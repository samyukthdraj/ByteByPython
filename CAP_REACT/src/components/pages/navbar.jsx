import React, { useContext } from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/authContext';

const Navbar = () => {
  const { user } = useContext(AuthContext);

  return (
    <AppBar position="fixed" sx={{ backgroundColor: 'white', color: 'black', boxShadow: 'none' }}>
      <Toolbar>
        <Typography variant="h7" component="div" sx={{ flexGrow: 1 }}>
          <div>{user ? `Welcome, ${user.name}!` : 'Please log in.'}</div>
        </Typography>
        <Box>
          {user?.userType === 'civilian' && (
            <Button sx={{ color: 'black' }}>
              <Link to="/civilian/newIncident" style={{ textDecoration: 'none', color: 'black' }}>
                New Incident
              </Link>
            </Button>
          )}
          <Button sx={{ color: 'black' }}>
            <Link
              to={user?.userType === 'civilian' ? '/civilian/dashboard' : '/police/dashboard'}
              style={{ textDecoration: 'none', color: 'black' }}
            >
              Dashboard
            </Link>
          </Button>
          <Button sx={{ color: 'black' }}>
            <Link to="/" style={{ textDecoration: 'none', color: 'black' }}>
              Logout
            </Link>
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;