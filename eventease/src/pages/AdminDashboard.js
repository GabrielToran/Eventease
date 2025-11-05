// src/pages/AdminDashboard.js
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalEvents: 0,
    totalRegistrations: 0,
    upcomingEvents: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch stats
      const statsResponse = await fetch('http://localhost:5000/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const statsData = await statsResponse.json();
      setStats(statsData);

      // Fetch recent activities
      const activitiesResponse = await fetch('http://localhost:5000/api/admin/activities?limit=10', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const activitiesData = await activitiesResponse.json();
      setRecentActivities(activitiesData);

      setLoading(false);
    } catch (err) {
      setError('Failed to load dashboard data');
      setLoading(false);
    }
  };

  if (loading) return <div style={styles.loading}>Loading admin dashboard...</div>;
  if (error) return <div style={styles.error}>{error}</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Admin Dashboard</h1>
        <button onClick={() => navigate('/')} style={styles.backButton}>
          ← Back to Dashboard
        </button>
      </div>

      {/* Stats Grid */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>👥</div>
          <div style={styles.statValue}>{stats.totalUsers}</div>
          <div style={styles.statLabel}>Total Users</div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>📅</div>
          <div style={styles.statValue}>{stats.totalEvents}</div>
          <div style={styles.statLabel}>Total Events</div>

        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>🎟️</div>
          <div style={styles.statValue}>{stats.totalRegistrations}</div>
          <div style={styles.statLabel}>Total Registrations</div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>🔜</div>
          <div style={styles.statValue}>{stats.upcomingEvents}</div>
          <div style={styles.statLabel}>Upcoming Events</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Quick Actions</h2>
        <div style={styles.actionsGrid}>
          <button 
            onClick={() => navigate('/admin/users')}
            style={styles.actionCard}
          >
            <div style={styles.actionIcon}>👥</div>
            <div style={styles.actionTitle}>User Management</div>
            <div style={styles.actionDesc}>Manage users, roles, and permissions</div>
          </button>

          <button 
            onClick={() => navigate('/admin/events')}
            style={styles.actionCard}
          >
            <div style={styles.actionIcon}>🛡️</div>
            <div style={styles.actionTitle}>Event Moderation</div>
            <div style={styles.actionDesc}>Review and moderate events</div>
          </button>

          <button 
            onClick={() => navigate('/admin/categories')}
            style={styles.actionCard}
          >
            <div style={styles.actionIcon}>📁</div>
            <div style={styles.actionTitle}>Category Management</div>
            <div style={styles.actionDesc}>Manage event categories</div>
          </button>

          <button 
            onClick={() => navigate('/admin/activity')}
            style={styles.actionCard}
          >
            <div style={styles.actionIcon}>📊</div>
            <div style={styles.actionTitle}>Activity Monitor</div>
            <div style={styles.actionDesc}>View system activity logs</div>
          </button>
        </div>
      </div>

      {/* Recent Activities */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Recent Activity</h2>
        <div style={styles.activityCard}>
          {recentActivities.length === 0 ? (
            <div style={styles.noActivity}>No recent activities</div>
          ) : (
            <div style={styles.activityList}>
              {recentActivities.map((activity, index) => (
                <div key={index} style={styles.activityItem}>
                  <div style={styles.activityIcon}>
                    {activity.type === 'registration' ? '🎟️' : '📅'}
                  </div>
                  <div style={styles.activityContent}>
                    <div style={styles.activityText}>
                      {activity.type === 'registration' ? (
                        <>
                          <strong>{activity.user_name}</strong> registered for{' '}
                          <strong>{activity.event_title}</strong>
                        </>
                      ) : (
                        <>
                          <strong>{activity.user_name}</strong> created event{' '}
                          <strong>{activity.event_title}</strong>
                        </>
                      )}
                    </div>
                    <div style={styles.activityTime}>
                      {new Date(activity.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '1rem',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  title: {
    fontSize: 'clamp(1.5rem, 5vw, 2rem)',
    color: '#1f2937',
  },
  backButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#6b7280',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1.5rem',
    marginBottom: '3rem',
  },
  statCard: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    textAlign: 'center',
  },
  statIcon: {
    fontSize: '2.5rem',
    marginBottom: '0.5rem',
  },
  statValue: {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: '0.5rem',
  },
  statLabel: {
    color: '#6b7280',
    fontSize: '0.95rem',
    marginBottom: '1rem',
  },
  statButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    width: '100%',
  },
  section: {
    marginBottom: '3rem',
  },
  sectionTitle: {
    fontSize: 'clamp(1.25rem, 4vw, 1.5rem)',
    marginBottom: '1.5rem',
    color: '#1f2937',
  },
  actionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1.5rem',
  },
  actionCard: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    textAlign: 'center',
    border: 'none',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  actionIcon: {
    fontSize: '3rem',
    marginBottom: '1rem',
  },
  actionTitle: {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    marginBottom: '0.5rem',
    color: '#1f2937',
  },
  actionDesc: {
    color: '#6b7280',
    fontSize: '0.9rem',
  },
  activityCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    padding: '1.5rem',
  },
  activityList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  activityItem: {
    display: 'flex',
    gap: '1rem',
    padding: '1rem',
    borderBottom: '1px solid #e5e7eb',
  },
  activityIcon: {
    fontSize: '1.5rem',
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    marginBottom: '0.25rem',
    color: '#1f2937',
  },
  activityTime: {
    fontSize: '0.85rem',
    color: '#6b7280',
  },
  noActivity: {
    textAlign: 'center',
    padding: '2rem',
    color: '#6b7280',
  },
  loading: {
    textAlign: 'center',
    padding: '3rem',
    fontSize: '1.2rem',
    color: '#6b7280',
  },
  error: {
    textAlign: 'center',
    padding: '2rem',
    backgroundColor: '#fee',
    color: '#c00',
    borderRadius: '8px',
  },
};

export default AdminDashboard;