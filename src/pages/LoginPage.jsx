import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  ThemeProvider,
  createTheme,
  CssBaseline,
  CircularProgress,
  Alert,
  InputAdornment,
  IconButton,
  Backdrop,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Visibility,
  VisibilityOff,
  LockOutlined,
  Email,
} from '@mui/icons-material';
import axiosInstance from "../axiosConfig";
import logo from "../assets/images/diocese-logo-new5.webp";
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2563EB',
      light: '#3B82F6',
      dark: '#1E40AF'
    },
    secondary: {
      main: '#10B981',
      light: '#34D399',
      dark: '#047857'
    }
  }
});

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: 12,
  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  padding: theme.spacing(4),
  maxWidth: 400,
  width: '100%'
}));

const LoadingOverlay = styled(Backdrop)(({ theme }) => ({
  zIndex: theme.zIndex.drawer + 1,
  color: '#fff',
  flexDirection: 'column',
  backgroundColor: 'rgba(0, 0, 0, 0.7)'
}));

const LoginPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.username || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await axiosInstance.get(`/auth/login/${formData.username}/${formData.password}`);

      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        if (response.data.admin) {
          localStorage.setItem('user', JSON.stringify(response.data.admin));
        }
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;

        // Add a delay before redirect
        await new Promise(resolve => setTimeout(resolve, 800));
        window.location.href = '/home';
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error.response?.data?.message || 'Invalid username or password');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 3,
          background: 'linear-gradient(120deg, #E2E8F0 0%, #F8FAFC 100%)'
        }}
      >
        <LoadingOverlay open={loading}>
          <CircularProgress color="inherit" size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Logging in...
          </Typography>
        </LoadingOverlay>

        <StyledCard>
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
            }}
          >
            <Box sx={{ textAlign: 'center', mb: 2 }}>
            <img src={logo} style={{width:'100%'}} alt="Diocese Logo" />
              
              <Typography variant="body2" color="text.secondary">
                Please sign in to continue
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <TextField
              fullWidth
              label="Email"
              name="username"
              value={formData.username}
              onChange={handleChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlined />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                py: 1.5,
                mt: 2,
                backgroundColor: 'primary.main',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
              }}
            >
              Sign In
            </Button>
          </Box>
        </StyledCard>
      </Box>
    </ThemeProvider>
  );
};

export default LoginPage;