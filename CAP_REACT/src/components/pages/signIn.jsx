import React, { useState, useEffect } from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Link from '@mui/material/Link';
import Box from '@mui/material/Box';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Snackbar from '@mui/material/Snackbar';
import { getData } from '../../services/API';

const theme = createTheme();

export default function SignIn() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    remember: false, // State for the "Remember me" checkbox
  });

  const [snackbarOpen, setSnackbarOpen] = useState(false);

  useEffect(() => {
    // Clear form data when component mounts
    setFormData({
      username: '',
      password: '',
      remember: false,
    });
  }, []); // Empty dependency array ensures this runs only once on mount

  const handleChange = (event) => {
    const { name, value, checked, type } = event.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value, // Handle checkbox state
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await getData(`get/userByUserName/${formData.username}`);
      if (response && response.password === formData.password) {
        console.log('Sign in successful:', response);
        // Proceed with sign-in logic
      } else {
        setSnackbarOpen(true); // Show snackbar with error message
      }
    } catch (error) {
      console.error('Error:', error);
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
            Sign in
          </Typography>
          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username" // Corrected ID
              label="Username" // Corrected Label
              name="username" // Corrected Name
              autoComplete="off" // Disabled auto-fill
              autoFocus
              value={formData.username}
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
              autoComplete="off" // Disabled auto-fill
              value={formData.password}
              onChange={handleChange}
            />
            <FormControlLabel
              control={
                <Checkbox
                  name="remember"
                  checked={formData.remember}
                  onChange={handleChange}
                  color="primary"
                />
              }
              label="Remember me"
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
            >
              Sign In
            </Button>
            <Link href="#" variant="body2">
              Forgot password?
            </Link>
            <Link href="#" variant="body2">
              {"Don't have an account? Sign Up"}
            </Link>
          </Box>
        </Box>
        <Snackbar
          open={snackbarOpen}
          onClose={handleSnackbarClose}
          message="Username or password is incorrect."
          autoHideDuration={6000}
        />
      </Container>
    </ThemeProvider>
  );
}
