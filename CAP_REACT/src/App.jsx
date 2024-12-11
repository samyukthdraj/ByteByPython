import './App.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import SignIn from './components/pages/signIn'
import SignUp from './components/pages/signUp'
import NewToken from './components/pages/newToken'
import ForgotPassword from './components/pages/ForgotPassword'



const router = createBrowserRouter([
  {
    path: '/',
    element: <SignIn />, // Root route goes to SignIn component
  },
  {
    path: '/signUp',
    element: <SignUp />, // Route for SignUp page
  },
  {
    path: '/newToken',
    element: <NewToken />, // Route for NewToken (CAP Dashboard)
  },
  {
    path: '/forgotpassword',
    element: <ForgotPassword />, // Route for NewToken (CAP Dashboard)
  },
]);

function App() {
  return <NewToken />;
  // < NewToken />
}

export default App


