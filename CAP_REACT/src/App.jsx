import './App.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import SignIn from './components/pages/signIn'
import SignUp from './components/pages/signUp'
import NewToken from './components/pages/newToken'

const router = createBrowserRouter([
  {
    path:'/',
    children:[
      {path: '/',element:<SignIn/>},
      {path: '/signUp',element:<SignUp/>},
      {path: '/newToken',element:<NewToken/>}
    ]
  }
])

function App() {
  return (
    <>
    <SignIn/>
    <SignUp/>
    <NewToken/>
    </>
  )
}

export default App
