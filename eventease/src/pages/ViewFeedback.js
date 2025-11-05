// src/pages/ViewFeedback.js
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Viewfeedback.css';

const ViewFeedback = () => {
  const [feedbackData, setFeedbackData] = useState([]);
  const [groupedFeedback, setGroupedFeedback] = useState({});
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:5000/api/feedback/organizer/${user.id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch feedback');
      }
      
      const data = await response.json();
      setFeedbackData(data);
      
      // Group feedback by event
      const grouped = data.reduce((acc, feedback) => {
        const eventId = feedback.event_id;
        if (!acc[eventId]) {
          acc[eventId] = {
            eventTitle: feedback.event_title,
            eventId: eventId,
            feedback: [],
            averageRating: 0,
            totalFeedback: 0
          };
        }
        acc[eventId].feedback.push(feedback);
        return acc;
      }, {});
      
      // Calculate average ratings
      Object.keys(grouped).forEach(eventId => {
        const feedbackArray = grouped[eventId].feedback;
        const totalRating = feedbackArray.reduce((sum, f) => sum + f.rating, 0);
        grouped[eventId].averageRating = (totalRating / feedbackArray.length).toFixed(1);
        grouped[eventId].totalFeedback = feedbackArray.length;
      });
      
      setGroupedFeedback(grouped);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const StarDisplay = ({ rating }) => {
    return (
      <div style={styles.starDisplay}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            style={{
              ...styles.star,
              color: star <= rating ? '#fbbf24' : '#d1d5db'
            }}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  const getRatingColor = (rating) => {
    if (rating >= 4) return '#10b981';
    if (rating >= 3) return '#f59e0b';
    return '#ef4444';
  };

  if (loading) return <div style={styles.loading}>Loading feedback...</div>;
  if (error) return <div style={styles.error}>{error}</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Event Feedback</h1>
        <button onClick={() => navigate('/')} style={styles.backButton}>
          ← Back to Dashboard
        </button>
      </div>

      {feedbackData.length === 0 ? (
        <div style={styles.noFeedback}>
          <h2>No feedback received yet</h2>
          <p>Feedback will appear here once attendees submit their reviews for your events.</p>
        </div>
      ) : !selectedEvent ? (
        <div>
          <p style={styles.subtitle}>
            Overview of feedback for all your events
          </p>
          
          <div style={styles.summaryGrid}>
            {Object.values(groupedFeedback).map((eventData) => (
              <div 
                key={eventData.eventId} 
                style={styles.summaryCard}
                onClick={() => setSelectedEvent(eventData)}
              >
                <h3 style={styles.eventTitle}>{eventData.eventTitle}</h3>
                
                <div style={styles.ratingSection}>
                  <div style={{
                    ...styles.averageRating,
                    color: getRatingColor(parseFloat(eventData.averageRating))
                  }}>
                    {eventData.averageRating}
                  </div>
                  <StarDisplay rating={Math.round(parseFloat(eventData.averageRating))} />
                </div>
                
                <div style={styles.feedbackCount}>
                  {eventData.totalFeedback} {eventData.totalFeedback === 1 ? 'review' : 'reviews'}
                </div>
                
                <button style={styles.viewDetailsButton}>
                  View All Feedback →
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <div style={styles.detailHeader}>
            <div>
              <h2 style={styles.detailTitle}>{selectedEvent.eventTitle}</h2>
              <div style={styles.detailRating}>
                <span style={{
                  ...styles.averageRatingLarge,
                  color: getRatingColor(parseFloat(selectedEvent.averageRating))
                }}>
                  {selectedEvent.averageRating}
                </span>
                <div>
                  <StarDisplay rating={Math.round(parseFloat(selectedEvent.averageRating))} />
                  <div style={styles.feedbackCountDetail}>
                    Based on {selectedEvent.totalFeedback} {selectedEvent.totalFeedback === 1 ? 'review' : 'reviews'}
                  </div>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setSelectedEvent(null)}
              style={styles.backToListButton}
            >
              ← Back to All Events
            </button>
          </div>
          
          <div style={styles.feedbackList}>
            {selectedEvent.feedback.map((feedback) => (
              <div key={feedback.id} style={styles.feedbackCard}>
                <div style={styles.feedbackHeader}>
                  <div style={styles.userInfo}>
                    <div style={styles.avatar}>
                      {feedback.user_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={styles.userName}>{feedback.user_name}</div>
                      <div style={styles.date}>
                        {new Date(feedback.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>
                  <StarDisplay rating={feedback.rating} />
                </div>
                
                <p style={styles.feedbackComment}>{feedback.comment}</p>
              </div>
            ))}
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
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '1.5rem',
  },
  summaryCard: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  eventTitle: {
    fontSize: '1.25rem',
    marginBottom: '1rem',
    color: '#1f2937',
  },
  ratingSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '1rem',
  },
  averageRating: {
    fontSize: '3rem',
    fontWeight: 'bold',
  },
  starDisplay: {
    display: 'flex',
    gap: '0.25rem',
  },
  star: {
    fontSize: '1.5rem',
  },
  feedbackCount: {
    color: '#6b7280',
    marginBottom: '1rem',
  },
  viewDetailsButton: {
    width: '100%',
    padding: '0.75rem',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '500',
  },
  detailHeader: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    marginBottom: '2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  detailTitle: {
    fontSize: '1.75rem',
    marginBottom: '1rem',
    color: '#1f2937',
  },
  detailRating: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
  },
  averageRatingLarge: {
    fontSize: '4rem',
    fontWeight: 'bold',
  },
  feedbackCountDetail: {
    color: '#6b7280',
    marginTop: '0.5rem',
  },
  backToListButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#6b7280',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
  },
  feedbackList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  feedbackCard: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  feedbackHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
    paddingBottom: '1rem',
    borderBottom: '1px solid #e5e7eb',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  avatar: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    backgroundColor: '#2563eb',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.25rem',
    fontWeight: 'bold',
  },
  userName: {
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '0.25rem',
  },
  date: {
    fontSize: '0.85rem',
    color: '#6b7280',
  },
  feedbackComment: {
    color: '#4b5563',
    lineHeight: '1.6',
    fontSize: '1rem',
  },
  noFeedback: {
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
  error: {
    textAlign: 'center',
    padding: '2rem',
    backgroundColor: '#fee',
    color: '#c00',
    borderRadius: '8px',
  },
};

export default ViewFeedback;