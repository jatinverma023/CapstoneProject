import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { assignmentService } from "../services/assignmentService";
import { submissionService } from "../services/submissionService";
import Loading from "../components/Loading";
import Alert from "../components/Alert";
import { formatDate } from "../utils/helpers";

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [allSubmissions, setAllSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadAssignments();
  }, []);

  // Time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const loadAssignments = async () => {
    try {
      setLoading(true);
      const response = await assignmentService.getAll();
      const assignmentsList = response.assignments || [];
      setAssignments(assignmentsList);

      // Fetch all submissions for all assignments
      const submissionsPromises = assignmentsList.map(async (assignment) => {
        try {
          const subRes = await submissionService.getSubmissionsByAssignment(
            assignment._id
          );
          return subRes.submissions || [];
        } catch (err) {
          console.error(
            `Error fetching submissions for ${assignment._id}:`,
            err
          );
          return [];
        }
      });

      const allSubs = await Promise.all(submissionsPromises);
      const flattenedSubs = allSubs.flat();
      setAllSubmissions(flattenedSubs);
    } catch (err) {
      setError(err.message || "Failed to load assignments");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this assignment?"))
      return;

    try {
      await assignmentService.delete(id);
      setSuccess("Assignment deleted successfully!");
      loadAssignments();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to delete assignment");
    }
  };

  const getSubmissionCount = (assignmentId) => {
    return allSubmissions.filter(
      (sub) =>
        sub.assignment_id?._id === assignmentId ||
        sub.assignment_id === assignmentId
    ).length;
  };

  const filteredAssignments = assignments.filter(
    (assignment) =>
      assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate stats
  const totalAssignments = assignments.length;
  const totalSubmissions = allSubmissions.length;
  const avgSubmissions =
    totalAssignments > 0 ? (totalSubmissions / totalAssignments).toFixed(1) : 0;

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-5xl animate-bounce">👨‍🏫</span>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                {getGreeting()}, {user?.name}!
              </h1>
              <p className="text-gray-600 mt-1">
                Ready to inspire minds? Let's empower your students today ✨
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div
            className="card"
            style={{
              background: "linear-gradient(to bottom right, #8b5cf6, #7c3aed)",
            }}
          >
            <div className="flex items-center justify-between text-white">
              <div>
                <p className="text-purple-100 text-sm font-medium mb-1">
                  Total Assignments
                </p>
                <p className="text-4xl font-bold">{totalAssignments}</p>
              </div>
              <span className="text-5xl opacity-50">📝</span>
            </div>
          </div>

          <div
            className="card"
            style={{
              background: "linear-gradient(to bottom right, #3b82f6, #2563eb)",
            }}
          >
            <div className="flex items-center justify-between text-white">
              <div>
                <p className="text-blue-100 text-sm font-medium mb-1">
                  Total Submissions
                </p>
                <p className="text-4xl font-bold">{totalSubmissions}</p>
              </div>
              <span className="text-5xl opacity-50">📤</span>
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
                  Avg Submissions
                </p>
                <p className="text-4xl font-bold">{avgSubmissions}</p>
              </div>
              <span className="text-5xl opacity-50">📊</span>
            </div>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
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
          <Link
            to="/teacher/assignments/create"
            className="btn-primary text-center px-6 py-3"
          >
            ➕ Create New Assignment
          </Link>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6">
            <Alert type="error" message={error} onClose={() => setError("")} />
          </div>
        )}
        {success && (
          <div className="mb-6">
            <Alert
              type="success"
              message={success}
              onClose={() => setSuccess("")}
            />
          </div>
        )}

        {/* Assignments List */}
        {filteredAssignments.length === 0 ? (
          <div className="text-center py-12 card">
            <span className="text-6xl mb-4 block">📝</span>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? "No assignments found" : "No assignments yet"}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm
                ? "Try a different search term"
                : "Create your first assignment to get started"}
            </p>
            {!searchTerm && (
              <Link
                to="/teacher/assignments/create"
                className="btn-primary inline-block"
              >
                ➕ Create Assignment
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredAssignments.map((assignment) => {
              const submissionCount = getSubmissionCount(assignment._id);

              return (
                <div
                  key={assignment._id}
                  className="card hover:shadow-2xl transition-all duration-300 border border-transparent hover:border-purple-200"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Assignment Info */}
                    <div className="flex-1">
                      <div className="flex items-start gap-4">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{
                            background:
                              "linear-gradient(to bottom right, #8b5cf6, #7c3aed)",
                          }}
                        >
                          <span className="text-2xl">📚</span>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            {assignment.title}
                          </h3>
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                            {assignment.description || "No description"}
                          </p>
                          <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              📅 Due: {formatDate(assignment.due_date)}
                            </span>
                            <span className="flex items-center gap-1">
                              📊 Max Marks: {assignment.maxMarks || 100}
                            </span>
                            <span className="flex items-center gap-1">
                              📤 {submissionCount} Submissions
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 lg:flex-col lg:items-end">
                      <Link
                        to={`/teacher/assignments/${assignment._id}/submissions`}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition-colors"
                      >
                        View Submissions ({submissionCount})
                      </Link>
                      <button
                        onClick={() => handleDelete(assignment._id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;
