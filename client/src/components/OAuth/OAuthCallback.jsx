import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { CircularProgress, Box, Typography, Alert } from '@mui/material';

const OAuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, dispatch } = useAuth();
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        console.log('🔍 Current URL:', window.location.href);
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        const userParam = params.get('user');
        const error = params.get('error');
        
        console.log('🎫 Received token:', token);
        console.log('👤 Received user param:', userParam);
        console.log('❌ Received error:', error);
        
        if (error) {
          throw new Error(error);
        }
        
        if (!token) {
          throw new Error('Không nhận được token từ OAuth provider');
        }

        console.log('✨ Processing OAuth callback...');
        
        // Parse user data if available
        let userData = null;
        if (userParam) {
          try {
            userData = JSON.parse(decodeURIComponent(userParam));
            console.log('🧑‍💻 User data from OAuth:', userData);
            
            // Store the token in localStorage
            localStorage.setItem('token', token);
            
            // Update auth context
            dispatch({
              type: 'LOGIN_SUCCESS',
              payload: {
                user: userData,
                token: token
              }
            });
            
            // Redirect to dashboard after a short delay
            console.log('✅ OAuth login successful, redirecting to dashboard...');
            setTimeout(() => {
              navigate('/dashboard', { replace: true });
            }, 100);
            
            return; // Exit early on success
            
          } catch (decodeErr) {
            console.error('❌ Failed to process user data:', decodeErr);
            // Continue to fallback method if parsing fails
          }
        }

        
        // Fallback method if user data is not available in URL
        console.log('ℹ️ User data not in URL, trying to fetch user info...');
        try {
          const result = await login(token);
          console.log('✅ Login result:', result);
          
          setTimeout(() => {
            navigate('/dashboard', { replace: true });
          }, 100);
          
        } catch (loginError) {
          console.error('❌ Login failed:', loginError);
          throw new Error('Không thể đăng nhập. Vui lòng thử lại.');
        }
        
      } catch (error) {
        console.error('🚨 OAuth callback error:', error);
        setError(error.message || 'Có lỗi xảy ra khi xử lý đăng nhập');
        
        // Wait 3 seconds before redirecting to login
        setTimeout(() => {
          navigate('/login', { 
            replace: true,
            state: { 
              error: error.message || 'Đăng nhập không thành công. Vui lòng thử lại sau.'
            } 
          });
        }, 3000);
      }
    };

    handleOAuthCallback();
  }, [navigate, login, dispatch]);

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      gap={2}
      p={3}
    >
      <CircularProgress />
      {error ? (
        <>
          <Alert severity="error" sx={{ width: '100%', maxWidth: 400 }}>
            {error}
          </Alert>
          <Typography variant="body2" color="text.secondary">
            Đang chuyển về trang đăng nhập...
          </Typography>
        </>
      ) : (
        <Typography variant="body1" color="text.secondary">
          Đang xử lý đăng nhập...
        </Typography>
      )}
    </Box>
  );
};

export default OAuthCallback; 