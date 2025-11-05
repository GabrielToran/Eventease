// src/Dashboard.js
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import './Dashboard.css';

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalEvents: 0,
    upcoming: 0,
    completed: 0,
    attendees: 0,
    myRegistrations: 0,
    myEvents: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserStats();
  }, [user]);

  const fetchUserStats = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch stats based on role
      if (user?.role === 'admin') {
        // Admin stats
        const response = await fetch('http://localhost:5000/api/admin/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        setStats({
          totalEvents: data.totalEvents,
          upcoming: data.upcomingEvents,
          completed: data.totalEvents - data.upcomingEvents,
          attendees: data.totalRegistrations,
          totalUsers: data.totalUsers,
        });
      } else if (user?.role === 'organizer') {
        // Organizer stats
        const eventsResponse = await fetch('http://localhost:5000/api/events', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const events = await eventsResponse.json();
        const myEvents = events.filter(e => e.organizer_id === user.id);
        const today = new Date();
        const upcoming = myEvents.filter(e => new Date(e.date) >= today && e.status === 'active');
        
        setStats({
          totalEvents: myEvents.length,
          upcoming: upcoming.length,
          completed: myEvents.length - upcoming.length,
          myEvents: myEvents.length
        });
      } else if (user?.role === 'attendee') {
        // Attendee stats
        const registrationsResponse = await fetch(
          `http://localhost:5000/api/registrations/user/${user.id}`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        const registrations = await registrationsResponse.json();
        const today = new Date();
        const upcoming = registrations.filter(r => new Date(r.date) >= today);
        
        setStats({
          myRegistrations: registrations.length,
          upcoming: upcoming.length,
          completed: registrations.length - upcoming.length,
        });
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching stats:', err);
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardCards = () => {
    const cards = [];

    // Browse Events - for all users
    cards.push({
      icon: '🔍',
      title: 'Browse Events',
      description: 'Discover and search all available events',
      action: () => navigate('/events'),
      buttonText: 'Browse Events',
      color: '#3b82f6',
      roles: ['attendee', 'organizer', 'admin']
    });

    // Role-specific cards
    if (user?.role === 'admin') {
      // Admin-specific cards
      cards.push({
        icon: '🛡️',
        title: 'Admin Dashboard',
        description: 'Access admin control panel and system management',
        action: () => navigate('/admin'),
        buttonText: 'Admin Panel',
        color: '#dc2626',
        featured: true,
        roles: ['admin']
      });

      cards.push({
        icon: '👥',
        title: 'User Management',
        description: 'Manage users, roles, and permissions',
        action: () => navigate('/admin/users'),
        buttonText: 'Manage Users',
        color: '#7c3aed',
        roles: ['admin']
      });

      cards.push({
        icon: '🎯',
        title: 'Event Moderation',
        description: 'Review and moderate all system events',
        action: () => navigate('/admin/events'),
        buttonText: 'Moderate Events',
        color: '#ea580c',
        roles: ['admin']
      });

      cards.push({
        icon: '📊',
        title: 'Activity Monitor',
        description: 'Track system activity and user behavior',
        action: () => navigate('/admin/activity'),
        buttonText: 'View Activity',
        color: '#0891b2',
        roles: ['admin']
      });

      cards.push({
        icon: '📁',
        title: 'Category Management',
        description: 'Organize and manage event categories',
        action: () => navigate('/admin/categories'),
        buttonText: 'Manage Categories',
        color: '#059669',
        roles: ['admin']
      });
    }

    if (user?.role === 'attendee') {
      cards.push({
        icon: '🎟️',
        title: 'My Registrations',
        description: 'View and manage your event registrations',
        action: () => navigate('/my-registrations'),
        buttonText: 'My Registrations',
        color: '#059669',
        roles: ['attendee']
      });

      cards.push({
        icon: '💬',
        title: 'Provide Feedback',
        description: 'Share your experience from past events',
        action: () => navigate('/provide-feedback'),
        buttonText: 'Give Feedback',
        color: '#8b5cf6',
        roles: ['attendee']
      });
    }

    if (user?.role === 'organizer' || user?.role === 'admin') {
      cards.push({
        icon: '📋',
        title: 'My Events',
        description: 'View and manage your created events',
        action: () => navigate('/my-events'),
        buttonText: 'My Events',
        color: '#059669',
        roles: ['organizer', 'admin']
      });

      cards.push({
        icon: '➕',
        title: 'Create Event',
        description: 'Create a new event for attendees',
        action: () => navigate('/create-event'),
        buttonText: 'Create New',
        color: '#10b981',
        roles: ['organizer', 'admin']
      });

      cards.push({
        icon: '⭐',
        title: 'View Feedback',
        description: 'See feedback from your event attendees',
        action: () => navigate('/view-feedback'),
        buttonText: 'View Feedback',
        color: '#f59e0b',
        roles: ['organizer', 'admin']
      });

      cards.push({
        icon: '📊',
        title: 'Analytics',
        description: 'View performance metrics and insights',
        action: () => navigate('/analytics'),
        buttonText: 'View Analytics',
        color: '#6366f1',
        roles: ['organizer', 'admin']
      });
    }

    return cards.filter(card => card.roles.includes(user?.role));
  };

  const getStatsCards = () => {
    if (user?.role === 'admin') {
      return [
        { label: 'Total Users', value: stats.totalUsers || 0, icon: '👥', color: '#3b82f6' },
        { label: 'Total Events', value: stats.totalEvents, icon: '📅', color: '#059669' },
        { label: 'Upcoming', value: stats.upcoming, icon: '🔜', color: '#f59e0b' },
        { label: 'Total Registrations', value: stats.attendees, icon: '🎟️', color: '#8b5cf6' },
      ];
    } else if (user?.role === 'organizer') {
      return [
        { label: 'My Events', value: stats.myEvents, icon: '📋', color: '#3b82f6' },
        { label: 'Upcoming', value: stats.upcoming, icon: '🔜', color: '#059669' },
        { label: 'Completed', value: stats.completed, icon: '✅', color: '#6b7280' },
      ];
    } else {
      return [
        { label: 'My Registrations', value: stats.myRegistrations, icon: '🎟️', color: '#3b82f6' },
        { label: 'Upcoming Events', value: stats.upcoming, icon: '🔜', color: '#059669' },
        { label: 'Past Events', value: stats.completed, icon: '✅', color: '#6b7280' },
      ];
    }
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner}></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Navigation Bar */}
      <nav style={styles.nav}>
        <div style={styles.navBrand}>
          <h2 style={styles.brandText}>EventEase</h2>
        </div>
        <div style={styles.navUser}>
          <span style={{
            ...styles.roleBadge,
            backgroundColor: user?.role === 'admin' ? '#dc2626' : 
                           user?.role === 'organizer' ? '#2563eb' : '#059669',
          }}>
            {user?.role?.toUpperCase()}
          </span>
          <span style={styles.userName}>Welcome, {user?.name || 'User'}!</span>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div style={styles.content}>
        {/* Welcome Section */}
        <div style={styles.welcomeSection}>
          <h1 style={styles.welcomeTitle}>
            {user?.role === 'admin' && '👑 Admin Dashboard'}
            {user?.role === 'organizer' && '📋 Organizer Dashboard'}
            {user?.role === 'attendee' && '🎉 Attendee Dashboard'}
          </h1>
          <p style={styles.welcomeText}>
            {user?.role === 'admin' && 'You have full administrative access to manage users, events, and monitor system activity.'}
            {user?.role === 'organizer' && 'Create and manage your events, track analytics, or browse events from other organizers!'}
            {user?.role === 'attendee' && 'Discover and register for exciting events in your area!'}
          </p>
        </div>

        {/* Stats Section */}
        <div style={styles.statsGrid}>
          {getStatsCards().map((stat, index) => (
            <div key={index} style={styles.statCard}>
              <div style={{...styles.statIcon, color: stat.color}}>
                {stat.icon}
              </div>
              <div style={styles.statContent}>
                <h4 style={styles.statLabel}>{stat.label}</h4>
                <p style={{...styles.statNumber, color: stat.color}}>
                  {stat.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions Grid */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Quick Actions</h2>
          <div style={styles.cardsGrid}>
            {getDashboardCards().map((card, index) => (
              <div 
                key={index} 
                style={{
                  ...styles.card,
                  ...(card.featured ? styles.featuredCard : {})
                }}
              >
                <div style={styles.cardIcon}>{card.icon}</div>
                <h3 style={styles.cardTitle}>{card.title}</h3>
                <p style={styles.cardDescription}>{card.description}</p>
                <button 
                  style={{
                    ...styles.cardButton,
                    backgroundColor: card.color
                  }}
                  onClick={card.action}
                >
                  {card.buttonText}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Admin Alert */}
        {user?.role === 'admin' && (
          <div style={styles.adminAlert}>
            <div style={styles.alertIcon}>🛡️</div>
            <div style={styles.alertContent}>
              <h3 style={styles.alertTitle}>Administrator Access</h3>
              <p style={styles.alertText}>
                You have full system access. Use the Admin Panel to manage users, moderate events, 
                view system activity, and configure categories.
              </p>
              <button 
                onClick={() => navigate('/admin')}
                style={styles.alertButton}
              >
                Go to Admin Panel →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f3f4f6',
  },
  nav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 2rem',
    backgroundColor: 'white',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  navBrand: {
    display: 'flex',
    alignItems: 'center',
  },
  brandText: {
    fontSize: 'clamp(1.25rem, 4vw, 1.5rem)',
    color: '#2563eb',
    margin: 0,
  },
  navUser: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  roleBadge: {
    padding: '0.25rem 0.75rem',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    color: 'white',
  },
  userName: {
    fontSize: 'clamp(0.9rem, 2vw, 1rem)',
    color: '#374151',
  },
  logoutBtn: {
    padding: '0.5rem 1rem',
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '500',
    transition: 'background-color 0.2s',
  },
  content: {
    padding: '1rem',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  welcomeSection: {
    marginBottom: '2rem',
    padding: '2rem',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  welcomeTitle: {
    fontSize: 'clamp(1.5rem, 5vw, 2rem)',
    marginBottom: '0.5rem',
    color: '#1f2937',
  },
  welcomeText: {
    fontSize: 'clamp(0.9rem, 2vw, 1rem)',
    color: '#6b7280',
    lineHeight: '1.6',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
    marginBottom: '2rem',
  },
  statCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1.5rem',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  statIcon: {
    fontSize: '2.5rem',
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    fontSize: '0.9rem',
    color: '#6b7280',
    margin: '0 0 0.25rem 0',
  },
  statNumber: {
    fontSize: '2rem',
    fontWeight: 'bold',
    margin: 0,
  },
  section: {
    marginBottom: '2rem',
  },
  sectionTitle: {
    fontSize: 'clamp(1.25rem, 4vw, 1.5rem)',
    marginBottom: '1.5rem',
    color: '#1f2937',
  },
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '1.5rem',
  },
  card: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s, box-shadow 0.2s',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
  },
  featuredCard: {
    border: '2px solid #dc2626',
    boxShadow: '0 4px 12px rgba(220, 38, 38, 0.2)',
  },
  cardIcon: {
    fontSize: '3rem',
    marginBottom: '1rem',
  },
  cardTitle: {
    fontSize: '1.25rem',
    marginBottom: '0.5rem',
    color: '#1f2937',
  },
  cardDescription: {
    fontSize: '0.9rem',
    color: '#6b7280',
    marginBottom: '1.5rem',
    flex: 1,
    lineHeight: '1.5',
  },
  cardButton: {
    padding: '0.75rem',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '500',
    transition: 'opacity 0.2s',
    width: '100%',
  },
  adminAlert: {
    display: 'flex',
    gap: '1.5rem',
    padding: '2rem',
    backgroundColor: '#fef2f2',
    border: '2px solid #dc2626',
    borderRadius: '12px',
    marginTop: '2rem',
  },
  alertIcon: {
    fontSize: '3rem',
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: '1.25rem',
    color: '#991b1b',
    marginBottom: '0.5rem',
  },
  alertText: {
    color: '#7f1d1d',
    marginBottom: '1rem',
    lineHeight: '1.6',
  },
  alertButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#dc2626',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '500',
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    color: '#6b7280',
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '4px solid #e5e7eb',
    borderTop: '4px solid #2563eb',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
};

// Add CSS animation for spinner
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @media (max-width: 640px) {
    .dashboard-nav {
      flex-direction: column;
      align-items: flex-start !important;
    }
  }
`;
document.head.appendChild(styleSheet);

export default Dashboard;