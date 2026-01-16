import 'reflect-metadata';
import 'dotenv/config';
import { AppDataSource } from '../config/database';
import { User, UserRole } from '../entities/user.entity';
import { Mood } from '../entities/mood.entity';

const seed = async () => {
  try {
    await AppDataSource.initialize();
    console.log('Connected to database\n');

    const userRepository = AppDataSource.getRepository(User);
    const moodRepository = AppDataSource.getRepository(Mood);

    // Clear all tables (moods first due to FK constraint)
    console.log('Clearing all tables...');
    await moodRepository.createQueryBuilder().delete().execute();
    await userRepository.createQueryBuilder().delete().execute();
    console.log('✓ Tables cleared\n');

    // === SEED USERS ===
    console.log('Seeding users...');
    
    const doctor1 = userRepository.create({
      email: 'doctor@example.com',
      password: 'doctor123',
      name: 'Dr. John Smith',
      role: UserRole.DOCTOR
    });

    const doctor2 = userRepository.create({
      email: 'doctor2@example.com',
      password: 'doctor123',
      name: 'Dr. Sarah Johnson',
      role: UserRole.DOCTOR
    });

    const patients = [
      { email: 'patient@example.com', name: 'Jane Doe' },
      { email: 'patient2@example.com', name: 'Michael Brown' },
      { email: 'patient3@example.com', name: 'Emily Davis' },
      { email: 'patient4@example.com', name: 'David Wilson' },
      { email: 'patient5@example.com', name: 'Lisa Anderson' },
    ].map(p => userRepository.create({
      email: p.email,
      password: 'patient123',
      name: p.name,
      role: UserRole.PATIENT
    }));

    await userRepository.save([doctor1, doctor2, ...patients]);
    console.log('✓ Users seeded\n');

    // === SEED MOODS ===
    console.log('Seeding moods...');
    
    const savedPatients = await userRepository.find({ where: { role: UserRole.PATIENT } });
    const today = new Date();
    const allMoods: Partial<Mood>[] = [];

    for (const patient of savedPatients) {
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const rate = Math.floor(Math.random() * 10) + 1;

        allMoods.push({
          userId: patient.id,
          rate,
          date: dateStr
        });
      }
    }

    await moodRepository.save(allMoods.map(m => moodRepository.create(m)));
    console.log(`✓ ${allMoods.length} moods seeded for ${savedPatients.length} patients\n`);

    // === SUMMARY ===
    console.log('════════════════════════════════════════');
    console.log('         SEEDING COMPLETE');
    console.log('════════════════════════════════════════\n');
    console.log('Doctors:');
    console.log('  - doctor@example.com / doctor123');
    console.log('  - doctor2@example.com / doctor123');
    console.log('\nPatients (password: patient123):');
    patients.forEach(p => console.log(`  - ${p.email}`));
    console.log('\nMoods: 7 days of mood data per patient');

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seed();
