import React, { useState, useEffect, useRef } from 'react';
import {
    AppBar,
    Box,
    Container,
    Paper,
    TextField,
    IconButton,
    Avatar,
    Typography,
    ThemeProvider,
    createTheme,
    CssBaseline,
    Button,
    Toolbar,
    useMediaQuery,
    List,
    ListItem,
    ListItemText,
    Divider,
    ListItemAvatar
} from '@mui/material';
import { Person, SmartToyRounded, Send } from '@mui/icons-material';
import { styled } from '@mui/system';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism';
import useScreenRecorder from './ScreenRecorder';
import useAbly from './useAbly';
import { GoogleIcon, EdgeIcon } from './CustomIcons';
import { useNavigate } from 'react-router-dom';

import RadioButtonCheckedOutlinedIcon from '@mui/icons-material/RadioButtonCheckedOutlined';
import StopCircleOutlinedIcon from '@mui/icons-material/StopCircleOutlined';
import DonutSmallIcon from '@mui/icons-material/DonutSmall';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import SendRoundedIcon from '@mui/icons-material/SendRounded';

import './Chatbot.css';

// CodeBlockSection component for rendering code
const CodeBlockSection = ({ code, language }) => (
    <Box style={{ fontSize: '15px' }} sx={{ overflowX: 'auto', borderRadius: 2, mb: 2 }}>
        <SyntaxHighlighter language={language} style={dracula}>
            {code}
        </SyntaxHighlighter>
    </Box>
);

