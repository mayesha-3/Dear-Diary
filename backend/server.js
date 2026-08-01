// backend/server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { errorHandler } from "./middleware/errorHandler.js";
// ── Config ───────────────────────────────────────────────
dotenv.config();

// ── MongoDB ──────────────────────────────────────────────
import { connectDB } from './config/db.js';

// ── Firebase Admin (auth only) ───────────────────────────
import './config/firebase.js';

// ── Routes ───────────────────────────────────────────────
import uploadRoutes     from './routes/upload.js';
import entryRoutes      from './routes/entries.js';
import stickerRoutes    from './routes/stickers.js';
import imageOfDayRoutes from './routes/imageOfDay.js';
import pdfRoutes        from './routes/route.js';
import adminRoutes      from './routes/admin.js';
import accountRoutes    from './routes/account.js';

// ── App setup ────────────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app  = express();
const PORT = process.env.PORT || 5001;

// ✅ CORS setup (must be before routes)
app.use(cors({
  origin: ["http://localhost:5173", "http://127.0.0.1:5173"], // allow both localhost & 127.0.0.1
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

// Handle preflight requests
// app.options removed due to Express 5 PathError; app.use(cors()) handles it

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images/stickers statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ── API routes ───────────────────────────────────────────
app.get("/", (_req, res) => res.json({ message: "DearDiary API Server ✅" }));

app.use("/api/upload",       uploadRoutes);
app.use("/api/entries",      entryRoutes);
app.use("/api/stickers",     stickerRoutes);
app.use("/api/image-of-day", imageOfDayRoutes);
app.use("/api",              pdfRoutes);
app.use("/api/admin",        adminRoutes);
app.use("/api/account",      accountRoutes);

// ── Global error handler ─────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// ── Start ────────────────────────────────────────────────
connectDB().finally(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
});
