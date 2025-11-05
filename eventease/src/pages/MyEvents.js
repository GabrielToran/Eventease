// src/pages/MyEvents.js
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEvents, deleteEvent } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import './Myevents.css';

const MyEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyEvents();
  }, []);

  const fetchMyEvents = async () => {
    try {
      const data = await getEvents();
      // Filter events created by this organizer
      const myEvents = data.filter(event => event.organizer_id === user.id);
      setEvents(myEvents);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch events');
      setLoading(false);
    }
  };

  const handleEdit = (eventId) => {
    navigate(`/edit-event/${eventId}`);
  };

  const handleDelete = async (eventId, eventTitle) => {
    if (window.confirm(`Are you sure you want to delete "${eventTitle}"?`)) {
      try {
        await deleteEvent(eventId);
        alert('Event deleted successfully!');
        fetchMyEvents(); // Refresh the list
      } catch (err) {
        alert('Failed to delete event: ' + err.message);
      }
    }
  };

   const handleViewAttendees = (eventId) => {
    navigate(`/event-attendees/${eventId}`);
  };


  const handleCreateNew = () => {
    navigate('/create-event');
  };

  if (loading) return <div style={styles.loading}>Loading your events...</div>;
  if (error) return <div style={styles.error}>{error}</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>My Events</h1>
        <div style={styles.headerButtons}>
          <button onClick={handleCreateNew} style={styles.createButton}>
            + Create New Event
          </button>
          <button onClick={() => navigate('/')} style={styles.backButton}>
            ← Back to Dashboard
          </button>
        </div>
      </div>

      {events.length === 0 ? (
        <div style={styles.noEvents}>
          <h2>You haven't created any events yet</h2>
          <p>Start by creating your first event!</p>
          <button onClick={handleCreateNew} style={styles.createButtonLarge}>
            Create Your First Event
          </button>
        </div>
      ) : (
        <div style={styles.eventsGrid}>
          {events.map(event => (
            <div key={event.id} style={styles.eventCard}>
              {event.image_url && (
                <img 
                  src={event.image_url} 
                  alt={event.title}
                  style={styles.eventImage}
                  onError={(e) => e.target.style.display = 'none'}
                />
              )}
              
              <div style={styles.eventContent}>
                <div style={styles.eventHeader}>
                  <div style={styles.eventCategory}>{event.category_name}</div>
                  <span style={{
                    ...styles.statusBadge,
                    backgroundColor: (event.status === 'active'|| event.status === 'upcoming') ? '#dcfce7' : 
                                   event.status === 'completed' ? '#dbeafe' : '#fee2e2',
                    color: (event.status === 'active' || event.status === 'upcoming') ? '#166534' : 
                           event.status === 'completed' ? '#1e40af' : '#991b1b',
                  }}>
                    {event.status}
                  </span>
                </div>

                <h3 style={styles.eventTitle}>{event.title}</h3>
                <p style={styles.eventDescription}>
                  {event.description.substring(0, 100)}...
                </p>
                
                <div style={styles.eventDetails}>
                  <div style={styles.detailItem}>
                    <span style={styles.icon}>📅</span>
                    <span>{new Date(event.date).toLocaleDateString()}</span>
                  </div>
                  <div style={styles.detailItem}>
                    <span style={styles.icon}>🕐</span>
                    <span>{event.time}</span>
                  </div>
                  <div style={styles.detailItem}>
                    <span style={styles.icon}>📍</span>
                    <span>{event.location}</span>
                  </div>
                  <div style={styles.detailItem}>
                    <span style={styles.icon}>👥</span>
                    <span>Max: {event.max_attendees} attendees</span>
                  </div>
                </div>

                <div style={styles.eventFooter}>
                  
                  <button
                    onClick={() => handleViewAttendees(event.id)}
                    style={styles.attendeesButton}
                  >
                    👥 View Attendees
                  </button>
                  
                  <button
                    onClick={() => handleEdit(event.id)}
                    style={styles.editButton}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDelete(event.id, event.title)}
                    style={styles.deleteButton}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
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
  headerButtons: {
    display: 'flex',
    gap: '1rem',
  },
  createButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '500',
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
  eventsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '1.5rem',
  },
  eventCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    overflow: 'hidden',
    transition: 'transform 0.2s',
  },
  eventImage: {
    width: '100%',
    height: '200px',
    objectFit: 'cover',
  },
  eventContent: {
    padding: '1.5rem',
  },
  eventHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem',
  },
  eventCategory: {
    display: 'inline-block',
    padding: '0.25rem 0.75rem',
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    borderRadius: '12px',
    fontSize: '0.85rem',
  },
  statusBadge: {
    padding: '0.25rem 0.75rem',
    borderRadius: '12px',
    fontSize: '0.85rem',
    fontWeight: '500',
  },
  eventTitle: {
    fontSize: '1.25rem',
    marginBottom: '0.5rem',
    color: '#1f2937',
  },
  eventDescription: {
    color: '#6b7280',
    marginBottom: '1rem',
    lineHeight: '1.5',
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
    display: 'flex',
    gap: '0.5rem',
    paddingTop: '1rem',
    borderTop: '1px solid #e5e7eb',
  },
  editButton: {
    flex: 1,
    padding: '0.75rem',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: '500',
  },
  deleteButton: {
    flex: 1,
    padding: '0.75rem',
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: '500',
  },
  noEvents: {
    textAlign: 'center',
    padding: '4rem 2rem',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  createButtonLarge: {
    marginTop: '1.5rem',
    padding: '1rem 2rem',
    backgroundColor: '#10b981',
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

export default MyEvents;