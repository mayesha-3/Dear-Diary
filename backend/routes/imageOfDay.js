// backend/routes/imageOfDay.js
import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getImageOfDay,
  getAllImagesOfDay,
  setImageOfDay,
  deleteImageOfDay,
} from '../controllers/imageOfDayController.js';

const router = express.Router();

// All image-of-day routes require a valid Firebase ID token
router.use(requireAuth);

// IMPORTANT: /all must come before / to avoid route conflicts
router.get('/all',  getAllImagesOfDay);
router.get('/',     getImageOfDay);
router.put('/',     setImageOfDay);
router.delete('/',  deleteImageOfDay);

export default router;
