import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getAccountStatus, upsertUser } from '../middleware/accountStatus.js';

const router = express.Router();

router.get('/status', requireAuth, getAccountStatus);
router.post('/upsert', requireAuth, upsertUser);

export default router;
