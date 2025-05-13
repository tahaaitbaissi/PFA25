import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import "./styles/Tendence.css";
import { FaBookmark, FaPlus } from 'react-icons/fa';

const Tendance = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newArticle, setNewArticle] = useState({
    title: '',
    content: '',
    image: ''
  });

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/articles/recommended', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setArticles(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Erreur lors du chargement des articles');
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
  }, []);

  const handleBookmark = async (articleId, e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:5000/bookmark/add',
        { article_id: articleId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error('Erreur de bookmark:', err);
    }
  };

  const handleAddPost = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/articles',
        newArticle,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setArticles([response.data, ...articles]);
      setShowAddForm(false);
      setNewArticle({ title: '', content: '', image: '' });
    } catch (err) {
      console.error('Erreur lors de l\'ajout:', err);
    }
  };

  if (loading) return <div className="loading">Chargement des articles...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="article-list">
      <div className="article-list-header">
        <h1>Articles Tendances</h1>

      </div>

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
                    onClick={(e) => handleBookmark(article._id, e)}
                  >
                    <FaBookmark />
                  </button>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {showAddForm && (
        <div className="add-post-form-overlay">
          <div className="add-post-form">
            <button 
              className="close-form-button"
              onClick={() => setShowAddForm(false)}
            >
              &times;
            </button>
            <h2>Créer un nouvel article</h2>
            <form onSubmit={handleAddPost}>
              <div className="form-group">
                <label>Titre</label>
                <input 
                  type="text" 
                  value={newArticle.title}
                  onChange={(e) => setNewArticle({...newArticle, title: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Contenu</label>
                <textarea 
                  value={newArticle.content}
                  onChange={(e) => setNewArticle({...newArticle, content: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>URL de l'image</label>
                <input 
                  type="text" 
                  value={newArticle.image}
                  onChange={(e) => setNewArticle({...newArticle, image: e.target.value})}
                />
              </div>
              <button type="submit" className="submit-post-button">
                Publier l'article
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tendance;