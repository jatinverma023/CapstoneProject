# Smart Assignment & Feedback Management System - Backend

A comprehensive backend API for managing assignments, submissions, and feedback in an educational setting.

## Features

- **User Management**: Role-based authentication (Teacher, Student, Admin)
- **Course Management**: Create and manage courses
- **Assignment Management**: Teachers can create, update, and manage assignments
- **Submission System**: Students can submit assignments with text and file uploads
- **Grading System**: Teachers can grade submissions with rubrics and feedback
- **File Uploads**: Support for multiple file types (images, PDFs, documents)
- **AI Chatbot**: Integrated Gemini AI for student assistance and Q&A
- **Analytics Dashboard**: Comprehensive insights on student performance and assignment statistics
- **Security**: JWT authentication, password hashing, input validation

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **multer** - File uploads
- **express-validator** - Input validation

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. Clone the repository
2. Navigate to the backend directory
3. Install dependencies:

   ```bash
   npm install
   ```

4. Create a `.env` file based on `.env.example`:

   ```bash
   cp .env.example .env
   ```

5. Update the `.env` file with your configuration:
   - `MONGO_URI`: Your MongoDB connection string
   - `JWT_SECRET`: A secure secret key for JWT tokens
   - `PORT`: Server port (default: 5000)
   - `NODE_ENV`: Environment (development/production)
   - `CLIENT_URL`: Frontend URL for CORS

6. Start the development server:
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:5000` (or your configured port).

## API Endpoints

### Authentication

- `POST /api/v1/auth/register` - Register a new user
- `POST /api/v1/auth/login` - Login user
- `GET /api/v1/auth/me` - Get current user profile

### Users

- `GET /api/v1/users/me` - Get current user profile
- `GET /api/v1/users` - Get all users (Admin only)

### Assignments

- `POST /api/v1/assignments` - Create assignment (Teacher)
- `GET /api/v1/assignments` - Get all assignments
- `GET /api/v1/assignments/:id` - Get single assignment
- `PUT /api/v1/assignments/:id` - Update assignment (Teacher)
- `DELETE /api/v1/assignments/:id` - Delete assignment (Teacher)
- `GET /api/v1/assignments/:id/submissions` - Get submissions for assignment (Teacher)

### Submissions

- `POST /api/v1/submissions/submit/:assignmentId` - Submit assignment (Student)
- `GET /api/v1/submissions/my` - Get student's submissions (Student)
- `GET /api/v1/submissions/:id` - Get single submission
- `POST /api/v1/submissions/:id/grade` - Grade submission (Teacher)
- `GET /api/v1/submissions/assignment/:assignmentId/student` - Get student's submission for assignment (Student)

## Project Structure

```
backend/
├── config/
│   └── db.js                 # Database connection
├── controllers/
│   ├── analyticsController.js # Analytics logic
│   └── assignmentController.js # Assignment logic
├── middleware/
│   ├── auth.js              # Authentication middleware
│   └── errorHandler.js      # Error handling middleware
├── models/
│   ├── User.js              # User model
│   ├── Course.js            # Course model
│   ├── Assignment.js        # Assignment model
│   └── Submission.js        # Submission model
├── routes/
│   ├── analytics.js         # Analytics routes
│   ├── auth.js              # Authentication routes
│   ├── assignments.js       # Assignment routes
│   ├── chatbot.js           # AI chatbot routes
│   ├── submissions.js       # Submission routes
│   └── users.js             # User management routes
├── services/
│   └── chatbotService.js    # AI chatbot service
├── uploads/                 # File uploads directory
├── test-gemini.js           # Gemini API test script
├── .env.example             # Environment variables template
├── package.json             # Dependencies and scripts
├── server.js                # Main application file
└── README.md                # This file
```

## Environment Variables

| Variable         | Description               | Default               |
| ---------------- | ------------------------- | --------------------- |
| `MONGO_URI`      | MongoDB connection string | Required              |
| `JWT_SECRET`     | JWT secret key            | Required              |
| `PORT`           | Server port               | 5000                  |
| `NODE_ENV`       | Environment               | development           |
| `CLIENT_URL`     | Frontend URL for CORS     | http://localhost:5173 |
| `GEMINI_API_KEY` | Google Gemini API key     | Required for chatbot  |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the ISC License.
