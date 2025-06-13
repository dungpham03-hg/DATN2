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
  Stack
} from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../contexts/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [error, setError] = useState(location.state?.error || '');
  const [loading, setLoading] = useState(false);

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
    <Container maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
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
              type="password"
              id="password"
              autoComplete="current-password"
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

          <Stack spacing={2} width="100%" mt={3}>
            <Divider>
              <Typography variant="body2" color="text.secondary">
                Hoặc đăng nhập với
              </Typography>
            </Divider>
            
            {/* Google Login via @react-oauth/google */}
            <GoogleLogin
              width="100%"
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

            <Button
              variant="outlined"
              startIcon={<GitHubIcon />}
              onClick={() => handleOAuthLogin('github')}
              fullWidth
              sx={{
                borderColor: '#24292e',
                color: '#24292e',
                '&:hover': {
                  borderColor: '#24292e',
                  backgroundColor: 'rgba(36, 41, 46, 0.04)'
                }
              }}
            >
              Đăng nhập bằng GitHub
            </Button>
          </Stack>

          <Box sx={{ mt: 2 }}>
            <Link href="/register" variant="body2">
              {"Chưa có tài khoản? Đăng ký"}
            </Link>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login; 