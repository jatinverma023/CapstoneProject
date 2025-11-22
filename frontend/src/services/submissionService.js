import axios from 'axios';

const API_URL = 'http://localhost:5000/api/v1';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const submissionService = {
  // Submit new assignment
  submit: async (formData) => {
    try {
      const assignmentId = formData.get('assignment_id');
      
      const backendFormData = new FormData();
      backendFormData.append('text_submission', formData.get('content'));
      
      const file = formData.get('file');
      if (file) {
        backendFormData.append('files', file);
      }

      const response = await axios.post(
        `${API_URL}/submissions/submit/${assignmentId}`, 
        backendFormData,
        {
          headers: {
            ...getAuthHeader(),
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to submit assignment');
    }
  },

  // Get my submissions (student)
  getMySubmissions: async () => {
    try {
      const response = await axios.get(`${API_URL}/submissions/my`, {
        headers: getAuthHeader(),
      });
      return { 
        submissions: response.data.submissions || [] 
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch submissions');
    }
  },

  // Get submissions by assignment (teacher)
  getSubmissionsByAssignment: async (assignmentId) => {
    try {
      const response = await axios.get(`${API_URL}/submissions/assignment/${assignmentId}`, {
        headers: getAuthHeader(),
      });
      return { 
        submissions: response.data.submissions || [] 
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch submissions');
    }
  },

  // Get submission by ID
  getById: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/submissions/${id}`, {
        headers: getAuthHeader(),
      });
      return { submission: response.data.submission };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch submission');
    }
  },

  // Grade submission (teacher)
  grade: async (id, gradeData) => {
    try {
      const response = await axios.post(
        `${API_URL}/submissions/${id}/grade`, 
        gradeData,
        {
          headers: getAuthHeader(),
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to grade submission');
    }
  },

  // Update submission - not implemented
  update: async (id, formData) => {
    throw new Error('Resubmission not allowed after initial submission');
  },
};
