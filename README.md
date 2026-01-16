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
│   └── user.entity.ts     # User entity (id, email, password, name, role)
├── middleware/
│   └── auth.middleware.ts # JWT authentication & role authorization
├── controllers/
│   └── auth.controller.ts # Login logic
├── routes/
│   └── auth.routes.ts     # Auth endpoints
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
