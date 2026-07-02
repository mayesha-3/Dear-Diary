// backend/models/Sticker.js
// Represents a reusable sticker in a user's personal sticker library.
// These are stickers the user has uploaded and wants to reuse across entries.
// (Different from the stickers embedded inside an Entry document.)
import mongoose from 'mongoose';

const StickerSchema = new mongoose.Schema(
  {
    // Firebase UID of the owner
    user: {
      type: String,
      required: true,
      index: true,
    },
    // URL of the sticker image (from /api/upload)
    imageUrl: {
      type: String,
      required: true,
    },
    // Original filename for display
    filename: {
      type: String,
      default: '',
    },
    // Optional label the user can assign
    label: {
      type: String,
      default: '',
      trim: true,
      maxlength: 60,
    },
    // Tags for filtering/searching the library
    tags: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

// Newest stickers first for the default library view
StickerSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('Sticker', StickerSchema);
