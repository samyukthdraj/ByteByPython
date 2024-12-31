import { AuthProvider } from './context/authContext';
import { RouterProvider } from 'react-router-dom';
import { createTheme, ThemeProvider } from '@mui/material/styles'; // For MUI theme
import routes from './routes';
import './App.css'
import { SnackbarProvider } from './context/snackbarContext';

const theme = createTheme({
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif', // Apply Roboto font
  },
});

function App() {
  return (
    <div>
      <AuthProvider>
        <ThemeProvider theme={theme}>
          <SnackbarProvider>
            <RouterProvider
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true,
                v7_fetcherPersist: true,
                v7_normalizeFormMethod: true,
                v7_partialHydration: true,
                v7_skipActionErrorRevalidation: true
              }}
              router={routes}
            />
          </SnackbarProvider>
        </ThemeProvider>
      </AuthProvider>
    </div>
  );
}

export default App;
