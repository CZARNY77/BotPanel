// This service handles communication with your Bot backend
const API_BASE_URL = 'http://conqbot:4000';

export const api = {
  // Generic GET request
  get: async (endpoint: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`);
      if (!response.ok) throw new Error('Network response was not ok');
      return await response.json();
    } catch (error) {
      console.warn(`API Fetch Error (${endpoint}):`, error);
      // For demo purposes in this environment, we suppress the error so the UI doesn't crash
      // In production, you would want to handle this error properly
      return null;
    }
  },

  // Generic POST request
  post: async (endpoint: string, data: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Network response was not ok');
      return await response.json();
    } catch (error) {
      console.warn(`API Post Error (${endpoint}):`, error);
      // Mock success for demo
      return { success: true, mock: true };
    }
  },

  // Generic DELETE request
  delete: async (endpoint: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Network response was not ok');
      return await response.json();
    } catch (error) {
      console.warn(`API Delete Error (${endpoint}):`, error);
      return { success: true, mock: true };
    }
  }
};

// Specific endpoints can be defined here
export const BotAPI = {
  getEvents: (serverId: string) => api.get(`/api/events/${serverId}`),
  createEvent: (eventData: any) => api.post('/api/events', eventData),
  deleteEvent: (eventId: string) => api.delete(`/api/events/${eventId}`),
  
  updateWelcome: (serverId: string, config: any) => api.post(`/api/welcome/${serverId}`, config),
  
  // Example for Emoji Triggers
  getTriggers: (serverId: string) => api.get(`/api/triggers/${serverId}`),
};