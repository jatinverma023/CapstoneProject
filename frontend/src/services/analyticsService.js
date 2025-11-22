import api from './api';

export const analyticsService = {
  async getClassAverage(assignmentId) {
    const response = await api.get(`/analytics/class-average/${assignmentId}`);
    return response.data;
  },

  async getRubricBreakdown(assignmentId) {
    const response = await api.get(`/analytics/rubric-breakdown/${assignmentId}`);
    return response.data;
  },

  async getStudentTrend(studentId) {
    const response = await api.get(`/analytics/student-trend/${studentId}`);
    return response.data;
  },

  async getClassSummary(teacherId) {
    const url = teacherId ? `/analytics/class-summary/${teacherId}` : '/analytics/class-summary';
    const response = await api.get(url);
    return response.data;
  },
};
