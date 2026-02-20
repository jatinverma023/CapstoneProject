# Smart Assignment & Feedback Management System

A comprehensive MERN stack application for managing assignments, submissions, grading, and feedback in educational institutions. Features AI-powered chatbot assistance and detailed analytics.

## 🚀 Features

### Core Functionality

- **Role-based Authentication**: Separate dashboards for Teachers, Students, and Admins
- **Course Management**: Create and organize courses
- **Assignment Management**: Teachers can create, edit, and manage assignments with due dates
- **Submission System**: Students can submit assignments with text and file uploads
- **Grading System**: Teachers can grade submissions with detailed feedback and rubrics
- **File Upload Support**: Handle multiple file types (PDFs, images, documents)

### Advanced Features

- **AI Chatbot**: Integrated Gemini AI for student assistance and Q&A
- **Analytics Dashboard**: Comprehensive insights on student performance and assignment statistics
- **Real-time Notifications**: Updates on assignment deadlines and grades
- **Responsive Design**: Mobile-friendly interface built with Tailwind CSS

## 🛠 Tech Stack

### Backend

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **multer** - File upload handling
- **Google Generative AI** - AI chatbot integration

### Frontend

- **React** - UI library
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Chart.js** - Data visualization
- **Axios** - HTTP client

## 📁 Project Structure

```
capstone-project/
├── .DS_Store               # macOS system file
├── .gitignore              # Git ignore rules
├── README.md               # Main project documentation (this file)
├── report.pdf              # Project report document
├── screenshot.png          # Project screenshot
├── submission-1.pdf        # Submission document
├── TODO.md                 # Project tasks and progress
├── backend/                # Express.js API server
│   ├── .DS_Store           # macOS system file
│   ├── list-models.js      # Script to list available AI models
│   ├── package-lock.json   # NPM lock file for dependencies
│   ├── package.json        # Backend dependencies and scripts
│   ├── README.md           # Backend-specific documentation
│   ├── server.js           # Main Express server file
│   ├── test-gemini.js      # Test script for Gemini AI integration
│   ├── config/
│   │   └── db.js           # MongoDB database connection configuration
│   ├── controllers/
│   │   ├── analyticsController.js  # Handles analytics API logic
│   │   └── assignmentController.js # Handles assignment API logic
│   ├── middleware/
│   │   ├── auth.js         # JWT authentication middleware
│   │   └── errorHandler.js # Global error handling middleware
│   ├── models/
│   │   ├── Assignment.js   # MongoDB schema for assignments
│   │   ├── Course.js       # MongoDB schema for courses
│   │   ├── Submission.js   # MongoDB schema for submissions
│   │   └── User.js         # MongoDB schema for users
│   ├── routes/
│   │   ├── analytics.js    # Analytics API endpoints
│   │   ├── assignments.js  # Assignment management endpoints
│   │   ├── auth.js         # Authentication endpoints
│   │   ├── chatbot.js      # AI chatbot endpoints
│   │   ├── submissions.js  # Submission management endpoints
│   │   └── users.js        # User management endpoints
│   ├── services/
│   │   └── chatbotService.js # Gemini AI chatbot service logic
│   └── uploads/
│       └── submissions/    # Directory for uploaded submission files
│           ├── submission-1762669899476-863767630.pdf
│           ├── submission-1762669899477-890531391.png
│           ├── submission-1762698168455-355922257.JPG
│           ├── submission-1762698404969-740012167.pdf
│           └── submission-1762706709456-45519582.JPG
├── frontend/               # React application
│   ├── .gitignore          # Frontend-specific git ignore rules
│   ├── eslint.config.js    # ESLint configuration
│   ├── index.html          # Main HTML template
│   ├── package-lock.json   # NPM lock file for frontend dependencies
│   ├── package.json        # Frontend dependencies and scripts
│   ├── postcss.config.js   # PostCSS configuration for Tailwind
│   ├── README.md           # Default Vite template README
│   ├── tailwind.config.js  # Tailwind CSS configuration
│   ├── vite.config.js      # Vite build configuration
│   ├── public/
│   │   └── vite.svg        # Vite logo asset
│   └── src/
│       ├── .DS_Store       # macOS system file
│       ├── App.css         # Global app styles
│       ├── App.jsx         # Main React application component
│       ├── index.css       # Global CSS styles with Tailwind imports
│       ├── main.jsx        # React application entry point
│       ├── assets/
│       │   └── react.svg   # React logo asset
│       ├── components/
│       │   ├── AIChatbot.jsx     # AI chatbot component
│       │   ├── Alert.jsx         # Alert/notification component
│       │   ├── Loading.jsx       # Loading spinner component
│       │   ├── Navbar.jsx        # Navigation bar component
│       │   └── ProtectedRoute.jsx # Route protection wrapper
│       ├── context/
│       │   └── AuthContext.jsx   # React context for authentication state
│       ├── pages/
│       │   ├── Analytics.jsx           # Teacher analytics dashboard
│       │   ├── AssignmentDetails.jsx   # Assignment details page
│       │   ├── CreateAssignment.jsx    # Create new assignment page
│       │   ├── GradeSubmission.jsx     # Grade submission page
│       │   ├── Home.jsx                # Landing/home page
│       │   ├── Login.jsx               # User login page
│       │   ├── Register.jsx            # User registration page
│       │   ├── StudentDashboard.jsx    # Student dashboard
│       │   ├── SubmitAssignment.jsx    # Submit assignment page
│       │   ├── TeacherAnalytics.jsx    # Teacher analytics page
│       │   ├── TeacherDashboard.jsx    # Teacher dashboard
│       │   └── ViewSubmissions.jsx     # View submissions page
│       ├── services/
│       │   ├── analyticsService.js     # API calls for analytics
│       │   ├── api.js                  # Base API configuration
│       │   ├── assignmentService.js    # API calls for assignments
│       │   ├── authService.js          # API calls for authentication
│       │   ├── chatbotService.js       # API calls for chatbot
│       │   └── submissionService.js    # API calls for submissions
│       └── utils/
│           └── helpers.js              # Utility helper functions
└── README.md              # This file (duplicated for clarity)
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn package manager

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd capstone-project
   ```

