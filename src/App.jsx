import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';

import Login from './components/Login';
import Landing from './components/landing';
import Chatbot from './components/Chatbot';
import ResumeGenerator from './components/ResumeGen';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    setIsAuthenticated(!!token);
    setIsLoading(false);
  }, []);

  // Protected Route wrapper component
  const ProtectedRoute = ({ children }) => {
    if (!isAuthenticated) {
      return <Navigate to="/" replace />;
    }
    return children;
  };

  // Chat Route wrapper component
  const ChatRoute = ({ children }) => {
    const canAccessChat = localStorage.getItem('canAccessChat') === 'true';

    if (!canAccessChat) {
      return <Navigate to="/landing" replace />;
    }
    return children;
  };

  // Handle the button click to allow access to /chat
  const handleAccessChat = () => {
    localStorage.setItem('canAccessChat', 'true');
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

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
        <Route
          path="/landing"
          element={
            <ProtectedRoute>
              <Landing
                setIsAuthenticated={setIsAuthenticated}
                handleAccessChat={handleAccessChat}
              />
            </ProtectedRoute>
          }
        />

        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <ChatRoute>
                <Chatbot setIsAuthenticated={setIsAuthenticated} />
              </ChatRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/resume"
          element={
            <ProtectedRoute>
              <ResumeGenerator setIsAuthenticated={setIsAuthenticated} />
            </ProtectedRoute>
          }
        />

        {/* Redirect all unknown routes to the home page */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;