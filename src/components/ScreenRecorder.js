import { useEffect, useRef, useState } from "react";
import audioBufferToWav from "audiobuffer-to-wav";
import Groq from "groq-sdk";

const apiKey = import.meta.env.VITE_GROQ_API_KEY;
const groq = new Groq({ apiKey: apiKey, dangerouslyAllowBrowser: true });

const useScreenRecorder = () => {
  const [transcription, setTranscription] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]); // Store audio chunks for each recording session

  // Define the function to start screen capture (video + audio)
  const startScreenCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: 40,
          height: 60,
          frameRate: 15,
        },
        audio: true,
      });

      // Check if the stream contains an audio track
      const audioTrack = stream.getAudioTracks()[0];
      if (!audioTrack) {
        throw new Error("No audio track found in the screen capture stream");
      }

      return stream;
    } catch (err) {
      console.error("Error accessing screen capture", err);
      throw err;
    }
  };

  // Start recording video and audio from the screen
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

  // Detect silence in the audio stream
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
    const silenceTimeout = 1500;

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

  // Handle silence detection and initiate transcription
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

  // Function to convert audio buffer to WAV and send it to Groq for transcription
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

          // Create an OfflineAudioContext with the correct length
          const offlineAudioContext = new OfflineAudioContext(
            1,
            sampleRate * duration,
            sampleRate
          );

          // Create a buffer source
          const soundSource = offlineAudioContext.createBufferSource();
          soundSource.buffer = decodedAudioData;

          // Create a band-pass filter using the same OfflineAudioContext
          const bandPassFilter = offlineAudioContext.createBiquadFilter();
          bandPassFilter.type = "bandpass";
          bandPassFilter.frequency.value = 1000; // Center frequency for voice
          bandPassFilter.Q.value = 1; // Bandwidth

          // Create a gain node to enhance audio
          const gainNode = offlineAudioContext.createGain();
          gainNode.gain.value = 1.5; // Increase volume

          // Connect the nodes: source -> filter -> gain -> destination
          soundSource.connect(bandPassFilter);
          bandPassFilter.connect(gainNode);
          gainNode.connect(offlineAudioContext.destination);
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
