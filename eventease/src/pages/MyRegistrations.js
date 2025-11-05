// src/pages/MyRegistrations.js
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserRegistrations, cancelRegistration } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import './MyRegistrations.css';

const MyRegistrations = () => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, upcoming, past
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    try {
      const data = await getUserRegistrations(user.id);
      setRegistrations(data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch registrations');
      setLoading(false);
    }
  };

  const handleCancelRegistration = async (registrationId, eventTitle) => {
    if (window.confirm(`Are you sure you want to cancel your registration for "${eventTitle}"?`)) {
      try {
        await cancelRegistration(registrationId);
        alert('Registration cancelled successfully!');
        fetchRegistrations(); // Refresh the list
      } catch (err) {
        alert('Failed to cancel registration: ' + err.message);
      }
    }
  };

  const getFilteredRegistrations = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (filter) {
      case 'upcoming':
        return registrations.filter(reg => new Date(reg.date) >= today);
      case 'past':
        return registrations.filter(reg => new Date(reg.date) < today);
      default:
        return registrations;
    }
  };

  const filteredRegistrations = getFilteredRegistrations();

  if (loading) return <div style={styles.loading}>Loading your registrations...</div>;
  if (error) return <div style={styles.error}>{error}</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>My Registrations</h1>
        <button onClick={() => navigate('/')} style={styles.backButton}>
          ← Back to Dashboard
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={styles.filterTabs}>
        <button
          onClick={() => setFilter('all')}
          style={{
            ...styles.filterTab,
            ...(filter === 'all' ? styles.activeTab : {}),
          }}
        >
          All Events ({registrations.length})
        </button>
        <button
          onClick={() => setFilter('upcoming')}
          style={{
            ...styles.filterTab,
            ...(filter === 'upcoming' ? styles.activeTab : {}),
          }}
        >
          Upcoming ({registrations.filter(r => new Date(r.date) >= new Date()).length})
        </button>
        <button
          onClick={() => setFilter('past')}
          style={{
            ...styles.filterTab,
            ...(filter === 'past' ? styles.activeTab : {}),
          }}
        >
          Past ({registrations.filter(r => new Date(r.date) < new Date()).length})
        </button>
      </div>

      {filteredRegistrations.length === 0 ? (
        <div style={styles.noRegistrations}>
          <h2>No registrations found</h2>
          <p>
            {filter === 'all' 
              ? "You haven't registered for any events yet."
              : filter === 'upcoming'
              ? "You have no upcoming events."
              : "You have no past events."}
          </p>
          <button onClick={() => navigate('/events')} style={styles.browseButton}>
            Browse Events
          </button>
        </div>
      ) : (
        <div style={styles.registrationsGrid}>
          {filteredRegistrations.map(registration => {
            const eventDate = new Date(registration.date);
            const isPastEvent = eventDate < new Date();
            
            return (
              <div key={registration.id} style={styles.registrationCard}>
                {registration.image_url && (
                  <img 
                    src={registration.image_url} 
                    alt={registration.title}
                    style={styles.eventImage}
                    onError={(e) => e.target.style.display = 'none'}
                  />
                )}
                
                <div style={styles.eventContent}>
                  {isPastEvent && (
                    <div style={styles.pastBadge}>Past Event</div>
                  )}
                  
                  <h3 style={styles.eventTitle}>{registration.title}</h3>
                  
                  <div style={styles.eventDetails}>
                    <div style={styles.detailItem}>
                      <span style={styles.icon}>📅</span>
                      <span>{eventDate.toLocaleDateString()}</span>
                    </div>
                    <div style={styles.detailItem}>
                      <span style={styles.icon}>🕐</span>
                      <span>{registration.time}</span>
                    </div>
                    <div style={styles.detailItem}>
                      <span style={styles.icon}>📍</span>
                      <span>{registration.location}</span>
                    </div>
                    <div style={styles.detailItem}>
                      <span style={styles.icon}>✅</span>
                      <span>Registered on: {new Date(registration.registered_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div style={styles.eventFooter}>
                    {!isPastEvent && (
                      <button
                        onClick={() => handleCancelRegistration(registration.id, registration.title)}
                        style={styles.cancelButton}
                      >
                        Cancel Registration
                      </button>
                    )}
                    {isPastEvent && (
                      <div style={styles.completedText}>Event Completed</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '2rem',
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
    fontSize: '2rem',
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
  filterTabs: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '2rem',
    borderBottom: '2px solid #e5e7eb',
  },
  filterTab: {
    padding: '0.75rem 1.5rem',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '3px solid transparent',
    cursor: 'pointer',
    fontSize: '1rem',
    color: '#6b7280',
    transition: 'all 0.2s',
  },
  activeTab: {
    color: '#2563eb',
    borderBottomColor: '#2563eb',
    fontWeight: '600',
  },
  registrationsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '1.5rem',
  },
  registrationCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    overflow: 'hidden',
  },
  eventImage: {
    width: '100%',
    height: '200px',
    objectFit: 'cover',
  },
  eventContent: {
    padding: '1.5rem',
    position: 'relative',
  },
  pastBadge: {
    position: 'absolute',
    top: '1rem',
    right: '1rem',
    padding: '0.25rem 0.75rem',
    backgroundColor: '#fef3c7',
    color: '#92400e',
    borderRadius: '12px',
    fontSize: '0.85rem',
    fontWeight: '500',
  },
  eventTitle: {
    fontSize: '1.25rem',
    marginBottom: '1rem',
    color: '#1f2937',
  },
  eventDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    marginBottom: '1rem',
  },
  detailItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.9rem',
    color: '#4b5563',
  },
  icon: {
    fontSize: '1rem',
  },
  eventFooter: {
    paddingTop: '1rem',
    borderTop: '1px solid #e5e7eb',
  },
  cancelButton: {
    width: '100%',
    padding: '0.75rem',
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: '500',
  },
  completedText: {
    textAlign: 'center',
    color: '#6b7280',
    fontStyle: 'italic',
  },
  noRegistrations: {
    textAlign: 'center',
    padding: '4rem 2rem',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  browseButton: {
    marginTop: '1.5rem',
    padding: '1rem 2rem',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1.1rem',
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

export default MyRegistrations;