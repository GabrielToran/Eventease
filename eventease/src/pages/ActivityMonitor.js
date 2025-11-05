// src/pages/ActivityMonitor.js
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ActivityMonitor.css';

const ActivityMonitor = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [limit, setLimit] = useState(50);
  const navigate = useNavigate();

  useEffect(() => {
    fetchActivities();
  }, [limit]);

  const fetchActivities = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/activities?limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch activities');
      
      const data = await response.json();
      setActivities(data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const getFilteredActivities = () => {
    if (filter === 'all') return activities;
    return activities.filter(activity => activity.type === filter);
  };

  const filteredActivities = getFilteredActivities();

  const ActivityIcon = ({ type }) => {
    switch (type) {
      case 'registration':
        return <span style={{fontSize: '1.5rem'}}>🎟️</span>;
      case 'event':
        return <span style={{fontSize: '1.5rem'}}>📅</span>;
      case 'user':
        return <span style={{fontSize: '1.5rem'}}>👤</span>;
      default:
        return <span style={{fontSize: '1.5rem'}}>📊</span>;
    }
  };

  const getActivityMessage = (activity) => {
    if (activity.type === 'registration') {
      return (
        <>
          <strong>{activity.user_name}</strong> registered for <strong>{activity.event_title}</strong>
        </>
      );
    } else if (activity.type === 'event') {
      return (
        <>
          <strong>{activity.user_name}</strong> created event <strong>{activity.event_title}</strong>
        </>
      );
    }
    return 'Activity';
  };

  if (loading) return <div style={styles.loading}>Loading activity log...</div>;
  if (error) return <div style={styles.error}>{error}</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Activity Monitor</h1>
        <button onClick={() => navigate('/admin')} style={styles.backButton}>
          ← Back to Admin Dashboard
        </button>
      </div>

      {/* Stats Summary */}
      <div style={styles.statsCard}>
        <div style={styles.statItem}>
          <div style={styles.statValue}>{activities.length}</div>
          <div style={styles.statLabel}>Total Activities</div>
        </div>
        <div style={styles.statItem}>
          <div style={styles.statValue}>
            {activities.filter(a => a.type === 'event').length}
          </div>
          <div style={styles.statLabel}>Events Created</div>
        </div>
        <div style={styles.statItem}>
          <div style={styles.statValue}>
            {activities.filter(a => a.type === 'registration').length}
          </div>
          <div style={styles.statLabel}>Registrations</div>
        </div>
      </div>

      {/* Filters */}
      <div style={styles.filtersCard}>
        <div style={styles.filterButtons}>
          <button
            onClick={() => setFilter('all')}
            style={{
              ...styles.filterButton,
              ...(filter === 'all' ? styles.filterButtonActive : {}),
            }}
          >
            All Activities
          </button>
          <button
            onClick={() => setFilter('event')}
            style={{
              ...styles.filterButton,
              ...(filter === 'event' ? styles.filterButtonActive : {}),
            }}
          >
            Events
          </button>
          <button
            onClick={() => setFilter('registration')}
            style={{
              ...styles.filterButton,
              ...(filter === 'registration' ? styles.filterButtonActive : {}),
            }}
          >
            Registrations
          </button>
        </div>

        <div style={styles.limitControl}>
          <label style={styles.label}>Show:</label>
          <select
            value={limit}
            onChange={(e) => setLimit(parseInt(e.target.value))}
            style={styles.select}
          >
            <option value="25">25 activities</option>
            <option value="50">50 activities</option>
            <option value="100">100 activities</option>
            <option value="200">200 activities</option>
          </select>
        </div>
      </div>

      {/* Activity List */}
      <div style={styles.activityCard}>
        {filteredActivities.length === 0 ? (
          <div style={styles.noActivity}>No activities found</div>
        ) : (
          <div style={styles.activityList}>
            {filteredActivities.map((activity, index) => (
              <div key={index} style={styles.activityItem}>
                <div style={styles.activityIcon}>
                  <ActivityIcon type={activity.type} />
                </div>
                <div style={styles.activityContent}>
                  <div style={styles.activityText}>
                    {getActivityMessage(activity)}
                  </div>
                  <div style={styles.activityTime}>
                    {new Date(activity.created_at).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
                <div style={{
                  ...styles.activityType,
                  backgroundColor: activity.type === 'registration' ? '#dbeafe' : '#dcfce7',
                  color: activity.type === 'registration' ? '#1e40af' : '#166534',
                }}>
                  {activity.type}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Export Button */}
      <div style={styles.exportSection}>
        <button
          onClick={() => {
            const dataStr = JSON.stringify(filteredActivities, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `activity-log-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
          }}
          style={styles.exportButton}
        >
          📥 Export Activity Log
        </button>
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
  statsCard: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2rem',
  },
  statItem: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    textAlign: 'center',
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
  },
  filtersCard: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    marginBottom: '2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  filterButtons: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  filterButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.95rem',
    transition: 'all 0.2s',
  },
  filterButtonActive: {
    backgroundColor: '#2563eb',
    color: 'white',
  },
  limitControl: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  label: {
    color: '#374151',
    fontWeight: '500',
  },
  select: {
    padding: '0.5rem 1rem',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '0.95rem',
  },
  activityCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    overflow: 'hidden',
  },
  activityList: {
    maxHeight: '600px',
    overflowY: 'auto',
  },
  activityItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1.5rem',
    borderBottom: '1px solid #e5e7eb',
    transition: 'background-color 0.2s',
  },
  activityIcon: {
    flexShrink: 0,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    marginBottom: '0.25rem',
    color: '#1f2937',
    fontSize: '0.95rem',
  },
  activityTime: {
    fontSize: '0.85rem',
    color: '#6b7280',
  },
  activityType: {
    padding: '0.25rem 0.75rem',
    borderRadius: '12px',
    fontSize: '0.85rem',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  noActivity: {
    textAlign: 'center',
    padding: '3rem',
    color: '#6b7280',
  },
  exportSection: {
    marginTop: '2rem',
    textAlign: 'center',
  },
  exportButton: {
    padding: '0.75rem 2rem',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '500',
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

export default ActivityMonitor;