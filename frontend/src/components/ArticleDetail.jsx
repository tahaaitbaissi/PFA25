import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import "./styles/ArticleDetail.css";

const ArticleDetail = ({ articles }) => {
  const { id } = useParams();
  const article = articles[parseInt(id)];
  
  const [comments, setComments] = useState(article.comments || []);
  const [newComment, setNewComment] = useState('');
  const [commentAuthor, setCommentAuthor] = useState('');
  const [showComments, setShowComments] = useState(true);

  if (!article) {
    return <div className="article-not-found">Article non trouvé</div>;
  }

  const handleAddComment = (e) => {
    e.preventDefault();
    if (newComment.trim() && commentAuthor.trim()) {
      const comment = {
        id: Date.now(),
        author: commentAuthor,
        content: newComment,
        date: new Date().toISOString()
      };
      setComments([...comments, comment]);
      setNewComment('');
      setCommentAuthor('');
    }
  };

  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  return (
    <div className="article-detail">
      <h1>{article.title}</h1>
      <img src={article.image} alt={article.title} className="detail-image" />
      <div className="article-meta">
        {/* <span>Publié par: {article.author}</span> */}
        <span>Date: {formatDate(article.date_soumission.$date)}</span>
        <span>Score IA: {(article.ai_score * 100).toFixed(0)}%</span>
      </div>
      <div className="article-content">
        <p>{article.content}</p>
        <h3>Résumé:</h3>
        <p>{article.summary}</p>
        <h3>Mots-clés:</h3>
        <ul className="keywords-list">
          {article.keywords?.map((keyword, index) => (
            <li key={index} className="keyword-item">{keyword}</li>
          ))}
        </ul>
      </div>
      <a href={article.source_url} target="_blank" rel="noopener noreferrer" className="original-article-link">
        Lire l'article original
      </a>

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
            <p className="no-comments">Soyez le premier à commenter cet article</p>
          ) : (
            <div className="comments-list">
              {comments.map((comment) => (
                <div key={comment.id} className="comment">
                  <div className="comment-content">
                    <p>{comment.content}</p>
                  </div>
                  <div className="comment-meta">
                    <span className="comment-author">{comment.author}</span>
                    <span className="comment-date">{formatDate(comment.date)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleAddComment} className="comment-form">
{/*             <div className="form-group">
              <input
                type="text"
                value={commentAuthor}
                onChange={(e) => setCommentAuthor(e.target.value)}
                placeholder="Votre nom"
                required
                className="author-input"
              />
            </div> */}
            <div className="form-group">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Votre commentaire..."
                required
                className="comment-textarea"
                rows="4"
              />
            </div>
            <button type="submit" className="submit-comment">
              Publier le commentaire
            </button>
          </form>
        </div>
      ) : (
        <div className="reddit-posts">
          {article.related_reddit_posts?.map((post, index) => (
            <div key={index} className="reddit-post">
              <a 
                href={post.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="reddit-post-link"
              >
                <h4>{post.title}</h4>
                <div className="reddit-meta">
                  <span>r/{post.subreddit}</span>
                  <span>▲ {post.upvotes} upvotes</span>
                  <span>💬 {post.comments} commentaires</span>
                </div>
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ArticleDetail;