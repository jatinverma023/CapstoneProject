import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { analyticsService } from "../services/analyticsService";
import { assignmentService } from "../services/assignmentService";
import Loading from "../components/Loading";
import Alert from "../components/Alert";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement
);

const TeacherAnalytics = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [classStats, setClassStats] = useState(null);
  const [rubricBreakdown, setRubricBreakdown] = useState(null);
  const [classSummary, setClassSummary] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedAssignment) {
      loadAssignmentAnalytics(selectedAssignment);
    }
  }, [selectedAssignment]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [assignmentsRes, summaryRes] = await Promise.all([
        assignmentService.getAll(),
        analyticsService.getClassSummary(),
      ]);
      setAssignments(assignmentsRes.assignments || []);
      setClassSummary(summaryRes);

      if (assignmentsRes.assignments?.length > 0) {
        setSelectedAssignment(assignmentsRes.assignments[0]._id);
      }
    } catch (err) {
      setError(err.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  const loadAssignmentAnalytics = async (assignmentId) => {
    try {
      const [statsRes, rubricRes] = await Promise.all([
        analyticsService.getClassAverage(assignmentId),
        analyticsService.getRubricBreakdown(assignmentId),
      ]);
      setClassStats(statsRes);
      setRubricBreakdown(rubricRes);
    } catch (err) {
      console.error("Failed to load assignment analytics:", err);
    }
  };

  if (loading) return <Loading />;

  // Chart data
  const gradeDistributionData = classStats
    ? {
        labels: ["90-100", "80-89", "70-79", "60-69", "Below 60"],
        datasets: [
          {
            label: "Number of Students",
            data: [
              classStats.gradeDistribution?.["90-100"] || 0,
              classStats.gradeDistribution?.["80-89"] || 0,
              classStats.gradeDistribution?.["70-79"] || 0,
              classStats.gradeDistribution?.["60-69"] || 0,
              classStats.gradeDistribution?.["Below 60"] || 0,
            ],
            backgroundColor: [
              "#10b981",
              "#3b82f6",
              "#f59e0b",
              "#ef4444",
              "#dc2626",
            ],
          },
        ],
      }
    : null;

  const rubricChartData = rubricBreakdown
    ? {
        labels: rubricBreakdown.breakdown?.map((r) => r.criterionName) || [],
        datasets: [
          {
            label: "Average Score (%)",
            data:
              rubricBreakdown.breakdown?.map((r) =>
                ((r.avgScore / r.maxMarks) * 100).toFixed(1)
              ) || [],
            backgroundColor: "#3b82f6",
          },
        ],
      }
    : null;

  const submissionStatusData = classSummary
    ? {
        labels: ["Submitted", "Pending"],
        datasets: [
          {
            data: [
              classSummary.totalSubmissions || 0,
              classSummary.totalPending || 0,
            ],
            backgroundColor: ["#10b981", "#f59e0b"],
          },
        ],
      }
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/teacher/dashboard")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            📊 Analytics Dashboard
          </h1>
          <p className="text-gray-600">
            Insights into student performance and assignment trends
          </p>
        </div>

        {error && (
          <div className="mb-6">
            <Alert type="error" message={error} onClose={() => setError("")} />
          </div>
        )}

        {/* Assignment Selector */}
        {assignments.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Assignment
            </label>
            <select
              value={selectedAssignment || ""}
              onChange={(e) => setSelectedAssignment(e.target.value)}
              className="input-field max-w-md"
            >
              {assignments.map((assignment) => (
                <option key={assignment._id} value={assignment._id}>
                  {assignment.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div
            className="card"
            style={{
              background: "linear-gradient(to bottom right, #3b82f6, #2563eb)",
            }}
          >
            <div className="text-white">
              <p className="text-sm opacity-90 mb-1">Total Assignments</p>
              <p className="text-3xl font-bold">
                {classSummary?.totalAssignments || 0}
              </p>
            </div>
          </div>

          <div
            className="card"
            style={{
              background: "linear-gradient(to bottom right, #10b981, #059669)",
            }}
          >
            <div className="text-white">
              <p className="text-sm opacity-90 mb-1">Total Submissions</p>
              <p className="text-3xl font-bold">
                {classSummary?.totalSubmissions || 0}
              </p>
            </div>
          </div>

          <div
            className="card"
            style={{
              background: "linear-gradient(to bottom right, #f59e0b, #d97706)",
            }}
          >
            <div className="text-white">
              <p className="text-sm opacity-90 mb-1">Class Average</p>
              <p className="text-3xl font-bold">
                {classStats?.average?.toFixed(1) || "N/A"}
              </p>
            </div>
          </div>

          <div
            className="card"
            style={{
              background: "linear-gradient(to bottom right, #8b5cf6, #7c3aed)",
            }}
          >
            <div className="text-white">
              <p className="text-sm opacity-90 mb-1">Pending</p>
              <p className="text-3xl font-bold">
                {classSummary?.totalPending || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Grade Distribution */}
          {gradeDistributionData && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Grade Distribution
              </h3>
              <Bar
                data={gradeDistributionData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { display: false },
                    title: { display: false },
                  },
                }}
              />
            </div>
          )}

          {/* Submission Status */}
          {submissionStatusData && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Submission Status
              </h3>
              <div className="flex justify-center">
                <div className="w-64">
                  <Doughnut data={submissionStatusData} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Rubric Performance */}
        {rubricChartData && (
          <div className="card mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Rubric Performance
            </h3>
            <Bar
              data={rubricChartData}
              options={{
                responsive: true,
                plugins: {
                  legend: { display: false },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                      display: true,
                      text: "Average Score (%)",
                    },
                  },
                },
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherAnalytics;
