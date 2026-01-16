import { Given, When, Then, Before, After } from '@cucumber/cucumber';
import { expect } from 'chai';
import request from 'supertest';
import app from '../../src/app';
import { AppDataSource } from '../../src/config/database';
import { User, UserRole } from '../../src/entities/user.entity';
import { Mood } from '../../src/entities/mood.entity';

let response: request.Response;
let authToken: string;
let currentUserId: string;
let patientIds: Map<string, string> = new Map();
let doctorIds: Map<string, string> = new Map();

const getTodayDate = (): string => {
    return new Date().toISOString().split('T')[0];
};

Before(async function () {
    // Initialize database connection if not already connected
    if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
    }
    // Reset maps
    patientIds = new Map();
    doctorIds = new Map();
});

After(async function () {
    // Cleanup if needed
});

Given('the API server is running', function () {
    // The app is imported and ready to use with supertest
    expect(app).to.exist;
});

Given('the following users exist in the system:', async function (dataTable) {
    const userRepository = AppDataSource.getRepository(User);
    const moodRepository = AppDataSource.getRepository(Mood);

    // Clear existing data - moods first due to foreign key constraint
    await moodRepository.createQueryBuilder().delete().from(Mood).execute();
    await userRepository.createQueryBuilder().delete().from(User).execute();

    // Create users from table
    const users = dataTable.hashes();
    for (const userData of users) {
        const user = userRepository.create({
            email: userData.email,
            password: userData.password,
            name: userData.name,
            role: userData.role as UserRole
        });
        const savedUser = await userRepository.save(user);
        
        // Store IDs for later reference
        if (userData.role === 'patient') {
            patientIds.set(userData.email, savedUser.id);
        } else if (userData.role === 'doctor') {
            doctorIds.set(userData.email, savedUser.id);
        }
    }
});

Given('I am logged in as {string} with password {string}', async function (email: string, password: string) {
    const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ email, password });

    authToken = loginResponse.body.token;
    currentUserId = loginResponse.body.user?.id;
});

Given('I have an invalid token', function () {
    authToken = 'invalid.token.here';
});

// Mood-specific Given steps
Given('I have no mood tracked for today', async function () {
    const moodRepository = AppDataSource.getRepository(Mood);
    const today = getTodayDate();
    
    await moodRepository.delete({ userId: currentUserId, date: today });
});

Given('I have a mood tracked for today with rate {int}', async function (rate: number) {
    const moodRepository = AppDataSource.getRepository(Mood);
    const today = getTodayDate();
    
    // Delete existing mood for today
    await moodRepository.delete({ userId: currentUserId, date: today });
    
    // Create new mood
    const mood = moodRepository.create({
        userId: currentUserId,
        rate,
        date: today
    });
    await moodRepository.save(mood);
});

// Doctor-patient relationship Given steps
Given('patient {string} is not assigned to any doctor', async function (patientEmail: string) {
    const userRepository = AppDataSource.getRepository(User);
    const patient = await userRepository.findOne({ where: { email: patientEmail } });
    
    if (patient) {
        await userRepository.update(patient.id, { doctorId: null as unknown as string });
    }
});

Given('patient {string} is assigned to doctor {string}', async function (patientEmail: string, doctorEmail: string) {
    const userRepository = AppDataSource.getRepository(User);
    
    const patient = await userRepository.findOne({ where: { email: patientEmail } });
    const doctor = await userRepository.findOne({ where: { email: doctorEmail } });
    
    if (patient && doctor) {
        await userRepository.update(patient.id, { doctorId: doctor.id });
    }
});

Given('patient {string} has mood entries', async function (patientEmail: string) {
    const userRepository = AppDataSource.getRepository(User);
    const moodRepository = AppDataSource.getRepository(Mood);
    
    const patient = await userRepository.findOne({ where: { email: patientEmail } });
    
    if (patient) {
        // Create some mood entries for the patient
        const today = new Date();
        for (let i = 0; i < 5; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            const existingMood = await moodRepository.findOne({ 
                where: { userId: patient.id, date: dateStr } 
            });
            
            if (!existingMood) {
                const mood = moodRepository.create({
                    userId: patient.id,
                    rate: Math.floor(Math.random() * 10) + 1,
                    date: dateStr
                });
                await moodRepository.save(mood);
            }
        }
    }
});

// When steps
When('I send a POST request to {string} with:', async function (endpoint: string, dataTable) {
    const data = dataTable.hashes()[0];
    response = await request(app)
        .post(endpoint)
        .send(data);
});

