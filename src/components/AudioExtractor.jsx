import audioBufferToWav from 'audiobuffer-to-wav';
import Groq from 'groq-sdk';

const apiKey = "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";
const groq = new Groq({ apiKey: apiKey, dangerouslyAllowBrowser: true });

export const transcribeAudioFile = async (file) => {
    if (!file) throw new Error('No file provided');

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const reader = new FileReader();

    const IGNORE_PHRASES = [
        "thank you", "thanks", "okay", "sorry", "hello", "goodbye", "please", "good morning",
        "good night", "alright", "got it", "understood", "I see", "excuse me", "yeah",
        "no problem", "right", "yeah right", "sure", "you’re welcome", "goodbye", "fine", "."
        // Add more common filler phrases here
    ];

    const isIgnoreText = (text) => {
        // Convert to lowercase for case-insensitive matching
        const lowerText = text.toLowerCase().trim();

        // Check if the text matches any of the garbage phrases
        return IGNORE_PHRASES.some(phrase => lowerText.includes(phrase));
    };

    const GIBBERISH_THRESHOLD = 0.6; // A threshold for gibberish detection (adjustable)
    const isGibberish = (text) => {
        const words = text.split(/\s+/); // Split by whitespace
        if (words.length < 5) return true; // Too short to be meaningful

        // Count words that don't match typical word patterns (i.e., non-alphabetical)
        const gibberishRatio = words.filter(word => !/^[a-zA-Z]+$/.test(word)).length / words.length;

        return gibberishRatio > GIBBERISH_THRESHOLD;
    };


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
                // Gibberish detection before sending to Groq AI
                // if (isGibberish(transcriptionText)) {
                //     console.log("Transcription is likely gibberish, skipping submission.")
                //     reject('Transcription is likely gibberish, skipping submission.');
                //     return; // Exit the process early if gibberish is detected
                // }

                // Post-process to remove garbage text
                // if (isIgnoreText(transcriptionText)) {
                //     console.log("TDetected random audio, skipping transcription")
                //     reject('Detected random audio, skipping transcription.');
                //     return; // Stop if transcription is garbage
                // }

                // If not gibberish, resolve with the transcription text
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
