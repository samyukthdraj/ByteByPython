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
import { postData } from '../../services/apiService';
import API_URLS from '../../services/apiUrlService';
import { useSnackbar } from '../../context/snackbarContext';

const theme = createTheme({
  palette: {
    background: {
      default: '#FFFFFF',
    },
    primary: {
      main: '#272343',
    },
    secondary: {
      main: '#E3F6F5',
    },
    tertiary: {
      main: '#FFFFFF',
    },
    quaternary: {
      main: '#BAE8E8',
    },
  },
});


export default function SignUp() {
  const { showSnackbar} = useSnackbar();
  const [formData, setFormData] = useState({
    _id: '',
    name: '',
    mobileNumber: '',
    username: '',
    password: '',
  });

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

    if(!formData.name){
      showSnackbar('Name is required.', 'error');
      return;
    }else if(!formData.mobileNumber){
      showSnackbar('MobileNumber is required.', 'error');
      return;
    }else if(!formData.username){
      showSnackbar('Username is required.', 'error');
      return;
    }else if(!formData.password){
      showSnackbar('Password is required.', 'error');
      return;
    }

    try {
      // Call the API to create the new civilian
      const postResponse = await postData(formData, API_URLS.CIVILIAN.signUp, null);

      if (postResponse.detail === 'User created successfully') {
        navigate('/'); // Navigate to the Sign In page after successful signup
      } else if (postResponse.detail = 'Username already exists') {
        showSnackbar('Username already exists.', 'info')
      }
    } catch (error) {
      console.error('An unexpected error occurred:', error.message);
    }
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
          <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography component="h1" variant="h5" color="primary">
            Sign up
          </Typography>
          <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <FormGroup>
                <TextField
                  margin="normal"
                  name="name"
                  required
                  fullWidth
                  id="name"
                  label="Name"
                  autoComplete="given-name"
                  autoFocus
                  value={formData.name}
                  onChange={handleChange}
                  color="primary" // Use theme's primary color
                  sx={{
                    // Change background color of the input box
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'secondary.main', // Theme-aware background color
                      '& input': {
                        color: 'primary.main', // Text color inside the input box
                      },
                      '& fieldset': {
                        borderColor: 'quaternary.main', // Border color
                      },
                      '&:hover fieldset': {
                        borderColor: 'primary.main', // Hover border color
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: 'primary.main', // Focused border color
                      },
                    },
                    // Change label color
                    '& .MuiInputLabel-root': {
                      color: 'primary.main', // Default label color
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: 'primary.main', // Focused label color
                    },
                  }}
                />
                <TextField
                  margin="normal"
                  name="mobileNumber"
                  required
                  fullWidth
                  id="mobileNumber"
                  label="Mobile Number"
                  autoComplete="tel"
                  value={formData.mobileNumber}
                  onChange={handleChange}
                  color="primary" // Use theme's primary color
                  sx={{
                    // Change background color of the input box
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'secondary.main', // Theme-aware background color
                      '& input': {
                        color: 'primary.main', // Text color inside the input box
                      },
                      '& fieldset': {
                        borderColor: 'quaternary.main', // Border color
                      },
                      '&:hover fieldset': {
                        borderColor: 'primary.main', // Hover border color
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: 'primary.main', // Focused border color
                      },
                    },
                    // Change label color
                    '& .MuiInputLabel-root': {
                      color: 'primary.main', // Default label color
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: 'primary.main', // Focused label color
                    },
                  }}
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
                  margin="normal"
                  color="primary" // Use theme's primary color
                  sx={{
                    // Change background color of the input box
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'secondary.main', // Theme-aware background color
                      '& input': {
                        color: 'primary.main', // Text color inside the input box
                      },
                      '& fieldset': {
                        borderColor: 'quaternary.main', // Border color
                      },
                      '&:hover fieldset': {
                        borderColor: 'primary.main', // Hover border color
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: 'primary.main', // Focused border color
                      },
                    },
                    // Change label color
                    '& .MuiInputLabel-root': {
                      color: 'primary.main', // Default label color
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: 'primary.main', // Focused label color
                    },
                  }}
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
                  margin="normal"
                  color="primary" // Use theme's primary color
                  sx={{
                    // Change background color of the input box
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'secondary.main', // Theme-aware background color
                      '& input': {
                        color: 'primary.main', // Text color inside the input box
                      },
                      '& fieldset': {
                        borderColor: 'quaternary.main', // Border color
                      },
                      '&:hover fieldset': {
                        borderColor: 'primary.main', // Hover border color
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: 'primary.main', // Focused border color
                      },
                    },
                    // Change label color
                    '& .MuiInputLabel-root': {
                      color: 'primary.main', // Default label color
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: 'primary.main', // Focused label color
                    },
                  }}
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
      </Container>
    </ThemeProvider>
  );
}