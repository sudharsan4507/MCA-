import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({ baseURL: API_BASE, timeout: 180000 });

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.code === 'ECONNABORTED') {
      err.message = 'Request timed out. Large files may take longer.';
    } else if (!err.response) {
      err.message = 'Cannot connect to the backend server. Please try again in a moment.';
    }
    return Promise.reject(err);
  }
);

export const analyzeAudio = async (file, onUploadProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/predict', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  });
  return response.data;
};

export const analyzeUrl = async (url) => {
  const response = await api.post('/predict/url', { url });
  return response.data;
};

export const validateUrl = async (url) => {
  const response = await api.get('/validate-url', { params: { url } });
  return response.data;
};

export const getHistory = async (limit = 20, offset = 0) => {
  const response = await api.get('/history', { params: { limit, offset } });
  return response.data;
};

export const getHistoryItem    = async (id) => (await api.get(`/history/${id}`)).data;
export const deleteHistoryItem = async (id) => (await api.delete(`/history/${id}`)).data;
export const getStats          = async ()   => (await api.get('/stats')).data;
export const checkHealth       = async ()   => (await api.get('/health')).data;

export default api;
