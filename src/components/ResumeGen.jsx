import React, { useState } from 'react';
import {
    Paper,
    Button,
    Input,
    AppBar,
    Toolbar,
    Typography,
    Box,
    IconButton,
    useMediaQuery,
    List,
    ListItem,
    ListItemText,
    TextField
} from '@mui/material';
import Stack from '@mui/material/Stack';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import RadioButtonCheckedOutlinedIcon from '@mui/icons-material/RadioButtonCheckedOutlined';
import StopCircleOutlinedIcon from '@mui/icons-material/StopCircleOutlined';
import DonutSmallIcon from '@mui/icons-material/DonutSmall';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import SendRoundedIcon from '@mui/icons-material/SendRounded';

const ResumeGen = ({ setIsAuthenticated }) => {
    const [jobDescription, setJobDescription] = useState('');
    const [additionalFields, setAdditionalFields] = useState(false);
    const [field1, setField1] = useState('');
    const [field2, setField2] = useState('');
    const [papers, setPapers] = useState([]);
    const [pdfData, setPdfData] = useState('');

    const BASE_URL = "http://127.0.0.1:8004";

    const handleSubmit = async () => {
        if (jobDescription.trim() === '') {
            alert('Please enter a job description');
            return;
        }

        try {
            const token = localStorage.getItem('access_token');

            if (!token) {
                throw new Error('No access token found.'); // Handle case where token is not available
            }

            const response = await fetch(BASE_URL + '/extract_data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`, // Send the token in the Authorization header
                },
                body: JSON.stringify({ resume: jobDescription }), // Pass the token in the request body if required
            });

            if (!response.ok) {
                throw new Error('Extraction failed.'); // Handle HTTP error
            }

            // Parse the response body as JSON
            const data = await response.json();  // Parse JSON content from the response
            console.log('RESPONSE:', data.resume);  // Log the parsed response
            const newData = JSON.parse(data.resume);
            setField1(newData.Competitors);
            setField2(newData.Technologies);

        } catch (error) {
            console.error('Error during logout:', error.message);
            // Handle logout error (e.g., show a notification)
        }
        // Process job description
        console.log('Processing job description:', jobDescription);

        // Show additional input fields
        setAdditionalFields(true);
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
            console.error('Error during logout:', error.message);
            // Handle logout error (e.g., show a notification)
        }
    };

    const handleGenerate = async () => {
        const value = {
            JD: jobDescription,
            Competitors: field1,
            Technologies: field2,
        }

        const jsonString = JSON.stringify(value);

        console.log("VALUE", typeof jsonString == 'string');

        try {
            const token = localStorage.getItem('access_token');

            if (!token) {
                throw new Error('No access token found.'); // Handle case where token is not available
            }

            const response = await fetch(BASE_URL + '/process_jd', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`, // Send the token in the Authorization header
                },
                body: JSON.stringify({
                    JD: jobDescription,
                    Competitors: field1,
                    Technologies: field2
                }), // Pass the token in the request body if required
            });

            // Parse the response body as JSON
            const data = await response.json();
            const newData = JSON.parse(data);
            console.log('NEW_DATA: ', newData);
            setPdfData(data.pdf);

            if (!response.ok) {
                throw new Error('Logout failed.'); // Handle HTTP error
            }

        } catch (error) {
            console.error('Error in Handle Generate:', error.message);
            // Handle logout error (e.g., show a notification)
        }

    };

    const downloadPDF = () => {
        const link = document.createElement('a');
        link.href = `data:application/pdf;base64,${pdfData}`;
        link.download = 'Resume_Data.pdf';
        link.click();
    };

    // MediaQuery hook to check if the screen is mobile (xs) or larger
    const isMobile = useMediaQuery('(max-width:600px)'); // Adjust this breakpoint as needed

    const darkTheme = createTheme({
        typography: {
            fontSize: 15,
            fontFamily: 'Arial',
        },
        palette: {
            mode: 'light',
            background: {
                default: '#f2f2f2',
                paper: '#f2f2f2',
            },
            primary: {
                main: '#000000',
            }
        },
    });

    return (
        <ThemeProvider theme={darkTheme}>
            <CssBaseline enableColorScheme />
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
                <AppBar position="fixed" sx={{ width: '100%', backgroundColor: 'transparent' }}>
                    <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        {/* Left side: Logo */}
                        <IconButton edge="start" sx={{ mr: 2 }} color="inherit">
                            <DonutSmallIcon sx={{ color: 'black' }} />
                        </IconButton>

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
                <Box sx={{ marginTop: '50px', width: '100%', backgroundColor: 'transparent' }}>
                    <div className="max-w-md mx-auto p-4 space-y-4 relative">
                        <div className="flex space-x-2">
                            <Input
                                placeholder="Enter job description"
                                value={jobDescription}
                                onChange={(e) => setJobDescription(e.target.value)}
                                sx={{
                                    flexGrow: 1,
                                    width: '85%',
                                    fontSize: '14px',
                                    backgroundColor: 'transparent',
                                    border: '1px solid black',  // Black border
                                    borderRadius: '5px',         // Rounded edges
                                    padding: '5px',              // Padding inside the input
                                    color: 'black',              // Text color
                                    '& .MuiInputBase-input': {
                                        padding: '5px',         // Adjust padding inside the input field
                                    }
                                }}
                            />
                            <Button variant="contained" color="primary" sx={{ ml: 1, fontSize: '12px' }} onClick={handleSubmit}>Submit</Button>
                        </div>

                        {additionalFields && (
                            <div className="space-y-2">
                                <Input
                                    placeholder="Competitors"
                                    value={field1}  // Ensure it never becomes undefined
                                    type="text"
                                    onChange={(e) => setField1(e.target.value)}
                                    sx={{
                                        flexGrow: 1,
                                        width: '46%',
                                        fontSize: '14px',
                                        backgroundColor: 'transparent',
                                        border: '1px solid black',  // Black border
                                        borderRadius: '5px',         // Rounded edges
                                        padding: '5px',              // Padding inside the input
                                        color: 'black',              // Text color
                                        '& .MuiInputBase-input': {
                                            padding: '5px',         // Adjust padding inside the input field
                                        },
                                        mt: 2,
                                        mr: 1,
                                    }}
                                />

                                <Input
                                    placeholder="Skills"
                                    value={field2}  // Ensure it never becomes undefined
                                    type="text"
                                    onChange={(e) => setField2(e.target.value)}
                                    sx={{
                                        flexGrow: 1,
                                        width: '46%',
                                        fontSize: '14px',
                                        backgroundColor: 'transparent',
                                        border: '1px solid black',  // Black border
                                        borderRadius: '5px',         // Rounded edges
                                        padding: '5px',              // Padding inside the input
                                        color: 'black',              // Text color
                                        '& .MuiInputBase-input': {
                                            padding: '5px',         // Adjust padding inside the input field
                                        },
                                        mt: 2,
                                    }}
                                />
                                <div className="flex justify-center">
                                    <Button variant="contained" color="primary" sx={{ mt: 1, fontSize: '12px' }} onClick={handleGenerate}>Generate</Button>
                                </div>
                            </div>
                        )}

                        {/* Container for dynamically generated papers */}
                        <div backgroundColor="black" alignContent="center">
                            <Stack
                                direction="row"
                                component="main"
                                alignContent={'center'}
                                sx={{ mt: 2 }}>
                                {papers}
                            </Stack>
                        </div>
                    </div>
                </Box>
            </>
        </ThemeProvider >
    );
};

export default ResumeGen;
