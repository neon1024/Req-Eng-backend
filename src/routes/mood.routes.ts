import { Router } from 'express';
import { getMoodConfig, getMoods, addMood, updateMood, deleteMood } from '../controllers/mood.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { UserRole } from '../entities/user.entity';

const router = Router();

// Public endpoint - get mood configuration (emojis, rate range)
router.get('/config', getMoodConfig);

// Protected routes - patient only
router.get('/', authenticate, authorize(UserRole.PATIENT), getMoods);
router.post('/', authenticate, authorize(UserRole.PATIENT), addMood);
router.put('/', authenticate, authorize(UserRole.PATIENT), updateMood);
router.delete('/', authenticate, authorize(UserRole.PATIENT), deleteMood);

export default router;
