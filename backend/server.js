import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

// Import routes
import uploadRoutes from './routes/upload.js';
import entryRoutes from './routes/entries.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/deardiary';

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => {
    mongoConnected = true;
    console.log('✓ Connected to MongoDB Atlas successfully!');
  })
  .catch(err => {
    console.error('✗ MongoDB connection error:', err.message);
    console.error('💡 Tip: Make sure your IP is whitelisted in MongoDB Atlas Network Access settings');
    // Continue without MongoDB - will show error to frontend
  });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware to check MongoDB connection (optional)
app.use((req, res, next) => {
  if (!mongoConnected && req.path.startsWith('/api/entries')) {
    return res.status(503).json({ 
      message: 'Database is still connecting... Please wait a moment and try again.',
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
