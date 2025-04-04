# Multi-Level Category API

A RESTful API service built with Node.js, Express, and MongoDB that handles hierarchical category management with authentication.

## Features

- User authentication (register/login) with JWT
- Category CRUD operations
- Hierarchical category structure with parent-child relationships
- Category status management (active/inactive)
- Automated tests using Jest

## Prerequisites

- Node.js (v14+)
- MongoDB
- npm or yarn

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```
3. Create a `.env` file in the root directory:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/category-apis
JWT_SECRET=your_jwt_secret_key
```

## Running the Application

Development mode with hot reload:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

Run tests:
```bash
npm test
```

## API Endpoints

### Authentication

- **POST** `/api/auth/register`
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```

- **POST** `/api/auth/login`
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```

### Categories

All category endpoints require authentication token in header:
`Authorization: Bearer <token>`

- **POST** `/api/category` - Create category
  ```json
  {
    "name": "Electronics",
    "parent": "parentId" // optional
  }
  ```

- **GET** `/api/category` - Get category tree

- **PUT** `/api/category/:id` - Update category
  ```json
  {
    "name": "New Name",
    "status": "active" // or "inactive"
  }
  ```

- **DELETE** `/api/category/:id` - Delete category

## Testing

The project uses Jest and Supertest for API testing. Tests are located in the `src/tests` directory.

- `auth.test.ts` - Authentication endpoints tests
- `category.test.ts` - Category operations tests

## Project Structure

```
src/
├── app.ts              # Express app setup
├── server.ts           # Server entry point
├── config/
│   └── db.ts          # Database configuration
├── controllers/
│   ├── authController.ts
│   └── categoryController.ts
├── middleware/
│   └── auth.ts        # JWT authentication middleware
├── models/
│   ├── Category.ts
│   └── User.ts
└── routes/
    ├── authRoutes.ts
    └── categoryRoutes.ts
```

## Technologies

- TypeScript
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- Jest for testing
- MongoDB Memory Server for testing