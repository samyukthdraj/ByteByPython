import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Link from '@mui/material/Link';
import Box from '@mui/material/Box';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { FormControl, FormGroup } from '@mui/material';
import Snackbar from '@mui/material/Snackbar';
import { getData, postData } from '../../services/API';
import API_URLS from '../../services/ApiUrl';
const theme = createTheme();

export default function SignUp() {
  const [formData, setFormData] = useState({
    _id: '',
    name: '',
    mobileNumber: '',
    username: '',
    password: '',
  });

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const navigate = useNavigate(); // Initialize useNavigate

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      // Call the API to create the new civilian
      const postResponse = await postData(formData, API_URLS.CIVILIAN.signUp);

      if (postResponse.detail === 'User created successfully') {
        navigate('/'); // Navigate to the Sign In page after successful signup
      } else if (postResponse.detail = 'Username already exists') {
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error('An unexpected error occurred:', error.message);
    }
  };


  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <ThemeProvider theme={theme}>
      <Container component="main" maxWidth="xs">
        <CssBaseline />
        <Box
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography component="h1" variant="h5">
            Sign up
          </Typography>
          <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 3 }}>
            <FormControl fullWidth>
              <FormGroup>
                <TextField
                  name="name"
                  required
                  fullWidth
                  id="name"
                  label="Name"
                  autoComplete="given-name"
                  autoFocus
                  value={formData.name}
                  onChange={handleChange}
                  sx={{ mb: 2 }}
                />
                <TextField
                  name="mobileNumber"
                  required
                  fullWidth
                  id="mobileNumber"
                  label="Mobile Number"
                  autoComplete="tel"
                  value={formData.mobileNumber}
                  onChange={handleChange}
                  sx={{ mb: 2 }}
                />
                <TextField
                  name="username"
                  required
                  fullWidth
                  id="username"
                  label="Username"
                  autoComplete="username"
                  value={formData.username}
                  onChange={handleChange}
                  sx={{ mb: 2 }}
                />
                <TextField
                  name="password"
                  required
                  fullWidth
                  id="password"
                  label="Password"
                  type="password"
                  autoComplete="off"
                  value={formData.password}
                  onChange={handleChange}
                  sx={{ mb: 2 }}
                />
              </FormGroup>
            </FormControl>
            <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
              Sign Up
            </Button>
            <Box textAlign="center">
              <Link onClick={() => navigate('/')} variant="body2" sx={{ cursor: 'pointer' }}>
                Already have an account? Sign in
              </Link>
            </Box>
          </Box>
        </Box>
        <Snackbar
          open={snackbarOpen}
          onClose={handleSnackbarClose}
          message="User already exists"
          autoHideDuration={6000}
        />
      </Container>
    </ThemeProvider>
  );
}