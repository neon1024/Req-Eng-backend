import { Router } from 'express';
import { getPatients, assignPatient, unassignPatient, getPatientMoods } from '../controllers/doctor.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { UserRole } from '../entities/user.entity';

const router = Router();

// All doctor routes require authentication + doctor role
router.get('/patients', authenticate, authorize(UserRole.DOCTOR), getPatients);
router.post('/patients/:patientId/assign', authenticate, authorize(UserRole.DOCTOR), assignPatient);
router.delete('/patients/:patientId/assign', authenticate, authorize(UserRole.DOCTOR), unassignPatient);
router.get('/patients/:patientId/moods', authenticate, authorize(UserRole.DOCTOR), getPatientMoods);

export default router;