// Function to extract code blocks and their languages
const extractCodeBlocks = (content) => {
    // console.log("extractCodeBlocks:", content);
    const codeBlockRegex = /```(\w+)\s*([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;

    // Function to format skills
    const formatSkills = (text) => {
        return text
            .replace(/(\d+\.\s)/g, '\n$1') // Add a newline before numbered points
            .replace(/\n{2,}/g, '\n') // Remove extra newlines
            .trim(); // Trim any leading/trailing whitespace
    };

    let match;
    while ((match = codeBlockRegex.exec(content)) !== null) {
        const language = match[1]; // Capture the language
        const code = match[2].trim(); // Capture the code content

        // Push text before the code block, formatted
        if (lastIndex < match.index) {
            const textBeforeCode = content.slice(lastIndex, match.index).trim();
            if (textBeforeCode) {
                parts.push({ type: 'text', content: formatSkills(textBeforeCode) });
            }
        }

        // Push the code block
        parts.push({ type: 'code', language, code });
        lastIndex = match.index + match[0].length;
    }

    // Push any remaining text after the last code block, formatted
    if (lastIndex < content.length) {
        const remainingText = content.slice(lastIndex).trim();
        if (remainingText) {
            parts.push({ type: 'text', content: formatSkills(remainingText) });
        }
    }

    return parts;
};


const lightTheme = createTheme({
    typography: {
        fontSize: 16,
        fontFamily: 'Arial',
        h5: {
            fontFamily: 'Arial, sans-serif', // Font for h5
        },
    },
    palette: {
        mode: 'light',
        background: {
            default: '#FFFFFF',
            paper: '#FFFFFF',
        },
        primary: {
            main: '#FFFFFF',
        },
        secondary: {
            main: '#FFFFFF'
        }
    },
});

const MessageContainer = styled(Box)(({ theme }) => ({
    display: 'flex',
    gap: theme.spacing(2),
    marginBottom: theme.spacing(2),
}));

const Chatbot = ({ setIsAuthenticated }) => {
    const ABLY_API_KEY = "iyQ8_g.iH_Akw:gBcPCX3_ql6bHz5-9ns4CAA3KuK_kRVd-lNpvNYalbk";
    const BASE_URL = "https://mockaibackend.vercel.app";
    const messagesEndRef = useRef(null);
    const { messages,
        inputMessage,
        setInputMessage,
        sendMessage } = useAbly(ABLY_API_KEY);

    const [timer, setTimer] = useState(0); // Timer state to track elapsed time
    const [intervalId, setIntervalId] = useState(null); // State to store interval ID for clearing

    const navigate = useNavigate();

    const { transcription, isRecording, startRecording, stopRecording } = useScreenRecorder();

    useEffect(() => {
        // Define an inner async function
        const fetchData = async () => {
            if (transcription) {
                // console.log("Sending to chatbot:", transcription);
                await sendMessage(transcription);
            }
        };

        // Call the async function immediately
        fetchData();
    }, [transcription]); // This will trigger the effect whenever 'transcription' changes


    // Load messages from local storage on mount
    useEffect(() => {
        const savedMessages = JSON.parse(localStorage.getItem('chatMessages')) || [];
        // Only update if no messages exist
        if (messages.length === 0) {
            messages.push(...savedMessages);
        }
    }, [messages]);

    // Format time to display minutes:seconds
    const formatTime = (time) => {
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    // Save messages to local storage whenever they change
    useEffect(() => {
        localStorage.setItem('chatMessages', JSON.stringify(messages));
    }, [messages]);

    const handleSendMessage = async () => {
        if (!inputMessage.trim()) return;
        setInputMessage(''); // Clear input immediately
        await sendMessage(inputMessage);
    }

    // Scroll to the bottom whenever messages change
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const renderMessageContent = (content) => {
        const parts = extractCodeBlocks(content);

        return (
            <div>
                {parts.map((part, index) => {
                    if (part.type === 'text') {
                        return (
                            <Typography key={index} fontSize={"16px"} className="radley-regular" color="#000000" style={{ lineHeight: "34px" }}>
                                {formatContent(part.content)}
                            </Typography>
                        );
                    } else if (part.type === 'code') {
                        return (
                            <CodeBlockSection key={index} code={part.code} language={part.language} />
                        );
                    }
                    return null; // Handle other types if necessary
                })}
            </div>
        );
    };

    // Function to format content and convert bold text
    const formatContent = (content) => {
        // Split content by new lines
        return content.split('\n').map((line, lineIndex) => (
            <React.Fragment key={lineIndex}>
                {line.split(/\*\*(.*?)\*\*/g).map((text, textIndex) => {
                    // If the text is surrounded by **, render it as bold
                    return textIndex % 2 === 1 ? (
                        <strong key={textIndex}>{text}</strong>
                    ) : (
                        text
                    );
                })}
                {lineIndex < content.split('\n').length - 1 && <br />} {/* Add line break except for the last line */}
            </React.Fragment>
        ));
    };

    const handleLogout = async () => {
        try {
            const token = localStorage.getItem('access_token');

            if (!token) {
                throw new Error('No access token found.'); // Handle case where token is not available
            }

            const response = await fetch(BASE_URL + '/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`, // Send the token in the Authorization header
                },
                body: JSON.stringify({ token }), // Pass the token in the request body if required
            });

            if (!response.ok) {
                throw new Error('Logout failed.'); // Handle HTTP error
            }

            // const data = await response.json();

            localStorage.clear(); // Clear the Local storage

            setIsAuthenticated(false);
            // Redirect to login page or another page
            navigate('/');

        } catch (error) {
            // console.error('Error during logout:', error.message);
            // Handle logout error (e.g., show a notification)
        }
    };

    // MediaQuery hook to check if the screen is mobile (xs) or larger
    const isMobile = useMediaQuery('(max-width:600px)'); // Adjust this breakpoint as needed

    return (
        <>
            <style>
                {`
                    body, html {
                        margin: 0;
                        padding: 0;
                        height: 100%;
                    }
                `}
            </style>
            <ThemeProvider theme={lightTheme}>
                <CssBaseline />
                <AppBar position="fixed" sx={{ width: '100%', backgroundColor: '#FFFFFF' }}>
                    <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        {/* Left side: Logo */}
                        <IconButton edge="start" sx={{ mr: 2 }} color="inherit">
                            <DonutSmallIcon sx={{ color: 'black' }} />
                        </IconButton>

                        {/* Box to hold the timer and buttons in the center */}
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexGrow: 1 }}>
                            {/* Record Button */}
                            <Button
                                variant="outlined"
                                startIcon={<RadioButtonCheckedOutlinedIcon />}
                                onClick={startRecording}
                                style={{
                                    backgroundColor: isRecording ? 'red' : 'transparent', // Change color on click
                                    color: isRecording ? 'white' : 'initial', // Adjust text color based on click state
                                    borderColor: isRecording ? 'red' : 'initial',
                                    borderRadius: '10px',
                                    marginLeft: '10px', // Space between the timer and button
                                    fontSize: '12px'
                                }}
                            >
                                Share Screen
                            </Button>

                            {/* Stop Button */}
                            <Button
                                variant="outlined"
                                startIcon={<StopCircleOutlinedIcon />}
                                onClick={stopRecording}
                                disabled={!isRecording}  // Disable Stop button if not recording
                                style={{
                                    backgroundColor: isRecording ? 'transparent' : 'transparent',
                                    color: isRecording ? 'black' : 'grey',
                                    borderColor: isRecording ? 'black' : 'grey',
                                    borderRadius: '10px',
                                    marginLeft: '10px', // Space between the Record and Stop button
                                    fontSize: '12px'
                                }}
                            >
                                Stop Sharing
                            </Button>
                        </Box>

                        {/* Right side: Logout Button */}
                        {!isMobile && (
                            <Button edge="end" color="inherit" variant="outlined"
                                startIcon={<LogoutOutlinedIcon />} onClick={handleLogout}
                                style={{
                                    backgroundColor: 'transparent',
                                    color: 'black',
                                    borderColor: 'black',
                                    borderRadius: '10px',
                                    marginLeft: '10px', // Space between the Record and Stop button
                                    fontSize: '12px'
                                }}
                            >
                                Logout
                            </Button>
                        )}
                    </Toolbar>
                </AppBar>
                <Container maxWidth="lg" sx={{ height: '100vh' }}>
                    <Paper
                        elevation={3}
                        sx={{
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            bgcolor: '#FFFFFF',
                            overflow: 'auto'
                        }}
                    >
                        <Box sx={{ marginTop: '60px' }} />
                        <List sx={{ maxHeight: '100%', overflowY: 'auto', padding: 0 }}>
                            {messages.map((message, index) => (
                                <React.Fragment key={index}>
                                    <ListItem sx={{ padding: '8px 0', display: 'flex', alignItems: 'flex-start' }}>
                                        {/* Avatar */}
                                        <ListItemAvatar>
                                            <Avatar
                                                sx={{
                                                    bgcolor: message.role === 'user' ? '#F87171' : '#FBBF24',
                                                    width: 32,
                                                    height: 32,
                                                    marginLeft: 2,
                                                    marginTop: 1,
                                                }}
                                            >
                                                {message.role === 'user' ? (
                                                    <Person sx={{ width: 20, height: 20 }} />
                                                ) : (
                                                    <SmartToyRounded sx={{ width: 20, height: 20 }} />
                                                )}
                                            </Avatar>
                                        </ListItemAvatar>

                                        {/* Message Box */}
                                        <Box
                                            sx={{
                                                flex: 1,
                                                bgcolor: message.role === 'user' ? '#f2f2f2' : '#FFFFFF',
                                                paddingLeft: 2,
                                                paddingRight: 2,
                                                paddingTop: 1,
                                                paddingBottom: 1,
                                                marginRight: 2,
                                                borderRadius: 2,
                                            }}
                                        >
                                            {message.content !== "Thank you." && renderMessageContent(message.content)}
                                        </Box>
                                    </ListItem>
                                </React.Fragment>
                            ))}

                            {/* Scroll to bottom */}
                            <div ref={messagesEndRef} />
                        </List>
                        <Box sx={{ marginTop: '60px' }} />
                        <Box sx={{
                            position: 'fixed',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            padding: '10px',
                            backgroundColor: '#fff',
                            boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}>
                            <TextField
                                fullWidth
                                variant="outlined"
                                placeholder="Type your message here..."
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                size="small"
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        backgroundColor: '#FFFFFF',
                                        fontSize: '14px'
                                    }
                                }}
                            />
                            <IconButton
                                color="primary"
                                aria-label="send message"
                                onClick={handleSendMessage}
                                disabled={!inputMessage || !inputMessage.trim()} // Disable button if input is empty
                            >
                                <SendRoundedIcon />
                            </IconButton>
                        </Box>
                    </Paper>
                    <Box sx={{ position: 'fixed', bottom: 16, right: 16 }}>
                        {/* <Fab color="primary" aria-label="add" >
                        <Send />
                    </Fab> */}
                    </Box>
                </Container>
            </ThemeProvider>
        </>
    );
};

export default Chatbot;
