import axios from 'axios';
import { auth } from '../firebase';

// Centralised axios instance. Adjust baseURL via your .env
// (e.g. VITE_API_URL=http://localhost:5100/api)
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5100/api',
});

// Attach Firebase Auth ID token automatically to requests
api.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;
    if (user) {
      try {
        // Force refresh if the token is close to expiry
        const token = await user.getIdToken(false);
        config.headers.Authorization = `Bearer ${token}`;
      } catch (err) {
        console.error('Failed to attach Firebase auth token to request:', err);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Helper: upload a single image file, returns the server URL
export async function uploadImage(file) {
  const formData = new FormData();
  formData.append('image', file);

  const res = await api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return res.data.url; // e.g. "/uploads/169999-abc123.png"
}

export default api;
