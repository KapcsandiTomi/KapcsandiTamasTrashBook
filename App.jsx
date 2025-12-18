import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from "react-router-dom";

import './App.css';

import Login from './Login';
import Register from './Register';
import Profile from './Profile';
import Home from './Home';
import Password from './Password';
import Products from './Products';
import Orders from './Orders';
import Admin from './Admin';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (storedUser && storedUser !== "undefined") {
      setUser(JSON.parse(storedUser));
    }
    setIsLoggedIn(!!token);
  }, []);

  return (
    <Router>
      <Navbar isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} user={user} />
      <Routes>
        <Route path='/' element={<Home isLoggedIn={isLoggedIn} />} />
        {!isLoggedIn && <Route path='/register' element={<Register />} />}
        {!isLoggedIn && <Route path='/login' element={<Login setIsLoggedIn={setIsLoggedIn} setUser={setUser} />} />}
        <Route path='/profile' element={<Profile />} />
        <Route path='/password' element={<Password />} />
        <Route path='/products' element={<Products isLoggedIn={isLoggedIn} />} />
        <Route path='/orders' element={<Orders />} />
        <Route path='/admin' element={<Admin />} />
      </Routes>
    </Router>
  );
}

export default App;

function Navbar({ isLoggedIn, setIsLoggedIn, user }) {
  const navigate = useNavigate();

  const handleLogOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    navigate("/");
  }

  return (
    <nav className="site-nav">
      <div className="nav-inner">
        <div className="brand">
          <Link to={"/"} className="brand-link">Tomy's Webshop</Link>
        </div>

        <div className="nav-menu">
          <ul className="nav-list">
            <li><Link to={"/"} className="nav-link">Kezdőlap</Link></li>
            <li><Link to={"/products"} className="nav-link">Termékek</Link></li>

            {!isLoggedIn ? (
              <>
                <li><Link to={"/register"} className="nav-link">Regisztráció</Link></li>
                <li><Link to={"/login"} className="nav-link nav-cta">Bejelentkezés</Link></li>
              </>
            ) : (
              <>
                <li><Link to={"/profile"} className="nav-link">Profilom</Link></li>
                <li><Link to={"/orders"} className="nav-link">Rendeléseim</Link></li>
                <li>
                  <button className="btn-logout" onClick={handleLogOut}>Kijelentkezés</button>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
