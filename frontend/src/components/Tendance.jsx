import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import "./styles/ArticleList.css";
import { FaBookmark, FaPlus, FaTimes } from 'react-icons/fa';

const Tendance = ({ articles, onAddArticle }) => {
  const [showAddPostForm, setShowAddPostForm] = useState(false);
  const [newArticle, setNewArticle] = useState({
    title: "",
    content: "",
    url: ""
  }); 

  const handleBookmark = (articleId, e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log(`Article ${articleId} bookmarké`);
  };

  const handleAddPost = () => setShowAddPostForm(true);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const completeArticle = {
      ...newArticle,
      author: "Utilisateur",
      description: "Description générée automatiquement",
      image: "https://via.placeholder.com/600x400",
      publishedAt: new Date().toISOString(),
      ai_score: 0.85,
      keywords: [],
      summary: "",
      comments: []
    };
    
    onAddArticle(completeArticle);
    setShowAddPostForm(false);
    setNewArticle({ title: "", content: "", url: "" });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewArticle(prev => ({ ...prev, [name]: value }));
  };

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
            >
              <FaTimes />
            </button>
            <h2>Nouvel Article</h2>
            <form onSubmit={handleFormSubmit}>
              <div className="form-group">
                <label>Titre:</label>
                <input
                  type="text"
                  name="title"
                  value={newArticle.title}
                  onChange={handleInputChange}
                  required
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
                />
              </div>

              <button type="submit" className="submit-post-button">
                Publier l'article
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="articles-container">
        {articles.map((article, index) => (
          <div key={index} className="article-card">
            <Link to={`/article/${index}`} className="article-link">
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
                    onClick={(e) => handleBookmark(index, e)}
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