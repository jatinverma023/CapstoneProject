import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { assignmentService } from "../services/assignmentService";
import { submissionService } from "../services/submissionService";
import Loading from "../components/Loading";
import Alert from "../components/Alert";
import AIChatbot from "../components/AIChatbot"; // ⬅️ ADD THIS IMPORT
import {
  formatDate,
  isOverdue,
  calculateGradePercentage,
} from "../utils/helpers";

const StudentDashboard = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  // Time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [assignmentsRes, submissionsRes] = await Promise.all([
        assignmentService.getAll(),
        submissionService.getMySubmissions(),
      ]);
      setAssignments(assignmentsRes.assignments || []);
      setSubmissions(submissionsRes.submissions || []);
    } catch (err) {
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const getSubmissionStatus = (assignmentId) => {
    const submission = submissions.find(
      (s) => s.assignment_id?._id === assignmentId
    );
    return {
      hasSubmitted: !!submission,
      graded: submission?.graded || false,
      grade: submission?.grade,
      maxMarks: submission?.assignment_id?.maxMarks,
      is_late: submission?.is_late,
    };
  };

  const filteredAssignments = assignments.filter(
    (assignment) =>
      assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: assignments.length,
    submitted: submissions.length,
    graded: submissions.filter((s) => s.graded).length,
    pending: assignments.length - submissions.length,
  };

  const averageGrade =
    submissions.filter((s) => s.graded).length > 0
      ? (
          submissions
            .filter((s) => s.graded)
            .reduce((sum, s) => sum + (s.grade || 0), 0) /
          submissions.filter((s) => s.graded).length
        ).toFixed(1)
      : "N/A";

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-5xl animate-bounce">🎓</span>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                {getGreeting()}, {user?.name}!
              </h1>
              <p className="text-gray-600 mt-1">
                Your learning adventure continues. Let's conquer today's goals!
                🚀
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div
            className="card"
            style={{
              background: "linear-gradient(to bottom right, #3b82f6, #2563eb)",
            }}
          >
            <div className="flex items-center justify-between text-white">
              <div>
                <p className="text-blue-100 text-sm font-medium mb-1">
                  Total Assignments
                </p>
                <p className="text-4xl font-bold">{stats.total}</p>
              </div>
              <span className="text-5xl opacity-50">📚</span>
            </div>
          </div>

          <div
            className="card"
            style={{
              background: "linear-gradient(to bottom right, #10b981, #059669)",
            }}
          >
            <div className="flex items-center justify-between text-white">
              <div>
                <p className="text-green-100 text-sm font-medium mb-1">
                  Submitted
                </p>
                <p className="text-4xl font-bold">{stats.submitted}</p>
              </div>
              <span className="text-5xl opacity-50">✅</span>
            </div>
          </div>

          <div
            className="card"
            style={{
              background: "linear-gradient(to bottom right, #a855f7, #9333ea)",
            }}
          >
            <div className="flex items-center justify-between text-white">
              <div>
                <p className="text-purple-100 text-sm font-medium mb-1">
                  Graded
                </p>
                <p className="text-4xl font-bold">{stats.graded}</p>
              </div>
              <span className="text-5xl opacity-50">📊</span>
            </div>
          </div>

          <div
            className="card"
            style={{
              background: "linear-gradient(to bottom right, #f59e0b, #d97706)",
            }}
          >
            <div className="flex items-center justify-between text-white">
              <div>
                <p className="text-orange-100 text-sm font-medium mb-1">
                  Average Grade
                </p>
                <p className="text-4xl font-bold">{averageGrade}</p>
              </div>
              <span className="text-5xl opacity-50">🏆</span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              🔍
            </span>
            <input
              type="text"
              placeholder="Search assignments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10 w-full"
            />
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6">
            <Alert type="error" message={error} onClose={() => setError("")} />
          </div>
        )}

        {/* Assignments Grid */}
        {filteredAssignments.length === 0 ? (
          <div className="text-center py-12 card">
            <span className="text-6xl mb-4 block">📚</span>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? "No assignments found" : "No assignments available"}
            </h3>
            <p className="text-gray-600">
              {searchTerm
                ? "Try a different search term"
                : "Check back later for new assignments"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAssignments.map((assignment) => {
              const status = getSubmissionStatus(assignment._id);
              const overdue = isOverdue(assignment.due_date);

              return (
                <div
                  key={assignment._id}
                  className="card hover:border-blue-300 border border-transparent transition-all duration-300"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
                        {assignment.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Due: {formatDate(assignment.due_date)}
                      </p>
                    </div>
                    {status.hasSubmitted ? (
                      <span
                        className={`badge ${status.graded ? "badge-success" : "badge-warning"}`}
                      >
                        {status.graded ? "Graded" : "Submitted"}
                      </span>
                    ) : overdue ? (
                      <span className="badge-danger">Overdue</span>
                    ) : (
                      <span className="badge-info">Pending</span>
                    )}
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {assignment.description || "No description"}
                  </p>

                  {status.graded && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-green-800">
                          Your Grade:
                        </span>
                        <span className="text-lg font-bold text-green-600">
                          {status.grade} / {status.maxMarks} (
                          {calculateGradePercentage(
                            status.grade,
                            status.maxMarks
                          )}
                          %)
                        </span>
                      </div>
                    </div>
                  )}

                  {status.hasSubmitted && status.is_late && !status.graded && (
                    <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-xs text-yellow-800">
                        ⚠️ Submitted late
                      </p>
                    </div>
                  )}

                  <Link
                    to={`/student/assignments/${assignment._id}`}
                    className="btn-primary w-full text-center block"
                  >
                    {status.hasSubmitted ? "View Details" : "View & Submit"}
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ⬇️ ADD AI CHATBOT HERE - Outside the container but inside the parent div */}
      <AIChatbot />
    </div>
  );
};

export default StudentDashboard;
