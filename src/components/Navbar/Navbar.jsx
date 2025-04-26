import React, { useContext } from 'react';
import './Navbar.css';
import { CoinContext } from '../../context/CoinContext';
import { UserContext } from '../../context/UserContext';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const { setCurrency } = useContext(CoinContext);
  const { currentUser, logout } = useContext(UserContext);
  const navigate = useNavigate();

  const currencyHandler = (event) => {
    const currencies = {
      usd: { name: "usd", symbol: "$" },
      eur: { name: "eur", symbol: "€" },
      inr: { name: "inr", symbol: "₹" }
    };
    
    setCurrency(currencies[event.target.value] || currencies.usd);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  return (
    <div className='navbar'> 
      <Link to='/'><h1 className='titles'>🪙CryptoPal</h1></Link>
      
      <ul>
        <Link to='/'><li>Home</li></Link>
        <li>Features</li>
        <li>Pricing</li>
        <li>Blog</li>
      </ul>

      <div className="nav-right">
        <select onChange={currencyHandler}>
          <option value='usd'>USD</option>
          <option value='eur'>EUR</option>
          <option value='inr'>INR</option>
        </select>
        
        {currentUser ? (
          <button onClick={handleLogout}>Logout</button>
        ) : (
          <Link to="/login">
            <button>Login</button>
          </Link>
        )}
      </div>
    </div>
  );
};

export default Navbar;