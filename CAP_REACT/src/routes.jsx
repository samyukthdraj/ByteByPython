import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import SignIn from './components/pages/signIn';
import SignUp from './components/pages/SignUp';
import ForgotPassword from './components/pages/ForgotPassword';
import Navbar from './components/pages/navbar';
import NewIncident from './components/civilian/newIncident';
import CivilianDashboard from './components/civilian/CivilianDashboard';
import PoliceDashboard from './components/police/policeDashboard';

const Layout = () => {
  return (
    <>
      <Navbar />
      <div 
        style={{ 
          padding: '18vh', /* Add padding equal to Navbar's height */
        }}
      >
        <Outlet />
      </div>
    </>
  );
};


const routes = createBrowserRouter([
  { path: '/', element: <SignIn /> },
  { path: '/signUp', element: <SignUp /> },
  { path: '/forgotPassword', element: <ForgotPassword /> },
  {
    path: '/civilian',
    element: <Layout />,
    children: [
      { path: 'dashboard', element: <CivilianDashboard /> },
      { path: 'newIncident', element: <NewIncident /> }, // Corrected this route
    ],
  },
  {
    path: '/police',
    element: <Layout />,
    children: [
      { path: 'dashboard', element: <PoliceDashboard /> },
    ],
  },
],
{
  future: {
    v7_startTransition: true,
          v7_relativeSplatPath: true,
          v7_fetcherPersist: true,
          v7_normalizeFormMethod: true,
          v7_partialHydration: true,
          v7_skipActionErrorRevalidation: true,
  }
});

export default routes;
