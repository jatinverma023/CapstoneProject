import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { submissionService } from "../services/submissionService";
import Loading from "../components/Loading";
import Alert from "../components/Alert";
import { formatDate, calculateGradePercentage } from "../utils/helpers";

const GradeSubmission = () => {
  const { id } = useParams(); // submission ID
  const navigate = useNavigate();

  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [gradeData, setGradeData] = useState({
    grade: "",
    feedback: "",
    rubricScores: [],
  });

  useEffect(() => {
    loadSubmission();
  }, [id]);

  const loadSubmission = async () => {
    try {
      setLoading(true);
      const response = await submissionService.getById(id);
      setSubmission(response.submission);

      // Pre-fill if already graded
      if (response.submission.graded) {
        setGradeData({
          grade: response.submission.grade || "",
          feedback: response.submission.feedback || "",
          rubricScores: response.submission.rubric_scores || [],
        });
      } else {
        // Initialize rubric scores if assignment has rubric
        if (response.submission.assignment_id?.rubric?.length > 0) {
          setGradeData((prev) => ({
            ...prev,
            rubricScores: response.submission.assignment_id.rubric.map(
              (item) => ({
                name: item.name,
                maxMarks: item.maxMarks,
                score: 0,
              })
            ),
          }));
        }
      }
    } catch (err) {
      setError(err.message || "Failed to load submission");
    } finally {
      setLoading(false);
    }
  };

  const handleRubricScoreChange = (index, value) => {
    const newScores = [...gradeData.rubricScores];
    const numValue = parseInt(value) || 0;
    const maxMarks = newScores[index].maxMarks;

    if (numValue > maxMarks) {
      setError(`Score cannot exceed ${maxMarks} marks`);
      return;
    }

    newScores[index].score = numValue;
    setGradeData({ ...gradeData, rubricScores: newScores });

    // Auto-calculate total grade
    const totalScore = newScores.reduce((sum, item) => sum + item.score, 0);
    setGradeData((prev) => ({ ...prev, grade: totalScore }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const maxMarks = submission.assignment_id.maxMarks || 100;
    const grade = parseInt(gradeData.grade);

    if (!grade && grade !== 0) {
      setError("Grade is required");
      return;
    }

    if (grade > maxMarks) {
      setError(`Grade cannot exceed ${maxMarks} marks`);
      return;
    }

    if (grade < 0) {
      setError("Grade cannot be negative");
      return;
    }

    setSubmitting(true);

    try {
      await submissionService.grade(id, {
        grade: grade,
        feedback: gradeData.feedback,
        rubric_scores:
          gradeData.rubricScores.length > 0
            ? gradeData.rubricScores
            : undefined,
      });

      setSuccess("Submission graded successfully!");
      setTimeout(() => {
        navigate(
          `/teacher/assignments/${submission.assignment_id._id}/submissions`
        );
      }, 1500);
    } catch (err) {
      setError(err.message || "Failed to grade submission");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loading />;
  if (!submission) return <Alert type="error" message="Submission not found" />;

  const assignment = submission.assignment_id;
  const student = submission.student_id;
  const totalRubricScore = gradeData.rubricScores.reduce(
    (sum, item) => sum + item.score,
    0
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() =>
              navigate(`/teacher/assignments/${assignment._id}/submissions`)
            }
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            ← Back to Submissions
          </button>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {submission.graded
              ? "👁️ View Graded Submission"
              : "✏️ Grade Submission"}
          </h1>
          <p className="text-gray-600">{assignment.title}</p>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Submission Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Student Info Card */}
            <div
              className="card"
              style={{
                background: "linear-gradient(to right, #3b82f6, #2563eb)",
                color: "white",
              }}
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold">
                  {student.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-1">{student.name}</h2>
                  <p className="text-blue-100">{student.email}</p>
                  <div className="flex gap-3 mt-2 text-sm">
                    <span>
                      📅 Submitted: {formatDate(submission.submitted_at)}
                    </span>
                    {submission.is_late && (
                      <span className="badge-danger">⚠️ Late</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Assignment Details */}
            <div className="card">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                📚 Assignment Details
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Title</p>
                  <p className="font-medium text-gray-900">
                    {assignment.title}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Description</p>
                  <p className="text-gray-700">
                    {assignment.description || "No description"}
                  </p>
                </div>
                <div className="flex gap-6">
                  <div>
                    <p className="text-sm text-gray-600">Due Date</p>
                    <p className="font-medium text-gray-900">
                      {formatDate(assignment.due_date)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Maximum Marks</p>
                    <p className="font-medium text-gray-900">
                      {assignment.maxMarks || 100}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Student Submission Content - UPDATED */}
            <div className="card">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                📝 Submission Content
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {submission.text_submission ||
                    submission.content ||
                    "No content submitted"}
                </p>
              </div>

              {/* Attachments: support for file_urls array and single file_url */}
              {submission.file_urls && submission.file_urls.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Attachments:
                  </p>
                  <div className="space-y-2">
                    {submission.file_urls.map((url, index) => (
                      <a
                        key={index}
                        href={`${url.startsWith("http") ? "" : "http://localhost:5000"}${url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-600 hover:bg-blue-100 transition-colors"
                      >
                        📎 View Attachment{" "}
                        {submission.file_urls.length > 1 ? index + 1 : ""}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {submission.file_url && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Attachment:
                  </p>
                  <a
                    href={`${submission.file_url.startsWith("http") ? "" : "http://localhost:5000"}${submission.file_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-600 hover:bg-blue-100 transition-colors"
                  >
                    📎 View Attachment
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Grading Form */}
          <div className="space-y-6">
            <div className="card sticky top-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                {submission.graded ? "📊 Grade Details" : "✏️ Grade Assignment"}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Rubric Grading */}
                {gradeData.rubricScores.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-gray-700">
                      Rubric Scoring:
                    </p>
                    {gradeData.rubricScores.map((item, index) => (
                      <div
                        key={index}
                        className="bg-purple-50 p-3 rounded-lg border border-purple-200"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-900">
                            {item.name}
                          </span>
                          <span className="text-xs text-gray-600">
                            Max: {item.maxMarks}
                          </span>
                        </div>
                        <input
                          type="number"
                          value={item.score}
                          onChange={(e) =>
                            handleRubricScoreChange(index, e.target.value)
                          }
                          className="input-field"
                          min="0"
                          max={item.maxMarks}
                          disabled={submission.graded}
                        />
                      </div>
                    ))}
                    <div className="bg-purple-100 p-3 rounded-lg border border-purple-300">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-purple-900">
                          Rubric Total:
                        </span>
                        <span className="text-xl font-bold text-purple-600">
                          {totalRubricScore} / {assignment.maxMarks}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Overall Grade */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Overall Grade * (out of {assignment.maxMarks})
                  </label>
                  <input
                    type="number"
                    value={gradeData.grade}
                    onChange={(e) =>
                      setGradeData({ ...gradeData, grade: e.target.value })
                    }
                    className="input-field text-2xl font-bold text-center"
                    min="0"
                    max={assignment.maxMarks}
                    required
                    disabled={submission.graded}
                  />
                  {gradeData.grade !== "" && (
                    <p className="text-center mt-2 text-sm text-gray-600">
                      {calculateGradePercentage(
                        gradeData.grade,
                        assignment.maxMarks
                      )}
                      %
                    </p>
                  )}
                </div>

                {/* Feedback */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Feedback
                  </label>
                  <textarea
                    value={gradeData.feedback}
                    onChange={(e) =>
                      setGradeData({ ...gradeData, feedback: e.target.value })
                    }
                    rows="5"
                    className="input-field resize-none"
                    placeholder="Provide feedback to the student..."
                    disabled={submission.graded}
                  />
                </div>

                {/* Submit Button */}
                {!submission.graded && (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary w-full"
                  >
                    {submitting ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Submitting...</span>
                      </div>
                    ) : (
                      <span>✅ Submit Grade</span>
                    )}
                  </button>
                )}

                {submission.graded && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <p className="text-green-800 font-medium">
                      ✅ Already Graded
                    </p>
                    <p className="text-sm text-green-600 mt-1">
                      This submission has been graded
                    </p>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GradeSubmission;
