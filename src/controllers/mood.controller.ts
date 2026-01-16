import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Mood } from '../entities/mood.entity';
import { AuthRequest } from '../middleware/auth.middleware';

// Mood configuration
export const MOOD_CONFIG = {
  rate: {
    min: 1,
    max: 10
  }
};

const getTodayDate = (): string => {
  return new Date().toISOString().split('T')[0];
};

const isValidRate = (rate: number): boolean => {
  return Number.isInteger(rate) && rate >= MOOD_CONFIG.rate.min && rate <= MOOD_CONFIG.rate.max;
};

// Public endpoint - no auth required
export const getMoodConfig = (_req: Request, res: Response) => {
  res.json({
    error: null,
    config: MOOD_CONFIG
  });
};

export const getMoods = async (req: AuthRequest, res: Response) => {
  try {
    const moodRepository = AppDataSource.getRepository(Mood);
    const moods = await moodRepository.find({
      where: { userId: req.user!.id },
      order: { date: 'DESC' }
    });

    const today = getTodayDate();
    const todayMood = moods.find(m => m.date === today);

    res.json({
      error: null,
      moods,
      todayTracked: !!todayMood,
      todayMood: todayMood || null
    });
  } catch (error) {
    console.error('Get moods error:', error);
    res.status(500).json({ error: 'Server error', message: 'Server error' });
  }
};

export const addMood = async (req: AuthRequest, res: Response) => {
  try {
    const { rate } = req.body;

    if (!isValidRate(rate)) {
      return res.status(400).json({ error: 'Rate must be an integer between 1 and 10', message: 'Rate must be an integer between 1 and 10' });
    }

    const moodRepository = AppDataSource.getRepository(Mood);
    const today = getTodayDate();

    const existingMood = await moodRepository.findOne({
      where: { userId: req.user!.id, date: today }
    });

    if (existingMood) {
      return res.status(400).json({ error: 'Mood already tracked for today. Use update instead.', message: 'Mood already tracked for today. Use update instead.' });
    }

    const mood = moodRepository.create({
      userId: req.user!.id,
      rate,
      date: today
    });

    await moodRepository.save(mood);

    res.status(201).json({
      error: null,
      message: 'Mood added successfully',
      mood
    });
  } catch (error) {
    console.error('Add mood error:', error);
    res.status(500).json({ error: 'Server error', message: 'Server error' });
  }
};

export const updateMood = async (req: AuthRequest, res: Response) => {
  try {
    const { rate } = req.body;

    if (!isValidRate(rate)) {
      return res.status(400).json({ error: 'Rate must be an integer between 1 and 10', message: 'Rate must be an integer between 1 and 10' });
    }

    const moodRepository = AppDataSource.getRepository(Mood);
    const today = getTodayDate();

    const mood = await moodRepository.findOne({
      where: { userId: req.user!.id, date: today }
    });

    if (!mood) {
      return res.status(404).json({ error: 'No mood tracked for today', message: 'No mood tracked for today' });
    }

    mood.rate = rate;
    await moodRepository.save(mood);

    res.json({
      error: null,
      message: 'Mood updated successfully',
      mood
    });
  } catch (error) {
    console.error('Update mood error:', error);
    res.status(500).json({ error: 'Server error', message: 'Server error' });
  }
};

export const deleteMood = async (req: AuthRequest, res: Response) => {
  try {
    const moodRepository = AppDataSource.getRepository(Mood);
    const today = getTodayDate();

    const mood = await moodRepository.findOne({
      where: { userId: req.user!.id, date: today }
    });

    if (!mood) {
      return res.status(404).json({ error: 'No mood tracked for today', message: 'No mood tracked for today' });
    }

    await moodRepository.remove(mood);

    res.json({
      error: null,
      message: 'Mood deleted successfully'
    });
  } catch (error) {
    console.error('Delete mood error:', error);
    res.status(500).json({ error: 'Server error', message: 'Server error' });
  }
};
