import React, { useState, useEffect } from 'react';
import { CssVarsProvider } from '@mui/joy/styles';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';

import Login from './components/Login';
import Landing from './components/landing';
import Chatbot from './components/Chatbot';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    console.log("Access_Token:", token);
    setIsAuthenticated(!!token); // Set authenticated state based on token presence
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={isAuthenticated ? <Navigate to="/landing" /> : <Login setIsAuthenticated={setIsAuthenticated} />} />
        <Route path="/landing" element={isAuthenticated ? <Landing setIsAuthenticated={setIsAuthenticated} /> : <Navigate to="/" />} />
        <Route path="/chat" element={isAuthenticated ? <Chatbot setIsAuthenticated={setIsAuthenticated} /> : <Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;