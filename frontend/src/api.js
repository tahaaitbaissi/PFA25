import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000', // Or your backend URL
  withCredentials: true, // If backend uses cookies/session
});

export default api;