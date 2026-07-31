// backend/config/db.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';

dotenv.config();

// Fix SRV DNS resolution timeout on networks that block or hang on SRV DNS queries
dns.setServers(['8.8.8.8', '1.1.1.1']);

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.warn('⚠️  MONGO_URI is not defined in .env — continuing without MongoDB for now.');
}

let isConnected = false;

export async function connectDB() {
  if (isConnected) {
    console.log('⚡ MongoDB already connected.');
    return;
  }

  if (!MONGO_URI) {
    console.warn('⚠️  Skipping MongoDB connection because MONGO_URI is missing.');
    return;
  }

  try {
    const conn = await mongoose.connect(MONGO_URI, {
      dbName: 'deardiary', // explicit DB name
    });

    isConnected = true;
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);

    mongoose.connection.on('disconnected', () => {
      isConnected = false;
      console.warn('⚠️  MongoDB disconnected.');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB error:', err);
    });
  } catch (err) {
    console.error('⚠️  MongoDB connection failed:', err.message);
    console.warn('⚠️  Continuing with the server running; database-backed routes may fail until MongoDB is reachable.');
  }
}

export const isMongoConnected = () => isConnected;
