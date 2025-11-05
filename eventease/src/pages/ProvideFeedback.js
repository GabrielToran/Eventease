// src/pages/ProvideFeedback.js
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserRegistrations } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import './Providefeedback.css';

const ProvideFeedback = () => {
  const [pastEvents, setPastEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPastEvents();
  }, []);

  const fetchPastEvents = async () => {
    try {
      const registrations = await getUserRegistrations(user.id);
      
      // Filter for past events
      const today = new Date();
      const past = registrations.filter(reg => {
        const eventDate = new Date(reg.date);
        return eventDate < today;
      });
      
      // Check which events can receive feedback
      const eventsWithFeedbackStatus = await Promise.all(
        past.map(async (event) => {
          try {
            const token = localStorage.getItem('token');
            const response = await fetch(
              `http://localhost:5000/api/feedback/can-feedback/${event.event_id}/${user.id}`,
              {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              }
            );
            const data = await response.json();
            return { ...event, ...data };
          } catch (err) {
            return { ...event, canFeedback: false, reason: 'Error checking status' };
          }
        })
      );
      
      setPastEvents(eventsWithFeedbackStatus);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch past events');
      setLoading(false);
    }
  };

  const handleEventSelect = (event) => {
    if (event.canFeedback) {
      setSelectedEvent(event);
      setRating(0);
      setComment('');
      setError('');
      setSuccess('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }
    
    if (!comment.trim()) {
      setError('Please provide a comment');
      return;
    }
    
    setSubmitting(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          event_id: selectedEvent.event_id,
          user_id: user.id,
          rating,
          comment
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit feedback');
      }
      
      setSuccess('Feedback submitted successfully!');
      setTimeout(() => {
        setSelectedEvent(null);
        fetchPastEvents();
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const StarRating = ({ rating, onRatingChange, disabled = false }) => {
    return (
      <div style={styles.starContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => !disabled && onRatingChange(star)}
            style={{
              ...styles.star,
              color: star <= rating ? '#fbbf24' : '#d1d5db',
              cursor: disabled ? 'default' : 'pointer'
            }}
            disabled={disabled}
          >
            ★
          </button>
        ))}
        <span style={styles.ratingText}>
          {rating > 0 ? `${rating} out of 5 stars` : 'Select a rating'}
        </span>
      </div>
    );
  };

  if (loading) return <div style={styles.loading}>Loading past events...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Provide Event Feedback</h1>
        <button onClick={() => navigate('/')} style={styles.backButton}>
          ← Back to Dashboard
        </button>
      </div>

      {!selectedEvent ? (
        <div>
          <p style={styles.subtitle}>
            Select a past event to provide feedback
          </p>
          
          {pastEvents.length === 0 ? (
            <div style={styles.noEvents}>
              <h2>No past events found</h2>
              <p>You don't have any completed events to provide feedback for.</p>
            </div>
          ) : (
            <div style={styles.eventsGrid}>
              {pastEvents.map((event) => (
                <div 
                  key={event.id} 
                  style={{
                    ...styles.eventCard,
                    opacity: event.canFeedback ? 1 : 0.6,
                    cursor: event.canFeedback ? 'pointer' : 'not-allowed'
                  }}
                  onClick={() => handleEventSelect(event)}
                >
                  {event.image_url && (
                    <img 
                      src={event.image_url} 
                      alt={event.title}
                      style={styles.eventImage}
                      onError={(e) => e.target.style.display = 'none'}
                    />
                  )}
                  
                  <div style={styles.eventContent}>
                    <h3 style={styles.eventTitle}>{event.title}</h3>
                    
                    <div style={styles.eventDetails}>
                      <div style={styles.detailItem}>
                        <span style={styles.icon}>📅</span>
                        <span>{new Date(event.date).toLocaleDateString()}</span>
                      </div>
                      <div style={styles.detailItem}>
                        <span style={styles.icon}>📍</span>
                        <span>{event.location}</span>
                      </div>
                    </div>
                    
                    {event.canFeedback ? (
                      <div style={styles.canFeedbackBadge}>
                        ✓ Ready for feedback
                      </div>
                    ) : (
                      <div style={styles.cannotFeedbackBadge}>
                        {event.reason}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div style={styles.feedbackForm}>
          <div style={styles.formCard}>
            <div style={styles.formHeader}>
              <h2>{selectedEvent.title}</h2>
              <button 
                onClick={() => setSelectedEvent(null)}
                style={styles.closeButton}
              >
                ✕
              </button>
            </div>
            
            {error && <div style={styles.error}>{error}</div>}
            {success && <div style={styles.success}>{success}</div>}
            
            <form onSubmit={handleSubmit}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Your Rating *</label>
                <StarRating 
                  rating={rating} 
                  onRatingChange={setRating}
                />
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Your Feedback *</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience with this event..."
                  rows="8"
                  style={styles.textarea}
                  required
                />
                <small style={styles.hint}>
                  Be specific about what you liked and what could be improved
                </small>
              </div>
              
              <div style={styles.buttonGroup}>
                <button
                  type="button"
                  onClick={() => setSelectedEvent(null)}
                  style={styles.cancelButton}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={styles.submitButton}
                >
                  {submitting ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </div>
            </form>
          </div>
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
  subtitle: {
    fontSize: '1.1rem',
    color: '#6b7280',
    marginBottom: '2rem',
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
  canFeedbackBadge: {
    padding: '0.5rem 1rem',
    backgroundColor: '#dcfce7',
    color: '#166534',
    borderRadius: '8px',
    fontSize: '0.9rem',
    fontWeight: '500',
    textAlign: 'center',
  },
  cannotFeedbackBadge: {
    padding: '0.5rem 1rem',
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    borderRadius: '8px',
    fontSize: '0.9rem',
    textAlign: 'center',
  },
  feedbackForm: {
    display: 'flex',
    justifyContent: 'center',
  },
  formCard: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '700px',
  },
  formHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
    paddingBottom: '1rem',
    borderBottom: '2px solid #e5e7eb',
  },
  closeButton: {
    padding: '0.5rem',
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
    color: '#6b7280',
  },
  formGroup: {
    marginBottom: '1.5rem',
  },
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    fontWeight: '600',
    color: '#374151',
  },
  starContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  star: {
    fontSize: '2.5rem',
    backgroundColor: 'transparent',
    border: 'none',
    padding: '0',
    transition: 'color 0.2s',
  },
  ratingText: {
    marginLeft: '1rem',
    color: '#6b7280',
    fontSize: '0.9rem',
  },
  textarea: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '1rem',
    fontFamily: 'inherit',
    resize: 'vertical',
  },
  hint: {
    display: 'block',
    marginTop: '0.5rem',
    color: '#6b7280',
    fontSize: '0.85rem',
  },
  buttonGroup: {
    display: 'flex',
    gap: '1rem',
    marginTop: '2rem',
  },
  cancelButton: {
    flex: 1,
    padding: '0.75rem',
    backgroundColor: '#e5e7eb',
    color: '#374151',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '500',
  },
  submitButton: {
    flex: 1,
    padding: '0.75rem',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '500',
  },
  error: {
    backgroundColor: '#fee',
    color: '#c00',
    padding: '0.75rem',
    borderRadius: '8px',
    marginBottom: '1rem',
  },
  success: {
    backgroundColor: '#dcfce7',
    color: '#166534',
    padding: '0.75rem',
    borderRadius: '8px',
    marginBottom: '1rem',
  },
  noEvents: {
    textAlign: 'center',
    padding: '4rem 2rem',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  loading: {
    textAlign: 'center',
    padding: '3rem',
    fontSize: '1.2rem',
    color: '#6b7280',
  },
};

export default ProvideFeedback;