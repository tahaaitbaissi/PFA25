import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import "./styles/ArticleList.css";
import { FaBookmark, FaPlus, FaTimes } from 'react-icons/fa';

const api = axios.create({
  baseURL: 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

api.interceptors.response.use(response => {
  return response;
}, error => {
  if (error.response?.status === 401) {
    // Handle unauthorized (e.g., redirect to login)
    console.error('Unauthorized access - redirecting to login');
    window.location.href = '/auth';
  }
  return Promise.reject(error);
});

const ArticleList = ({ onAddArticle }) => {
  const [articles, setArticles] = useState([]);
  const [bookmarkedIds, setBookmarkedIds] = useState([]);
  const [showAddPostForm, setShowAddPostForm] = useState(false);
  const [newArticle, setNewArticle] = useState({
    title: "",
    content: "",
    url: "",
    image: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewImage, setPreviewImage] = useState(null);
  const [articlesLoading, setArticlesLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const [articlesRes, bookmarksRes] = await Promise.all([
          api.get('/articles/'),
          token ? api.get('/bookmark/list') : Promise.resolve({ data: [] })
        ]);

        const bookmarkedArticleIds = bookmarksRes.data.bookmarks.map(b => b.article_id);
        setBookmarkedIds(bookmarkedArticleIds);

        const processedArticles = articlesRes.data.map(article => ({
          ...article,
          isBookmarked: bookmarksRes.data.bookmarks.includes(article._id)
        }));

        setArticles(processedArticles);
      } catch (err) {
        setError('Erreur de chargement des données');
        console.error('Fetch error:', err);
      } finally {
        setArticlesLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleBookmark = async (articleId, e) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const isBookmarked = bookmarkedIds.includes(articleId);
      
      // Configure the request based on add/remove operation
      const config = {
        method: isBookmarked ? 'delete' : 'post',
        url: isBookmarked ? '/bookmark/remove' : '/bookmark/add',
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        data: { article_id: articleId } // Same for both operations
      };

      await api(config);

      // Update UI state
      setBookmarkedIds(prev =>
        isBookmarked ? prev.filter(id => id !== articleId) : [...prev, articleId]
      );

      setArticles(prev =>
        prev.map(article =>
          article._id === articleId
            ? { ...article, isBookmarked: !isBookmarked }
            : article
        )
      );
    } catch (err) {
      console.error('Bookmark error:', err);
      setError(err.response?.data?.message || 
              err.message || 
              'Failed to update bookmark');
    }
  };

  const handleAddPost = () => setShowAddPostForm(true);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewArticle(prev => ({ ...prev, image: file }));
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('title', newArticle.title);
      formData.append('content', newArticle.content);
      formData.append('source_url', newArticle.url);
      if (newArticle.image) formData.append('image', newArticle.image);

      const response = await api.post('/articles/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setArticles(prev => [response.data, ...prev]);
      setShowAddPostForm(false);
      setNewArticle({ title: "", content: "", url: "", image: null });
      setPreviewImage(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur de création');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewArticle(prev => ({ ...prev, [name]: value }));
  };

  if (articlesLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Chargement des articles...</p>
      </div>
    );
  }

  return (
    <div className="article-list">
      <header className="article-list-header">
        <h1>Articles Récents</h1>
        <button className="add-post-button" onClick={handleAddPost}>
          <FaPlus /> Nouvel Article
        </button>
      </header>

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

            <h2>Créer un Nouvel Article</h2>

            {error && <div className="error-banner">{error}</div>}

            <form onSubmit={handleFormSubmit}>
              <div className="form-group">
                <label>Titre de l'article</label>
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
                <label>URL Source</label>
                <input
                  type="url"
                  name="url"
                  value={newArticle.url}
                  onChange={handleInputChange}
                  placeholder="https://example.com"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label>Contenu</label>
                <textarea
                  name="content"
                  value={newArticle.content}
                  onChange={handleInputChange}
                  rows="6"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group image-upload">
                <label>
                  Image de couverture
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={loading}
                  />
                </label>
                {previewImage && (
                  <div className="image-preview">
                    <img src={previewImage} alt="Preview" />
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="submit-post-button"
                disabled={loading}
              >
                {loading ? 'Publication...' : 'Publier'}
              </button>
            </form>
          </div>
        </div>
      )}

      {error && <div className="error-banner">{error}</div>}

      <div className="articles-container">
        {articles.map(article => (
          <article key={article._id} className="article-card">
            <Link to={`/article/${article._id}`} className="article-link">
              {article.image && (
                <div className="article-image">
                  <img src={article.image} alt={article.title} />
                </div>
              )}

              <div className="article-content">
                <h3>{article.title}</h3>
                <p className="excerpt">{article.content.slice(0, 150)}...</p>

                <div className="article-footer">
                  <span className="ai-score">
                    {(article.ai_score * 100).toFixed(1)}% Fiabilité
                  </span>
                  <button
                    className={`bookmark-button ${bookmarkedIds.includes(article._id) ? 'bookmarked' : ''}`}
                    onClick={(e) => handleBookmark(article._id, e)}
                    aria-label="Bookmark"
                  >
                    <FaBookmark />
                  </button>
                </div>
              </div>
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
};

export default ArticleList;