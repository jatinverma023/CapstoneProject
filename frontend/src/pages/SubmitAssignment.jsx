import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { assignmentService } from "../services/assignmentService";
import { submissionService } from "../services/submissionService";
import Loading from "../components/Loading";
import Alert from "../components/Alert";
import { formatDate, isOverdue } from "../utils/helpers";

const SubmitAssignment = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [assignment, setAssignment] = useState(null);
  const [existingSubmission, setExistingSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    content: "",
    file: null,
  });

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

      // Check if already submitted
      const mySubmission = submissionsRes.submissions.find(
        (s) => s.assignment_id?._id === id || s.assignment_id === id
      );

      if (mySubmission) {
        setExistingSubmission(mySubmission);
        setFormData({
          content: mySubmission.content || "",
          file: null,
        });
      }
    } catch (err) {
      setError(err.message || "Failed to load assignment");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError("File size must be less than 10MB");
        e.target.value = "";
        return;
      }
      setFormData({ ...formData, file });
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.content.trim()) {
      setError("Please provide your work content");
      return;
    }

    if (isOverdue(assignment.due_date)) {
      setError("This assignment is overdue");
      return;
    }

    setSubmitting(true);

    try {
      const submitData = new FormData();
      submitData.append("assignment_id", id);
      submitData.append("content", formData.content);
      if (formData.file) {
        submitData.append("file", formData.file);
      }

      if (existingSubmission && !existingSubmission.graded) {
        // Resubmit
        await submissionService.update(existingSubmission._id, submitData);
        setSuccess("Assignment resubmitted successfully!");
      } else {
        // New submission
        await submissionService.submit(submitData);
        setSuccess("Assignment submitted successfully!");
      }

      setTimeout(() => {
        navigate(`/student/assignments/${id}`);
      }, 1500);
    } catch (err) {
      setError(err.message || "Failed to submit assignment");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loading />;
  if (!assignment) return <Alert type="error" message="Assignment not found" />;

  const overdue = isOverdue(assignment.due_date);
  const canSubmit =
    !existingSubmission || (!existingSubmission.graded && !overdue);

  if (existingSubmission && existingSubmission.graded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Alert
            type="warning"
            message="This assignment has already been graded. You cannot resubmit."
          />
          <button
            onClick={() => navigate(`/student/assignments/${id}`)}
            className="btn-primary mt-4"
          >
            ← Back to Assignment
          </button>
        </div>
      </div>
    );
  }

  if (overdue && !existingSubmission) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Alert
            type="error"
            message="This assignment is overdue. You can no longer submit."
          />
          <button
            onClick={() => navigate(`/student/assignments/${id}`)}
            className="btn-primary mt-4"
          >
            ← Back to Assignment
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(`/student/assignments/${id}`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            ← Back to Assignment
          </button>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {existingSubmission
              ? "🔄 Resubmit Assignment"
              : "📝 Submit Assignment"}
          </h1>
          <p className="text-gray-600">{assignment.title}</p>
        </div>

        {/* Assignment Info Card */}
        <div
          className="card mb-6"
          style={{
            background: "linear-gradient(to right, #3b82f6, #2563eb)",
            color: "white",
          }}
        >
          <h2 className="text-2xl font-bold mb-3">{assignment.title}</h2>
          <p className="text-blue-100 mb-4">
            {assignment.description || "No description"}
          </p>
          <div className="flex flex-wrap gap-6">
            <div>
              <p className="text-blue-200 text-sm">Due Date</p>
              <p className="text-lg font-semibold">
                📅 {formatDate(assignment.due_date)}
              </p>
            </div>
            <div>
              <p className="text-blue-200 text-sm">Maximum Marks</p>
              <p className="text-lg font-semibold">
                📊 {assignment.maxMarks || 100}
              </p>
            </div>
            {overdue && existingSubmission && (
              <div>
                <p className="text-blue-200 text-sm">Status</p>
                <p className="text-lg font-semibold">
                  ⚠️ This will be marked as late
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Rubric Display */}
        {assignment.rubric && assignment.rubric.length > 0 && (
          <div className="card mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              📋 Grading Criteria
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Your submission will be evaluated based on:
            </p>
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

        {existingSubmission && (
          <div className="mb-6">
            <Alert
              type="warning"
              message="You have already submitted this assignment. Submitting again will replace your previous submission."
            />
          </div>
        )}

        {/* Submission Form */}
        <div className="card">
          <h3 className="text-xl font-bold text-gray-900 mb-6">✏️ Your Work</h3>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Content Textarea */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assignment Content *
              </label>
              <textarea
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                rows="12"
                className="input-field resize-none"
                placeholder="Write your assignment work here...&#10;&#10;• Explain your solution&#10;• Show your work/code&#10;• Include any notes or references"
                required
              />
              <p className="text-sm text-gray-500 mt-2">
                {formData.content.length} characters
              </p>
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Attach File (Optional)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                  accept=".pdf,.doc,.docx,.txt,.zip,.jpg,.jpeg,.png"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="text-4xl mb-2">📎</div>
                  <p className="text-gray-700 font-medium mb-1">
                    {formData.file
                      ? formData.file.name
                      : "Click to upload a file"}
                  </p>
                  <p className="text-sm text-gray-500">
                    PDF, DOC, TXT, ZIP, or Images (Max 10MB)
                  </p>
                </label>
              </div>
              {existingSubmission?.file_url && !formData.file && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    📎 Previous file attached. Upload a new file to replace it.
                  </p>
                </div>
              )}
            </div>

            {/* Important Notes */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-yellow-900 mb-2">
                ⚠️ Important Notes:
              </p>
              <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                <li>Make sure your work is complete before submitting</li>
                <li>You can resubmit before grading if needed</li>
                <li>Once the teacher grades your work, you cannot resubmit</li>
                {overdue && (
                  <li className="text-red-600 font-medium">
                    This submission will be marked as LATE
                  </li>
                )}
              </ul>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={submitting || !canSubmit}
                className="btn-primary flex-1"
              >
                {submitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Submitting...</span>
                  </div>
                ) : existingSubmission ? (
                  <span>🔄 Resubmit Assignment</span>
                ) : (
                  <span>✅ Submit Assignment</span>
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate(`/student/assignments/${id}`)}
                className="btn-secondary"
                disabled={submitting}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SubmitAssignment;
