import router from './routes';
import { AuthProvider } from './context/AuthContext';
import { BrowserRouter as Router, RouterProvider } from 'react-router-dom';

function App() {
  return (
      <AuthProvider>
        <RouterProvider 
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
          v7_fetcherPersist: true,
          v7_normalizeFormMethod: true,
          v7_partialHydration: true,
          v7_skipActionErrorRevalidation: true
        }}
        router={router} />
      </AuthProvider>
  );
}

export default App;
