import { Response } from 'express';
import { AppDataSource } from '../config/database';
import { User, UserRole } from '../entities/user.entity';
import { Mood } from '../entities/mood.entity';
import { AuthRequest } from '../middleware/auth.middleware';
import { IsNull } from 'typeorm';

// Get all patients: my assigned + unassigned
export const getPatients = async (req: AuthRequest, res: Response) => {
    try {
        const userRepository = AppDataSource.getRepository(User);
        const doctorId = req.user!.id;

        // Get my assigned patients
        const myPatients = await userRepository.find({
            where: { role: UserRole.PATIENT, doctorId },
            order: { name: 'ASC' }
        });

        // Get unassigned patients
        const unassignedPatients = await userRepository.find({
            where: { role: UserRole.PATIENT, doctorId: IsNull() },
            order: { name: 'ASC' }
        });

        res.json({
            error: null,
            myPatients: myPatients.map(p => p.toJSON()),
            unassignedPatients: unassignedPatients.map(p => p.toJSON())
        });
    } catch (error) {
        console.error('Get patients error:', error);
        res.status(500).json({ error: 'Server error', message: 'Server error' });
    }
};

// Assign a patient to me
export const assignPatient = async (req: AuthRequest, res: Response) => {
    try {
        const { patientId } = req.params;
        const doctorId = req.user!.id;

        const userRepository = AppDataSource.getRepository(User);

        const patient = await userRepository.findOne({
            where: { id: patientId, role: UserRole.PATIENT }
        });

        if (!patient) {
            return res.status(404).json({ error: 'Patient not found', message: 'Patient not found' });
        }

        if (patient.doctorId && patient.doctorId !== doctorId) {
            return res.status(400).json({ error: 'Patient is already assigned to another doctor', message: 'Patient is already assigned to another doctor' });
        }

        if (patient.doctorId === doctorId) {
            return res.status(400).json({ error: 'Patient is already assigned to you', message: 'Patient is already assigned to you' });
        }

        patient.doctorId = doctorId;
        await userRepository.save(patient);

        res.json({
            error: null,
            message: 'Patient assigned successfully',
            patient: patient.toJSON()
        });
    } catch (error) {
        console.error('Assign patient error:', error);
        res.status(500).json({ error: 'Server error', message: 'Server error' });
    }
};

// Unassign a patient from me
export const unassignPatient = async (req: AuthRequest, res: Response) => {
    try {
        const { patientId } = req.params;
        const doctorId = req.user!.id;

        const userRepository = AppDataSource.getRepository(User);

        const patient = await userRepository.findOne({
            where: { id: patientId, role: UserRole.PATIENT, doctorId }
        });

        if (!patient) {
            return res.status(404).json({ error: 'Patient not found or not assigned to you', message: 'Patient not found or not assigned to you' });
        }

        await userRepository.update(patient.id, { doctorId: null as unknown as string });
        patient.doctorId = undefined;

        res.json({
            error: null,
            message: 'Patient unassigned successfully',
            patient: patient.toJSON()
        });
    } catch (error) {
        console.error('Unassign patient error:', error);
        res.status(500).json({ error: 'Server error', message: 'Server error' });
    }
};

// Get mood history for a specific patient (must be assigned to me)
export const getPatientMoods = async (req: AuthRequest, res: Response) => {
    try {
        const { patientId } = req.params;
        const doctorId = req.user!.id;

        const userRepository = AppDataSource.getRepository(User);
        const moodRepository = AppDataSource.getRepository(Mood);

        // Check if patient is assigned to this doctor
        const patient = await userRepository.findOne({
            where: { id: patientId, role: UserRole.PATIENT, doctorId }
        });

        if (!patient) {
            return res.status(404).json({ error: 'Patient not found or not assigned to you', message: 'Patient not found or not assigned to you' });
        }

        // Get patient's mood history
        const moods = await moodRepository.find({
            where: { userId: patientId },
            order: { date: 'DESC' }
        });

        res.json({
            error: null,
            patient: patient.toJSON(),
            moods
        });
    } catch (error) {
        console.error('Get patient moods error:', error);
        res.status(500).json({ error: 'Server error', message: 'Server error' });
    }
};
