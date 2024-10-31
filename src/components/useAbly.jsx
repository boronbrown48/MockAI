import { useEffect, useState } from 'react';
import Ably from 'ably';

const useAbly = (apiKey) => {
    const CHANNEL_NAME = import.meta.env.VITE_CHANNEL_NAME;
    const SEND_MESSAGE_URL = import.meta.env.VITE_SEND_MESSAGE_URL;
    const [messages, setMessages] = useState([]);
    const [channel, setChannel] = useState(null);
    const [inputMessage, setInputMessage] = useState('');

    useEffect(() => {
        const ably = new Ably.Realtime(apiKey);
        const chatChannel = ably.channels.get(CHANNEL_NAME);

        chatChannel.subscribe('message', (message) => {
            console.log("REC Messages:", message);
            setMessages((prevMessages) => [...prevMessages, message.data]);
        });

        setChannel(chatChannel);

        return () => {
            chatChannel.unsubscribe();
            ably.close();
        };
    }, [apiKey]);

    const sendMessage = async (message) => {
        if (channel) {
            console.log(JSON.stringify({ 'role': 'user', 'content': message }))
          await fetch(SEND_MESSAGE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 'role': 'user', 'content': message }),
        });
        setInputMessage('');
        }
    };

    return { messages, inputMessage, setInputMessage, sendMessage };
};

export default useAbly;
