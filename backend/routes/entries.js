// backend/routes/entries.js
import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getEntries,
  getPicOfTheDay,
  getEntry,
  createEntry,
  updateEntry,
  deleteEntry,
} from '../controllers/entryController.js';

const router = express.Router();

// All entry routes require a valid Firebase ID token
router.use(requireAuth);

// IMPORTANT: specific routes must come before /:id
router.get('/pic-of-the-day', getPicOfTheDay);

router.get('/',        getEntries);
router.get('/:id',     getEntry);
router.post('/',       createEntry);
router.put('/:id',     updateEntry);
router.delete('/:id',  deleteEntry);

export default router;
