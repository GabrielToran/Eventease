const API_URL = 'http://localhost:5000/api';

// Get token from localStorage
const getToken = () => localStorage.getItem('token');

// API call helper
const apiCall = async (endpoint, options = {}) => {
  const token = getToken();
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  const response = await fetch(`${API_URL}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong');
  }

  return data;
};

// Auth APIs
export const login = (credentials) => 
  apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });

export const register = (userData) =>
  apiCall('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  });

// Event APIs
export const getEvents = () => apiCall('/events');

export const getEventById = (id) => apiCall(`/events/${id}`);

export const createEvent = (eventData) =>
  apiCall('/events', {
    method: 'POST',
    body: JSON.stringify(eventData),
  });

export const updateEvent = (id, eventData) =>
  apiCall(`/events/${id}`, {
    method: 'PUT',
    body: JSON.stringify(eventData),
  });

export const deleteEvent = (id) =>
  apiCall(`/events/${id}`, {
    method: 'DELETE',
  });

export const getCategories = () => apiCall('/categories');
export const getUserRegistrations = (userId) => apiCall(`/registrations/user/${userId}`);
export const getEventRegistrations = (eventId) => apiCall(`/registrations/event/${eventId}`);
export const registerForEvent = (registrationData) =>
  apiCall('/registrations', {
    method: 'POST',
    body: JSON.stringify(registrationData),
  });

export const cancelRegistration = (id) =>
  apiCall(`/registrations/${id}`, {
    method: 'DELETE',
  });

  // Feedback APIs
export const submitFeedback = (feedbackData) =>
  apiCall('/feedback', {
    method: 'POST',
    body: JSON.stringify(feedbackData),
  });

export const getEventFeedback = (eventId) => apiCall(`/feedback/event/${eventId}`);

export const getOrganizerFeedback = (organizerId) => apiCall(`/feedback/organizer/${organizerId}`);

export const canProvideFeedback = (eventId, userId) => apiCall(`/feedback/can-feedback/${eventId}/${userId}`);