import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import SignIn from './components/pages/SignIn';
import SignUp from './components/pages/SignUp';
import ForgotPassword from './components/pages/ForgotPassword';
import Navbar from './components/pages/Navbar';
import NewIncident from './components/Civilian/newIncident';
import CivilianDashboard from './components/Civilian/CivilianDashboard';
import PoliceDashboard from './components/Police/PoliceDashboard';

const Layout = () => {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
};

const router = createBrowserRouter([
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

export default router;
