import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Link,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Debug: Log when error state changes
  React.useEffect(() => {
    console.log("🔍 Error state changed to:", error);
  }, [error]);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
    
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    console.log("🔍 LOGIN BUTTON CLICKED:", new Date().toISOString());
    console.log("🔍 Form data:", { email: formData.email, password: "***" });
    const submitStartTime = performance.now();

    try {
      console.log("🔍 Calling login function...");
      const loginCallStart = performance.now();
      
      const result = await login(formData.email, formData.password);
      
      const loginCallEnd = performance.now();
      console.log(`🔍 Login function returned in ${(loginCallEnd - loginCallStart).toFixed(3)}ms`);
      console.log("🔍 Login result:", result);
      
      if (result && result.success) {
        console.log("🔍 Login successful, navigating...");
        const navStart = performance.now();
        
        navigate('/documents');
        
        const navEnd = performance.now();
        console.log(`🔍 Navigation completed in ${(navEnd - navStart).toFixed(3)}ms`);
      } else {
        console.log("🔍 Login failed:", result?.error);
        console.log("🔍 Setting error state to:", result?.error);
        const errorMsg = result?.error || 'Incorrect email or password';
        setError(errorMsg);
        console.log("🔍 Error state set, component should re-render with error:", errorMsg);
      }
    } catch (error) {
      console.error("🔍 Unexpected error in handleSubmit:", error);
      console.log("🔍 Setting error state to: An unexpected error occurred");
      setError("An unexpected error occurred. Please try again.");
    } finally {
      const totalSubmitTime = performance.now() - submitStartTime;
      console.log(`🔍 TOTAL SUBMIT PROCESS: ${totalSubmitTime.toFixed(3)}ms`);
      console.log("🔍 Setting loading to false");
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
          <Typography component="h1" variant="h4" align="center" gutterBottom>
            Document Repository
          </Typography>
          <Typography component="h2" variant="h5" align="center" gutterBottom>
            Sign In
          </Typography>
          
          {error && (
            <>
              {console.log("🔍 Rendering error alert with message:", error)}
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            </>
          )}
          
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={formData.email}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
            <Box textAlign="center">
              <Link
                component="button"
                variant="body2"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/register');
                }}
              >
                Don't have an account? Sign Up
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;
