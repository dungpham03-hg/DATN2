import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/Auth/PrivateRoute';
import PublicOnlyRoute from './components/Auth/PublicOnlyRoute';
import Layout from './components/Layout';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Dashboard from './pages/Dashboard/Dashboard';
import Profile from './pages/Profile/Profile';
import Meetings from './pages/Meetings/Meetings';
import MeetingDetail from './pages/Meetings/MeetingDetail';
import CreateMeeting from './pages/Meetings/CreateMeeting';
// import EditMeeting from './pages/Meetings/EditMeeting';
import OAuthCallback from './components/OAuth/OAuthCallback';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            {/* Root redirect */}
            <Route path="/" element={<PrivateRoute><Navigate to="/dashboard" replace /></PrivateRoute>} />

            {/* Public routes - chỉ truy cập khi chưa đăng nhập */}
            <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
            <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
            
            {/* OAuth callback route - không cần bảo vệ */}
            <Route path="/oauth/callback" element={<OAuthCallback />} />
            
            {/* Protected routes - yêu cầu đăng nhập */}
            <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/meetings" element={<Meetings />} />
              <Route path="/meetings/create" element={<CreateMeeting />} />
              <Route path="/meetings/:id" element={<MeetingDetail />} />
              {/* <Route path="/meetings/:id/edit" element={<EditMeeting />} /> */}
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App; 