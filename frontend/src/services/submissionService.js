import api from "./api";

export const submissionService = {
  submit: async (formData) => {
    try {
      const assignmentId = formData.get("assignment_id");

      const backendFormData = new FormData();
      backendFormData.append("text_submission", formData.get("content"));

      const file = formData.get("file");
      if (file) {
        backendFormData.append("files", file);
      }

      const response = await api.post(
        `/submissions/submit/${assignmentId}`,
        backendFormData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to submit assignment");
    }
  },

  getMySubmissions: async () => {
    try {
      const response = await api.get("/submissions/my");
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to fetch submissions");
    }
  },

  getSubmissionsByAssignment: async (assignmentId) => {
    try {
      const response = await api.get(`/submissions/assignment/${assignmentId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to fetch submissions");
    }
  },

  getById: async (id) => {
    try {
      const response = await api.get(`/submissions/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to fetch submission");
    }
  },

  grade: async (id, gradeData) => {
    try {
      const response = await api.post(`/submissions/${id}/grade`, gradeData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to grade submission");
    }
  },

  update: async () => {
    throw new Error("Resubmission not allowed after initial submission");
  },
};