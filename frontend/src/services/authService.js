import api from './api';

export const authService = {
  async register(name, email, password, role) {
    const response = await api.post('/auth/register', {
      name,
      email,
      password,
      role,
    });
    return response.data;
  },

  async login(email, password) {
    const response = await api.post('/auth/login', {
      email,
      password,
    });
    return response.data;
  },

  async getCurrentUser() {
    const response = await api.get('/auth/me');
    return response.data.user;
  },

  logout() {
    localStorage.removeItem('token');
  },
};
