import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = express.Router();

// All uploads land in /uploads, which server.js serves statically
// at the "/uploads" path (see app.use('/uploads', express.static(...)))
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = crypto.randomBytes(16).toString('hex');
    cb(null, `${Date.now()}-${unique}${ext}`);
  },
});

const ALLOWED_MIME = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml'];

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB per file
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      return cb(new Error('Unsupported file type. Use PNG, JPG, GIF, WEBP or SVG.'));
    }
    cb(null, true);
  },
});

// POST /api/upload
// Accepts a single file under the field name "image".
// Used for: sticker images, the "pic of the day" image,
// and any image dropped into the rich text editor.
router.post('/', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded.' });
  }

  // Build an absolute-ish URL so the frontend can use it directly
  // in <img src> and the Quill editor.
  const url = `/uploads/${req.file.filename}`;

  return res.status(201).json({
    url,
    filename: req.file.filename,
    size: req.file.size,
    mimeType: req.file.mimetype,
  });
});

// Multer/file-filter error handler for this router
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: err.message });
  }
  if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
});

export default router;
