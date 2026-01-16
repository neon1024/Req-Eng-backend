import { BeforeAll, AfterAll } from '@cucumber/cucumber';
import 'reflect-metadata';
import 'dotenv/config';
import { AppDataSource } from '../../src/config/database';

BeforeAll(async function () {
    // Initialize database connection
    if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
        console.log('Database connected for tests');
    }
});

AfterAll(async function () {
    // Close database connection
    if (AppDataSource.isInitialized) {
        await AppDataSource.destroy();
        console.log('Database connection closed');
    }
});
