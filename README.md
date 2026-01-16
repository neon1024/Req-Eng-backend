# Req-Eng Backend

Express.js REST API with TypeScript, PostgreSQL, and JWT authentication.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **Authentication**: JWT (JSON Web Tokens)

## Project Structure

```
src/
├── server.ts              # Entry point
├── app.ts                 # Express app configuration
├── config/
│   └── database.ts        # TypeORM PostgreSQL connection
├── entities/
│   ├── user.entity.ts     # User entity (id, email, password, name, role)
│   └── mood.entity.ts     # Mood entity (id, userId, level, note, date)
├── middleware/
│   └── auth.middleware.ts # JWT authentication & role authorization
├── controllers/
│   ├── auth.controller.ts # Login logic
│   └── mood.controller.ts # Mood tracking logic
├── routes/
│   ├── auth.routes.ts     # Auth endpoints
│   └── mood.routes.ts     # Mood endpoints
└── scripts/
    └── seedUsers.ts       # Database seeder
```

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Create a `.env` file in the root:

```
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_postgres_password
DB_NAME=req_eng_db
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
```

### 3. Create database

```sql
CREATE DATABASE req_eng_db;
```

### 4. Seed database

```bash
npm run seed
```

This creates two test users:
- **Doctor**: `doctor@example.com` / `doctor123`
- **Patient**: `patient@example.com` / `patient123`

### 5. Run the server

```bash
# Development (with hot reload)
npm run dev

# Production
npm run build
npm start
```

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/login` | Login with email & password | No |
| GET | `/api/auth/profile` | Get current user profile | Yes |

### Moods

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/api/moods/config` | Get mood configuration (emojis, rate range) | No | - |
| GET | `/api/moods` | Get all moods for current user | Yes | Patient |
| POST | `/api/moods` | Add mood for today | Yes | Patient |
| PUT | `/api/moods` | Update today's mood | Yes | Patient |
| DELETE | `/api/moods` | Delete today's mood | Yes | Patient |

> **Note:** Only today's mood can be updated or deleted. Historical moods are read-only. Only patients can access mood CRUD endpoints.

### Health

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/health` | Health check | No |

## Usage Examples

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "doctor@example.com", "password": "doctor123"}'
```

Response:
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "doctor@example.com",
    "name": "Dr. John Smith",
    "role": "doctor"
  }
}
```

### Access Protected Routes

Include the JWT token in the Authorization header:

```bash
curl http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer <your_token>"
```

### Get Mood Config

```bash
curl http://localhost:3000/api/moods/config
```

Response:
```json
{
  "error": null,
  "config": {
    "rate": { "min": 1, "max": 10 }
  }
}
```

### Get All Moods

```bash
curl http://localhost:3000/api/moods \
  -H "Authorization: Bearer <patient_token>"
```

Response:
```json
{
  "error": null,
  "moods": [
    {
      "id": "uuid",
      "userId": "uuid",
      "rate": 7,
      "date": "2026-01-16",
      "createdAt": "2026-01-16T10:00:00.000Z"
    }
  ],
  "todayTracked": true,
  "todayMood": { ... }
}
```

### Add Mood

```bash
curl -X POST http://localhost:3000/api/moods \
  -H "Authorization: Bearer <patient_token>" \
  -H "Content-Type: application/json" \
  -d '{"rate": 7}'
```

Response:
```json
{
  "error": null,
  "message": "Mood added successfully",
  "mood": {
    "id": "uuid",
    "userId": "uuid",
    "rate": 7,
    "date": "2026-01-16",
    "createdAt": "2026-01-16T10:00:00.000Z"
  }
}
```

### Update Today's Mood

```bash
curl -X PUT http://localhost:3000/api/moods \
  -H "Authorization: Bearer <patient_token>" \
  -H "Content-Type: application/json" \
  -d '{"rate": 9}'
```

### Delete Today's Mood

```bash
curl -X DELETE http://localhost:3000/api/moods \
  -H "Authorization: Bearer <patient_token>"
```

## Mood Fields

| Field | Type | Description |
|-------|------|-------------|
| `rate` | Integer (1-10) | Mood rating from 1 (worst) to 10 (best) |

## User Roles

- `doctor`
- `patient`

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm start` | Run compiled production server |
| `npm run seed` | Seed database with test users |
