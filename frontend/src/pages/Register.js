import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Link,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { departmentsAPI, rolesAPI } from '../services/api';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    department_id: '',
    role_id: '',
  });
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching departments and roles...');
        const [deptResponse, roleResponse] = await Promise.all([
          departmentsAPI.getDepartments(),
          rolesAPI.getRoles(),
        ]);
        console.log('Departments:', deptResponse);
        console.log('Roles:', roleResponse);
        setDepartments(deptResponse);
        setRoles(roleResponse);
        setError(''); // Clear any previous errors
      } catch (error) {
        console.error('Error fetching data:', error);
        if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
          setError('Cannot connect to server. Please ensure the backend is running on http://127.0.0.1:8088');
        } else {
          setError(`Failed to load departments and roles: ${error.response?.data?.detail || error.message}`);
        }
      }
    };

    fetchData();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    const { confirmPassword, ...userData } = formData;
    const result = await register(userData);
    
    if (result.success) {
      navigate('/documents');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <Container component="main" maxWidth="sm">
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
            Sign Up
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: '400px', margin: '0 auto' }}>
              <TextField
                required
                fullWidth
                size="medium"
                id="first_name"
                label="First Name"
                name="first_name"
                autoComplete="given-name"
                value={formData.first_name}
                onChange={handleChange}
              />
              
              <TextField
                required
                fullWidth
                size="medium"
                id="last_name"
                label="Last Name"
                name="last_name"
                autoComplete="family-name"
                value={formData.last_name}
                onChange={handleChange}
              />
              
              <TextField
                required
                fullWidth
                size="medium"
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
              />
              
              <TextField
                required
                fullWidth
                size="medium"
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
              />
              
              <TextField
                required
                fullWidth
                size="medium"
                name="confirmPassword"
                label="Confirm Password"
                type="password"
                id="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
              
              <FormControl fullWidth required>
                <InputLabel id="department-label" size="normal">Department</InputLabel>
                <Select
                  labelId="department-label"
                  id="department_id"
                  name="department_id"
                  value={formData.department_id}
                  label="Department"
                  onChange={handleChange}
                  size="medium"
                  variant="outlined"
                >
                  {departments.map((dept) => (
                    <MenuItem key={dept.department_id} value={dept.department_id}>
                      {dept.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth required>
                <InputLabel id="role-label" size="normal">Role</InputLabel>
                <Select
                  labelId="role-label"
                  id="role_id"
                  name="role_id"
                  value={formData.role_id}
                  label="Role"
                  onChange={handleChange}
                  size="medium"
                  variant="outlined"
                >
                  {roles.map((role) => (
                    <MenuItem key={role.role_id} value={role.role_id}>
                      {role.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </Button>
            <Box textAlign="center">
              <Link
                component="button"
                variant="body2"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/login');
                }}
              >
                Already have an account? Sign In
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Register;
