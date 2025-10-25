import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
//import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './Login';
import Signup  from './Signup';
import Dashboard from './Dashboard';
import CreateEvent from './pages/CreateEvent'; 
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
     
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/Signup" element={<Signup />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
              path="/create-event"
              element={
                <ProtectedRoute>
                  <CreateEvent />
                </ProtectedRoute>
              }
              />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;