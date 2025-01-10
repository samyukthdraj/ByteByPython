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
import LogoutSharpIcon from '@mui/icons-material/LogoutSharp';
import AccountCircleIcon from '@mui/icons-material/AccountCircle'; // Import User Icon
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';


const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: 'white',
  boxShadow: 'none',
  padding: theme.spacing(1),
}));

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const [open, setOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null); // For user menu
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery('(max-width:600px)');

  useEffect(() => {
    if (!isMobile) {
      setDrawerOpen(false);
    }
  }, [isMobile]);

  const handleLogout = () => {
    setOpen(false);
    logout();
    navigate('/');
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

  const handleUserMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const renderNavLinks = () => (
    <Box
      display="flex"
      flexDirection={drawerOpen || isMobile ? 'column' : 'row'}
      justifyContent="flex-end" // Align to the right
      alignItems="center"
    >
      {user?.userType === 'civilian' && (
        <Button
          component={Link}
          to="/civilian/newIncident"
          variant="text"
          sx={{
            color: 'black',
            marginRight: 2,
            textDecoration: 'none',
            textTransform: 'capitalize',
            fontSize:'1.125rem',
            '&:hover': {
              color: '#000000', // Maintain black on hover for better contrast.
              textDecoration: 'underline',
            },
            '&.active': {
              fontWeight: 600,
              color: '#000000',
            },
          }}
          className={location.pathname === '/civilian/newIncident' ? 'active' : ''}
        >
          New Incident
        </Button>
      )}
      <Button
        component={Link}
        to={user?.userType === 'civilian' ? '/civilian/dashboard' : '/police/dashboard'}
        variant="text"
        sx={{
          color: 'black',
          marginRight: 2,
          textDecoration: 'none',
          textTransform: 'capitalize',
          fontSize:'1.125rem',
          '&:hover': {
            color: '#000000',
            textDecoration: 'underline',
          },
          '&.active': {
            fontWeight: 600,
            color: '#000000',
          },
        }}
        className={
          location.pathname === '/civilian/dashboard' || location.pathname === '/police/dashboard'
            ? 'active'
            : ''
        }
      >
        Dashboard
      </Button>
      <IconButton
        aria-controls="user-menu"
        aria-haspopup="true"
        onClick={handleUserMenuOpen}
        sx={{ 
          color: 'black',
         }}
      >
        <AccountCircleIcon />
      </IconButton>
      <Menu
        id="user-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleUserMenuClose}
      >
        <MenuItem onClick={handleUserMenuClose}>{user ? `Welcome, ${user.name}!` : 'Please log in.'}</MenuItem>
        <MenuItem onClick={handleClickOpen}>Logout</MenuItem>
      </Menu>
    </Box>
  );

  return (
    <>
      <StyledAppBar position="fixed">
        <Toolbar>
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, color: 'black', fontSize: '40px', fontWeight: '700'}}
          >
            C A P
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
                    backgroundColor: 'white',
                    color: 'black',
                    width: 250,
                  },
                }}
              >
                <Box sx={{ padding: 2 }}>{renderNavLinks()}</Box>
              </Drawer>
            </>
          ) : (
            renderNavLinks()
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