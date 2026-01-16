import { Given, When, Then, Before, After } from '@cucumber/cucumber';
import { expect } from 'chai';
import request from 'supertest';
import app from '../../src/app';
import { AppDataSource } from '../../src/config/database';
import { User, UserRole } from '../../src/entities/user.entity';

let response: request.Response;
let authToken: string;

Before(async function () {
    // Initialize database connection if not already connected
    if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
    }
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

    // Clear existing users
    await userRepository.clear();

    // Create users from table
    const users = dataTable.hashes();
    for (const userData of users) {
        const user = userRepository.create({
            email: userData.email,
            password: userData.password,
            name: userData.name,
            role: userData.role as UserRole
        });
        await userRepository.save(user);
    }
});

Given('I am logged in as {string} with password {string}', async function (email: string, password: string) {
    const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ email, password });

    authToken = loginResponse.body.token;
});

Given('I have an invalid token', function () {
    authToken = 'invalid.token.here';
});

When('I send a POST request to {string} with:', async function (endpoint: string, dataTable) {
    const data = dataTable.hashes()[0];
    response = await request(app)
        .post(endpoint)
        .send(data);
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
