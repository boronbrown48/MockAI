import * as React from 'react';
import { useColorScheme } from '@mui/joy/styles';
import Sheet from '@mui/joy/Sheet';
import CssBaseline from '@mui/joy/CssBaseline';
import Typography from '@mui/joy/Typography';
import FormControl from '@mui/joy/FormControl';
import FormLabel from '@mui/joy/FormLabel';
import Input from '@mui/joy/Input';
import Button from '@mui/joy/Button';
import Link from '@mui/joy/Link';
import Select from '@mui/joy/Select';
import Option from '@mui/joy/Option';
import { useState } from 'react';

function ModeToggle() {
  const { mode, setMode } = useColorScheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <Button variant="soft">Change mode</Button>;
  }

  return (
    <Select
      variant="soft"
      value={mode}
      onChange={(event, newMode) => {
        setMode(newMode);
      }}
      sx={{ width: 'max-content' }}
    >
      <Option value="system">System</Option>
      <Option value="light">Light</Option>
      <Option value="dark">Dark</Option>
    </Select>
  );
}

export default function Signin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Reset error state

    try {
      const response = await fetch('http://localhost:8003/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          username: email,
          password: password,
        }),
      });

      if (!response.ok) {
        throw new Error('Login failed. Please check your credentials.');
      }

      const data = await response.json();
      console.log('Login successful:', data);
      // Handle successful login (e.g., store token, redirect, etc.)
    } catch (err) {
      setError(err.message);
      console.error(err);
    }
  };

  return (
    <main 
    style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh', // Full viewport height
    }}
    >
      <CssBaseline />
      <Sheet
        sx={{
          width: 350,
          mx: 'auto',
          my: 4,
          py: 3,
          px: 2,
          display: 'flex',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 2,
          borderRadius: 'sm',
          boxShadow: 'md',
        }}
        variant="outlined"
      >
        <div>
          <Typography sx={{ py: 0.5, fontSize: 18 }}>
            <b>Welcome!</b>
          </Typography>
          <Typography level="body-sm">Sign in to continue.</Typography>
        </div>
        <form onSubmit={handleSubmit}>
          <FormControl sx={{ py: 0.5 }}>
            <FormLabel sx={{ py: 0.5 }}>Email</FormLabel>
            <Input
              name="email"
              type="text"
              placeholder="johndoe@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </FormControl>
          <FormControl sx={{ py: 1 }}>
            <FormLabel sx={{ py: 0.5 }}>Password</FormLabel>
            <Input
              name="password"
              type="password"
              placeholder="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </FormControl>
          {error && <Typography sx={{ color: 'red' }}>{error}</Typography>}
          <Button sx={{ mt: 2, mb: 2 }} type="submit">Log in</Button>
        </form>
      </Sheet>
    </main>
  );
}
