import React, { useState, useRef, useEffect } from 'react';
import { Mic, StopCircle, Video } from 'lucide-react';

const ScreenRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isNowSilent, setIsNowSilent] = useState(false);
  const [error, setError] = useState(null);
  const mediaRecorder = useRef(null);
  const mediaStream = useRef(null);
  const audioContext = useRef(null);
  const audioAnalyser = useRef(null);
  const silenceTimeout = useRef(null);
  const chunks = useRef([]);
  const isProcessing = useRef(false);

  const BASE_URL = process.env.VITE_SERVER_URL;

  // Configuration for silence detection
  const SILENCE_THRESHOLD = -60; // dB (adjusted for testing)
  const SILENCE_DURATION = 2000; // ms to consider as silence
  const CHECK_INTERVAL = 100; // ms between checks

  const startRecording = async () => {

    try {
      // Request screen capture with audio
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: 40,
          height: 60,
          frameRate: 15,
        },
        audio: true,
      });

      mediaStream.current = screenStream;

      // Set up audio analysis
      audioContext.current = new AudioContext();
      const audioSource = audioContext.current.createMediaStreamSource(screenStream);
      audioAnalyser.current = audioContext.current.createAnalyser();
      audioAnalyser.current.fftSize = 2048;
      audioSource.connect(audioAnalyser.current);
      console.log("AudioContext and analyser set up.");

      // Create MediaRecorder
      mediaRecorder.current = new MediaRecorder(screenStream, {
        mimeType: 'video/webm',
      });

      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunks.current.push(event.data);
          console.log(`Chunk available, current size: ${chunks.current.length}`);
        }
      };

      mediaRecorder.current.onstart = () => {
        chunks.current = [];
        console.log("Recording started, chunks cleared.");
      };

      mediaRecorder.current.onstop = async () => {
        console.log("Recording stopped manually.");
        //await sendRemainingChunks();
      };

      mediaRecorder.current.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setError('MediaRecorder error: ' + event.error);
      };

      // mediaRecorder.current.start(1000); // Collect data every second
      setIsRecording(true);
      // console.log("MediaRecorder started, isRecording set to true.");

    } catch (err) {
      console.error("Recording error:", err);
      setError('Failed to start recording: ' + err.message);
      cleanup();
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && mediaStream.current) {
      mediaRecorder.current.stop();
      cleanup();
      setIsRecording(false);
    }
  };

  const cleanup = () => {
    if (mediaStream.current) {
      mediaStream.current.getTracks().forEach(track => track.stop());
      console.log("MediaStream tracks stopped.");
    }
    if (audioContext.current) {
      audioContext.current.close();
      console.log("AudioContext closed.");
    }
    stopSilenceDetection();
  };

  const startSilenceDetection = () => {
    let silenceStart = null;
    console.log("Starting silence detection...");
    const checkAudioLevel = async () => {
      if (!audioAnalyser.current || !isRecording) return;
      const dataArray = new Float32Array(audioAnalyser.current.frequencyBinCount);
      audioAnalyser.current.getFloatTimeDomainData(dataArray);

      // Calculate RMS value
      const rms = Math.sqrt(dataArray.reduce((sum, val) => sum + val * val, 0) / dataArray.length);
      const db = 20 * Math.log10(rms);
      //console.log("Calculated RMS:", rms, "dB:", db);

      if (db < SILENCE_THRESHOLD) {
        if (!silenceStart) {
          silenceStart = Date.now();
        } else if (Date.now() - silenceStart >= SILENCE_DURATION) {
          setIsNowSilent(true);
        }
      } else {
        setIsNowSilent(false);
      }

      // Continue checking if still recording
      if (isRecording) {
        silenceTimeout.current = setTimeout(checkAudioLevel, CHECK_INTERVAL);
      }
    };

    checkAudioLevel();
  };

  useEffect(() => {
    if (isRecording) startSilenceDetection();
  }, [isRecording]);

  useEffect(() => {
    const handleSilence = async () => {
      if (isNowSilent) {
        mediaRecorder.current.stop();
        if (chunks.current.length) {
          console.log("Silence detected, sending chunks...");
          await sendCurrentChunks();
        }
      } else {
        if (mediaRecorder.current) {
          console.log("Start hearing...");
          mediaRecorder.current.start(1000); // Collect data every second
          setIsRecording(true);
        }
      }
    };

    handleSilence();
  }, [isNowSilent]);

  const stopSilenceDetection = () => {
    if (silenceTimeout.current) {
      clearTimeout(silenceTimeout.current);
    }
  };

  const sendCurrentChunks = async () => {
    if (chunks.current.length === 0 || isProcessing.current) return;

    isProcessing.current = true;
    const chunksToSend = [...chunks.current];
    chunks.current = []; // Clear the chunks for next batch

    try {
      const blob = new Blob(chunksToSend, { type: 'video/webm' });
      const formData = new FormData();
      formData.append('video', blob, `screen-recording-${Date.now()}.webm`);

      console.log("Preparing to send", chunksToSend.length, "chunks...");

      const response = await fetch(BASE_URL + '/upload-video/', {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Upload failed: ${response.status}`);
      }

      const result = await response.json();
      console.log("Chunk uploaded successfully:", result);

    } catch (err) {
      console.error("Upload error:", err);
      setError('Failed to send chunk: ' + err.message);
    } finally {
      isProcessing.current = false;
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <div className="space-y-4">
        <div className="flex justify-center space-x-4">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`flex items-center px-4 py-2 rounded-lg ${isRecording
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-blue-500 hover:bg-blue-600'
              } text-white transition-colors`}
          >
            {isRecording ? (
              <>
                <StopCircle className="w-5 h-5 mr-2" />
                Stop Recording
              </>
            ) : (
              <>
                <Video className="w-5 h-5 mr-2" />
                Start Recording
              </>
            )}
          </button>
        </div>

        {isRecording && (
          <div className="flex items-center justify-center space-x-2 text-green-500">
            <Mic className="w-5 h-5 animate-pulse" />
            <span>Recording in progress...</span>
          </div>
        )}

        {error && (
          <div className="text-red-500 text-center">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScreenRecorder;
