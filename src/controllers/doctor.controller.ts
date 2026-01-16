import { Response } from 'express';
import { AppDataSource } from '../config/database';
import { User, UserRole } from '../entities/user.entity';
import { Mood } from '../entities/mood.entity';
import { AuthRequest } from '../middleware/auth.middleware';
import { IsNull } from 'typeorm';

// Calculate average mood score for a patient
const calculateMoodScore = async (userId: string): Promise<{ avgScore: number | null; moodCount: number }> => {
    const moodRepository = AppDataSource.getRepository(Mood);

    const result = await moodRepository
        .createQueryBuilder('mood')
        .select('AVG(mood.rate)', 'avgScore')
        .addSelect('COUNT(*)', 'moodCount')
        .where('mood.userId = :userId', { userId })
        .getRawOne();

    return {
        avgScore: result.avgScore ? parseFloat(parseFloat(result.avgScore).toFixed(1)) : null,
        moodCount: parseInt(result.moodCount) || 0
    };
};

// Add mood score to patient data
const addScoreToPatients = async (patients: User[]) => {
    const patientsWithScore = await Promise.all(
        patients.map(async (patient) => {
            const { avgScore, moodCount } = await calculateMoodScore(patient.id);
            return {
                ...patient.toJSON(),
                moodScore: avgScore,
                moodCount
            };
        })
    );

    // Sort by score ascending (lowest/worst first), null scores at the end
    return patientsWithScore.sort((a, b) => {
        if (a.moodScore === null && b.moodScore === null) return 0;
        if (a.moodScore === null) return 1;
        if (b.moodScore === null) return -1;
        return a.moodScore - b.moodScore;
    });
};

// Get all patients: my assigned + unassigned
export const getPatients = async (req: AuthRequest, res: Response) => {
    try {
        const userRepository = AppDataSource.getRepository(User);
        const doctorId = req.user!.id;

        // Get my assigned patients
        const myPatients = await userRepository.find({
            where: { role: UserRole.PATIENT, doctorId }
        });

        // Get unassigned patients
        const unassignedPatients = await userRepository.find({
            where: { role: UserRole.PATIENT, doctorId: IsNull() }
        });

        // Add scores and sort by mood score (ascending - worst first)
        const myPatientsWithScore = await addScoreToPatients(myPatients);
        const unassignedPatientsWithScore = await addScoreToPatients(unassignedPatients);

        res.json({
            error: null,
            myPatients: myPatientsWithScore,
            unassignedPatients: unassignedPatientsWithScore
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
