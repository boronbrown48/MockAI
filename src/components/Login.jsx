import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import {
  TextField,
  Button,
  Container,
  Typography,
  Box,
  Stack,
  CssBaseline,
  CircularProgress,
  Divider,
  Alert,
} from '@mui/material';
import Content from './Content';
import { BASE_URL_SETTING } from './../setting';

// Move theme definitions outside component to prevent recreation on each render
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
      main: '#FFFFFF',
    },
  },
});

// For Vite, use import.meta.env instead of process.env
const BASE_URL = import.meta.env.VITE_API_URL || BASE_URL_SETTING;

const Login = ({ setIsAuthenticated }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = useCallback((event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Authentication failed');
      }

      // Store tokens securely
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('client_id', data.client_id);
      localStorage.setItem("refreshToken", data.refresh_token);

      setIsAuthenticated(true);
      navigate('/landing');
    } catch (error) {
      setError(("Error during Login: " + error.message) || 'An error occurred during login. Please try again.');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };


  return (
    <ThemeProvider theme={lightTheme}>
      <CssBaseline enableColorScheme />
      <Stack
        marginTop="50px"
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
          <Divider orientation="vertical" variant="middle" flexItem />
          <Container maxWidth="xs" sx={{ height: '100vh' }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                marginTop: 10,
                height: '100%',
              }}
            >
              <Typography component="h1" variant="h5">
                Sign In
              </Typography>
              {error && (
                <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
                  {error}
                </Alert>
              )}
              <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="username"
                  label="Email Address"
                  name="username"
                  // type="email"
                  autoComplete="email"
                  value={formData.username}
                  onChange={handleInputChange}
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
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleInputChange}
                  sx={{ mt: 3, mb: 1, borderRadius: 2 }}
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={loading || !formData.username || !formData.password}
                  sx={{ height: 45, mt: 3, mb: 2, borderRadius: 2 }}
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
};

export default Login;