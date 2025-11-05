import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './Login';
import Signup  from './Signup';
import Dashboard from './Dashboard';
import CreateEvent from './pages/CreateEvent'; 
import EditEvent from './pages/EditEvent';
import EventsList from './pages/EventList';
import MyEvents from './pages/MyEvents';
import MyRegistrations from './pages/MyRegistrations';
import EventAttendees from './pages/EventAttendees';
import ProvideFeedback from './pages/ProvideFeedback';
import ViewFeedback from './pages/ViewFeedback';
import Analytics from './pages/Analytics';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';

// Admin Components
import AdminDashboard from './pages/AdminDashboard';
import UserManagement from './pages/Usermanagement';
import EventModeration from './pages/EventModeration';
import CategoryManagement from './pages/CategoryManagement';
import ActivityMonitor from './pages/ActivityMonitor';

import './App.css';
import './responsive.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/Signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          {/* Main Dashboard */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          
          {/* Events Routes */}
          <Route
            path="/events"
            element={
              <ProtectedRoute>
                <EventsList />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/my-events"
            element={
              <ProtectedRoute allowedRoles={['organizer', 'admin']}>
                <MyEvents />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/create-event"
            element={
              <ProtectedRoute allowedRoles={['organizer', 'admin']}>
                <CreateEvent />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/edit-event/:id"
            element={
              <ProtectedRoute allowedRoles={['organizer', 'admin']}>
                <EditEvent />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/my-registrations"
            element={
              <ProtectedRoute>
                <MyRegistrations />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/event-attendees/:eventId"
            element={
              <ProtectedRoute allowedRoles={['organizer', 'admin']}>
                <EventAttendees />
              </ProtectedRoute>
            }
          />
          
          {/* Feedback Routes */}
          <Route
            path="/provide-feedback"
            element={
              <ProtectedRoute allowedRoles={['attendee']}>
                <ProvideFeedback />
              </ProtectedRoute>
            }
          />

          <Route
            path="/view-feedback"
            element={
              <ProtectedRoute allowedRoles={['organizer', 'admin']}>
                <ViewFeedback />
              </ProtectedRoute>
            }
          />
          
          {/* Analytics Route */}
          <Route
            path="/analytics"
            element={
              <ProtectedRoute allowedRoles={['organizer', 'admin']}>
                <Analytics />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <UserManagement />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/events"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <EventModeration />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/categories"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <CategoryManagement />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/activity"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ActivityMonitor />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
