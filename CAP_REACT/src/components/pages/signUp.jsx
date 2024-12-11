import React, { useState } from 'react';
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

const theme = createTheme();

export default function SignUp() {
  const [formData, setFormData] = useState({
    name: '',
    mobileNumber: '',
    username: '',
    password: '',
    type: 'civilian',
  });

  const [snackbarOpen, setSnackbarOpen] = useState(false);

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
      if (response.detail === 'User not found') {
        const postResponse = await postData(formData, 'post/user');
        console.log(postResponse);
      } else {
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.log(error);
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
              <Link href="#" variant="body2">
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
