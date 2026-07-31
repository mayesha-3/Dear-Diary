// backend/dbConnect.js
// Standalone script — run with `node dbConnect.js` to verify
// your Atlas cluster is reachable using the MONGO_URI in .env.
// The production connection is handled by config/db.js (imported by server.js).
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from "node:dns";

// Force Node to use IPv4 and Google's public DNS for SRV lookups
dns.setDefaultResultOrder('ipv4first'); // <-- 2. Force IPv4
dns.setServers(['8.8.8.8', '8.8.4.4']); // <-- 3. Set reliable DNS

dotenv.config();

const uri = process.argv[2] || process.env.MONGO_URI;

if (!uri) {
  console.error('❌ MONGO_URI is not set in .env and no URI passed');
  process.exit(1);
}

async function run() {
  try {
    console.log("Connecting to URI:", uri.replace(/:([^@]+)@/, ":****@")); // Print URI safely without password

    await mongoose.connect(uri, {
      tls: true,
      serverSelectionTimeoutMS: 5000, // Drop wait time from 30s to 5s for fast feedback
    });

    await mongoose.connection.db.admin().command({ ping: 1 });
    console.log("✅ Connected and pinged MongoDB successfully!");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
