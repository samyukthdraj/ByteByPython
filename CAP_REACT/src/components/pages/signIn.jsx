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
import { getData, postData } from '../../services/API';
import { AuthContext } from '../../context/AuthContext';
import API_URLS from '../../services/ApiUrl';

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
      const response = await postData(formData, API_URLS.AUTH.signIn);
      console.log(formData)
      if (response) {
        // Check for userType to avoid errors if the server response changes
        const userType = response.userType || response.user_type; // Handle potential variations in response
        if (userType === 'civilian') {
          login(response); // Call the login function from AuthContext
          navigate('/civilian/dashboard');
        } else if (userType === 'police') {
          login(response); // Call the login function from AuthContext
          navigate('/police/dashboard');
        }
      } else {
        setSnackbarOpen(true);
      }
    } catch (error) {
      // Handle specific error responses
      if (error.response && error.response.data && error.response.data.detail) {
        setSnackbarOpen(true);
        //Set a more specific error message based on the response.
        // This example assumes the server sends 'detail' in the response.
        const errorMessage = error.response.data.detail;
        // Update the Snackbar message to reflect the specific error.
        // you will likely want to use a more sophisticated approach to display errors.
      } else {
        console.error('Error:', error);
        setSnackbarOpen(true); //Generic error message.
      }
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
