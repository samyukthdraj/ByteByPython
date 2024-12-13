// SignIn.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CssBaseline from '@mui/material/CssBaseline';
import { FormControl, FormGroup } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { getData } from '../../services/API';
import { AuthContext } from '../../context/AuthContext';

const theme = createTheme();

export default function SignIn() {
  const { login } = useContext(AuthContext); // Use the AuthContext
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Clear form data when component mounts
    setFormData({
      username: '',
      password: '',
    });
  }, []);

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
      const response = await getData(`get/userByUserName/${formData.username}`);
      if (response && response.password === formData.password) {
        login(response); // Use the login function from AuthContext
        if (response.type === 'civilian') {
          navigate('/civilian/newIncident'); // Direct to the correct route
        } else if (response.type === 'police') {
          navigate('/police/dashboard');
        }
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

  const handleSignUp = () => {
    navigate('/signUp');
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
            Sign In
          </Typography>
          <Box
            component="form"
            onSubmit={handleSubmit}
            noValidate
            sx={{ mt: 1 }}
            autoComplete="off"
          >
            <FormControl fullWidth>
              <FormGroup>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="username"
                  label="Username"
                  name="username"
                  autoComplete="off"
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
                  autoComplete="off"
                  value={formData.password}
                  onChange={handleChange}
                />
              </FormGroup>
            </FormControl>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
            >
              Sign In
            </Button>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                mt: 2,
              }}
            >
              <Link href="#" variant="body2">
                Forgot password?
              </Link>
              <Link variant="body2" onClick={handleSignUp} sx={{ cursor: 'pointer' }}>
                {"Don't have an account? Sign Up"}
              </Link>
            </Box>
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
