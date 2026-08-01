import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { listUsers, setRestrict, setWarn, importFirebaseUsers } from '../controllers/adminController.js';

const router = express.Router();

// Quick public ping to verify route is mounted (placed before auth)
router.get('/ping', (_req, res) => res.json({ ok: true, route: '/api/admin/ping' }));

// All admin routes require auth
router.use(requireAuth);

router.get('/users', listUsers);
router.post('/users/:uid/restrict', setRestrict);
router.post('/users/:uid/warn', setWarn);
router.post('/import-firebase', importFirebaseUsers);

export default router;
