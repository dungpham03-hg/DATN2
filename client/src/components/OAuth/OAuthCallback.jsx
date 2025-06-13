import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { CircularProgress, Box, Typography, Alert } from '@mui/material';

const OAuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        console.log('🔍 Current URL:', window.location.href);
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        const error = params.get('error');
        
        console.log('🎫 Received token:', token);
        console.log('❌ Received error:', error);
        
        if (error) {
          throw new Error(error);
        }
        
        if (!token) {
          throw new Error('Không nhận được token từ OAuth provider');
        }

        console.log('✨ Processing login...');
        
        // Lưu token và cập nhật trạng thái đăng nhập
        const result = await login(token);
        console.log('✅ Login result:', result);
        
        // Đợi 150ms để Context cập nhật trước khi điều hướng
        setTimeout(() => {
          console.log('🔄 Navigating to dashboard...');
          navigate('/dashboard', { replace: true });
        }, 150);
      } catch (error) {
        console.error('🚨 OAuth callback error:', error);
        setError(error.message);
        
        // Chờ 3 giây trước khi chuyển về trang login
        setTimeout(() => {
          navigate('/login', { 
            replace: true,
            state: { 
              error: 'Đăng nhập không thành công. Vui lòng thử lại sau.'
            } 
          });
        }, 3000);
      }
    };

    handleOAuthCallback();
  }, [navigate, login]);

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