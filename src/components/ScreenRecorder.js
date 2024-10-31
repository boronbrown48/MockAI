import React, { useState, useRef, useEffect } from 'react';
import { transcribeAudioFile } from './AudioExtractor';

const SILENCE_THRESHOLD = -60; // dB (adjusted for testing)
const SILENCE_DURATION = 1000; // ms to consider as silence
const CHECK_INTERVAL = 100; // ms between checks

export const useScreenRecorder = (onTranscriptionReceived) => {
    const mediaRecorder = useRef(null);
    const mediaStream = useRef(null);
    const audioContext = useRef(null);
    const audioAnalyser = useRef(null);
    const silenceTimeout = useRef(null);
    const chunks = useRef([]);
    const isProcessing = useRef(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isNowSilent, setIsNowSilent] = useState(false);
    const [error, setError] = useState(null);

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
            };

            mediaRecorder.current.onerror = (event) => {
                onsole.error('MediaRecorder error:', event);
                setError('MediaRecorder error: ' + event.error);
            };

            // mediaRecorder.current.start(1000); // Collect data every second
            setIsRecording(true);
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
            // Delay stopping to ensure the last chunks of audio is captured
            setTimeout(() => {
          mediaRecorder.current.stop();
          if (chunks.current.length) {
            console.log("Silence detected, sending chunks...");
            sendCurrentChunks();
          }
        }, 300);
          } else {
            if(mediaRecorder.current) {
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
        console.log("SEND CURRENT CHUCKS")
        if (chunks.current.length === 0 || isProcessing.current) return;

        isProcessing.current = true;
        const chunksToSend = [...chunks.current];
        chunks.current = []; // Clear the chunks for next batch

        try {
            console.log("Transcribe Audio File")

            const blob = new Blob(chunksToSend, { type: 'video/webm' });
            const file = new File([blob], "video.webm", { type: 'video/webm' });

            transcribeAudioFile(file).then(transcription => {
                console.log(transcription); // Logs the transcribed text.
                onTranscriptionReceived(transcription); // Notify parent with the transcription
            }).catch(error => {
                console.error('Error:', error); // Handles any errors that occurred.
            });

          //  onChunksSent();

        } catch (err) {
          console.error("Upload error:", err);
          setError('Failed to send chunk: ' + err.message);
        } finally {
          isProcessing.current = false;
        }
    };

    return { isRecording, startRecording, stopRecording, error };
};

export default useScreenRecorder;