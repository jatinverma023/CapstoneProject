import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { assignmentService } from "../services/assignmentService";
import { submissionService } from "../services/submissionService";
import Loading from "../components/Loading";
import Alert from "../components/Alert";
import { formatDate, calculateGradePercentage } from "../utils/helpers";

const Analytics = () => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [assignmentsRes, allSubmissionsData] = await Promise.all([
        assignmentService.getAll(),
        loadAllSubmissions(),
      ]);

      setAssignments(assignmentsRes.assignments || []);
      setSubmissions(allSubmissionsData);
    } catch (err) {
      setError(err.message || "Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  const loadAllSubmissions = async () => {
    try {
      const assignmentsRes = await assignmentService.getAll();
      const assignmentsList = assignmentsRes.assignments || [];

      const submissionsPromises = assignmentsList.map(async (assignment) => {
        try {
          const subRes = await submissionService.getSubmissionsByAssignment(
            assignment._id
          );
          return subRes.submissions || [];
        } catch (err) {
          return [];
        }
      });

      const allSubs = await Promise.all(submissionsPromises);
      return allSubs.flat();
    } catch (err) {
      return [];
    }
  };

  // Calculate statistics
  const totalAssignments = assignments.length;
  const totalSubmissions = submissions.length;
  const gradedSubmissions = submissions.filter((s) => s.graded).length;
  const ungradedSubmissions = submissions.filter((s) => !s.graded).length;
  const lateSubmissions = submissions.filter((s) => s.is_late).length;

  const averageGrade =
    submissions.filter((s) => s.graded).length > 0
      ? (
          submissions
            .filter((s) => s.graded)
            .reduce((sum, s) => sum + (s.grade || 0), 0) /
          submissions.filter((s) => s.graded).length
        ).toFixed(1)
      : 0;

  // Assignment completion rate
  const completionRate =
    totalAssignments > 0
      ? ((totalSubmissions / (totalAssignments * 1)) * 100).toFixed(1)
      : 0;

  // Top performing students (based on average grade)
  const studentGrades = {};
  submissions
    .filter((s) => s.graded)
    .forEach((sub) => {
      const studentId = sub.student_id?._id;
      const studentName = sub.student_id?.name || "Unknown";

      if (!studentGrades[studentId]) {
        studentGrades[studentId] = {
          name: studentName,
          grades: [],
          totalGrade: 0,
          count: 0,
        };
      }

      studentGrades[studentId].grades.push(sub.grade);
      studentGrades[studentId].totalGrade += sub.grade || 0;
      studentGrades[studentId].count += 1;
    });

  const topStudents = Object.values(studentGrades)
    .map((student) => ({
      name: student.name,
      averageGrade: (student.totalGrade / student.count).toFixed(1),
      totalSubmissions: student.count,
    }))
    .sort((a, b) => b.averageGrade - a.averageGrade)
    .slice(0, 5);

  if (loading) return <Loading />;

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
            📊 Analytics Dashboard
          </h1>
          <p className="text-gray-600">
            Track performance and get insights into student progress
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6">
            <Alert type="error" message={error} onClose={() => setError("")} />
          </div>
        )}

        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card bg-gradient-to-br from-purple-500 to-purple-700 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium mb-1">
                  Total Assignments
                </p>
                <p className="text-4xl font-bold">{totalAssignments}</p>
              </div>
              <span className="text-5xl opacity-50">📝</span>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-blue-500 to-blue-700 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium mb-1">
                  Total Submissions
                </p>
                <p className="text-4xl font-bold">{totalSubmissions}</p>
              </div>
              <span className="text-5xl opacity-50">📤</span>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-green-500 to-green-700 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium mb-1">
                  Average Grade
                </p>
                <p className="text-4xl font-bold">{averageGrade}%</p>
              </div>
              <span className="text-5xl opacity-50">🏆</span>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-orange-500 to-orange-700 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium mb-1">
                  Completion Rate
                </p>
                <p className="text-4xl font-bold">{completionRate}%</p>
              </div>
              <span className="text-5xl opacity-50">✅</span>
            </div>
          </div>
        </div>

        {/* Submission Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              📊 Submission Status
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="font-medium text-gray-700">Graded</span>
                <span className="text-xl font-bold text-green-600">
                  {gradedSubmissions}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                <span className="font-medium text-gray-700">
                  Pending Grading
                </span>
                <span className="text-xl font-bold text-yellow-600">
                  {ungradedSubmissions}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                <span className="font-medium text-gray-700">
                  Late Submissions
                </span>
                <span className="text-xl font-bold text-red-600">
                  {lateSubmissions}
                </span>
              </div>
            </div>
          </div>

          <div className="card lg:col-span-2">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              🏆 Top Performing Students
            </h3>
            {topStudents.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No graded submissions yet
              </p>
            ) : (
              <div className="space-y-2">
                {topStudents.map((student, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                        style={{
                          background:
                            index === 0
                              ? "linear-gradient(to bottom right, #f59e0b, #d97706)"
                              : index === 1
                                ? "linear-gradient(to bottom right, #6b7280, #4b5563)"
                                : index === 2
                                  ? "linear-gradient(to bottom right, #cd7f32, #8b4513)"
                                  : "linear-gradient(to bottom right, #3b82f6, #2563eb)",
                        }}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {student.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {student.totalSubmissions} submissions
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600">
                        {student.averageGrade}%
                      </p>
                      <p className="text-xs text-gray-500">Average Grade</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Assignment Performance */}
        <div className="card">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            📚 Assignment Performance
          </h3>
          {assignments.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No assignments created yet
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Assignment
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">
                      Due Date
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">
                      Submissions
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">
                      Avg Grade
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((assignment) => {
                    const assignmentSubs = submissions.filter(
                      (s) =>
                        s.assignment_id?._id === assignment._id ||
                        s.assignment_id === assignment._id
                    );
                    const gradedSubs = assignmentSubs.filter((s) => s.graded);
                    const avgGrade =
                      gradedSubs.length > 0
                        ? (
                            gradedSubs.reduce(
                              (sum, s) => sum + (s.grade || 0),
                              0
                            ) / gradedSubs.length
                          ).toFixed(1)
                        : "N/A";

                    return (
                      <tr
                        key={assignment._id}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-3 px-4">
                          <p className="font-medium text-gray-900">
                            {assignment.title}
                          </p>
                          <p className="text-sm text-gray-500">
                            {assignment.description || "No description"}
                          </p>
                        </td>
                        <td className="py-3 px-4 text-center text-sm text-gray-600">
                          {formatDate(assignment.due_date)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                            {assignmentSubs.length}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-bold ${
                              avgGrade === "N/A"
                                ? "bg-gray-100 text-gray-600"
                                : avgGrade >= 75
                                  ? "bg-green-100 text-green-700"
                                  : avgGrade >= 60
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-red-100 text-red-700"
                            }`}
                          >
                            {avgGrade === "N/A" ? avgGrade : `${avgGrade}%`}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
