// backend/routes/stickers.js
import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getStickers,
  addSticker,
  updateSticker,
  deleteSticker,
} from '../controllers/stickerController.js';

const router = express.Router();

// All sticker routes require a valid Firebase ID token
router.use(requireAuth);

router.get('/',        getStickers);
router.post('/',       addSticker);
router.patch('/:id',   updateSticker);
router.delete('/:id',  deleteSticker);

export default router;
