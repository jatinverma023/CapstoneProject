import api from './api';

export const assignmentService = {
  async getAll() {
    const response = await api.get('/assignments');
    return response.data;
  },

  async getById(id) {
    const response = await api.get(`/assignments/${id}`);
    return response.data;
  },

  async create(data) {
    const response = await api.post('/assignments', data);
    return response.data;
  },

  async update(id, data) {
    const response = await api.put(`/assignments/${id}`, data);
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/assignments/${id}`);
    return response.data;
  },

  async getSubmissions(id) {
    const response = await api.get(`/assignments/${id}/submissions`);
    return response.data;
  },
};
