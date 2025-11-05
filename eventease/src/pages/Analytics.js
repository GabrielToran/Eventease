// src/pages/Analytics.js
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEvents, getEventRegistrations } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import './Analytics.css';

const Analytics = () => {
  const [analytics, setAnalytics] = useState({
    totalEvents: 0,
    upcomingEvents: 0,
    completedEvents: 0,
    totalAttendees: 0,
    averageAttendance: 0,
    eventPerformance: [],
    categoryBreakdown: {},
    recentTrends: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch all events
      const events = await getEvents();
      const myEvents = events.filter(event => event.organizer_id === user.id);
      
      // Calculate basic stats
      const today = new Date();
      const upcoming = myEvents.filter(e => new Date(e.date) >= today && e.status === 'active');
      const completed = myEvents.filter(e => new Date(e.date) < today || e.status === 'completed');
      
      // Fetch registrations for each event
      const eventPerformance = await Promise.all(
        myEvents.map(async (event) => {
          try {
            const response = await fetch(
              `http://localhost:5000/api/registrations/event/${event.id}`,
              {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              }
            );
            const registrations = await response.json();
            
            // Fetch feedback for the event
            let averageRating = null;
            let feedbackCount = 0;
            try {
              const feedbackResponse = await fetch(
                `http://localhost:5000/api/feedback/event/${event.id}`,
                {
                  headers: {
                    'Authorization': `Bearer ${token}`
                  }
                }
              );
              const feedback = await feedbackResponse.json();
              if (feedback.length > 0) {
                const totalRating = feedback.reduce((sum, f) => sum + f.rating, 0);
                averageRating = (totalRating / feedback.length).toFixed(1);
                feedbackCount = feedback.length;
              }
            } catch (err) {
              console.error('Error fetching feedback:', err);
            }
            
            return {
              ...event,
              registrationCount: registrations.length,
              occupancyRate: ((registrations.length / event.max_attendees) * 100).toFixed(1),
              averageRating,
              feedbackCount
            };
          } catch (err) {
            return {
              ...event,
              registrationCount: 0,
              occupancyRate: 0,
              averageRating: null,
              feedbackCount: 0
            };
          }
        })
      );
      
      // Calculate total attendees
      const totalAttendees = eventPerformance.reduce((sum, e) => sum + e.registrationCount, 0);
      
      // Calculate average attendance
      const averageAttendance = myEvents.length > 0 
        ? (totalAttendees / myEvents.length).toFixed(1)
        : 0;
      
      // Category breakdown
      const categoryBreakdown = myEvents.reduce((acc, event) => {
        const category = event.category_name || 'Uncategorized';
        if (!acc[category]) {
          acc[category] = { count: 0, attendees: 0 };
        }
        acc[category].count++;
        const eventData = eventPerformance.find(e => e.id === event.id);
        acc[category].attendees += eventData?.registrationCount || 0;
        return acc;
      }, {});
      
      // Recent trends (last 6 events)
      const recentTrends = eventPerformance
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 6)
        .reverse();
      
      setAnalytics({
        totalEvents: myEvents.length,
        upcomingEvents: upcoming.length,
        completedEvents: completed.length,
        totalAttendees,
        averageAttendance,
        eventPerformance: eventPerformance.sort((a, b) => b.registrationCount - a.registrationCount),
        categoryBreakdown,
        recentTrends
      });
      
      setLoading(false);
    } catch (err) {
      setError('Failed to load analytics');
      setLoading(false);
    }
  };

  const getPerformanceColor = (rate) => {
    if (rate >= 80) return '#10b981';
    if (rate >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const getRatingColor = (rating) => {
    if (rating >= 4) return '#10b981';
    if (rating >= 3) return '#f59e0b';
    return '#ef4444';
  };

  if (loading) return <div style={styles.loading}>Loading analytics...</div>;
  if (error) return <div style={styles.error}>{error}</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Analytics Dashboard</h1>
        <button onClick={() => navigate('/')} style={styles.backButton}>
          ← Back to Dashboard
        </button>
      </div>

      {/* Overview Stats */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>📊</div>
          <div style={styles.statValue}>{analytics.totalEvents}</div>
          <div style={styles.statLabel}>Total Events</div>
        </div>
        
        <div style={styles.statCard}>
          <div style={styles.statIcon}>📅</div>
          <div style={styles.statValue}>{analytics.upcomingEvents}</div>
          <div style={styles.statLabel}>Upcoming Events</div>
        </div>
        
        <div style={styles.statCard}>
          <div style={styles.statIcon}>✅</div>
          <div style={styles.statValue}>{analytics.completedEvents}</div>
          <div style={styles.statLabel}>Completed Events</div>
        </div>
        
        <div style={styles.statCard}>
          <div style={styles.statIcon}>👥</div>
          <div style={styles.statValue}>{analytics.totalAttendees}</div>
          <div style={styles.statLabel}>Total Attendees</div>
        </div>
        
        <div style={styles.statCard}>
          <div style={styles.statIcon}>📈</div>
          <div style={styles.statValue}>{analytics.averageAttendance}</div>
          <div style={styles.statLabel}>Avg Attendees/Event</div>
        </div>
      </div>

      {/* Event Performance */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Event Performance</h2>
        <div style={styles.tableCard}>
          <div style={styles.table}>
            <div style={styles.tableHeader}>
              <div style={styles.headerCell}>Event Name</div>
              <div style={styles.headerCell}>Date</div>
              <div style={styles.headerCell}>Registrations</div>
              <div style={styles.headerCell}>Occupancy</div>
              <div style={styles.headerCell}>Rating</div>
            </div>
            
            {analytics.eventPerformance.slice(0, 10).map((event) => (
              <div key={event.id} style={styles.tableRow}>
                <div style={styles.tableCell}>{event.title}</div>
                <div style={styles.tableCell}>
                  {new Date(event.date).toLocaleDateString()}
                </div>
                <div style={styles.tableCell}>
                  {event.registrationCount} / {event.max_attendees}
                </div>
                <div style={styles.tableCell}>
                  <div style={styles.progressContainer}>
                    <div 
                      style={{
                        ...styles.progressBar,
                        width: `${event.occupancyRate}%`,
                        backgroundColor: getPerformanceColor(parseFloat(event.occupancyRate))
                      }}
                    />
                    <span style={styles.progressText}>{event.occupancyRate}%</span>
                  </div>
                </div>
                <div style={styles.tableCell}>
                  {event.averageRating ? (
                    <span style={{ 
                      color: getRatingColor(parseFloat(event.averageRating)),
                      fontWeight: 'bold'
                    }}>
                      ★ {event.averageRating} ({event.feedbackCount})
                    </span>
                  ) : (
                    <span style={{ color: '#9ca3af' }}>No ratings</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Category Breakdown</h2>
        <div style={styles.categoryGrid}>
          {Object.entries(analytics.categoryBreakdown).map(([category, data]) => (
            <div key={category} style={styles.categoryCard}>
              <h3 style={styles.categoryName}>{category}</h3>
              <div style={styles.categoryStats}>
                <div style={styles.categoryStat}>
                  <span style={styles.categoryValue}>{data.count}</span>
                  <span style={styles.categoryLabel}>Events</span>
                </div>
                <div style={styles.categoryStat}>
                  <span style={styles.categoryValue}>{data.attendees}</span>
                  <span style={styles.categoryLabel}>Attendees</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Trends */}
      {analytics.recentTrends.length > 0 && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Recent Event Trends</h2>
          <div style={styles.trendsCard}>
            <div style={styles.chartContainer}>
              {analytics.recentTrends.map((event, index) => {
                const maxHeight = 200;
                const maxAttendees = Math.max(...analytics.recentTrends.map(e => e.registrationCount));
                const barHeight = maxAttendees > 0 ? (event.registrationCount / maxAttendees) * maxHeight : 0;
                
                return (
                  <div key={event.id} style={styles.barContainer}>
                    <div 
                      style={{
                        ...styles.bar,
                        height: `${barHeight}px`,
                        backgroundColor: getPerformanceColor(parseFloat(event.occupancyRate))
                      }}
                    >
                      <span style={styles.barValue}>{event.registrationCount}</span>
                    </div>
                    <div style={styles.barLabel}>
                      {event.title.length > 15 
                        ? event.title.substring(0, 15) + '...' 
                        : event.title}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Key Insights */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Key Insights</h2>
        <div style={styles.insightsGrid}>
          <div style={styles.insightCard}>
            <div style={styles.insightIcon}>🏆</div>
            <div style={styles.insightContent}>
              <h3 style={styles.insightTitle}>Best Performing Event</h3>
              <p style={styles.insightText}>
                {analytics.eventPerformance[0]?.title || 'N/A'} with{' '}
                {analytics.eventPerformance[0]?.registrationCount || 0} attendees
              </p>
            </div>
          </div>
          
          <div style={styles.insightCard}>
            <div style={styles.insightIcon}>⭐</div>
            <div style={styles.insightContent}>
              <h3 style={styles.insightTitle}>Highest Rated Event</h3>
              <p style={styles.insightText}>
                {analytics.eventPerformance
                  .filter(e => e.averageRating)
                  .sort((a, b) => b.averageRating - a.averageRating)[0]?.title || 'N/A'}
                {analytics.eventPerformance
                  .filter(e => e.averageRating)
                  .sort((a, b) => b.averageRating - a.averageRating)[0]?.averageRating && 
                  ` (${analytics.eventPerformance
                    .filter(e => e.averageRating)
                    .sort((a, b) => b.averageRating - a.averageRating)[0]?.averageRating}★)`}
              </p>
            </div>
          </div>
          
          <div style={styles.insightCard}>
            <div style={styles.insightIcon}>📊</div>
            <div style={styles.insightContent}>
              <h3 style={styles.insightTitle}>Average Occupancy</h3>
              <p style={styles.insightText}>
                {analytics.eventPerformance.length > 0
                  ? (analytics.eventPerformance.reduce((sum, e) => 
                      sum + parseFloat(e.occupancyRate), 0) / analytics.eventPerformance.length).toFixed(1)
                  : 0}% across all events
              </p>
            </div>
          </div>
        </div>
      </div>
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
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1.5rem',
    marginBottom: '3rem',
  },
  statCard: {
    backgroundColor: 'white',
    padding: '2rem',
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
  },
  section: {
    marginBottom: '3rem',
  },
  sectionTitle: {
    fontSize: '1.5rem',
    marginBottom: '1.5rem',
    color: '#1f2937',
  },
  tableCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    overflow: 'hidden',
  },
  table: {
    width: '100%',
  },
  tableHeader: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1.5fr 1.5fr 1fr',
    padding: '1rem 1.5rem',
    backgroundColor: '#f9fafb',
    borderBottom: '2px solid #e5e7eb',
    fontWeight: '600',
    color: '#374151',
  },
  headerCell: {
    fontSize: '0.9rem',
  },
  tableRow: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1.5fr 1.5fr 1fr',
    padding: '1rem 1.5rem',
    borderBottom: '1px solid #e5e7eb',
  },
  tableCell: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '0.95rem',
    color: '#4b5563',
  },
  progressContainer: {
    position: 'relative',
    width: '100%',
    height: '24px',
    backgroundColor: '#e5e7eb',
    borderRadius: '12px',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    transition: 'width 0.3s ease',
  },
  progressText: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    color: '#1f2937',
  },
  categoryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1.5rem',
  },
  categoryCard: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  categoryName: {
    fontSize: '1.1rem',
    marginBottom: '1rem',
    color: '#1f2937',
  },
  categoryStats: {
    display: 'flex',
    justifyContent: 'space-around',
  },
  categoryStat: {
    textAlign: 'center',
  },
  categoryValue: {
    display: 'block',
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#2563eb',
  },
  categoryLabel: {
    display: 'block',
    color: '#6b7280',
    fontSize: '0.85rem',
  },
  trendsCard: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  chartContainer: {
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: '300px',
    gap: '1rem',
  },
  barContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    width: '100%',
    maxWidth: '80px',
    borderRadius: '8px 8px 0 0',
    position: 'relative',
    transition: 'height 0.3s ease',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingTop: '0.5rem',
  },
  barValue: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: '0.9rem',
  },
  barLabel: {
    marginTop: '0.5rem',
    fontSize: '0.75rem',
    color: '#6b7280',
    textAlign: 'center',
    maxWidth: '100px',
  },
  insightsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '1.5rem',
  },
  insightCard: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    display: 'flex',
    gap: '1rem',
  },
  insightIcon: {
    fontSize: '2.5rem',
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: '1rem',
    marginBottom: '0.5rem',
    color: '#1f2937',
  },
  insightText: {
    color: '#6b7280',
    fontSize: '0.9rem',
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

export default Analytics;