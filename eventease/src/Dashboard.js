// src/Dashboard.js
import { useState, useEffect } from 'react';
import {useNavigate} from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import './Dashboard.css';

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalEvents: 0,
    upcoming: 0,
    completed: 0,
    attendees: 0
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleCreateEvent = () => {
    navigate('/create-event');
  }

  const handleViewEvents = () => {
    // Navigate to events list page (you'll need to create this)
    navigate('/events');
  };

  const handleManageAttendees = () => {
    // Navigate to attendees management page
    navigate('/attendees');
  };

  const handleSettings = () => {
    // Navigate to settings page
    navigate('/settings');
  };

  // Fetch user stats on component mount
  useEffect(() => {
    // TODO: Fetch actual stats from API
    // For now using placeholder data
    setStats({
      totalEvents: 0,
      upcoming: 0,
      completed: 0,
      attendees: 0
    });
  }, []);

  // Customize dashboard based on user role
  const getDashboardCards = () => {
    const commonCards = [
      {
        icon: '📅',
        title: 'My Events',
        description: 'View and manage your events',
        action: handleViewEvents,
        buttonText: 'View Events',
        roles: ['attendee', 'organizer', 'admin']
      },
      {
        icon: '⚙️',
        title: 'Settings',
        description: 'Update your profile',
        action: handleSettings,
        buttonText: 'Go to Settings',
        roles: ['attendee', 'organizer', 'admin']
      }
    ];

    const organizerCards = [
      {
        icon: '➕',
        title: 'Create Event',
        description: 'Create a new event',
        action: handleCreateEvent,
        buttonText: 'Create New',
        roles: ['organizer', 'admin']
      },
      {
        icon: '👥',
        title: 'Attendees',
        description: 'Manage event attendees',
        action: handleManageAttendees,
        buttonText: 'View Attendees',
        roles: ['organizer', 'admin']
      }
    ];

    const adminCards = [
      {
        icon: '🛡️',
        title: 'Admin Panel',
        description: 'System administration',
        action: () => navigate('/admin'),
        buttonText: 'Admin Panel',
        roles: ['admin']
      }
    ];

    // Combine and filter cards based on user role
    const allCards = [...commonCards, ...organizerCards, ...adminCards];
    return allCards.filter(card => card.roles.includes(user?.role));
  };

   return (
    <div className="dashboard-container">
      <nav className="dashboard-nav">
        <div className="nav-brand">
          <h2>EventEase</h2>
        </div>
        <div className="nav-user">
          <span className="user-role-badge" style={{
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: 'bold',
            marginRight: '10px',
            backgroundColor: user?.role === 'admin' ? '#dc2626' : 
                           user?.role === 'organizer' ? '#2563eb' : '#059669',
            color: 'white'
          }}>
            {user?.role?.toUpperCase()}
          </span>
          <span>Welcome, {user?.name || 'User'}!</span>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="welcome-section">
          <h1>Welcome to Your Dashboard</h1>
          <p>
            {user?.role === 'admin' && 'You have full administrative access to the system.'}
            {user?.role === 'organizer' && 'Start creating and managing your events!'}
            {user?.role === 'attendee' && 'Discover and register for exciting events!'}
          </p>
        </div>

        <div className="dashboard-grid">
          {getDashboardCards().map((card, index) => (
            <div key={index} className="dashboard-card">
              <div className="card-icon">{card.icon}</div>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
              <button className="card-btn" onClick={card.action}>
                {card.buttonText}
              </button>
            </div>
          ))}
        </div>

        <div className="stats-section">
          <div className="stat-box">
            <h4>Total Events</h4>
            <p className="stat-number">{stats.totalEvents}</p>
          </div>
          <div className="stat-box">
            <h4>Upcoming</h4>
            <p className="stat-number">{stats.upcoming}</p>
          </div>
          <div className="stat-box">
            <h4>Completed</h4>
            <p className="stat-number">{stats.completed}</p>
          </div>
          {(user?.role === 'organizer' || user?.role === 'admin') && (
            <div className="stat-box">
              <h4>Total Attendees</h4>
              <p className="stat-number">{stats.attendees}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;