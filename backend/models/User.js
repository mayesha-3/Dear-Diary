// backend/models/User.js
// Lightweight shadow user record.
// Firebase handles actual auth — this doc lets us store
// per-user preferences and is the anchor for stickers /
// image-of-day records.
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    // Firebase UID — the primary key we join on everywhere
    firebaseUid: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      default: '',
    },
    displayName: {
      type: String,
      default: '',
    },
    photoUrl: {
      type: String,
      default: '',
    },
    // User preferences (theme, font, etc.) can grow here
    preferences: {
      theme: { type: String, default: 'light' },
      font: { type: String, default: 'default' },
    },
  },
  { timestamps: true }
);

export default mongoose.model('User', UserSchema);
