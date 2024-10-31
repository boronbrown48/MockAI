import audioBufferToWav from 'audiobuffer-to-wav';
import Groq from 'groq-sdk';

const apiKey = import.meta.env.VITE_GROQ_API_KEY;
const groq = new Groq({ apiKey: "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", dangerouslyAllowBrowser: true });

export const transcribeAudioFile = async (file) => {
    if (!file) throw new Error('No file provided');

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const reader = new FileReader();

    return new Promise((resolve, reject) => {
        reader.onload = async () => {
            const audioFileAsBuffer = reader.result; // ArrayBuffer

            try {
                const decodedAudioData = await audioContext.decodeAudioData(audioFileAsBuffer);
                const duration = decodedAudioData.duration;
                const sampleRate = 16000;

                // Create an OfflineAudioContext with the correct length
                const offlineAudioContext = new OfflineAudioContext(1, sampleRate * duration, sampleRate);
                
                // Create a buffer source
                const soundSource = offlineAudioContext.createBufferSource();
                soundSource.buffer = decodedAudioData;

                // Create a band-pass filter using the same OfflineAudioContext
                const bandPassFilter = offlineAudioContext.createBiquadFilter();
                bandPassFilter.type = 'bandpass';
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
                const wavBlob = new Blob([wavData], { type: 'audio/wav' });

                // Send to Groq AI for transcription
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
            file: file,
            model: 'whisper-large-v3-turbo',
            language: 'en',
            temperature: 0.0,
        });

        return transcription.text;
    } catch (error) {
        throw new Error('Transcription error: ' + error.message);
    }
};
