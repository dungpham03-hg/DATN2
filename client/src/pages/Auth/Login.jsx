import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Link,
  Divider,
  Stack,
  IconButton,
  InputAdornment
} from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../contexts/AuthContext';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [error, setError] = useState(location.state?.error || '');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email');
    const password = formData.get('password');

    try {
      setError('');
      setLoading(true);
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = (provider) => {
    const apiUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';
    window.location.href = `${apiUrl}/auth/${provider}`;
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        p: 2,
      }}
    >
      <Container maxWidth="sm" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Tiêu đề tên ứng dụng */}
        <Typography variant="h4" fontWeight="bold" color="white" gutterBottom>
        Quản lý cuộc họp
      </Typography>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
        }}
      >
        <Paper
            elevation={10}
          sx={{
              px: 5,
              py: 6,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
              borderRadius: 4,
              backdropFilter: 'blur(10px)',
              backgroundColor: 'rgba(255,255,255,0.85)'
          }}
        >
          <Typography component="h1" variant="h5" gutterBottom>
            Đăng nhập
          </Typography>

          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email"
              name="email"
              autoComplete="email"
              autoFocus
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Mật khẩu"
                type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                        sx={{ color: 'text.secondary' }}
                        disableRipple
                        size="small"
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3 }}
              disabled={loading}
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </Button>
          </Box>

          <Stack spacing={2} width="100%" mt={3} alignItems="center">
            <Divider>
              <Typography variant="body2" color="text.secondary">
                Hoặc đăng nhập với
              </Typography>
            </Divider>
            
            {/* Google Login chỉ hiển thị icon */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <GoogleLogin
                type="icon"
                shape="circle"
                theme="outline"
                onSuccess={async (credentialResponse) => {
                  try {
                    const { credential } = credentialResponse;
                    if (!credential) throw new Error('Không nhận được credential');

                    setLoading(true);
                    // Gửi credential sang backend để đổi JWT nội bộ
                    const apiUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';
                    const res = await fetch(`${apiUrl}/auth/google-token`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify({ credential })
                    });
                    if (!res.ok) {
                      const errData = await res.json();
                      throw new Error(errData.message || 'Xác thực Google thất bại');
                    }
                    const data = await res.json();

                    await login(data.token, undefined, data.user);
                    navigate('/dashboard');
                  } catch (err) {
                    console.error(err);
                    setError(err.message);
                  } finally {
                    setLoading(false);
                  }
                }}
                onError={() => setError('Đăng nhập Google thất bại')}
              />

              {/* GitHub Login chỉ hiển thị icon */}
              <IconButton
                onClick={() => handleOAuthLogin('github')}
                sx={{
                  border: '1px solid #24292e',
                  width: 44,
                  height: 44,
                  color: '#24292e',
                  '&:hover': {
                    backgroundColor: 'rgba(36, 41, 46, 0.04)'
                  }
                }}
              >
                <GitHubIcon />
              </IconButton>
            </Box>
          </Stack>

          <Box sx={{ mt: 2 }}>
            <Link href="/register" variant="body2">
              {"Chưa có tài khoản? Đăng ký"}
            </Link>
          </Box>
        </Paper>
      </Box>
    </Container>
    </Box>
  );
};

export default Login; 