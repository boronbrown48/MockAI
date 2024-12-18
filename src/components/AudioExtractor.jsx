import audioBufferToWav from 'audiobuffer-to-wav';
import Groq from 'groq-sdk';

const apiKey = "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";
const groq = new Groq({ apiKey: apiKey, dangerouslyAllowBrowser: true });

export const transcribeAudioFile = async (file) => {
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
