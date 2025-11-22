import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useAuth } from "./context/AuthContext";

// Components
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Loading from "./components/Loading";

// Pages - Public
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import StudentDashboard from "./pages/StudentDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import CreateAssignment from "./pages/CreateAssignment";
import ViewSubmissions from "./pages/ViewSubmissions";
import GradeSubmission from "./pages/GradeSubmission";
import AssignmentDetails from "./pages/AssignmentDetails";
import SubmitAssignment from "./pages/SubmitAssignment";
import Analytics from "./pages/Analytics";

function App() {
  const { user, loading } = useAuth();

  if (loading) return <Loading />;

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <Routes>
          {/* Public Routes */}
          <Route
            path="/"
            element={
              !user ? (
                <Home />
              ) : (
                <Navigate
                  to={
                    user.role === "teacher"
                      ? "/teacher/dashboard"
                      : "/student/dashboard"
                  }
                />
              )
            }
          />
          {/* Teacher Routes */}
          <Route
            path="/teacher/dashboard"
            element={
              <ProtectedRoute role="teacher">
                <TeacherDashboard />
              </ProtectedRoute>
            }
          />
          {/* Add this Analytics route */}
          <Route
            path="/teacher/analytics"
            element={
              <ProtectedRoute role="teacher">
                <Analytics />
              </ProtectedRoute>
            }
          />

          {/* Add this new route */}
          <Route
            path="/teacher/assignments/create"
            element={
              <ProtectedRoute role="teacher">
                <CreateAssignment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/assignments/:id/submissions"
            element={
              <ProtectedRoute role="teacher">
                <ViewSubmissions />
              </ProtectedRoute>
            }
          />
          {/* Add this new route */}
          <Route
            path="/student/assignments/:id/submit"
            element={
              <ProtectedRoute role="student">
                <SubmitAssignment />
              </ProtectedRoute>
            }
          />

          {/* Add this new route */}
          <Route
            path="/teacher/submissions/:id/grade"
            element={
              <ProtectedRoute role="teacher">
                <GradeSubmission />
              </ProtectedRoute>
            }
          />
          {/* Add this new route */}
          <Route
            path="/student/assignments/:id"
            element={
              <ProtectedRoute role="student">
                <AssignmentDetails />
              </ProtectedRoute>
            }
          />

          <Route
            path="/login"
            element={
              !user ? (
                <Login />
              ) : (
                <Navigate
                  to={
                    user.role === "teacher"
                      ? "/teacher/dashboard"
                      : "/student/dashboard"
                  }
                />
              )
            }
          />

          <Route
            path="/register"
            element={
              !user ? (
                <Register />
              ) : (
                <Navigate
                  to={
                    user.role === "teacher"
                      ? "/teacher/dashboard"
                      : "/student/dashboard"
                  }
                />
              )
            }
          />

          {/* Teacher Routes */}
          <Route
            path="/teacher/dashboard"
            element={
              <ProtectedRoute role="teacher">
                <TeacherDashboard />
              </ProtectedRoute>
            }
          />

          {/* Student Routes */}
          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute role="student">
                <StudentDashboard />
              </ProtectedRoute>
            }
          />

          {/* 404 - Redirect to home */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
