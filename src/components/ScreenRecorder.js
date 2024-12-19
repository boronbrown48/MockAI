import { useEffect, useRef, useState } from "react";
import audioBufferToWav from "audiobuffer-to-wav";
import Groq from "groq-sdk";

const apiKey = "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";
const groq = new Groq({ apiKey: apiKey, dangerouslyAllowBrowser: true });

const useScreenRecorder = () => {
  const [transcription, setTranscription] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);

  // Check if running on MacOS
  const isMacOS = () => {
    return navigator.platform.toUpperCase().indexOf("MAC") >= 0;
  };

  // Get available audio devices
  const getAudioDevices = async () => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter((device) => device.kind === "audioinput");
  };

  const startScreenCapture = async () => {
    try {
      if (isMacOS()) {
        // MacOS-specific handling
        const audioDevices = await getAudioDevices();
        const blackholeDevice = audioDevices.find((device) =>
          device.label.toLowerCase().includes("blackhole 2ch")
        );

        const constraints = {
          audio: blackholeDevice
            ? { deviceId: { exact: blackholeDevice.deviceId } }
            : true,
          video: false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        return stream;
      } else {
        // Windows/Other OS handling - use original screen capture logic
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            width: 40,
            height: 60,
            frameRate: 15,
          },
          audio: true,
        });

        const audioTrack = stream.getAudioTracks()[0];
        if (!audioTrack) {
          throw new Error("No audio track found in the screen capture stream");
        }

        return stream;
      }
    } catch (err) {
      console.error("Error accessing audio/screen capture", err);
      throw err;
    }
  };

  // Rest of the code remains the same...
  const startRecording = (stream) => {
    const mediaRecorder = new MediaRecorder(stream);
    chunksRef.current = []; // Reset chunks for new recording

    mediaRecorder.ondataavailable = (e) => {
      chunksRef.current.push(e.data); // Add new chunks
    };

    mediaRecorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      // const url = URL.createObjectURL(blob);
      // const videoElement = document.createElement("video");
      // videoElement.src = url;
      // videoElement.controls = true;
      // document.body.appendChild(videoElement);

      // Clear the chunks array after each stop to prevent reusing old audio
      chunksRef.current = [];

      // Call transcription when the recording stops
      await handleSilenceDetected(blob);
    };

    mediaRecorder.start();
    return mediaRecorder;
  };

  const detectSilence = (stream, mediaRecorder) => {
    const audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    analyser.fftSize = 64;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    let silenceDetected = false;
    let lastNonSilentTime = Date.now();
    const silenceThreshold = 10;
    const silenceTimeout = 3000;

    const checkSilence = () => {
      analyser.getByteFrequencyData(dataArray);

      // Calculate the average volume
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const averageVolume = sum / bufferLength;

      const currentTime = Date.now();

      if (averageVolume < silenceThreshold) {
        if (
          !silenceDetected &&
          currentTime - lastNonSilentTime >= silenceTimeout
        ) {
          silenceDetected = true;
          console.log("Silence detected, stopping recording...");
          mediaRecorder.stop();
        }
      } else {
        if (silenceDetected) {
          silenceDetected = false;
          lastNonSilentTime = currentTime;
          console.log("Audio resumed, restarting recording...");
          mediaRecorder.start();
        }
      }

      // Use requestAnimationFrame for more efficient audio checks
      requestAnimationFrame(checkSilence);
    };

    checkSilence();
  };

  const handleSilenceDetected = async (blob) => {
    try {
      const transcriptionText = await transcribeAudioFile(blob);
      setTranscription(transcriptionText); // Update transcription state
    } catch (error) {
      console.error("Error in transcription:", error);
    }
  };

  // Start recording process and listen for silence
  const start = async () => {
    const stream = await startScreenCapture(); // Call the function here
    streamRef.current = stream;

    const mediaRecorder = startRecording(stream);
    mediaRecorderRef.current = mediaRecorder;

    detectSilence(stream, mediaRecorder);
    setIsRecording(true);
  };

  const stop = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    setIsRecording(false);
  };

  useEffect(() => {
    // start();

    return () => {
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const transcribeAudioFile = async (file) => {
    if (!file) throw new Error("No file provided");

    const audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    const reader = new FileReader();

    return new Promise((resolve, reject) => {
      reader.onload = async () => {
        const audioFileAsBuffer = reader.result; // ArrayBuffer

        try {
          const decodedAudioData = await audioContext.decodeAudioData(
            audioFileAsBuffer
          );
          const duration = decodedAudioData.duration;
          const sampleRate = 16000;

          // Create an OfflineAudioContext for resampling
          const offlineAudioContext = new OfflineAudioContext(
            1,
            sampleRate * duration,
            sampleRate
          );

          // Create a buffer source
          const soundSource = offlineAudioContext.createBufferSource();
          soundSource.buffer = decodedAudioData;

          // Connect the source directly to the destination
          soundSource.connect(offlineAudioContext.destination);
          soundSource.start();

          // Render the audio
          const renderedBuffer = await offlineAudioContext.startRendering();

          // Convert to WAV
          const wavData = audioBufferToWav(renderedBuffer);
          const wavBlob = new Blob([wavData], { type: "audio/wav" });

          // Send to Groq AI for transcription
          const transcriptionText = await sendToGroqAI(wavBlob);
          resolve(transcriptionText);
        } catch (err) {
          reject(`Error during audio processing: ${err.message}`);
        }
      };

      reader.onerror = (err) => {
        reject("File reading failed: " + err.message);
      };

      reader.readAsArrayBuffer(file);
    });
  };

  const sendToGroqAI = async (blob) => {
    try {
      const file = new File([blob], "audio.wav", { type: "audio/wav" });
      const transcription = await groq.audio.transcriptions.create({
        file: file,
        model: "whisper-large-v3-turbo",
        language: "en",
        temperature: 0.0,
      });

      return transcription.text;
    } catch (error) {
      throw new Error("Transcription error: " + error.message);
    }
  };

  return {
    transcription,
    isRecording,
    startRecording: start,
    stopRecording: stop,
  };
};

export default useScreenRecorder;
