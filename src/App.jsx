import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';

import Login from './components/Login';
import Landing from './components/landing';
import Chatbot from './components/Chatbot';
import ResumeGenerator from './components/ResumeGen';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [canAccessChat, setCanAccessChat] = useState(false);  // State to track if user can access /chat

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    setIsAuthenticated(!!token); // Set true if token exists
    setIsLoading(false); // Stop loading
  }, []);

  if (isLoading) {
    return <div>Loading...</div>; // Show loading while checking authentication
  }

  // Handle the button click to allow access to /chat
  const handleAccessChat = () => {
    setCanAccessChat(true);
  };

  return (
    <Router>
      <Routes>
        {/* Public Route */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to="/landing" replace />
            ) : (
              <Login setIsAuthenticated={setIsAuthenticated} />
            )
          }
        />

        {/* Protected Routes */}
        {isAuthenticated && (
          <>
            <Route
              path="/landing"
              element={<Landing setIsAuthenticated={setIsAuthenticated} handleAccessChat={handleAccessChat} />}
            />

            {/* /chat route is only accessible if canAccessChat is true */}
            <Route
              path="/chat"
              element={
                canAccessChat ? (
                  <Chatbot setIsAuthenticated={setIsAuthenticated} />
                ) : (
                  <Navigate to="/landing" replace />  // Redirect to landing if the user hasn't clicked the button
                )
              }
            />

            <Route
              path="/resume"
              element={<ResumeGenerator setIsAuthenticated={setIsAuthenticated} />}
            />
          </>
        )}

        {/* Redirect all unknown routes to the home page */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
