import React, { useState } from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import Stack from '@mui/material/Stack';
import { useNavigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { TextField, Button, Container, Typography, Box, Toolbar, AppBar, CircularProgress } from '@mui/material';
import Content from './Content';
import Divider from '@mui/material/Divider';

export default function Login({ setIsAuthenticated }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const BASE_URL = "https://mockaibackend.vercel.app";

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    // Handle sign-in
    try {
      const response = await fetch(BASE_URL + '/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded', // Change to x-www-form-urlencoded
        },
        body: new URLSearchParams({ username, password }), // Send data as form data
      });

      if (response.ok) {
        const data = await response.json();
        // Store the access token (you may want to store it in localStorage or context)
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('client_id', data.client_id)
        setMessage('Login successful!');

        console.log(localStorage.getItem('access_token'))
        setIsAuthenticated(true);
        // Redirect to login page or another page
        navigate('/landing');
      } else {
        const data = await response.json();
        setMessage(data.detail || 'Invalid username or password');
      }
    } catch (error) {
      setMessage('An error occurred. Please try again.');
    } finally {
      setLoading(false); // Set loading back to false after the attempt
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

  const lightTheme = createTheme({
    palette: {
      mode: 'light',
      background: {
        default: '#FFFFFF',
        paper: '#FFFFFF',
      },
      primary: {
        main: '#000000',
      },
      secondary: {
        main: '#FFFFFF'
      }
    },
  });

  return (
    <ThemeProvider theme={lightTheme}>
      <CssBaseline enableColorScheme />
      {/* <ColorModeSelect sx={{ position: 'fixed', top: '1rem', right: '1rem' }} /> */}
      <Stack
        marginTop={"50px"}
        direction="column"
        component="main"
      >
        <Stack
          direction={{ xs: 'column-reverse', md: 'row' }}
          sx={{
            justifyContent: 'center',
            gap: { xs: 6, sm: 6 },
            p: { xs: 2, sm: 4 },
            m: 'auto',
          }}
        >
          <Content />
          <Divider orientation='vertical' variant="middle" flexItem />
          <Container maxWidth="xs" sx={{ height: '100vh' }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                marginTop: 10,
                height: '100%'
              }}
            >
              <Typography component="h1" variant="h5">
                Sign In
              </Typography>
              <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="email"
                  label="Email Address"
                  name="email"
                  fontSize="14px"
                  autoComplete="email"
                  onChange={(e) => setUsername(e.target.value)}
                  autoFocus
                  sx={{ mt: 3, borderRadius: 2 }}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type="password"
                  id="password"
                  fontSize="14px"
                  autoComplete="current-password"
                  onChange={(e) => setPassword(e.target.value)}
                  sx={{ mt: 3, mb: 1, borderRadius: 2 }}
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ height: 45, mt: 3, mb: 2, borderRadius: 2 }}
                  disabled={loading} // Disable button while loading
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
                </Button>
              </Box>
            </Box>
          </Container>
        </Stack>
      </Stack>
    </ThemeProvider>
  );
}