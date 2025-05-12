import api from '../api';

// Articles
export const fetchArticles = () => api.get('/articles/');
export const fetchArticle = (id) => api.get(`/articles/${id}`);
export const createArticle = (data) => api.post('/articles/', data);
export const updateArticle = (id, data) => api.put(`/articles/${id}`, data);
export const deleteArticle = (id) => api.delete(`/articles/${id}`);

// Add more for search, etc.