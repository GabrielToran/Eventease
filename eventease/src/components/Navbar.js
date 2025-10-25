//import React from "react";
//import { Link, useNavigate } from "react-router-dom";
//import { useAuth  } from "../contexts/AuthContext";
//import "./Navbar.css"; 

//const Navbar = () => {
  //const { user, logout} = useAuth();
  //const navigate = useNavigate();

  //const handleLogout = () => {
   // logout();
   // navigate("/login");
  //};

  //return (
    
    //<nav className="navbar">
      //<div className="navbar-logo">
       // <Link to="/">EventEase</Link>
      //</div>
  //<button onClick={logout}>Logout</button>
    //  <ul className="navbar-links">
       // {!user ? (
        //  <>
           // <li>
          //    <Link to="/login" className="nav-link">Login</Link>
          //  </li>
           // <li>
           //   <Link to="/register" className="nav-link">Register</Link>
           // </li>
          //</>
       // ) : (
          //<>
            //<li>
             // <Link to="/" className="nav-link">Home</Link>
            //</li>
            //<li>
            //  <Link to="/events" className="nav-link">Events</Link>
           // </li>
           // <li>
            //  <Link to="/feedback" className="nav-link">Feedback</Link>
           // </li>
            //<li>
             // <button onClick={handleLogout} className="logout-btn">Logout</button>
           // </li>
         // </>
      //  )}
      //</ul>
   // </nav>
 // );
//};

//export default Navbar;
