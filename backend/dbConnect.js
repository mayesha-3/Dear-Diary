// backend/dbConnect.js
// Standalone script — run with `node dbConnect.js` to verify
// your Atlas cluster is reachable using the MONGO_URI in .env.
// The production connection is handled by config/db.js (imported by server.js).
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.argv[2] || process.env.MONGO_URI;

if (!uri) {
  console.error('❌ MONGO_URI is not set in .env and no URI passed');
  process.exit(1);
}

async function run() {
  try {
    await mongoose.connect(uri);
    await mongoose.connection.db.admin().command({ ping: 1 });
    console.log('✅ Connected and pinged MongoDB successfully!');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
