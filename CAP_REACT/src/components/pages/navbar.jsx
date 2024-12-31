import React, { useContext, useState, useEffect } from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/authContext';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { styled } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: '#272343', // Modern blue
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', // Subtle shadow for depth
  padding: theme.spacing(1),
  transition: 'background-color 0.3s ease', // Smooth background transition
}));

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const [open, setOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery('(max-width:600px)');

  // Ensure the drawer state is reset when screen size changes
  useEffect(() => {
    if (!isMobile) {
      setDrawerOpen(false); // Close the drawer when transitioning to a desktop screen
    }
  }, [isMobile]);

  const handleLogout = () => {
    setOpen(false);
    logout();
    navigate('/'); // Redirect to login after logout
  };

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  const renderNavLinks = () => (
    <Box
      display="flex"
      flexDirection={drawerOpen || isMobile ? 'column' : 'row'}
      justifyContent="flex-start"
      alignItems="center"
    >
      {user?.userType === 'civilian' && (
        <Button
          variant="text"
          sx={{
            color: '#FFFFFF',
            marginBottom: drawerOpen || isMobile ? 2 : 0,
            marginRight: drawerOpen || isMobile ? 0 : 2,
            '&:hover': {
              color: '#BAE8E8', // Hover color
              backgroundColor: 'transparent',
            },
            '&.active': {
              color: '#EFE3C2', // Active nav item color
            },
          }}
          className={location.pathname === '/civilian/newIncident' ? 'active' : ''}
        >
          <Link to="/civilian/newIncident" style={{ textDecoration: 'none', color: 'inherit' }}>
            New Incident
          </Link>
        </Button>
      )}
      <Button
        variant="text"
        sx={{
          color: '#FFFFFF',
          marginBottom: drawerOpen || isMobile ? 2 : 0,
          marginRight: drawerOpen || isMobile ? 0 : 2,
          '&:hover': {
            color: '#BAE8E8', // Hover color
            backgroundColor: 'transparent',
          },
          '&.active': {
            color: '#EFE3C2', // Active nav item color
          },
        }}
        className={
          location.pathname === '/civilian/dashboard' || location.pathname === '/police/dashboard'
            ? 'active'
            : ''
        }
      >
        <Link
          to={user?.userType === 'civilian' ? '/civilian/dashboard' : '/police/dashboard'}
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          Dashboard
        </Link>
      </Button>
      <Button
        variant="text"
        sx={{
          color: '#FFFFFF',
          '&:hover': {
            color: '#BAE8E8', // Hover color
            backgroundColor: 'transparent',
          },
        }}
        onClick={handleClickOpen}
      >
        Logout
      </Button>
    </Box>
  );

  return (
    <>
      <StyledAppBar position="fixed">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold', color: 'white' }}>
            {user ? `Welcome, ${user.name}!` : 'Please log in.'}
          </Typography>

          {isMobile ? (
            <>
              <IconButton edge="end" color="inherit" onClick={toggleDrawer} sx={{ display: { sm: 'none' } }}>
                <MenuIcon />
              </IconButton>
              <Drawer
                anchor="right"
                open={drawerOpen}
                onClose={toggleDrawer}
                sx={{
                  '& .MuiDrawer-paper': {
                    backgroundColor: '#272343', // Match the app bar background
                    color: '#FFFFFF', // Ensure the text is white on the dark background
                    width: 250,
                  },
                }}
              >
                <Box sx={{ padding: 2 }}>{renderNavLinks()}</Box>
              </Drawer>
            </>
          ) : (
            renderNavLinks() // Display in row on desktop view
          )}
        </Toolbar>
      </StyledAppBar>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Logout Confirmation</DialogTitle>
        <DialogContent>Are you sure you want to logout?</DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Cancel
          </Button>
          <Button onClick={handleLogout} color="secondary">
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Navbar;