2. **Backend Setup**

   ```bash
   cd backend
   npm install
   cp .env.example .env  # Create environment file
   ```

3. **Frontend Setup**

   ```bash
   cd ../frontend
   npm install
   ```

4. **Environment Configuration**

   Create `.env` file in backend directory:

   ```env
   MONGO_URI=mongodb://localhost:27017/smart-assignment
   JWT_SECRET=your-super-secret-jwt-key
   PORT=5000
   NODE_ENV=development
   CLIENT_URL=http://localhost:5173
   GEMINI_API_KEY=your-gemini-api-key
   ```

5. **Start MongoDB**

   ```bash
   # If using local MongoDB
   mongod
   ```

6. **Run the Application**

   **Backend:**

   ```bash
   cd backend
   npm run dev
   ```

   **Frontend:**

   ```bash
   cd frontend
   npm run dev
   ```

   The application will be available at:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

## 📚 API Documentation

### Authentication Endpoints

- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/auth/me` - Get current user

### Assignment Endpoints

- `GET /api/v1/assignments` - Get all assignments
- `POST /api/v1/assignments` - Create assignment (Teacher)
- `GET /api/v1/assignments/:id` - Get assignment details
- `PUT /api/v1/assignments/:id` - Update assignment (Teacher)

### Submission Endpoints

- `POST /api/v1/submissions/submit/:assignmentId` - Submit assignment
- `GET /api/v1/submissions/my` - Get my submissions (Student)
- `POST /api/v1/submissions/:id/grade` - Grade submission (Teacher)

### Analytics Endpoints

- `GET /api/v1/analytics/overview` - Get system overview
- `GET /api/v1/analytics/assignments` - Assignment analytics
- `GET /api/v1/analytics/students` - Student performance data

### AI Chatbot Endpoints

- `POST /api/v1/chatbot/ask` - Ask AI assistant

## 🎯 Usage

### For Teachers

1. Register/Login as a teacher
2. Create courses and assignments
3. View student submissions
4. Grade assignments with feedback
5. Access analytics dashboard

### For Students

1. Register/Login as a student
2. View available assignments
3. Submit assignments with files
4. Check grades and feedback
5. Use AI chatbot for assistance

## 🤖 AI Chatbot Features

The integrated AI chatbot powered by Google's Gemini provides:

- Assignment-related Q&A
- Study tips and guidance
- Clarification on course materials
- General academic assistance

## 📊 Analytics Dashboard

Teachers can access detailed analytics including:

- Assignment completion rates
- Student performance metrics
- Grade distributions
- Submission timelines
- Course engagement statistics

## 🔧 Development

### Running Tests

```bash
cd backend
npm test
```

### Building for Production

```bash
cd frontend
npm run build
```

### Code Quality

- ESLint for JavaScript/React linting
- Prettier for code formatting
- Follows MERN stack best practices

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License - see the LICENSE file for details.

## 👥 Authors

- **Your Name** - _Initial work_ - [Your GitHub](https://github.com/yourusername)

## 🙏 Acknowledgments

- Google Generative AI for chatbot functionality
- MongoDB for database solutions
- React community for excellent documentation
- Educational institutions for inspiration
