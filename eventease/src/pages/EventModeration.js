// src/pages/EventModeration.js
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './EventModeration.css';

const EventModeration = () => {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    filterEvents();
  }, [events, searchTerm, statusFilter]);

  const fetchEvents = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/events');
      if (!response.ok) throw new Error('Failed to fetch events');
      
      const data = await response.json();
      setEvents(data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const filterEvents = () => {
    let filtered = [...events];

    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.organizer_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter) {
      filtered = filtered.filter(event => event.status === statusFilter);
    }

    setFilteredEvents(filtered);
  };

  const handleStatusChange = async (eventId, newStatus, reason = '') => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/events/${eventId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus, reason })
      });

      if (!response.ok) throw new Error('Failed to update event status');

      alert('Event status updated successfully!');
      fetchEvents();
      setSelectedEvent(null);
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleBlockEvent = (event) => {
    const reason = window.prompt('Please provide a reason for blocking this event:');
    if (reason) {
      handleStatusChange(event.id, 'cancelled', reason);
    }
  };

  const handleDeleteEvent = async (eventId, eventTitle) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${eventTitle}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete event');

      alert('Event deleted successfully!');
      fetchEvents();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const EventModal = ({ event, onClose }) => (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h2>{event.title}</h2>
          <button onClick={onClose} style={styles.closeButton}>✕</button>
        </div>
        
        {event.image_url && (
          <img src={event.image_url} alt={event.title} style={styles.modalImage} />
        )}
        
        <div style={styles.modalContent}>
          <div style={styles.infoRow}>
            <strong>Organizer:</strong> {event.organizer_name}
          </div>
          <div style={styles.infoRow}>
            <strong>Category:</strong> {event.category_name}
          </div>
          <div style={styles.infoRow}>
            <strong>Date:</strong> {new Date(event.date).toLocaleDateString()}
          </div>
          <div style={styles.infoRow}>
            <strong>Time:</strong> {event.time}
          </div>
          <div style={styles.infoRow}>
            <strong>Location:</strong> {event.location}
          </div>
          <div style={styles.infoRow}>
            <strong>Max Attendees:</strong> {event.max_attendees}
          </div>
          <div style={styles.infoRow}>
            <strong>Status:</strong> 
            <span style={{
              ...styles.statusBadge,
              backgroundColor: event.status === 'active' ? '#dcfce7' : 
                             event.status === 'cancelled' ? '#fee2e2' : '#dbeafe',
              color: event.status === 'active' ? '#166534' : 
                     event.status === 'cancelled' ? '#991b1b' : '#1e40af',
            }}>
              {event.status}
            </span>
          </div>
          <div style={styles.descriptionSection}>
            <strong>Description:</strong>
            <p>{event.description}</p>
          </div>
        </div>
        
        <div style={styles.modalActions}>
          {event.status === 'active' && (
            <button
              onClick={() => {
                handleBlockEvent(event);
                onClose();
              }}
              style={{...styles.actionButton, backgroundColor: '#ef4444'}}
            >
              Block Event
            </button>
          )}
          {event.status === 'cancelled' && (
            <button
              onClick={() => {
                handleStatusChange(event.id, 'active');
                onClose();
              }}
              style={{...styles.actionButton, backgroundColor: '#10b981'}}
            >
              Reactivate Event
            </button>
          )}
          <button
            onClick={() => {
              handleDeleteEvent(event.id, event.title);
              onClose();
            }}
            style={{...styles.actionButton, backgroundColor: '#dc2626'}}
          >
            Delete Event
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) return <div style={styles.loading}>Loading events...</div>;
  if (error) return <div style={styles.error}>{error}</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Event Moderation</h1>
        <button onClick={() => navigate('/admin')} style={styles.backButton}>
          ← Back to Admin Dashboard
        </button>
      </div>

      {/* Filters */}
      <div style={styles.filtersCard}>
        <div style={styles.filtersGrid}>
          <div style={styles.filterGroup}>
            <label style={styles.label}>Search</label>
            <input
              type="text"
              placeholder="Search by title, description, or organizer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.filterGroup}>
            <label style={styles.label}>Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={styles.input}
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        <button 
          onClick={() => {
            setSearchTerm('');
            setStatusFilter('');
          }}
          style={styles.clearButton}
        >
          Clear Filters
        </button>
      </div>

      {/* Results Count */}
      <div style={styles.resultsCount}>
        Showing {filteredEvents.length} of {events.length} events
      </div>

      {/* Events Grid */}
      <div style={styles.eventsGrid}>
        {filteredEvents.map((event) => (
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
                <span style={{
                  ...styles.statusBadge,
                  backgroundColor: event.status === 'active' ? '#dcfce7' : 
                                 event.status === 'cancelled' ? '#fee2e2' : '#dbeafe',
                  color: event.status === 'active' ? '#166534' : 
                         event.status === 'cancelled' ? '#991b1b' : '#1e40af',
                }}>
                  {event.status}
                </span>
              </div>

              <h3 style={styles.eventTitle}>{event.title}</h3>
              
              <div style={styles.eventDetails}>
                <div style={styles.detailItem}>
                  <span>👤</span>
                  <span>{event.organizer_name}</span>
                </div>
                <div style={styles.detailItem}>
                  <span>📅</span>
                  <span>{new Date(event.date).toLocaleDateString()}</span>
                </div>
                <div style={styles.detailItem}>
                  <span>📍</span>
                  <span>{event.location}</span>
                </div>
              </div>

              <div style={styles.eventActions}>
                <button
                  onClick={() => setSelectedEvent(event)}
                  style={{...styles.actionButton, backgroundColor: '#3b82f6'}}
                >
                  View Details
                </button>
                {event.status === 'active' ? (
                  <button
                    onClick={() => handleBlockEvent(event)}
                    style={{...styles.actionButton, backgroundColor: '#ef4444'}}
                  >
                    Block
                  </button>
                ) : event.status === 'cancelled' ? (
                  <button
                    onClick={() => handleStatusChange(event.id, 'active')}
                    style={{...styles.actionButton, backgroundColor: '#10b981'}}
                  >
                    Reactivate
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedEvent && (
        <EventModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
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
  filtersCard: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    marginBottom: '1.5rem',
  },
  filtersGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1rem',
    marginBottom: '1rem',
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    marginBottom: '0.5rem',
    fontWeight: '500',
    color: '#374151',
  },
  input: {
    padding: '0.75rem',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '1rem',
  },
  clearButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  resultsCount: {
    marginBottom: '1rem',
    color: '#6b7280',
    fontSize: '0.95rem',
  },
  eventsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '1.5rem',
  },
  eventCard: {
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
  },
  eventHeader: {
    marginBottom: '0.5rem',
  },
  statusBadge: {
    padding: '0.25rem 0.75rem',
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
  eventActions: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  actionButton: {
    flex: 1,
    padding: '0.5rem 1rem',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '500',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '1rem',
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '12px',
    maxWidth: '600px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.5rem',
    borderBottom: '1px solid #e5e7eb',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
    color: '#6b7280',
  },
  modalImage: {
    width: '100%',
    maxHeight: '300px',
    objectFit: 'cover',
  },
  modalContent: {
    padding: '1.5rem',
  },
  infoRow: {
    marginBottom: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  descriptionSection: {
    marginTop: '1rem',
    paddingTop: '1rem',
    borderTop: '1px solid #e5e7eb',
  },
  modalActions: {
    padding: '1.5rem',
    borderTop: '1px solid #e5e7eb',
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap',
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

export default EventModeration;