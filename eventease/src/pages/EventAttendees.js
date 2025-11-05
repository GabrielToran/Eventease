// src/pages/EventAttendees.js
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getEventById, getEventRegistrations } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import './EventAttendees.css';

const EventAttendees = () => {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchEventAndAttendees();
  }, [eventId]);

  const fetchEventAndAttendees = async () => {
    try {
      const eventData = await getEventById(eventId);
      
      // Check if user is the organizer or admin
      if (eventData.organizer_id !== user.id && user.role !== 'admin') {
        alert('You are not authorized to view attendees for this event');
        navigate('/my-events');
        return;
      }

      setEvent(eventData);
      
      const attendeesData = await getEventRegistrations(eventId);
      setAttendees(attendeesData);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch event attendees');
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (attendees.length === 0) {
      alert('No attendees to export');
      return;
    }

    // Prepare CSV headers
    const headers = ['Name', 'Email', 'Registration Date', 'Status'];
    
    // Prepare CSV rows
    const rows = attendees.map(attendee => [
      attendee.user_name,
      attendee.user_email,
      new Date(attendee.registered_at).toLocaleString(),
      attendee.status || 'Confirmed'
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${event.title.replace(/\s+/g, '_')}_attendees_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToJSON = () => {
    if (attendees.length === 0) {
      alert('No attendees to export');
      return;
    }

    const exportData = {
      event: {
        id: event.id,
        title: event.title,
        date: event.date,
        time: event.time,
        location: event.location,
      },
      attendees: attendees.map(attendee => ({
        name: attendee.user_name,
        email: attendee.user_email,
        registrationDate: attendee.registered_at,
        status: attendee.status || 'Confirmed'
      })),
      exportDate: new Date().toISOString(),
      totalAttendees: attendees.length
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${event.title.replace(/\s+/g, '_')}_attendees_${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getFilteredAttendees = () => {
    if (!searchTerm) return attendees;
    
    return attendees.filter(attendee =>
      attendee.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      attendee.user_email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const filteredAttendees = getFilteredAttendees();

  if (loading) return <div style={styles.loading}>Loading attendees...</div>;
  if (error) return <div style={styles.error}>{error}</div>;
  if (!event) return <div style={styles.error}>Event not found</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Event Attendees</h1>
          <p style={styles.eventTitle}>{event.title}</p>
        </div>
        <button onClick={() => navigate('/my-events')} style={styles.backButton}>
          ← Back to My Events
        </button>
      </div>

      {/* Event Summary */}
      <div style={styles.summaryCard}>
        <div style={styles.summaryGrid}>
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>Total Registered</span>
            <span style={styles.summaryValue}>{attendees.length}</span>
          </div>
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>Max Capacity</span>
            <span style={styles.summaryValue}>{event.max_attendees}</span>
          </div>
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>Available Spots</span>
            <span style={styles.summaryValue}>{event.max_attendees - attendees.length}</span>
          </div>
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>Occupancy Rate</span>
            <span style={styles.summaryValue}>
              {Math.round((attendees.length / event.max_attendees) * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={styles.controls}>
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.searchInput}
        />
        
        <div style={styles.exportButtons}>
          <button onClick={exportToCSV} style={styles.exportButton}>
            📊 Export CSV
          </button>
          <button onClick={exportToJSON} style={styles.exportButton}>
            📄 Export JSON
          </button>
        </div>
      </div>

      {/* Attendees List */}
      {filteredAttendees.length === 0 ? (
        <div style={styles.noAttendees}>
          <h3>
            {attendees.length === 0 
              ? 'No attendees yet' 
              : 'No attendees match your search'}
          </h3>
          <p>
            {attendees.length === 0 
              ? 'When people register for this event, they will appear here.'
              : 'Try adjusting your search criteria.'}
          </p>
        </div>
      ) : (
        <div style={styles.attendeesCard}>
          <h3 style={styles.attendeesTitle}>
            Registered Attendees ({filteredAttendees.length})
          </h3>
          
          <div style={styles.table}>
            <div style={styles.tableHeader}>
              <div style={styles.headerCell}>Name</div>
              <div style={styles.headerCell}>Email</div>
              <div style={styles.headerCell}>Registration Date</div>
              <div style={styles.headerCell}>Status</div>
            </div>
            
            {filteredAttendees.map((attendee, index) => (
              <div 
                key={attendee.id} 
                style={{
                  ...styles.tableRow,
                  backgroundColor: index % 2 === 0 ? '#f9fafb' : 'white'
                }}
              >
                <div style={styles.tableCell}>
                  <div style={styles.nameCell}>
                    <div style={styles.avatar}>
                      {attendee.user_name.charAt(0).toUpperCase()}
                    </div>
                    <span>{attendee.user_name}</span>
                  </div>
                </div>
                <div style={styles.tableCell}>{attendee.user_email}</div>
                <div style={styles.tableCell}>
                  {new Date(attendee.registered_at).toLocaleDateString()} at{' '}
                  {new Date(attendee.registered_at).toLocaleTimeString()}
                </div>
                <div style={styles.tableCell}>
                  <span style={styles.statusBadge}>Confirmed</span>
                </div>
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
    alignItems: 'flex-start',
    marginBottom: '2rem',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  title: {
    fontSize: '2rem',
    color: '#1f2937',
    marginBottom: '0.5rem',
  },
  eventTitle: {
    fontSize: '1.1rem',
    color: '#6b7280',
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
  summaryCard: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    marginBottom: '2rem',
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '2rem',
  },
  summaryItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  summaryLabel: {
    fontSize: '0.9rem',
    color: '#6b7280',
    marginBottom: '0.5rem',
  },
  summaryValue: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#2563eb',
  },
  controls: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  searchInput: {
    flex: '1',
    minWidth: '250px',
    padding: '0.75rem',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '1rem',
  },
  exportButtons: {
    display: 'flex',
    gap: '0.5rem',
  },
  exportButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '500',
  },
  attendeesCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    overflow: 'hidden',
  },
  attendeesTitle: {
    padding: '1.5rem',
    borderBottom: '1px solid #e5e7eb',
    fontSize: '1.25rem',
    color: '#1f2937',
  },
  table: {
    width: '100%',
  },
  tableHeader: {
    display: 'grid',
    gridTemplateColumns: '2fr 2fr 2fr 1fr',
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
    gridTemplateColumns: '2fr 2fr 2fr 1fr',
    padding: '1rem 1.5rem',
    borderBottom: '1px solid #e5e7eb',
  },
  tableCell: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '0.95rem',
    color: '#4b5563',
  },
  nameCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: '#2563eb',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '1rem',
  },
  statusBadge: {
    padding: '0.25rem 0.75rem',
    backgroundColor: '#dcfce7',
    color: '#166534',
    borderRadius: '12px',
    fontSize: '0.85rem',
    fontWeight: '500',
  },
  noAttendees: {
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

export default EventAttendees;