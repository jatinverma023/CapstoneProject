import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { assignmentService } from "../services/assignmentService";
import Alert from "../components/Alert";

const CreateAssignment = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    due_date: "",
    maxMarks: 100,
    rubric: [],
  });

  const [rubricItem, setRubricItem] = useState({
    name: "",
    maxMarks: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddRubric = () => {
    if (!rubricItem.name.trim() || !rubricItem.maxMarks) {
      setError("Please fill in rubric name and marks");
      return;
    }

    setFormData({
      ...formData,
      rubric: [
        ...formData.rubric,
        { ...rubricItem, maxMarks: parseInt(rubricItem.maxMarks) },
      ],
    });
    setRubricItem({ name: "", maxMarks: "" });
    setError("");
  };

  const handleRemoveRubric = (index) => {
    setFormData({
      ...formData,
      rubric: formData.rubric.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.title.trim()) {
      setError("Title is required");
      return;
    }

    if (!formData.due_date) {
      setError("Due date is required");
      return;
    }

    const dueDate = new Date(formData.due_date);
    if (dueDate < new Date()) {
      setError("Due date must be in the future");
      return;
    }

    setLoading(true);

    try {
      await assignmentService.create({
        ...formData,
        maxMarks: parseInt(formData.maxMarks),
      });
      navigate("/teacher/dashboard");
    } catch (err) {
      setError(err.message || "Failed to create assignment");
    } finally {
      setLoading(false);
    }
  };

  const totalRubricMarks = formData.rubric.reduce(
    (sum, item) => sum + item.maxMarks,
    0
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/teacher/dashboard")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            ✏️ Create New Assignment
          </h1>
          <p className="text-gray-600">
            Fill in the details to create a new assignment for students
          </p>
        </div>

        {/* Form Card */}
        <div className="card">
          {error && (
            <div className="mb-6">
              <Alert
                type="error"
                message={error}
                onClose={() => setError("")}
              />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Assignment Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="input-field"
                placeholder="e.g., React Fundamentals Project"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                className="input-field resize-none"
                placeholder="Provide detailed instructions for the assignment..."
              />
            </div>

            {/* Due Date and Max Marks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="due_date"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Due Date *
                </label>
                <input
                  type="datetime-local"
                  id="due_date"
                  name="due_date"
                  value={formData.due_date}
                  onChange={handleChange}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="maxMarks"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Maximum Marks *
                </label>
                <input
                  type="number"
                  id="maxMarks"
                  name="maxMarks"
                  value={formData.maxMarks}
                  onChange={handleChange}
                  className="input-field"
                  min="1"
                  required
                />
              </div>
            </div>

            {/* Rubric Section */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Grading Rubric (Optional)
              </h3>

              {/* Add Rubric Item */}
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                  <input
                    type="text"
                    placeholder="Criterion name (e.g., Code Quality)"
                    value={rubricItem.name}
                    onChange={(e) =>
                      setRubricItem({ ...rubricItem, name: e.target.value })
                    }
                    className="input-field"
                  />
                  <input
                    type="number"
                    placeholder="Marks"
                    value={rubricItem.maxMarks}
                    onChange={(e) =>
                      setRubricItem({ ...rubricItem, maxMarks: e.target.value })
                    }
                    className="input-field"
                    min="1"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddRubric}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium text-sm transition-colors"
                >
                  ➕ Add Criterion
                </button>
              </div>

              {/* Rubric Items List */}
              {formData.rubric.length > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-sm font-medium text-gray-700">
                      Rubric Items:
                    </p>
                    <p className="text-sm text-gray-600">
                      Total: {totalRubricMarks} / {formData.maxMarks} marks
                    </p>
                  </div>
                  {formData.rubric.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-lg"
                    >
                      <div className="flex-1">
                        <span className="font-medium text-gray-900">
                          {item.name}
                        </span>
                        <span className="text-gray-600 ml-3">
                          ({item.maxMarks} marks)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveRubric(index)}
                        className="text-red-600 hover:text-red-700 ml-4"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {formData.rubric.length > 0 &&
                totalRubricMarks !== formData.maxMarks && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      ⚠️ Note: Rubric total ({totalRubricMarks}) should match
                      max marks ({formData.maxMarks})
                    </p>
                  </div>
                )}
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-6">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex-1"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Creating...</span>
                  </div>
                ) : (
                  <span>✅ Create Assignment</span>
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate("/teacher/dashboard")}
                className="btn-secondary"
                disabled={loading}
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

export default CreateAssignment;
