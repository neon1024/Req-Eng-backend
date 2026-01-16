import 'reflect-metadata';
import 'dotenv/config';
import { AppDataSource } from '../config/database';
import { User, UserRole } from '../entities/user.entity';

const seedUsers = async () => {
  try {
    await AppDataSource.initialize();
    console.log('Connected to database');

    const userRepository = AppDataSource.getRepository(User);

    // Clear existing users
    await userRepository.clear();

    // Create seed users
    const doctor = userRepository.create({
      email: 'doctor@example.com',
      password: 'doctor123',
      name: 'Dr. John Smith',
      role: UserRole.DOCTOR
    });

    const patient = userRepository.create({
      email: 'patient@example.com',
      password: 'patient123',
      name: 'Jane Doe',
      role: UserRole.PATIENT
    });

    await userRepository.save([doctor, patient]);
    console.log('Users seeded successfully');

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedUsers();
