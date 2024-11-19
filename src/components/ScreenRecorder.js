import { useEffect, useRef, useState } from 'react';
import audioBufferToWav from 'audiobuffer-to-wav';
import Groq from 'groq-sdk';

// Initialize Groq API
const apiKey = import.meta.env.VITE_GROQ_API_KEY;
const groq = new Groq({ apiKey, dangerouslyAllowBrowser: true });

const useScreenRecorder = (onTranscriptionReceived) => {
    const [transcription, setTranscription] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef(null);
    const streamRef = useRef(null);
    const chunksRef = useRef([]);

    const isMac = navigator.platform.toLowerCase().includes('mac');

    const startScreenCapture = async () => {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: { width: 40, height: 60, frameRate: 15 },
                audio: true,
            });
            const audioTrack = stream.getAudioTracks()[0];
            if (!audioTrack) {
                throw new Error('No audio track found in the screen capture stream');
            }
            return stream;
        } catch (err) {
            console.error('Error accessing screen capture', err);
            throw err;
        }
    };

    const startRecording = (stream) => {
        const mediaRecorder = new MediaRecorder(stream);
        chunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
            chunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = async () => {
            const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
            await handleSilenceDetected(blob);
            chunksRef.current = [];
        };

        mediaRecorder.start();
        return mediaRecorder;
    };

    const detectSilence = (stream, mediaRecorder) => {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);

        analyser.fftSize = 256; // Increased for better frequency analysis
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        let silenceStart = null;
        let consecutiveSilentFrames = 0;
        const CONSECUTIVE_FRAMES_THRESHOLD = 5; // Number of frames to confirm silence

        const checkSilence = () => {
            analyser.getByteFrequencyData(dataArray);
            
            // Calculate average volume with focus on speech frequencies
            let sum = 0;
            let count = 0;
            for (let i = 0; i < bufferLength; i++) {
                // Focus on frequencies between 200Hz and 3000Hz (speech range)
                const frequency = i * (audioContext.sampleRate / analyser.fftSize);
                if (frequency >= 200 && frequency <= 3000) {
                    sum += dataArray[i];
                    count++;
                }
            }
            const averageVolume = sum / count;

            const silenceThreshold = isMac ? 15 : 10;
            const currentTime = Date.now();

            if (averageVolume < silenceThreshold) {
                consecutiveSilentFrames++;
                if (silenceStart === null) {
                    silenceStart = currentTime;
                }

                // Check if we've had enough consecutive silent frames and enough time has passed
                if (consecutiveSilentFrames >= CONSECUTIVE_FRAMES_THRESHOLD && 
                    currentTime - silenceStart >= 2000) {
                    if (mediaRecorder.state === 'recording') {
                        mediaRecorder.stop();
                        silenceStart = null;
                        consecutiveSilentFrames = 0;
                    }
                }
            } else {
                silenceStart = null;
                consecutiveSilentFrames = 0;
                
                // If we were stopped due to silence, start a new recording
                if (mediaRecorder.state === 'inactive') {
                    mediaRecorder.start();
                }
            }

            requestAnimationFrame(checkSilence);
        };

        checkSilence();
    };

    const handleSilenceDetected = async (blob) => {
        try {
            const transcriptionText = await transcribeAudioFile(blob);
            setTranscription(transcriptionText);
            if (onTranscriptionReceived) {
                onTranscriptionReceived(transcriptionText);
            }
        } catch (error) {
            console.error('Error in transcription:', error);
        }
    };

    const transcribeAudioFile = async (file) => {
        if (!file) throw new Error('No file provided');

        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const reader = new FileReader();

        return new Promise((resolve, reject) => {
            reader.onload = async () => {
                const audioFileAsBuffer = reader.result;

                try {
                    const decodedAudioData = await audioContext.decodeAudioData(audioFileAsBuffer);
                    const duration = decodedAudioData.duration;
                    const sampleRate = 16000;

                    const offlineAudioContext = new OfflineAudioContext(1, sampleRate * duration, sampleRate);
                    const soundSource = offlineAudioContext.createBufferSource();
                    soundSource.buffer = decodedAudioData;

                    const bandPassFilter = offlineAudioContext.createBiquadFilter();
                    bandPassFilter.type = 'bandpass';
                    bandPassFilter.frequency.value = 1000;
                    bandPassFilter.Q.value = 1;

                    const gainNode = offlineAudioContext.createGain();
                    gainNode.gain.value = 1.5;

                    soundSource.connect(bandPassFilter);
                    bandPassFilter.connect(gainNode);
                    gainNode.connect(offlineAudioContext.destination);
                    soundSource.start();

                    const renderedBuffer = await offlineAudioContext.startRendering();
                    const wavData = audioBufferToWav(renderedBuffer);
                    const wavBlob = new Blob([wavData], { type: 'audio/wav' });

                    const transcriptionText = await sendToGroqAI(wavBlob);
                    resolve(transcriptionText);
                } catch (err) {
                    reject(`Error during audio processing: ${err.message}`);
                }
            };

            reader.onerror = (err) => {
                reject('File reading failed: ' + err.message);
            };

            reader.readAsArrayBuffer(file);
        });
    };

    const sendToGroqAI = async (blob) => {
        try {
            const file = new File([blob], 'audio.wav', { type: 'audio/wav' });
            const transcription = await groq.audio.transcriptions.create({
                file,
                model: 'whisper-large-v3-turbo',
                language: 'en',
                temperature: 0.0,
            });
            return transcription.text;
        } catch (error) {
            throw new Error('Transcription error: ' + error.message);
        }
    };

    const start = async () => {
        const stream = await startScreenCapture();
        streamRef.current = stream;
        const mediaRecorder = startRecording(stream);
        mediaRecorderRef.current = mediaRecorder;
        detectSilence(stream, mediaRecorder);
        setIsRecording(true);
    };

    const stop = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
        }
        setIsRecording(false);
    };

    return {
        transcription,
        isRecording,
        startRecording: start,
        stopRecording: stop
    };
};

export default useScreenRecorder;