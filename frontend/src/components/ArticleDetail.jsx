import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import './styles/ArticleDetail.css';
import { CircularProgress } from '@mui/material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const ArticleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [article, setArticle] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showComments, setShowComments] = useState(true);

  const API_URL = process.env.REACT_APP_API_URL;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [articleRes, commentsRes] = await Promise.all([
          axios.get(`${API_URL}/articles/${id}`),
          axios.get(`${API_URL}/comments/${id}`)
        ]);
        
        setArticle(articleRes.data);
        setComments(commentsRes.data.comments);
      } catch (err) {
        setError(err.response?.data?.error || 'Erreur de chargement des données');
        if (err.response?.status === 404) navigate('/404');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate, API_URL]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/comments/add`,
        { article_id: id, content: newComment },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setComments([...comments, response.data.comment]);
      setNewComment('');
    } catch (err) {
      setError(err.response?.data?.error || 'Échec de l\'ajout du commentaire');
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/comments/delete/${commentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setComments(comments.filter(comment => comment._id !== commentId));
    } catch (err) {
      setError(err.response?.data?.error || 'Échec de la suppression du commentaire');
    }
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'd MMM yyyy à HH:mm', { locale: fr });
    } catch {
      return 'Date inconnue';
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <CircularProgress />
        <p>Chargement en cours...</p>
      </div>
    );
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!article) {
    return <div className="not-found">Article non trouvé</div>;
  }

  return (
    <div className="article-detail-container">
      <article className="main-article">
        <h1 className="article-title">{article.title}</h1>
        
        {article.image && (
          <img 
            src={article.image} 
            alt={article.title} 
            className="article-image"
            onError={(e) => e.target.style.display = 'none'}
          />
        )}

        <div className="article-meta">
          <span className="publication-date">
            {formatDate(article.date_soumission)}
          </span>
          <span className="ai-score">
            Fiabilité IA : {(article.ai_score * 100).toFixed(0)}%
          </span>
        </div>

        <div className="article-content">
          <p className="article-text">{article.content}</p>
          
          {article.summary && (
            <div className="article-summary">
              <h3>Résumé :</h3>
              <p>{article.summary}</p>
            </div>
          )}

          {article.keywords?.length > 0 && (
            <div className="keywords-section">
              <h3>Mots-clés :</h3>
              <div className="keywords-list">
                {article.keywords.map((keyword, index) => (
                  <span key={index} className="keyword-tag">{keyword}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {article.source_url && (
          <a
            href={article.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="source-link"
          >
            Lire l'article original
          </a>
        )}
      </article>

      <div className="interaction-section">
        <div className="section-switcher">
          <button
            className={`switch-button ${showComments ? 'active' : ''}`}
            onClick={() => setShowComments(true)}
          >
            Commentaires ({comments.length})
          </button>
          <button
            className={`switch-button ${!showComments ? 'active' : ''}`}
            onClick={() => setShowComments(false)}
          >
            Discussions Reddit ({article.related_reddit_posts?.length || 0})
          </button>
        </div>

        {showComments ? (
          <div className="comments-section">
            {comments.length === 0 ? (
              <p className="no-comments">Aucun commentaire pour le moment</p>
            ) : (
              <div className="comments-list">
                {comments.map((comment) => (
                  <div key={comment._id} className="comment-card">
                    <div className="comment-header">
                      <span className="comment-author">{comment.author?.username || 'Anonyme'}</span>
                      <span className="comment-date">{formatDate(comment.created_at)}</span>
                    </div>
                    <p className="comment-content">{comment.content}</p>
                    {user?._id === comment.user_id && (
                      <button
                        onClick={() => handleDeleteComment(comment._id)}
                        className="delete-comment-button"
                      >
                        Supprimer
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleAddComment} className="comment-form">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Écrivez votre commentaire..."
                className="comment-input"
                rows="4"
                required
              />
              <button type="submit" className="submit-comment-button">
                Publier
              </button>
            </form>
          </div>
        ) : (
          <div className="reddit-posts-section">
            {article.related_reddit_posts?.length > 0 ? (
              article.related_reddit_posts.map((post, index) => (
                <a
                  key={index}
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="reddit-post-card"
                >
                  <h4 className="reddit-post-title">{post.title}</h4>
                  <div className="reddit-post-meta">
                    <span className="subreddit">r/{post.subreddit}</span>
                    <div className="engagement-metrics">
                      <span className="upvotes">▲ {post.upvotes}</span>
                      <span className="comments">💬 {post.comments}</span>
                    </div>
                  </div>
                </a>
              ))
            ) : (
              <p className="no-reddit-posts">Aucune discussion Reddit trouvée</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ArticleDetail;