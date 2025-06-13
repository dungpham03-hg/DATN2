import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';

// Context
import { AuthProvider } from './contexts/AuthContext';

// Components
import Navbar from './components/Layout/Navbar';
import PrivateRoute from './components/Auth/PrivateRoute';

// Pages
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Dashboard from './pages/Dashboard/Dashboard';
import Meetings from './pages/Meetings/Meetings';
import MeetingDetail from './pages/Meetings/MeetingDetail';
import CreateMeeting from './pages/Meetings/CreateMeeting';
import Profile from './pages/Profile/Profile';

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <Navbar />
        
        <main className="main-content">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Private Routes */}
            <Route path="/" element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } />
            
            <Route path="/dashboard" element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } />
            
            <Route path="/meetings" element={
              <PrivateRoute>
                <Meetings />
              </PrivateRoute>
            } />
            
            <Route path="/meetings/create" element={
              <PrivateRoute>
                <CreateMeeting />
              </PrivateRoute>
            } />
            
            <Route path="/meetings/:id" element={
              <PrivateRoute>
                <MeetingDetail />
              </PrivateRoute>
            } />
            
            <Route path="/profile" element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            } />
            
            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        
        {/* Toast notifications */}
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </div>
    </AuthProvider>
  );
}

export default App; 