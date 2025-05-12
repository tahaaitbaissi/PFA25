import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import "./styles/ArticleList.css";
import { FaBookmark } from 'react-icons/fa';

const Tendance = () => {
  const [articles, setArticles] = useState([]);
  const [articlesLoading, setArticlesLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const response = await axios.get('http://localhost:5000/articles/recommended/');
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

  if (articlesLoading) {
    return <div className="loading">Chargement des articles...</div>;
  }

  return (
    <div className="article-list">
      <div className="article-list-header">
        <h1>Liste des Articles</h1>
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

export default Tendance;