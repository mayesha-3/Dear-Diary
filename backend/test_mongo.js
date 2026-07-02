import mongoose from 'mongoose';
import dns from 'dns';
import dotenv from 'dotenv';
dotenv.config();

console.log("Setting DNS server to 8.8.8.8...");
dns.setServers(['8.8.8.8']);

const uris = [
  process.env.MONGO_URI,
  "mongodb+srv://c241488_db_user:OXqPxC7UOwiCLuRS@diary.93vu2m6.mongodb.net/deardiary"
];

async function test(uri, name) {
  console.log(`Testing ${name}...`);
  if (!uri) {
    console.log(`❌ ${name} is not set.`);
    return;
  }
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000
    });
    console.log(`✅ ${name} connected successfully! Host: ${conn.connection.host}`);
    await mongoose.disconnect();
  } catch (err) {
    console.error(`❌ ${name} failed:`, err.message);
  }
}

async function run() {
  await test(uris[0], "URI from .env");
  await test(uris[1], "URI from database.txt");
  process.exit(0);
}

run();
