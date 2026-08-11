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
  PersonOutline,
} from '@mui/icons-material';
import axiosInstance from "../axiosConfig";
import logo from "../assets/images/diocese-logo-new5.webp";

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#5B4CD6', light: '#7C6CF0', dark: '#4338CA' },
    secondary: { main: '#10B981' }
  }
});

const StyledCard = styled(Card)({
  borderRadius: 12,
  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  padding: 32,
  maxWidth: 400,
  width: '100%'
});

const LoadingOverlay = styled(Backdrop)(({ theme }) => ({
  zIndex: theme.zIndex.drawer + 1,
  color: '#fff',
  flexDirection: 'column',
  backgroundColor: 'rgba(0, 0, 0, 0.7)'
}));

const ParishLoginPage = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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

      const response = await axiosInstance.post('/parishc/parish-credentials/login', {
        username: formData.username,
        password: formData.password
      });

      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        if (response.data.user) {
          localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;

        await new Promise(resolve => setTimeout(resolve, 800));
        window.location.href = '/parish/registration';
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
      <Box sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 3,
        background: 'linear-gradient(120deg, #EDE9FE 0%, #F8FAFC 100%)'
      }}>
        <LoadingOverlay open={loading}>
          <CircularProgress color="inherit" size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>Logging in...</Typography>
        </LoadingOverlay>

        <StyledCard>
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <img src={logo} style={{ width: '100%' }} alt="Diocese Logo" />
              <Typography variant="body1" sx={{ fontWeight: 700, color: '#5B4CD6', mt: 1 }}>
                Parish Login
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Sign in with your parish credentials
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>
            )}

            <TextField
              fullWidth label="Username" name="username"
              value={formData.username} onChange={handleChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start"><PersonOutline /></InputAdornment>
                )
              }}
            />

            <TextField
              fullWidth label="Password" name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password} onChange={handleChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start"><LockOutlined /></InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />

            <Button type="submit" variant="contained" size="large" disabled={loading}
              sx={{
                py: 1.5, mt: 2,
                backgroundColor: 'primary.main',
                '&:hover': { backgroundColor: 'primary.dark' }
              }}>
              Sign In
            </Button>

            {/* <Button href="/login" size="small"
              sx={{ textTransform: 'none', color: '#94A3B8', fontSize: '13px' }}>
              Admin Login →
            </Button> */}
          </Box>
        </StyledCard>
      </Box>
    </ThemeProvider>
  );
};

export default ParishLoginPage;