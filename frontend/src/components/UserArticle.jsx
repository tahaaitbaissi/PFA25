import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import "./styles/ArticleList.css";
import { FaBookmark, FaPlus, FaTimes } from 'react-icons/fa';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Add request interceptor for auth token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const UserArticle = () => {
  const [articles, setArticles] = useState([]);
  const [showAddPostForm, setShowAddPostForm] = useState(false);
  const [newArticle, setNewArticle] = useState({
    title: "",
    content: "",
    url: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [articlesLoading, setArticlesLoading] = useState(true);

  // Fetch user's articles
  const fetchUserArticles = async () => {
    try {
      const response = await api.get('/articles/my-articles/');
      setArticles(response.data);
    } catch (err) {
      console.error('Error loading articles:', err);
      setError('Error loading articles');
    } finally {
      setArticlesLoading(false);
    }
  };

  useEffect(() => {
    fetchUserArticles();
  }, []);

  const handleBookmark = async (articleId, e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await api.post('/bookmark/add', { article_id: articleId });
      console.log(`Article ${articleId} bookmarked successfully`);
    } catch (err) {
      console.error('Bookmark error:', err);
      setError(err.response?.data?.message || 'Failed to bookmark article');
    }
  };

  const handleAddPost = () => setShowAddPostForm(true);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/articles/', {
        title: newArticle.title,
        content: newArticle.content,
        source_url: newArticle.url,
        image: "https://via.placeholder.com/600x400"
      });

      // Refresh the articles list
      await fetchUserArticles();
      
      setShowAddPostForm(false);
      setNewArticle({ title: "", content: "", url: "" });
    } catch (err) {
      console.error('Error creating article:', err);
      setError(err.response?.data?.message || 'Error creating article');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewArticle(prev => ({ ...prev, [name]: value }));
  };

  if (articlesLoading) {
    return <div className="loading">Loading articles...</div>;
  }

  return (
    <div className="article-list">
      <div className="article-list-header">
        <h1>Your Articles</h1>
        <button className="add-post-button" onClick={handleAddPost}>
          <FaPlus /> Add New Post
        </button>
      </div>

      {showAddPostForm && (
        <div className="add-post-form-overlay">
          <div className="add-post-form">
            <button 
              className="close-form-button" 
              onClick={() => setShowAddPostForm(false)}
              disabled={loading}
            >
              <FaTimes />
            </button>
            <h2>New Article</h2>
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleFormSubmit}>
              <div className="form-group">
                <label>Title:</label>
                <input
                  type="text"
                  name="title"
                  value={newArticle.title}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label>Source URL:</label>
                <input
                  type="url"
                  name="url"
                  value={newArticle.url}
                  onChange={handleInputChange}
                  required
                  placeholder="https://example.com"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label>Content:</label>
                <textarea
                  name="content"
                  value={newArticle.content}
                  onChange={handleInputChange}
                  required
                  rows="8"
                  placeholder="Write your article here..."
                  disabled={loading}
                />
              </div>

              <button 
                type="submit" 
                className="submit-post-button"
                disabled={loading}
              >
                {loading ? 'Publishing...' : 'Publish Article'}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="articles-container">
        {articles.length > 0 ? (
          articles.map(article => (
            <div key={article._id} className="article-card">
              <Link to={`/article/${article._id}`} className="article-link">
                <img 
                  src={article.image || 'https://via.placeholder.com/600x400'} 
                  alt={article.title} 
                  className="article-image" 
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/600x400';
                  }}
                />
                <div className="article-content">
                  <h4>{article.title}</h4>
                  <p className="content-preview">
                    {article.content.length > 150 
                      ? `${article.content.substring(0, 150)}...` 
                      : article.content}
                  </p>
                  <div className="article-footer">
                    <span className="ai-score">
                      AI Score: {(article.ai_score * 100).toFixed(2)}%
                    </span>
                    <button 
                      className="bookmark-button" 
                      onClick={(e) => handleBookmark(article._id, e)}
                      aria-label="Save as bookmark"
                    >
                      <FaBookmark />
                    </button>
                  </div>
                </div>
              </Link>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <h3>No articles yet</h3>
            <p>Create your first article to get started</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserArticle;