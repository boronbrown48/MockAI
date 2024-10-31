import React, { useState, useEffect, useRef } from 'react';
import { 
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
} from '@mui/material';
import { Person, SmartToyRounded, Send } from '@mui/icons-material';
import GraphicEqOutlinedIcon from '@mui/icons-material/GraphicEqOutlined';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import { styled } from '@mui/system';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula  } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useScreenRecorder } from './ScreenRecorder';
import useAbly from './useAbly';
import { GoogleIcon, EdgeIcon } from './CustomIcons';

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
    console.log("extractCodeBlocks:", content);
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


const darkTheme = createTheme({
    typography: {
        fontSize: 16,
        fontFamily: 'Arial',
        h5: {
            fontFamily: 'Arial, sans-serif', // Font for h5
          },
    },
    palette: {
        mode: 'dark',
        background: {
            default: '#0E1117',
            paper: '#0E1117',
        },
        primary: {
            main: '#60A5FA',
        },
        secondary: {
            main: '#FF0000'
        }
    },
});

const MessageContainer = styled(Box)(({ theme }) => ({
    display: 'flex',
    gap: theme.spacing(2),
    marginBottom: theme.spacing(2),
})); 

const Chatbot = () => {
    const ABLY_API_KEY = import.meta.env.VITE_ABLY_API_KEY;
    const messagesEndRef = useRef(null);
    const { messages,
        inputMessage,
        setInputMessage,
        sendMessage} = useAbly(ABLY_API_KEY);
    
    const onTranscriptionReceived = async (message) => {
        console.log("Sending to chatbot:", message);
        await sendMessage(message);
    };

    const { isRecording, startRecording, stopRecording, error } = useScreenRecorder(onTranscriptionReceived);

    const handleSendMessage = async () => {
        if (!inputMessage.trim()) return;

        console.log("Input Message:", inputMessage);
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
        console.log("renderMessageContent:", content);
        const parts = extractCodeBlocks(content);
        
        return (
            <div>
                {parts.map((part, index) => {
                if (part.type === 'text') {
                    return (
                        <Typography key={index} variant="body2" color="#d9d9d9" style={{ lineHeight: "34px" }}>
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
        console.log("formatContent:", content);
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

    return (
        <ThemeProvider theme={darkTheme}>
            <CssBaseline />
            <Container maxWidth="lg" sx={{ height: '100vh', py: 4 }}>
                <Paper 
                    elevation={3} 
                    sx={{ 
                        height: '100%', 
                        display: 'flex', 
                        flexDirection: 'column',
                        bgcolor: '#0E1117',
                        overflow: 'hidden'
                    }}
                >
                    <Box sx={{ 
                        flexGrow: 1, 
                        p: 1, 
                        overflow: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                        bgcolor: '#0E1117',
                        '&::-webkit-scrollbar': {
                            width: '8px',
                            backgroundColor: '#0E1117', // Background of the scrollbar
                        },
                        '&::-webkit-scrollbar-thumb': {
                            backgroundColor: '#808080', // Color of the scrollbar thumb
                            borderRadius: '4px',
                        },
                        '&::-webkit-scrollbar-thumb:hover': {
                            backgroundColor: '#FBAA24', // Color on hover
                        },
                    }} aria-live="polite">
                        <Box
                          display="flex"
                          height="150px"
                          position="sticky"
                        >
                            <Box
                              flex={1}
                              display="flex"
                              flexDirection="column"
                              justifyContent="center"
                              alignItems="flex-start"
                              padding={2}
                            >
                                <Typography variant="h5" component="h2"  color='primary' 
                                sx={{ fontWeight: 'bold', paddingBottom: 1.5 }}>
                                  Mock Interview AI
                                </Typography>
                                <Typography variant="body2" color="text.secondary"
                                sx={{ fontStyle: 'italic', fontSize: '10' }}>
                                  Share your specific or entire screen screen with audio.
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, paddingTop: 2 }}>
                                    <EdgeIcon/>
                                    <Typography variant="body2">Microsoft Edge</Typography>
                                    <GoogleIcon/>   
                                    <Typography variant="body2">Google Chrome only</Typography>
                                </Box>
                            </Box>
                            <Box
                              flex={1}
                              display="flex"
                              flexDirection="column"
                              justifyContent="center"
                              alignItems="center"
                              padding={2}
                            >
                              <IconButton height='10' width='10'>
                                <CloudUploadOutlinedIcon height='10' width='10' />
                              </IconButton>
                              <Typography variant="body2" color="text.secondary"
                                sx={{ fontSize: '10', paddingBottom: 1 }}>
                                  Upload a resume
                                </Typography>
                              <Button variant="outlined" sx={{ fontSize: 14 }}>Lets Start</Button>
                            </Box>
                        </Box>
                        {messages.map((message, index) => (
                            <MessageContainer key={index} paddingRight={"0px"}>
                                <Avatar 
                                    sx={{ 
                                        bgcolor: message.role === 'user' ? '#F87171' : '#FBBF24',
                                        width: 32,
                                        height: 32,
                                    }}
                                >
                                    {message.role === 'user' ? 
                                        <Person sx={{ width: 20, height: 20 }} /> : 
                                        <SmartToyRounded sx={{ width: 20, height: 20 }} />
                                    }
                                </Avatar>
                                <Box sx={{ 
                                    flex: 1,
                                    bgcolor: message.role === 'user' ? '#1A1C23' : '#0E1117',
                                    paddingLeft: 2,
                                    paddingRight: 2,
                                    paddingTop:1,
                                    paddingBottom:1,
                                    borderRadius: 2
                                }}>
                                    {renderMessageContent(message.content)}
                                </Box>
                            </MessageContainer>
                        ))}
                        <div ref={messagesEndRef} />
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, bgcolor: '#0E1117' }}>
                    <IconButton 
                            color={isRecording ? "secondary" : "primary" }
                            aria-label="Record" 
                            onClick={isRecording ? stopRecording : startRecording}
                        >
                            <GraphicEqOutlinedIcon />
                        </IconButton>
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
                                    backgroundColor: '#0E1117',
                                }
                            }}
                        />
                        <IconButton 
                            color="primary" 
                            aria-label="send message" 
                            onClick={handleSendMessage}
                            disabled={!inputMessage || !inputMessage.trim()} // Disable button if input is empty
                        >
                            <Send />
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
    );
};

export default Chatbot;
