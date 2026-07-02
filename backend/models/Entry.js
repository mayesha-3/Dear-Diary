// backend/models/Entry.js
import mongoose from 'mongoose';

// A single sticker placed on a diary page.
// x / y are percentages (0-100) of the page container so the
// sticker position stays correct across different screen sizes.
const StickerSchema = new mongoose.Schema(
  {
    stickerId: {
      type: String,
      required: true, // client-generated unique id (e.g. uuid)
    },
    imageUrl: {
      type: String,
      required: true, // url returned by /api/upload
    },
    x: {
      type: Number, // left position, % of container width
      required: true,
      default: 50,
    },
    y: {
      type: Number, // top position, % of container height
      required: true,
      default: 50,
    },
    width: {
      type: Number, // width in px
      default: 120,
    },
    rotation: {
      type: Number, // degrees
      default: 0,
    },
    zIndex: {
      type: Number,
      default: 10,
    },
  },
  { _id: false }
);

const EntrySchema = new mongoose.Schema(
  {
    // Firebase UID — NOT a Mongoose ObjectId, since Firebase is the auth source
    user: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    // HTML produced by the rich text editor (Quill / similar)
    content: {
      type: String,
      required: true,
    },
    // Plain-text excerpt of content — used for list previews & search
    excerpt: {
      type: String,
      default: '',
    },
    stickers: {
      type: [StickerSchema],
      default: [],
    },
    picOfTheDay: {
      imageUrl: { type: String, default: null },
      enabled: { type: Boolean, default: false },
    },
    // The diary date this entry belongs to (user-editable, defaults to now)
    entryDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  { timestamps: true } // adds createdAt / updatedAt
);

// Compound index: newest entries first per user
EntrySchema.index({ user: 1, entryDate: -1 });

// Text index for full-text search on title + excerpt
EntrySchema.index({ title: 'text', excerpt: 'text' });

export default mongoose.model('Entry', EntrySchema);
