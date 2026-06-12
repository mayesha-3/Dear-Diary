import axios from 'axios';

// Centralised axios instance. Adjust baseURL via your .env
// (e.g. VITE_API_URL=http://localhost:5000/api)
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Attach auth token automatically if you store one (adjust to your auth setup)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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
