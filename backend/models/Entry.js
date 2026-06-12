import mongoose from 'mongoose';

// A single sticker placed on the page.
// x / y are stored as PERCENTAGES (0-100) of the page container's
// width/height so the sticker's position stays correct regardless
// of screen size. "fixed position on page" + "in front of text" is
// achieved on the front end via position: absolute + a z-index that
// is always higher than the text layer.
const StickerSchema = new mongoose.Schema(
  {
    stickerId: {
      type: String,
      required: true, // client-generated unique id (e.g. uuid)
    },
    imageUrl: {
      type: String,
      required: true, // url returned by the /api/upload route
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
      default: 10, // higher than the text layer's z-index
    },
  },
  { _id: false }
);

const EntrySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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
    // Plain-text version of content, kept in sync on save.
    // Used for list previews / search without re-parsing HTML.
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
    // The diary date this entry belongs to (user-editable,
    // defaults to "now" but can be backdated).
    entryDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  { timestamps: true } // adds createdAt / updatedAt
);

// Helpful for the "Past Entries" page: newest first.
EntrySchema.index({ user: 1, entryDate: -1 });

export default mongoose.model('Entry', EntrySchema);
