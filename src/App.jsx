import React from 'react'
import Navbar from './components/Navbar/Navbar'
import {Routes, Route, Navigate, useLocation} from 'react-router-dom'
import Home from './pages/Home/Home'
import Coin from './pages/Coin/Coin'
import Login from './pages/Login/Login'
import Register from './pages/Register/Register'
import Footer from './components/Footer/Footer'
import { UserContext } from './context/UserContext'
import { useContext, useEffect } from 'react'

const App = () => {
  const { currentUser, loading } = useContext(UserContext);
  const location = useLocation();
  
  // Protected route component
  const ProtectedRoute = ({ children }) => {
    if (loading) {
      return <div className="spinner"><div className="spin"></div></div>;
    }
    
    if (!currentUser) {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
    
    return children;
  };
  
  // Auth route component - redirects to home if already logged in
  const AuthRoute = ({ children }) => {
    if (loading) {
      return <div className="spinner"><div className="spin"></div></div>;
    }
    
    if (currentUser) {
      return <Navigate to="/" replace />;
    }
    
    return children;
  };
  
  return (
    <div className='app'>
      <Navbar/>
      <Routes>
        <Route path='/' element={
          <ProtectedRoute>
            <Home/>
          </ProtectedRoute>
        }/>
        <Route path='/coin/:coinID' element={
          <ProtectedRoute>
            <Coin/>
          </ProtectedRoute>
        }/>
        <Route path='/login' element={
          <AuthRoute>
            <Login/>
          </AuthRoute>
        }/>
        <Route path='/register' element={
          <AuthRoute>
            <Register/>
          </AuthRoute>
        }/>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer/>
    </div>
  )
}

export default App