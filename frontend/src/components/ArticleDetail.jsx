import React, { useState, useEffect } from 'react'; // Import useEffect
import { useParams, useNavigate } from 'react-router-dom'; // Import useNavigate
import axios from 'axios'; // Import axios
import "./styles/ArticleDetail.css";
import { CircularProgress } from '@mui/material'; // Import CircularProgress for loading

const ArticleDetail = () => { // Removed 'articles' prop as data will be fetched
  const { id } = useParams();
  const navigate = useNavigate(); // For redirection if article not found
  const [article, setArticle] = useState(null); // State to hold fetched article data
  const [loading, setLoading] = useState(true); // State for loading indicator
  const [error, setError] = useState(null); // State for error handling

  // Local state for comments - Note: This is client-side only as no backend endpoints provided for comments
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  // const [commentAuthor, setCommentAuthor] = useState(''); // Commented out as in original code
  const [showComments, setShowComments] = useState(true);

  const API_URL = 'http://localhost:5000/articles'; // Base URL for article endpoints

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        setLoading(true); // Start loading
        const response = await axios.get(`${API_URL}/${id}`);
        console.log(response);
        setArticle(response.data);
        // Assuming the fetched article data includes a 'comments' array
        setComments(response.data.comments || []); // Initialize local comments state
        setError(null); // Clear any previous errors
      } catch (err) {
        console.error("Error fetching article:", err);
        setError("Impossible de charger l'article."); // Set error message
        setArticle(null); // Clear article data
        // Optionally redirect if article not found (e.g., 404 error)
        if (err.response && err.response.status === 404) {
             navigate('/not-found'); // Redirect to a not-found page
        }
      } finally {
        setLoading(false); // End loading
      }
    };

    if (id) { // Only fetch if id is available
      fetchArticle();
    }

  }, [id, navigate, API_URL]); // Rerun effect if id changes

  // Handle adding a comment (still client-side)
  const handleAddComment = (e) => {
    e.preventDefault();
    // Using a placeholder author since the input is commented out
    const author = "Anonyme"; // Or get from authenticated user if available globally
    if (newComment.trim() && author.trim()) {
      const comment = {
        // Generate a unique ID for the comment (client-side only)
        id: Date.now(),
        author: author,
        content: newComment.trim(),
        date: new Date().toISOString() // Use ISO string for consistent date format
      };
      setComments([...comments, comment]);
      setNewComment('');
      // setCommentAuthor(''); // Commented out
      // Note: To make comments persistent, you would need a backend endpoint here
      // to save the new comment to the database.
    }
  };

  // Format date function
  const formatDate = (dateInput) => {
    // Handle potential date formats from backend, including the $date object
    let dateString;
    if (dateInput && typeof dateInput === 'object' && dateInput.$date) {
        dateString = dateInput.$date;
    } else if (typeof dateInput === 'string') {
        dateString = dateInput;
    } else {
        return "Date invalide"; // Handle unexpected date formats
    }

    try {
      const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      };
      return new Date(dateString).toLocaleDateString('fr-FR', options);
    } catch (e) {
      console.error("Error formatting date:", e);
      return "Date invalide"; // Return error message if date parsing fails
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className="article-detail loading">
        <CircularProgress />
        <p>Chargement de l'article...</p>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="article-detail error">
        <p>{error}</p>
      </div>
    );
  }

  // Render article not found state (after loading and no error, but article is null)
  if (!article) {
    return <div className="article-detail not-found">Article non trouvé</div>;
  }

  // Render article details
  return (
    <div className="article-detail">
      <h1>{article.title}</h1>
      {/* Add a check for article.image before rendering */}
      {article.image && <img src={article.image} alt={article.title} className="detail-image" />}
      <div className="article-meta">
        {/* Assuming author might be available in fetched data */}
        {/* {article.author && <span>Publié par: {article.author}</span>} */}
        {/* Access $date property if date_soumission is an object */}
        <span>Date: {formatDate(article.date_soumission)}</span>
        {/* Ensure ai_score is a number beforetoFixed */}
        <span>Score IA: {typeof article.ai_score === 'number' ? (article.ai_score * 100).toFixed(0) : 'N/A'}%</span>
      </div>
      <div className="article-content">
        {/* Render HTML content if needed, otherwise use p tags */}
        {/* <div dangerouslySetInnerHTML={{ __html: article.content }} /> */}
        <p>{article.content}</p>
        {/* Add checks before rendering summary and keywords */}
        {article.summary && (
          <>
            <h3>Résumé:</h3>
            <p>{article.summary}</p>
          </>
        )}
        {article.keywords?.length > 0 && (
          <>
            <h3>Mots-clés:</h3>
            <ul className="keywords-list">
              {/* Use keyword string as key, assuming keywords are strings */}
              {article.keywords.map((keyword, index) => (
                <li key={keyword || index} className="keyword-item">{keyword}</li>
              ))}
            </ul>
          </>
        )}
      </div>
      {/* Add a check for source_url before rendering */}
      {article.source_url && (
        <a href={article.source_url} target="_blank" rel="noopener noreferrer" className="original-article-link">
          Lire l'article original
        </a>
      )}


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
              {/* Use comment.id as key */}
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
            {/* Comment author input is commented out */}
{/* <div className="form-group">
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
          {article.related_reddit_posts?.length > 0 ? ( // Add check for length
            article.related_reddit_posts.map((post, index) => (
              <div key={post.url || index} className="reddit-post"> {/* Use post.url as key if unique, fallback to index */}
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
            ))
          ) : (
            <p className="no-reddit-posts">Aucune discussion Reddit trouvée pour cet article.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default ArticleDetail;
