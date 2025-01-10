import { AuthProvider } from './context/authContext';
import { RouterProvider } from 'react-router-dom';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import routes from './routes';
import './App.css';
import { SnackbarProvider } from './context/snackbarContext';

// Choose ONE main font family.  I'm using Open Sans here.
const theme = createTheme({
  typography: {
    fontFamily: '"Open Sans", sans-serif',
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}> {/* ThemeProvider should wrap everything */}
      <AuthProvider>
        <SnackbarProvider>
          <RouterProvider router={routes} />
        </SnackbarProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;