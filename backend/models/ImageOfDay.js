// backend/models/ImageOfDay.js
// Stores one "image of the day" per user per calendar date.
// This is a standalone record — separate from diary entries —
// so the user can set a daily hero image even if they write no text.
import mongoose from 'mongoose';

const ImageOfDaySchema = new mongoose.Schema(
  {
    // Firebase UID of the owner
    user: {
      type: String,
      required: true,
      index: true,
    },
    // Calendar date this image belongs to (time part zeroed out)
    date: {
      type: Date,
      required: true,
    },
    // URL of the image (from /api/upload)
    imageUrl: {
      type: String,
      required: true,
    },
    // Optional caption
    caption: {
      type: String,
      default: '',
      trim: true,
      maxlength: 300,
    },
    // Original filename for reference
    filename: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// One image per user per date — enforced at the DB level
ImageOfDaySchema.index({ user: 1, date: 1 }, { unique: true });

export default mongoose.model('ImageOfDay', ImageOfDaySchema);
