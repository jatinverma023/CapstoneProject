import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
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

const AssignmentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [assignment, setAssignment] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [assignmentRes, submissionsRes] = await Promise.all([
        assignmentService.getById(id),
        submissionService.getMySubmissions(),
      ]);

      setAssignment(assignmentRes.assignment);

      // Find submission for this assignment
      const mySubmission = submissionsRes.submissions.find(
        (s) => s.assignment_id?._id === id || s.assignment_id === id
      );
      setSubmission(mySubmission || null);
    } catch (err) {
      setError(err.message || "Failed to load assignment");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;
  if (!assignment) return <Alert type="error" message="Assignment not found" />;

  const overdue = isOverdue(assignment.due_date);
  const canSubmit = !submission && !overdue;
  const canResubmit = submission && !submission.graded && !overdue;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/student/dashboard")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            📚 Assignment Details
          </h1>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6">
            <Alert type="error" message={error} onClose={() => setError("")} />
          </div>
        )}

        {/* Assignment Info Card */}
        <div
          className="card mb-6"
          style={{
            background: "linear-gradient(to right, #3b82f6, #2563eb)",
            color: "white",
          }}
        >
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h2 className="text-3xl font-bold mb-3">{assignment.title}</h2>
              <p className="text-blue-100 text-lg mb-4">
                {assignment.description || "No description provided"}
              </p>
            </div>
            {submission ? (
              submission.graded ? (
                <span className="badge-success text-lg px-4 py-2">
                  ✅ Graded
                </span>
              ) : (
                <span className="badge-warning text-lg px-4 py-2">
                  ⏳ Submitted
                </span>
              )
            ) : overdue ? (
              <span className="badge-danger text-lg px-4 py-2">⚠️ Overdue</span>
            ) : (
              <span className="badge-info text-lg px-4 py-2">📝 Pending</span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-blue-200 text-sm mb-1">Due Date</p>
              <p className="text-xl font-semibold">
                📅 {formatDate(assignment.due_date)}
              </p>
            </div>
            <div>
              <p className="text-blue-200 text-sm mb-1">Maximum Marks</p>
              <p className="text-xl font-semibold">
                📊 {assignment.maxMarks || 100}
              </p>
            </div>
            <div>
              <p className="text-blue-200 text-sm mb-1">Status</p>
              <p className="text-xl font-semibold">
                {submission
                  ? submission.graded
                    ? "✅ Graded"
                    : "⏳ Submitted"
                  : overdue
                    ? "⚠️ Overdue"
                    : "📝 Open"}
              </p>
            </div>
          </div>
        </div>

        {/* Rubric Card */}
        {assignment.rubric && assignment.rubric.length > 0 && (
          <div className="card mb-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              📋 Grading Rubric
            </h3>
            <div className="space-y-2">
              {assignment.rubric.map((item, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-3 bg-blue-50 border border-blue-200 rounded-lg"
                >
                  <span className="font-medium text-gray-900">{item.name}</span>
                  <span className="text-blue-600 font-semibold">
                    {item.maxMarks} marks
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submission Status */}
        {submission ? (
          <div className="card mb-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              📤 Your Submission
            </h3>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
              <div className="flex justify-between items-center mb-3">
                <p className="text-sm text-gray-600">Submitted on:</p>
                <p className="font-medium text-gray-900">
                  {formatDate(submission.submitted_at)}
                </p>
              </div>
              {submission.is_late && (
                <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-2">
                  <p className="text-sm text-yellow-800">
                    ⚠️ This submission was late
                  </p>
                </div>
              )}
            </div>

            {/* Grade Display */}
            {submission.graded && (
              <div className="bg-green-50 border-2 border-green-300 rounded-xl p-6 mb-4">
                <div className="text-center mb-4">
                  <p className="text-green-700 text-lg font-medium mb-2">
                    Your Grade
                  </p>
                  <p className="text-5xl font-bold text-green-600 mb-2">
                    {submission.grade} / {assignment.maxMarks}
                  </p>
                  <p className="text-2xl font-semibold text-green-700">
                    {calculateGradePercentage(
                      submission.grade,
                      assignment.maxMarks
                    )}
                    %
                  </p>
                </div>

                {/* Rubric Scores */}
                {submission.rubric_scores &&
                  submission.rubric_scores.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="font-semibold text-gray-900 mb-2">
                        Rubric Breakdown:
                      </p>
                      {submission.rubric_scores.map((score, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center p-2 bg-white rounded-lg"
                        >
                          <span className="text-gray-700">{score.name}</span>
                          <span className="font-semibold text-green-600">
                            {score.score} / {score.maxMarks}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                {/* Feedback */}
                {submission.feedback && (
                  <div className="mt-4 p-4 bg-white rounded-lg">
                    <p className="font-semibold text-gray-900 mb-2">
                      Teacher's Feedback:
                    </p>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {submission.feedback}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Submission Content */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="font-semibold text-gray-900 mb-2">Your Work:</p>
              <p className="text-gray-700 whitespace-pre-wrap">
                {submission.content}
              </p>
            </div>

            {submission.file_url && (
              <div className="mt-4">
                <a
                  href={submission.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  📎 View Attached File
                </a>
              </div>
            )}
          </div>
        ) : (
          /* Not Submitted Yet */
          <div className="card mb-6 text-center py-12">
            <span className="text-6xl mb-4 block">📝</span>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              No Submission Yet
            </h3>
            <p className="text-gray-600 mb-6">
              {overdue
                ? "This assignment is overdue. You can no longer submit."
                : "You haven't submitted your work for this assignment yet."}
            </p>
            {canSubmit && (
              <Link
                to={`/student/assignments/${id}/submit`}
                className="btn-primary inline-block"
              >
                ✏️ Submit Assignment
              </Link>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          {(canSubmit || canResubmit) && (
            <Link
              to={`/student/assignments/${id}/submit`}
              className="btn-primary flex-1 text-center"
            >
              {canResubmit ? "🔄 Resubmit Assignment" : "✏️ Submit Assignment"}
            </Link>
          )}
          <button
            onClick={() => navigate("/student/dashboard")}
            className="btn-secondary"
          >
            Back to Dashboard
          </button>
        </div>
      </div>

      {/* ⬇️ ADD AI CHATBOT HERE - Outside the container but inside the parent div */}
      <AIChatbot
        assignmentId={assignment._id}
        assignmentTitle={assignment.title}
      />
    </div>
  );
};

export default AssignmentDetails;
