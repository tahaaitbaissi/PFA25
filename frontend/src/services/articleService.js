import api from '../api'; // Assuming this is configured with your backend base URL
// Removed direct axios import as we'll use the configured 'api' instance

// Articles (assuming these also use the configured 'api' instance)
export const fetchArticles = () => api.get('/articles/');
export const fetchArticle = (id) => api.get(`/articles/${id}`);
export const createArticle = (data) => api.post('/articles/', data);
export const updateArticle = (id, data) => api.put(`/articles/${id}`, data);
export const deleteArticle = (id) => api.delete(`/articles/${id}`);


export const searchArticles = async (query) => {
  try {
    console.log('Attempting to search for query:', query); // Log before the request

    // Use the configured 'api' instance and the correct backend path relative to the base URL
    // The path should match your backend route definition: /articles/search
    const response = await api.get(`/articles/search?q=${encodeURIComponent(query)}`);

    console.log('Search successful, received data:', response.data); // Log on success
    return response.data;

  } catch (error) {
    console.error('Error searching articles:', error); // Log the error

    // Add more detailed logging from the error object
    if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Search error response data:', error.response.data);
        console.error('Search error response status:', error.response.status);
        console.error('Search error response headers:', error.response.headers);
    } else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an instance of XMLHttpRequest in the browser and an http.ClientRequest in node.js
        console.error('Search error request:', error.request);
        console.error('No response received from server.'); // More specific message
    } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Search error message:', error.message);
        console.error('Error setting up the search request.'); // More specific message
    }

    throw error; // Re-throw the error so the calling component can handle it
  }
};