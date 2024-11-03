import { useEffect, useState } from 'react';
import Ably from 'ably';

const useAbly = (apiKey) => {
    const CHANNEL_NAME = import.meta.env.VITE_CHANNEL_NAME;
    const BASE_URL = import.meta.env.VITE_SERVER_URL;
    const ABLY_API = import.meta.env.VITE_ABLY_API_KEY;
    const CLIENT_ID = localStorage.getItem("client_id");

    const [messages, setMessages] = useState([]);
    const [channel, setChannel] = useState(null);
    const [inputMessage, setInputMessage] = useState('');

    useEffect(() => {
        const ably = new Ably.Realtime(ABLY_API);
        const chatChannel = ably.channels.get(CHANNEL_NAME + CLIENT_ID);

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
            await fetch(BASE_URL + "/send", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 'role': 'user', 'content': message, 'client_id': CLIENT_ID }),
            });
            setInputMessage('');
        }
    };

    return { messages, inputMessage, setInputMessage, sendMessage };
};

export default useAbly;
