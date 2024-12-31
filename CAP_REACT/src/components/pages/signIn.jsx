import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CssBaseline from '@mui/material/CssBaseline';
import { FormControl, FormGroup } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { postData } from '../../services/apiService';
import { AuthContext } from '../../context/authContext';
import API_URLS from '../../services/apiUrlService';
import './signIn.css';
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

export default function SignIn() {
  const { showSnackbar } = useSnackbar();
  const { login } = useContext(AuthContext); // Use the AuthContext
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

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
  
    if (!formData.username) {
      showSnackbar('Username is required.', 'error');
      return;
    }else if (!formData.password) {
      showSnackbar('Password is required.', 'error');
      return;
    }
  
    try {
      const response = await postData(formData, API_URLS.AUTH.signIn, null);
      if (response) {
        // Check if the response contains an invalid username or password error
        if (response.detail === 'Invalid username or password.') {
          showSnackbar('Invalid username or password.', 'error');
        } else {
          const userType = response.userType || response.user_type;
  
          // Handle different user types
          if (userType === 'civilian') {
            login(response); // Call the login function from AuthContext
            navigate('/civilian/dashboard');
          } else if (userType === 'police') {
            login(response); // Call the login function from AuthContext
            navigate('/police/dashboard');
          }
        }
      }
    } catch (error) {
      // Handle specific error responses
      if (error.response && error.response.data && error.response.data.detail) {
        const errorMessage = error.response.data.detail;
        showSnackbar(errorMessage, 'error');
      } else {
        console.error('Error:', error);
        showSnackbar('An unexpected error occurred.', 'error');
      }
    }
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
          <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography component="h1" variant="h5" color="primary">
            Welcome back
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
                  autoComplete="new-password"
                  autoFocus
                  value={formData.username}
                  onChange={handleChange}
                  color="primary"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'secondary.main',
                      '& input': {
                        color: 'primary.main',
                      },
                      '& fieldset': {
                        borderColor: 'quaternary.main',
                      },
                      '&:hover fieldset': {
                        borderColor: 'primary.main',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: 'primary.main',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: 'primary.main',
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: 'primary.main',
                    },
                  }}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type="password"
                  id="password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  color="primary"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'secondary.main',
                      '& input': {
                        color: 'primary.main',
                      },
                      '& fieldset': {
                        borderColor: 'quaternary.main',
                      },
                      '&:hover fieldset': {
                        borderColor: 'primary.main',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: 'primary.main',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: 'primary.main',
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: 'primary.main',
                    },
                  }}
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
                justifyContent: 'flex-end',
                mt: 2,
              }}
            >
              <Link variant="body2" onClick={handleSignUp} sx={{ cursor: 'pointer' }} color="primary">
                {"Sign Up"}
              </Link>
            </Box>
          </Box>
        </Box>
      </Container>
    </ThemeProvider>
  );
}
