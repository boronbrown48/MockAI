import React, { useState } from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import Stack from '@mui/material/Stack';
import { useNavigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import {
  Button,
  Container,
  Typography,
  Box,
  Toolbar,
  AppBar,
  IconButton,
  Paper,
  Icon,
  CircularProgress
} from '@mui/material';
import LandingContent from './LandingContent';
import Divider from '@mui/material/Divider';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import pdfToText from './PdfOcr'; // Create a URL for the file

export default function Landing({ setIsAuthenticated }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);

  const [jdFile, setJDFile] = useState(null);
  const [uploadingJD, setJDUploading] = useState(false);
  const [uploadJDComplete, setUploadJDComplete] = useState(false);

  const [isFirstFileUploaded, setIsFirstFileUploaded] = useState(false);
  const [isSecondFileUploaded, setIsSecondFileUploaded] = useState(false);

  const [resumeData, setResumeData] = useState(false);
  const [jdData, setJDData] = useState(false);

  const navigate = useNavigate();

  const BASE_URL = import.meta.env.VITE_SERVER_URL;

  const handleFileChange = async (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setUploading(true);
      setUploadComplete(false);

      if (!selectedFile || selectedFile.type !== 'application/pdf') {
        console.log("Please upload a valid PDF file.")
        setError('Please upload a valid PDF file.');
        return;
      }

      const fileUrl = URL.createObjectURL(selectedFile); // Create a URL for the file

      setError('');

      try {
        const extractedText = await pdfToText(fileUrl); // Call the pdfToText function
        console.log(extractedText)
        setResumeData(extractedText);
        if (fileUrl) {
          return () => {
            URL.revokeObjectURL(fileUrl);
          };
        }
      } catch (err) {
        setError('Error extracting text from the PDF.');
        console.error(err);
      } finally {
        setUploading(false);
        setUploadComplete(true);
        setIsFirstFileUploaded(true);
      }
    }
    setUploading(false);
    setUploadComplete(true);
    setIsFirstFileUploaded(true);
  };

  const handleJDFileChange = async (event) => {
    const selectedJDFile = event.target.files[0];
    if (selectedJDFile) {
      setJDFile(selectedJDFile);
      setJDUploading(true);
      setUploadJDComplete(false);

      if (!selectedJDFile || selectedJDFile.type !== 'application/pdf') {
        setError('Please upload a valid PDF file.');
        return;
      }

      const fileUrl = URL.createObjectURL(selectedJDFile); // Create a URL for the file

      setError('');

      try {
        const extractedText = await pdfToText(fileUrl); // Call the pdfToText function
        setJDData(extractedText);
        if (fileUrl) {
          return () => {
            URL.revokeObjectURL(fileUrl);
          };
        }
      } catch (err) {
        setError('Error extracting text from the PDF.');
        console.error(err);
      } finally {
        setJDUploading(false);
        setUploadJDComplete(true);
        setIsSecondFileUploaded(true);
      }
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Check if both files are selected
    if (!file || !jdFile) {
      setError('Please upload both the candidate\'s resume and the job description.');
      console.error("Select all files")
      return; // Exit the function if files are not selected
    }

    setError(''); // Clear any previous error messages
    setLoading(true); // Start loading

    // Access the token from local storage
    const storedToken = localStorage.getItem('access_token');
    console.log(storedToken)

    console.log(resumeData)

    try {
      const response = await fetch(BASE_URL + '/extract-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', // Change to x-www-form-urlencoded
          'Authorization': `Bearer ${storedToken}`, // Include the token in the Authorization header
        },
        body: JSON.stringify({ resume: resumeData }), // Send data as form data
      });

      if (response.ok) {
        const data = await response.json();
        console.log(data)
        localStorage.setItem('resumeData', data);
        localStorage.setItem('jdData', jdData);

        setIsAuthenticated(true);
        // Redirect to login page or another page
        navigate('/chat');
      } else {
        const data = await response.json();
        console.error(data)
      }
    } catch (error) {
      console.error('An error occurred. Please try again.');
    } finally {
      setLoading(false); // Reset loading state when done
    }
    // setIsAuthenticated(true);
    // navigate('/chat');
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


  const darkTheme = createTheme({
    typography: {
      fontSize: 15,
      fontFamily: 'Arial',
    },
    palette: {
      mode: 'dark',
      background: {
        default: '#0E1117',
        paper: '#0E1117',
      },
      primary: {
        main: '#60A5FA',
      }
    },
  });
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline enableColorScheme />
      <AppBar position="static" sx={{ backdropFilter: "blur(20px)" }} color='transparent'>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>

          </Typography>
          <Button color="inherit" onClick={handleLogout}>Logout</Button>
        </Toolbar>
      </AppBar>
      {/* <ColorModeSelect sx={{ position: 'fixed', top: '1rem', right: '1rem' }} /> */}
      <Stack
        direction="column"
        component="main"
        sx={[
          {
            justifyContent: 'center',
            height: 'calc((1 - var(--template-frame-height, 0)) * 100%)',
            marginTop: 'max(40px - var(--template-frame-height, 0px), 0px)',
            minHeight: '100%',
          },
          (theme) => ({
            '&::before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              zIndex: -1,
              inset: 0,
              backgroundImage:
                'radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))',
              backgroundRepeat: 'no-repeat',
              ...theme.applyStyles('dark', {
                backgroundImage:
                  'radial-gradient(at 50% 50%, hsla(210, 100%, 16%, 0.5), hsl(220, 30%, 5%))',
              }),
            },
          }),
        ]}
      >
        <Stack
          direction={{ xs: 'column-reverse', md: 'row' }}
          sx={{
            justifyContent: 'center',
            gap: { xs: 6, sm: 6 },
            p: { xs: 2, sm: 1 },
            m: 'auto',
          }}
        >
          <LandingContent sx={{ alignItems: 'left' }} />
          <Divider orientation='vertical' variant="middle" flexItem />
          <Container maxWidth="xs" sx={{ height: '100vh' }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                marginTop: 5,
                height: '100%'
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                <IconButton component="label">
                  <CloudUploadOutlinedIcon sx={{ height: 40, width: 40 }} />
                  <input type="file" accept="application/pdf" onChange={handleFileChange} hidden />
                </IconButton>

                <Box mt={2} textAlign="center">
                  {uploading ? (
                    <Box display="flex" alignItems="center" justifyContent="center">
                      <CircularProgress size={24} style={{ marginRight: 8 }} />
                      Processing..
                    </Box>
                  ) : uploadComplete ? (
                    <Box display="flex" alignItems="center" justifyContent="center" color="green">
                      <CheckCircleOutlineOutlinedIcon style={{ marginRight: 8 }} />
                      Processing Complete
                    </Box>
                  ) : (
                    <span>Upload Candidate's Resume</span> // Changed to <span> to avoid nesting issues
                  )}
                </Box>

                {file && (
                  <Paper elevation={2} sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    width: '200px',
                    mt: 2
                  }}>
                    <Icon style={{ marginRight: 8 }}>
                      <PictureAsPdfOutlinedIcon />
                    </Icon>
                    <Typography variant="body2"
                    > {file.name.length > 20 ? `${file.name.substring(0, 20)}...` : file.name}</Typography> {/* Use Typography for file name */}
                  </Paper>
                )}

                <Divider width="100%" sx={{ mt: 5, marginBottom: 2 }} />

                <IconButton component="label" disabled={!isFirstFileUploaded}>
                  {isFirstFileUploaded ? (
                    <CloudUploadOutlinedIcon sx={{ height: 40, width: 40, color: 'white' }} />
                  ) : (
                    <CloudUploadOutlinedIcon sx={{ height: 40, width: 40, color: 'grey' }} /> // Replace with your disabled icon
                  )}
                  <input type="file" accept="application/pdf" onChange={handleJDFileChange} hidden />
                </IconButton>

                <Box mt={2} textAlign="center">
                  {uploadingJD ? (
                    <Box display="flex" alignItems="center" justifyContent="center">
                      <CircularProgress size={24} style={{ marginRight: 8 }} />
                      Processing..
                    </Box>
                  ) : uploadJDComplete ? (
                    <Box display="flex" alignItems="center" justifyContent="center" color="green">
                      <CheckCircleOutlineOutlinedIcon style={{ marginRight: 8 }} />
                      Processing Complete
                    </Box>
                  ) : !isFirstFileUploaded ? (
                    <Typography variant="body2" sx={{ color: 'grey' }}>
                      Upload Job Description
                    </Typography>
                  ) : (
                    <Typography variant="body2" sx={{ color: 'white' }}>
                      Upload Job Description
                    </Typography>
                  )}
                </Box>

                {jdFile && (
                  <Paper elevation={2} sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    width: '200px',
                    mt: 2
                  }}>
                    <Icon style={{ marginRight: 8 }}>
                      <PictureAsPdfOutlinedIcon />
                    </Icon>
                    <Typography variant="body2"
                    > {jdFile.name.length > 20 ? `${jdFile.name.substring(0, 20)}...` : jdFile.name}</Typography> {/* Use Typography for file name */}
                  </Paper>
                )}

                <Button variant="contained" color="primary" sx={{ mt: 5 }} onClick={handleSubmit} disabled={loading}>
                  {loading ? <CircularProgress size={24} color="inherit" /> : "Start Interview"}
                </Button>
              </Box>

            </Box>
          </Container>
        </Stack>
      </Stack>
    </ThemeProvider>
  );
}