import React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import { Link } from 'react-router-dom';

const Navbar = () => {
    return (
        <AppBar position="static" sx={{ backgroundColor: 'white', color: 'black', boxShadow: 'none' }}>
            <Toolbar>
                <Typography variant="h7" component="div" sx={{ flexGrow: 1 }}>
                  <p>
                    CAP
                  </p>
                </Typography>
                <Box>
                    <Button sx={{ color: 'black' }}>
                        <Link to="/civilian/dashboard" style={{ textDecoration: 'none', color: 'black' }}>
                            Civilian Dashboard
                        </Link>
                    </Button>
                    <Button sx={{ color: 'black' }}>
                        <Link to="/police/dashboard" style={{ textDecoration: 'none', color: 'black' }}>
                            Police Dashboard
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
