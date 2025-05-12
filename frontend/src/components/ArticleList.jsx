import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import "./styles/ArticleList.css";
import { FaBookmark, FaPlus, FaTimes } from 'react-icons/fa';

const ArticleList = ({ onAddArticle }) => {
  const [articles, setArticles] = useState([]);
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
    const fetchArticles = async () => {
      try {
        const response = await axios.get('http://localhost:5000/articles/');
        setArticles(response.data);
      } catch (err) {
        console.error('Erreur de chargement des articles:', err.message);
        setError('Erreur lors du chargement des articles');
      } finally {
        setArticlesLoading(false);
      }
    };
    fetchArticles();
  }, []);

  const handleBookmark = async (articleId, e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/bookmark/add/`, { article_id: articleId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log(`Article ${articleId} bookmarké avec succès`);
    } catch (err) {
      console.error('Erreur de bookmark:', err.response?.data?.message);
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
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));

      const formData = new FormData();
      formData.append('title', newArticle.title);
      formData.append('content', newArticle.content);
      formData.append('source_url', newArticle.url);

      const response = await axios.post('http://localhost:5000/articles/', formData, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      onAddArticle(response.data);
      setArticles(prev => [response.data, ...prev]);

      setShowAddPostForm(false);
      setNewArticle({ title: "", content: "", url: "", image: null });
      setPreviewImage(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la création de l\'article');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewArticle(prev => ({ ...prev, [name]: value }));
  };

  if (articlesLoading) {
    return <div className="loading">Chargement des articles...</div>;
  }

  return (
    <div className="article-list">
      <div className="article-list-header">
        <h1>Liste des Articles</h1>
        <button className="add-post-button" onClick={handleAddPost}>
          <FaPlus /> Ajouter votre post
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
            <h2>Nouvel Article</h2>
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleFormSubmit}>
              <div className="form-group">
                <label>Titre:</label>
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
                <label>URL Source:</label>
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
                <label>Contenu:</label>
                <textarea
                  name="content"
                  value={newArticle.content}
                  onChange={handleInputChange}
                  required
                  rows="8"
                  placeholder="Écrivez votre article ici..."
                  disabled={loading}
                />
              </div>

              <button 
                type="submit" 
                className="submit-post-button"
                disabled={loading}
              >
                {loading ? 'Publication en cours...' : 'Publier l\'article'}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="articles-container">
        {articles.map(article => (
          <div key={article._id} className="article-card">
            <Link to={`/article/${article._id}`} className="article-link">
              <img 
                src={article.image} 
                alt={article.title} 
                className="article-image" 
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
                    Score IA: {(article.ai_score * 100).toFixed(2)}%
                  </span>
                  <button 
                    className="bookmark-button" 
                    onClick={(e) => handleBookmark(article.id, e)}
                    aria-label="Enregistrer comme bookmark"
                  >
                    <FaBookmark />
                  </button>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ArticleList;