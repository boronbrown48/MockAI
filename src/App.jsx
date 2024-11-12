import React, { useState, useEffect } from 'react';
import { CssVarsProvider } from '@mui/joy/styles';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';

import Login from './components/Login';
import Landing from './components/landing';
import Chatbot from './components/Chatbot';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // New loading state

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    console.log("Access_Token:", token);
    setIsAuthenticated(!!token);
    setIsLoading(false); // Set loading to false once the check is done
  }, []);

  if (isLoading) {
    return <div>Loading...</div>; // Optionally show a loading indicator
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={isAuthenticated ? <Navigate to="/landing" /> : <Login setIsAuthenticated={setIsAuthenticated} />} />
        <Route path="/landing" element={isAuthenticated ? <Landing setIsAuthenticated={setIsAuthenticated} /> : <Navigate to="/" />} />
        <Route path="/chat" element={isAuthenticated ? <Chatbot setIsAuthenticated={setIsAuthenticated} /> : <Navigate to="/" />} />
        <Route path="/chat" element={isAuthenticated ? <Chatbot /> : <Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;