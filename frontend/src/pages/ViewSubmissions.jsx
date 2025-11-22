import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { submissionService } from "../services/submissionService";
import { assignmentService } from "../services/assignmentService";
import Loading from "../components/Loading";
import Alert from "../components/Alert";
import { formatDate, calculateGradePercentage } from "../utils/helpers";

const ViewSubmissions = () => {
  const { id } = useParams(); // assignment ID
  const navigate = useNavigate();

  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // all, graded, ungraded

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [assignmentRes, submissionsRes] = await Promise.all([
        assignmentService.getById(id),
        submissionService.getSubmissionsByAssignment(id),
      ]);
      setAssignment(assignmentRes.assignment);
      setSubmissions(submissionsRes.submissions || []);
    } catch (err) {
      setError(err.message || "Failed to load submissions");
    } finally {
      setLoading(false);
    }
  };

  const filteredSubmissions = submissions.filter((sub) => {
    if (filterStatus === "graded") return sub.graded;
    if (filterStatus === "ungraded") return !sub.graded;
    return true;
  });

  const stats = {
    total: submissions.length,
    graded: submissions.filter((s) => s.graded).length,
    ungraded: submissions.filter((s) => !s.graded).length,
    late: submissions.filter((s) => s.is_late).length,
  };

  if (loading) return <Loading />;
  if (!assignment) return <Alert type="error" message="Assignment not found" />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/teacher/dashboard")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            📤 Submissions
          </h1>
          <p className="text-gray-600">{assignment.title}</p>
        </div>

        {/* Assignment Info Card */}
        <div
          className="card mb-8"
          style={{
            background: "linear-gradient(to right, #8b5cf6, #7c3aed)",
            color: "white",
          }}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">{assignment.title}</h2>
              <p className="text-purple-100 mb-3">
                {assignment.description || "No description"}
              </p>
              <div className="flex flex-wrap gap-4 text-sm">
                <span className="flex items-center gap-1">
                  📅 Due: {formatDate(assignment.due_date)}
                </span>
                <span className="flex items-center gap-1">
                  📊 Max Marks: {assignment.maxMarks || 100}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <div className="card bg-blue-50 border-blue-200">
            <div className="text-center">
              <p className="text-blue-600 text-sm font-medium mb-1">
                Total Submissions
              </p>
              <p className="text-3xl font-bold text-blue-900">{stats.total}</p>
            </div>
          </div>

          <div className="card bg-green-50 border-green-200">
            <div className="text-center">
              <p className="text-green-600 text-sm font-medium mb-1">Graded</p>
              <p className="text-3xl font-bold text-green-900">
                {stats.graded}
              </p>
            </div>
          </div>

          <div className="card bg-yellow-50 border-yellow-200">
            <div className="text-center">
              <p className="text-yellow-600 text-sm font-medium mb-1">
                Ungraded
              </p>
              <p className="text-3xl font-bold text-yellow-900">
                {stats.ungraded}
              </p>
            </div>
          </div>

          <div className="card bg-red-50 border-red-200">
            <div className="text-center">
              <p className="text-red-600 text-sm font-medium mb-1">
                Late Submissions
              </p>
              <p className="text-3xl font-bold text-red-900">{stats.late}</p>
            </div>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilterStatus("all")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterStatus === "all"
                ? "bg-purple-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            All ({stats.total})
          </button>
          <button
            onClick={() => setFilterStatus("graded")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterStatus === "graded"
                ? "bg-green-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            Graded ({stats.graded})
          </button>
          <button
            onClick={() => setFilterStatus("ungraded")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterStatus === "ungraded"
                ? "bg-yellow-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            Ungraded ({stats.ungraded})
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6">
            <Alert type="error" message={error} onClose={() => setError("")} />
          </div>
        )}

        {/* Submissions List */}
        {filteredSubmissions.length === 0 ? (
          <div className="text-center py-12 card">
            <span className="text-6xl mb-4 block">📭</span>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No submissions yet
            </h3>
            <p className="text-gray-600">
              {filterStatus === "all"
                ? "Students haven't submitted their work yet"
                : `No ${filterStatus} submissions found`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredSubmissions.map((submission) => (
              <div
                key={submission._id}
                className="card hover:shadow-2xl transition-all duration-300"
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Student Info */}
                  <div className="flex items-center gap-4 flex-1">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0"
                      style={{
                        background:
                          "linear-gradient(to bottom right, #3b82f6, #2563eb)",
                      }}
                    >
                      {submission.student_id?.name?.charAt(0).toUpperCase() ||
                        "?"}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {submission.student_id?.name || "Unknown Student"}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {submission.student_id?.email || "No email"}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="text-xs text-gray-600">
                          📅 {formatDate(submission.submitted_at)}
                        </span>
                        {submission.is_late && (
                          <span className="badge-danger">⚠️ Late</span>
                        )}
                        {submission.graded ? (
                          <span className="badge-success">✅ Graded</span>
                        ) : (
                          <span className="badge-warning">⏳ Pending</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Grade Display */}
                  {submission.graded && (
                    <div className="bg-green-50 px-6 py-3 rounded-lg border border-green-200">
                      <p className="text-sm text-green-700 mb-1">Grade</p>
                      <p className="text-2xl font-bold text-green-900">
                        {submission.grade}/{assignment.maxMarks}
                        <span className="text-sm ml-2">
                          (
                          {calculateGradePercentage(
                            submission.grade,
                            assignment.maxMarks
                          )}
                          %)
                        </span>
                      </p>
                    </div>
                  )}

                  {/* Action Button */}
                  <Link
                    to={`/teacher/submissions/${submission._id}/grade`}
                    className={`px-6 py-3 rounded-lg font-medium text-center transition-colors ${
                      submission.graded
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-purple-600 text-white hover:bg-purple-700"
                    }`}
                  >
                    {submission.graded ? "👁️ View" : "✏️ Grade"}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewSubmissions;
