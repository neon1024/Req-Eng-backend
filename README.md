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
│   ├── user.entity.ts     # User entity (id, email, password, name, role, doctorId)
│   └── mood.entity.ts     # Mood entity (id, userId, rate, date)
├── middleware/
│   └── auth.middleware.ts # JWT authentication & role authorization
├── controllers/
│   ├── auth.controller.ts # Login logic
│   ├── mood.controller.ts # Mood tracking logic
│   └── doctor.controller.ts # Doctor-patient management
├── routes/
│   ├── auth.routes.ts     # Auth endpoints
│   ├── mood.routes.ts     # Mood endpoints
│   └── doctor.routes.ts   # Doctor endpoints
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

This creates test users:

**Doctors:**
- `doctor@example.com` / `doctor123`
- `doctor2@example.com` / `doctor123`

**Patients (all use password `patient123`):**
- `patient@example.com` - Jane Doe
- `patient2@example.com` - Michael Brown
- `patient3@example.com` - Emily Davis
- `patient4@example.com` - David Wilson
- `patient5@example.com` - Lisa Anderson

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

### Doctor (Patient Management)

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/api/doctor/patients` | Get my patients + unassigned patients | Yes | Doctor |
| POST | `/api/doctor/patients/:patientId/assign` | Assign patient to me | Yes | Doctor |
| DELETE | `/api/doctor/patients/:patientId/assign` | Unassign patient from me | Yes | Doctor |
| GET | `/api/doctor/patients/:patientId/moods` | Get patient's mood history | Yes | Doctor |

> **Note:** Doctors can only view mood history for patients assigned to them.

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

### Get Patients (Doctor)

```bash
curl http://localhost:3000/api/doctor/patients \
  -H "Authorization: Bearer <doctor_token>"
```

Response:
```json
{
  "error": null,
  "myPatients": [
    {
      "id": "uuid",
      "email": "patient@example.com",
      "name": "Jane Doe",
      "role": "patient",
      "moodScore": 3.5,
      "moodCount": 7
    },
    {
      "id": "uuid",
      "name": "David Wilson",
      "moodScore": 6.2,
      "moodCount": 5
    }
  ],
  "unassignedPatients": [
    {
      "id": "uuid",
      "name": "New Patient",
      "moodScore": null,
      "moodCount": 0
    }
  ]
}
```

> **Note:** Patients are sorted by `moodScore` ascending (lowest/worst first). Patients with no moods (`null`) appear at the end.

### Assign Patient (Doctor)

```bash
curl -X POST http://localhost:3000/api/doctor/patients/<patientId>/assign \
  -H "Authorization: Bearer <doctor_token>"
```

Response:
```json
{
  "error": null,
  "message": "Patient assigned successfully",
  "patient": { ... }
}
```

### Unassign Patient (Doctor)

```bash
curl -X DELETE http://localhost:3000/api/doctor/patients/<patientId>/assign \
  -H "Authorization: Bearer <doctor_token>"
```

### Get Patient Mood History (Doctor)

```bash
curl http://localhost:3000/api/doctor/patients/<patientId>/moods \
  -H "Authorization: Bearer <doctor_token>"
```

Response:
```json
{
  "error": null,
  "patient": {
    "id": "uuid",
    "name": "Jane Doe",
    "email": "patient@example.com"
  },
  "moods": [
    { "id": "uuid", "rate": 7, "date": "2026-01-16" },
    { "id": "uuid", "rate": 5, "date": "2026-01-15" }
  ]
}
```

## Mood Fields

| Field | Type | Description |
|-------|------|-------------|
| `rate` | Integer (1-10) | Mood rating from 1 (worst) to 10 (best) |

## Patient Fields (in Doctor API)

| Field | Type | Description |
|-------|------|-------------|
| `moodScore` | Float or null | Average mood rating (1.0-10.0), null if no moods |
| `moodCount` | Integer | Total number of mood entries |

## User Roles

- `doctor` - Can manage patients, view their mood history
- `patient` - Can track daily moods, assigned to a doctor

## Doctor-Patient Relationship

- Patients can be **unassigned** (no doctor) or **assigned** to one doctor
- Doctors can see all unassigned patients and assign them to themselves
- Doctors can only view mood history for their assigned patients
- Doctors can unassign patients from themselves

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm start` | Run compiled production server |
| `npm run seed` | Seed database with test users |
