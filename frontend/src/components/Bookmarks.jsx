import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import "./styles/ArticleList.css";
import { FaBookmark, FaPlus, FaTimes } from 'react-icons/fa';

const Bookmarks = () => {
  const [bookmarkedArticles, setBookmarkedArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddPostForm, setShowAddPostForm] = useState(false);
  const [newArticle, setNewArticle] = useState({
    title: "",
    content: "",
    url: ""
  });

  // Fetch user's bookmarked articles
  const fetchBookmarks = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await axios.get('http://localhost:5000/bookmark/list', {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Fetch complete article details for each bookmark
      const articlesPromises = response.data.bookmarks.map(async bookmark => {
        const articleRes = await axios.get(`http://localhost:5000/articles/${bookmark.article_id}`);
        return {
          ...articleRes.data,
          bookmark_date: bookmark.date,
          bookmark_id: bookmark._id
        };
      });

      const articles = await Promise.all(articlesPromises);
      setBookmarkedArticles(articles);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load bookmarks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const handleBookmark = async (articleId, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      await axios.delete('http://localhost:5000/bookmark/remove', {
        data: { article_id: articleId },
        headers: { Authorization: `Bearer ${token}` }
      });

      // Optimistic UI update
      setBookmarkedArticles(prev => 
        prev.filter(article => article._id !== articleId)
      );
    } catch (err) {
      console.error('Failed to remove bookmark:', err);
      setError(err.response?.data?.message || 'Failed to remove bookmark');
    }
  };

  const handleAddPost = () => setShowAddPostForm(true);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      // First create the article
      const articleResponse = await axios.post(
        'http://localhost:5000/articles',
        {
          title: newArticle.title,
          content: newArticle.content,
          url: newArticle.url,
          image: "https://via.placeholder.com/600x400"
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Then bookmark it
      await axios.post(
        'http://localhost:5000/bookmark/add',
        { article_id: articleResponse.data._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Refresh bookmarks
      await fetchBookmarks();
      setShowAddPostForm(false);
      setNewArticle({ title: "", content: "", url: "" });
    } catch (err) {
      console.error('Failed to add article:', err);
      setError(err.response?.data?.message || 'Failed to add article');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewArticle(prev => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading your bookmarks...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h3>Error</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }

  return (
    <div className="article-list">
      <div className="article-list-header">
        <h1>Your Bookmarked Articles</h1>
        <button className="add-post-button" onClick={handleAddPost}>
          <FaPlus /> Add New Article
        </button>
      </div>

      {showAddPostForm && (
        <div className="add-post-form-overlay">
          <div className="add-post-form">
            <button 
              className="close-form-button" 
              onClick={() => setShowAddPostForm(false)}
            >
              <FaTimes />
            </button>
            <h2>New Article</h2>
            <form onSubmit={handleFormSubmit}>
              <div className="form-group">
                <label>Title:</label>
                <input
                  type="text"
                  name="title"
                  value={newArticle.title}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter article title"
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
                  placeholder="Write your article content here..."
                />
              </div>

              <button type="submit" className="submit-post-button">
                Publish Article
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="articles-container">
        {bookmarkedArticles.length > 0 ? (
          bookmarkedArticles.map(article => (
            <div key={article._id} className="article-card">
              <Link to={`/article/${article._id}`} className="article-link">
                <img 
                  src={article.image} 
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
                      Score: {(article.ai_score * 100).toFixed(2)}%
                    </span>
                    <span className="bookmark-date">
                      Bookmarked on: {new Date(article.bookmark_date).toLocaleDateString()}
                    </span>
                    <button 
                      className="bookmark-button active" 
                      onClick={(e) => handleBookmark(article._id, e)}
                      aria-label="Remove bookmark"
                      title="Remove bookmark"
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
            <h3>No bookmarks yet</h3>
            <p>Save interesting articles to see them here</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Bookmarks;