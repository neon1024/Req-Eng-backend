import 'reflect-metadata';
import 'dotenv/config';
import { AppDataSource } from '../config/database';
import { User, UserRole } from '../entities/user.entity';
import { Mood } from '../entities/mood.entity';

const seedMoods = async () => {
  try {
    await AppDataSource.initialize();
    console.log('Connected to database');

    const userRepository = AppDataSource.getRepository(User);
    const moodRepository = AppDataSource.getRepository(Mood);

    // Find patient user
    const patient = await userRepository.findOne({ where: { role: UserRole.PATIENT } });
    
    if (!patient) {
      console.error('No patient found. Run npm run seed first.');
      process.exit(1);
    }

    // Clear existing moods
    await moodRepository.clear();

    // Create sample moods for past 7 days
    const moods: Partial<Mood>[] = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Random rate between 1-10
      const rate = Math.floor(Math.random() * 10) + 1;

      moods.push({
        userId: patient.id,
        rate,
        date: dateStr
      });
    }

    await moodRepository.save(moods.map(m => moodRepository.create(m)));
    console.log(`Seeded ${moods.length} moods for patient: ${patient.email}`);

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedMoods();
