// src/pages/EventList.js
import {useState,useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {getEvents,getCategories,registerForEvent,getUserRegistrations} from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import './EventList.css';

const EventsList = () => {
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [registeredEventIds, setRegisteredEventIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchEvents();
    fetchCategories();
    if (user?.role === 'attendee') {
      fetchUserRegistrations();
    }
  }, []);

  useEffect(() => {
    filterEvents();
  }, [events, searchTerm, selectedCategory, selectedDate, selectedLocation]);

  const fetchEvents = async () => {
    try {
      const data = await getEvents();
      setEvents(data);
      setFilteredEvents(data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch events');
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchUserRegistrations = async () => {
    try {
      const registrations = await getUserRegistrations(user.id);
      const eventIds = registrations.map(reg => reg.event_id);
      setRegisteredEventIds(eventIds);
    } catch (err) {
      console.error('Error fetching user registrations:', err);
    }
  };

  const filterEvents = () => {
    let filtered = [...events];

    // Search by title or description
    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(event => 
        event.category_id === parseInt(selectedCategory)
      );
    }

    // Filter by date
    if (selectedDate) {
      filtered = filtered.filter(event => {
        const eventDate = new Date(event.date).toISOString().split('T')[0];
        return eventDate === selectedDate;
      });
    }

    // Filter by location - FIXED BUG
    if (selectedLocation) {
      filtered = filtered.filter(event => 
        event.location.toLowerCase().includes(selectedLocation.toLowerCase())
      );
    }

    setFilteredEvents(filtered);
  };

  const handleRegister = async (eventId) => {
    if (!user) {
      alert('Please login to register for events');
      navigate('/login');
      return;
    }

    try {
      await registerForEvent({
        event_id: eventId,
        user_id: user.id
      });
      
      // Update registered events list
      setRegisteredEventIds([...registeredEventIds, eventId]);
      
      alert('Successfully registered for the event! Check "My Registrations" to view all your events.');
      
      // Optionally refresh events to show updated capacity
      fetchEvents();
    } catch (err) {
      const errorMessage = err.message || 'Failed to register';
      alert(errorMessage);
      console.error('Registration error:', err);
    }
  };

  const handleViewDetails = (eventId) => {
    // For now, just show an alert. You can create a detailed view page later
    alert('Event details view - Coming soon!');
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedDate('');
    setSelectedLocation('');
  };

  const isRegistered = (eventId) => {
    return registeredEventIds.includes(eventId);
  };

  if (loading) return <div style={styles.loading}>Loading events...</div>;
  if (error) return <div style={styles.error}>{error}</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Browse Events</h1>
        <button onClick={() => navigate('/')} style={styles.backButton}>
          ← Back to Dashboard
        </button>
      </div>

      {/* Filters Section */}
      <div style={styles.filtersCard}>
        <h3 style={styles.filterTitle}>Search & Filter Events</h3>
        
        <div style={styles.filtersGrid}>
          {/* Search */}
          <div style={styles.filterGroup}>
            <label style={styles.label}>Search</label>
            <input
              type="text"
              placeholder="Search by title or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.input}
            />
          </div>

          {/* Category Filter */}
          <div style={styles.filterGroup}>
            <label style={styles.label}>Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={styles.input}
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div style={styles.filterGroup}>
            <label style={styles.label}>Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={styles.input}
            />
          </div>

          {/* Location Filter */}
          <div style={styles.filterGroup}>
            <label style={styles.label}>Location</label>
            <input
              type="text"
              placeholder="Filter by location..."
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              style={styles.input}
            />
          </div>
        </div>

        <button onClick={clearFilters} style={styles.clearButton}>
          Clear All Filters
        </button>
      </div>

      {/* Results Count */}
      <div style={styles.resultsCount}>
        Showing {filteredEvents.length} of {events.length} events
        {user?.role === 'attendee' && ` • ${registeredEventIds.length} registered`}
      </div>

      {/* Events Grid */}
      {filteredEvents.length === 0 ? (
        <div style={styles.noEvents}>
          <p>No events found matching your criteria.</p>
        </div>
      ) : (
        <div style={styles.eventsGrid}>
          {filteredEvents.map(event => {
            const isEventRegistered = isRegistered(event.id);
            const isPastEvent = new Date(event.date) < new Date();
            
            return (
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
                  <div style={styles.eventCategory}>{event.category_name}</div>
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
                      <span style={styles.icon}>👤</span>
                      <span>{event.organizer_name}</span>
                    </div>
                  </div>

                  <div style={styles.eventFooter}>
                    <span style={{
                      ...styles.status,
                      color: (event.status === 'active' || event.status === 'upcoming') ? '#059669' : 
                             event.status === 'cancelled' ? '#dc2626' : '#6b7280'
                    }}>
                      Status: {event.status}
                    </span>
                    <div style={styles.buttonGroup}>
                      {user?.role === 'attendee' && (
                        <>
                          {isEventRegistered ? (
                            <button
                              style={styles.registeredButton}
                              disabled
                            >
                              ✓ Registered
                            </button>
                          ) : isPastEvent ? (
                            <button
                              style={styles.pastButton}
                              disabled
                            >
                              Event Passed
                            </button>
                          ) : (event.status === 'active' || event.status === 'upcoming') ? (
                            <button
                              onClick={() => handleRegister(event.id)}
                              style={styles.registerButton}
                            >
                              Register Now
                            </button>
                          ) : (
                            <button
                              style={styles.disabledButton}
                              disabled
                            >
                              Not Available
                            </button>
                          )}
                        </>
                      )}
                      
                      {(user?.role === 'organizer' || user?.role === 'admin') && (
                        <button
                          onClick={() => handleViewDetails(event.id)}
                          style={styles.detailsButton}
                        >
                          View Details
                        </button>
                      )}
                    </div>
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
  filtersCard: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    marginBottom: '2rem',
  },
  filterTitle: {
    marginBottom: '1rem',
    color: '#1f2937',
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
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '1.5rem',
  },
  eventCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    overflow: 'hidden',
    transition: 'transform 0.2s',
    cursor: 'pointer',
  },
  eventImage: {
    width: '100%',
    height: '200px',
    objectFit: 'cover',
  },
  eventContent: {
    padding: '1.5rem',
  },
  eventCategory: {
    display: 'inline-block',
    padding: '0.25rem 0.75rem',
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    borderRadius: '12px',
    fontSize: '0.85rem',
    marginBottom: '0.5rem',
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '1rem',
    borderTop: '1px solid #e5e7eb',
  },
  status: {
    fontSize: '0.85rem',
    fontWeight: '500',
  },
  buttonGroup: {
    display: 'flex',
    gap: '0.5rem',
  },
  detailsButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem',
  },
  registerButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '600',
  },
  registeredButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#059669',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.9rem',
    fontWeight: '600',
    cursor: 'not-allowed',
    opacity: 0.7,
  },
  pastButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#6b7280',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.9rem',
    cursor: 'not-allowed',
    opacity: 0.7,
  },
  disabledButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#9ca3af',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.9rem',
    cursor: 'not-allowed',
    opacity: 0.7,
  },
  noEvents: {
    textAlign: 'center',
    padding: '3rem',
    backgroundColor: 'white',
    borderRadius: '12px',
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

export default EventsList;