When('I send a POST request to {string} with authentication and body:', async function (endpoint: string, dataTable) {
    const data = dataTable.hashes()[0];
    // Convert rate to number if present
    if (data.rate) {
        data.rate = parseInt(data.rate);
    }
    response = await request(app)
        .post(endpoint)
        .set('Authorization', `Bearer ${authToken}`)
        .send(data);
});

When('I send a PUT request to {string} with authentication and body:', async function (endpoint: string, dataTable) {
    const data = dataTable.hashes()[0];
    // Convert rate to number if present
    if (data.rate) {
        data.rate = parseInt(data.rate);
    }
    response = await request(app)
        .put(endpoint)
        .set('Authorization', `Bearer ${authToken}`)
        .send(data);
});

When('I send a DELETE request to {string} with authentication', async function (endpoint: string) {
    response = await request(app)
        .delete(endpoint)
        .set('Authorization', `Bearer ${authToken}`);
});

When('I send a GET request to {string} with authentication', async function (endpoint: string) {
    response = await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${authToken}`);
});

When('I send a GET request to {string} without authentication', async function (endpoint: string) {
    response = await request(app)
        .get(endpoint);
});

When('I send a GET request to {string}', async function (endpoint: string) {
    response = await request(app)
        .get(endpoint);
});

// Doctor-patient specific When steps
When('I send a POST request to {string} with authentication', async function (endpoint: string) {
    response = await request(app)
        .post(endpoint)
        .set('Authorization', `Bearer ${authToken}`);
});

When('I send a POST request to {string} for patient {string} with authentication', async function (endpointTemplate: string, patientEmail: string) {
    const userRepository = AppDataSource.getRepository(User);
    const patient = await userRepository.findOne({ where: { email: patientEmail } });
    
    const endpoint = endpointTemplate.replace('{patientId}', patient?.id || 'unknown');
    response = await request(app)
        .post(endpoint)
        .set('Authorization', `Bearer ${authToken}`);
});

When('I send a DELETE request to {string} for patient {string} with authentication', async function (endpointTemplate: string, patientEmail: string) {
    const userRepository = AppDataSource.getRepository(User);
    const patient = await userRepository.findOne({ where: { email: patientEmail } });
    
    const endpoint = endpointTemplate.replace('{patientId}', patient?.id || 'unknown');
    response = await request(app)
        .delete(endpoint)
        .set('Authorization', `Bearer ${authToken}`);
});

When('I send a GET request to {string} for patient {string} with authentication', async function (endpointTemplate: string, patientEmail: string) {
    const userRepository = AppDataSource.getRepository(User);
    const patient = await userRepository.findOne({ where: { email: patientEmail } });
    
    const endpoint = endpointTemplate.replace('{patientId}', patient?.id || 'unknown');
    response = await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${authToken}`);
});

// Then steps
Then('the response status should be {int}', function (statusCode: number) {
    expect(response.status).to.equal(statusCode);
});

Then('the response should contain a {string}', function (field: string) {
    expect(response.body).to.have.property(field);
});

Then('the response user role should be {string}', function (role: string) {
    expect(response.body.user.role).to.equal(role);
});

Then('the response message should be {string}', function (message: string) {
    expect(response.body.message).to.equal(message);
});

Then('the response should contain user information', function () {
    expect(response.body).to.have.property('user');
    expect(response.body.user).to.have.property('email');
    expect(response.body.user).to.have.property('name');
    expect(response.body.user).to.have.property('role');
});

Then('the response should contain {string} with value {string}', function (field: string, value: string) {
    expect(response.body[field]).to.equal(value);
});

// Mood-specific Then steps
Then('the response should contain mood rate configuration', function () {
    expect(response.body).to.have.property('config');
    expect(response.body.config).to.have.property('rate');
    expect(response.body.config.rate).to.have.property('min');
    expect(response.body.config.rate).to.have.property('max');
});

Then('the response should contain a list of moods', function () {
    expect(response.body).to.have.property('moods');
    expect(response.body.moods).to.be.an('array');
});

Then('the response should indicate today is tracked', function () {
    expect(response.body).to.have.property('todayTracked');
    expect(response.body.todayTracked).to.be.true;
});

// Doctor-specific Then steps
Then('the response should contain {string} list', function (listName: string) {
    expect(response.body).to.have.property(listName);
    expect(response.body[listName]).to.be.an('array');
});

Then('the response should contain patient information', function () {
    expect(response.body).to.have.property('patient');
    expect(response.body.patient).to.have.property('email');
    expect(response.body.patient).to.have.property('name');
});
