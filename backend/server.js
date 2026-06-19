import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { db, isFirebaseConnected } from './config/firebase.js';

// Import routes
import uploadRoutes from './routes/upload.js';
import entryRoutes from './routes/entries.js';
import pdfRoutes from './routes/route.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware to check Firebase connection
app.use((req, res, next) => {
  if (!isFirebaseConnected() && req.path.startsWith('/api/entries')) {
    return res.status(503).json({ 
      message: 'Firebase database is not connected or initialized... Please check server configuration.',
      connected: false 
    });
  }
  next();
});

// Serve static files (uploads folder)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'DearDiary API Server' });
});

// API routes
app.use('/api/upload', uploadRoutes);
app.use('/api', pdfRoutes);
app.use('/api/entries', entryRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
