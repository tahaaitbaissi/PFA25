import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './styles/ArticleDetail.css';
import { CircularProgress } from '@mui/material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const ArticleDetail = () => {
  // --- Debug Log: Component Render Start ---
  console.log('ArticleDetail component rendering...');

  const { id } = useParams();
  const navigate = useNavigate();

  const [article, setArticle] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true); // Initial loading state for article/comments
  const [error, setError] = useState('');
  const [showComments, setShowComments] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isUserLoading, setIsUserLoading] = useState(true); // Initial user loading state

  // --- FIX: Use hardcoded API_URL instead of process.env ---
  const API_URL = 'http://localhost:5000'; // <-- Hardcoded backend URL
  console.log('API_URL:', API_URL); // Debug Log: Check API_URL value


  // Effect to fetch Article and Comments
  useEffect(() => {
    // --- Debug Log: Inside first useEffect ---
    console.log('useEffect [id, navigate, API_URL] triggered. Fetching article and comments...');

    const fetchData = async () => {
      // --- Debug Log: Inside fetchData async function ---
      console.log('fetchData() called.');
      setLoading(true); // Ensure loading is true when starting fetch
      setError(''); // Clear previous errors

      try {
        // --- Debug Log: Attempting to get token for article/comments ---
        console.log('Attempting to get token from localStorage...');
        const token = localStorage.getItem('token');
        console.log('Token:', token ? 'Found' : 'Not Found');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        console.log('Request Headers:', headers);


        // --- Debug Log: Making axios calls for article and comments ---
        console.log(`Making GET request to ${API_URL}/articles/${id}`);
        console.log(`Making GET request to ${API_URL}/comments/${id}`);

        const [articleRes, commentsRes] = await Promise.all([
          axios.get(`${API_URL}/articles/${id}`, { headers }),
          axios.get(`${API_URL}/comments/${id}`, { headers })
        ]);

        // --- Debug Log: Article and comments fetched successfully ---
        console.log('Article and comments fetched successfully.');
        console.log('Article Data:', articleRes.data);
        console.log('Comments Data:', commentsRes.data);


        setArticle(articleRes.data);
        setComments(commentsRes.data.comments || []);
        // setError is cleared at the start of try block

      } catch (err) {
        // --- Debug Log: Error fetching article/comments ---
        console.error('Error fetching article/comments:', err);

        setError(err.response?.data?.error || 'Erreur de chargement des données');
        if (err.response?.status === 404) {
             console.log('Navigating to /404 due to 404 status.');
             navigate('/404');
             // No need to set loading to false here, as navigation will unmount the component
        } else {
             // Handle other errors, maybe display a message
             console.log('Setting loading to false due to non-404 error.');
             setLoading(false); // Ensure loading is set to false on error
        }
      } finally {
        // --- Debug Log: fetchData finally block ---
        console.log('fetchData() finally block.');
        // --- FIX: Set loading to false here unconditionally (unless navigated) ---
        // Only set loading to false if we didn't navigate away on a 404
        if (!error || error.response?.status !== 404) {
             setLoading(false);
             console.log('setLoading(false) called in finally.');
        } else {
             console.log('setLoading(false) skipped in finally due to 404 navigation.');
        }
      }
    };

    // Call fetchData when component mounts or id/API_URL changes
    fetchData();

     // --- Debug Log: End of first useEffect ---
    console.log('End of useEffect [id, navigate, API_URL].');

  }, [id, navigate, API_URL, error]); // Added 'error' to dependencies to re-evaluate finally logic


  // Effect to fetch current user ID if token exists (for comment deletion check)
  useEffect(() => {
     // --- Debug Log: Inside second useEffect ---
    console.log('useEffect [API_URL] triggered. Fetching user ID...');

    const fetchUserId = async () => {
       // --- Debug Log: Inside fetchUserId async function ---
       console.log('fetchUserId() called.');
      setIsUserLoading(true); // Ensure user loading is true when starting fetch
      const token = localStorage.getItem('token');
      console.log('Token for user ID fetch:', token ? 'Found' : 'Not Found');

      if (token) {
        try {
           // --- Debug Log: Making axios call for user profile ---
           console.log(`Making GET request to ${API_URL}/user_auth/profile`);
          // Assuming you have a profile endpoint that returns user data including _id
          const response = await axios.get(`${API_URL}/user_auth/profile`, {
            headers: { Authorization: `Bearer ${token}` }
          });
           // --- Debug Log: User profile fetched successfully ---
           console.log('User profile fetched successfully.');
           console.log('Full User Profile Data:', response.data); // Log full data for inspection

          // Assuming the user object in the response has an _id field
          // Check if response.data has an _id directly or a 'user' object with _id
          let fetchedUserId = null;
          if (response.data && response.data._id) {
              fetchedUserId = response.data._id; // Case 1: _id is at top level
              console.log('User ID found at top level:', fetchedUserId); // Debug Log
          } else if (response.data && response.data.user && response.data.user._id) {
              fetchedUserId = response.data.user._id; // Case 2: _id is nested under 'user'
              console.log('User ID found nested under user:', fetchedUserId); // Debug Log
          } else {
              console.warn('User profile data missing expected _id structure.', response.data); // Debug Log
          }

          setCurrentUserId(fetchedUserId);

        } catch (err) {
          // --- Debug Log: Error fetching user profile ---
          console.error('Error fetching user profile for comment auth:', err);
          // Handle error fetching user profile (e.g., token invalid/expired)
          // Optionally, clear token and redirect to login, but don't block article view
          // localStorage.removeItem('token');
          // navigate('/auth'); // This might be too aggressive, consider just disabling comment features
          setCurrentUserId(null); // Ensure ID is null on error
        }
      } else {
          console.log('No token found, currentUserId remains null.'); // Debug Log
          setCurrentUserId(null); // Ensure ID is null if no token
      }
      // --- Debug Log: Setting isUserLoading to false ---
      console.log('Setting isUserLoading to false.');
      setIsUserLoading(false); // User loading is complete (either found ID or no token)
    };

    // Call fetchUserId when component mounts or API_URL changes
    fetchUserId();

    // --- Debug Log: End of second useEffect ---
    console.log('End of useEffect [API_URL].');

  }, [API_URL]); // Dependency array: run when API_URL changes

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) {
        setError('Commentaire ne peut pas être vide.');
        console.log('Comment is empty.'); // Debug Log
        return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
        setError('Vous devez être connecté pour commenter.');
        console.log('No token found for adding comment.'); // Debug Log
        return;
    }

    // --- Debug Log: Attempting to add comment ---
    console.log(`Attempting to add comment for article ${id}.`);

    try {
      const response = await axios.post(
        `${API_URL}/comments/add`,
        { article_id: id, content: newComment },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // --- Debug Log: Comment added successfully ---
      console.log('Comment added successfully:', response.data);

      // Assuming backend returns the newly created comment with _id and author info (including user_id)
      // Add the new comment to the state
      setComments([...comments, response.data.comment]);
      setNewComment('');
      setError(''); // Clear any previous errors
    } catch (err) {
      // --- Debug Log: Error adding comment ---
      console.error('Error adding comment:', err);
      setError(err.response?.data?.error || 'Échec de l\'ajout du commentaire');
    }
  };

  const handleDeleteComment = async (commentId) => {
     const token = localStorage.getItem('token');
     if (!token) {
        setError('Vous devez être connecté pour supprimer un commentaire.');
        console.log('No token found for deleting comment.'); // Debug Log
        return;
    }

    // --- Debug Log: Attempting to delete comment ---
    console.log(`Attempting to delete comment ${commentId}.`);

    try {
      await axios.delete(`${API_URL}/comments/delete/${commentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // --- Debug Log: Comment deleted successfully ---
      console.log(`Comment ${commentId} deleted successfully.`);


      setComments(comments.filter(comment => comment._id !== commentId));
      setError(''); // Clear any previous errors
    } catch (err) {
      // --- Debug Log: Error deleting comment ---
      console.error('Error deleting comment:', err);
      setError(err.response?.data?.error || 'Échec de la suppression du commentaire');
    }
  };

  const formatDate = (dateString) => {
    try {
      // Check if dateString is valid before formatting
      if (!dateString) return 'Date inconnue';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Date invalide';
      // Using 'yyyy' for the year
      return format(date, 'd MMM yyyy à HH:mm', { locale: fr }); // Added year
    } catch {
      return 'Date inconnue';
    }
  };

  // --- Debug Log: State values before conditional rendering ---
  console.log('Render decision state:', { loading, isUserLoading, error, article: !!article });


  // Show loading if either article/comments or user is loading
  if (loading || isUserLoading) {
    // --- Debug Log: Showing Loading State ---
    console.log('Showing loading state...');
    return (
      <div className="loading-container">
        <CircularProgress />
        <p>Chargement en cours...</p>
      </div>
    );
  }

  // Then check for error state (only show error if no article was loaded)
  if (error && !article) {
     // --- Debug Log: Showing Error State ---
    console.log('Showing error state:', error);
    return (
      <div className="error-message">
         {error}
         {/* Optionally add a retry button or link */}
         {/* Note: If the error is a 404 leading to navigate('/404'), this error state might not be reached */}
         <button onClick={() => {
             console.log('Retry button clicked.'); // Debug Log
             // A simple page refresh is the easiest way to retry fetching everything
             window.location.reload();
         }}>Réessayer</button>
      </div>
    );
  }

  // Finally, check if article data is available
  if (!article) {
    // --- Debug Log: Article not found state ---
    console.log('Showing Article not found state.');
    // This case might be redundant if 404 is handled in fetchData, but good as a fallback
    return <div className="not-found">Article non trouvé</div>;
  }

  // --- Debug Log: Rendering Article Detail ---
  console.log('Rendering Article Detail...');
  console.log('Article data:', article);
  console.log('Comments data:', comments);
  console.log('Current User ID:', currentUserId);


  return (
    <div className="article-detail-container">
      <article className="main-article">
        <h1 className="article-title">{article.title || 'Titre inconnu'}</h1> {/* Fallback for title */}

        {article.image && (
          <img
            src={article.image}
            alt={article.title || 'Image de l\'article'}
            className="article-image"
            onError={(e) => { e.target.style.display = 'none'; console.warn('Image failed to load:', e.target.src); }} // Log image load errors
          />
        )}

        <div className="article-meta">
          <span className="publication-date">
            Publié le {formatDate(article.date_soumission)} {/* Added label */}
          </span>
          {/* Check if ai_score is a number before displaying */}
          {typeof article.ai_score === 'number' && (
             <span className="ai-score">
               Fiabilité IA : {(article.ai_score * 100).toFixed(0)}%
             </span>
          )}
        </div>

        <div className="article-content">
          <p className="article-text">{article.content || 'Contenu non disponible.'}</p> {/* Fallback for content */}

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
                      {/* Access author username, provide fallback */}
                      <span className="comment-author">{comment.author?.username || 'Anonyme'}</span>
                      <span className="comment-date">{formatDate(comment.created_at)}</span> {/* Assuming comment has created_at */}
                    </div>
                    <p className="comment-content">{comment.content}</p>
                    {/* Show delete button if currentUserId matches comment.user_id */}
                    {currentUserId && comment.user_id && currentUserId === comment.user_id && (
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

            {/* Only show comment form if a token exists in localStorage */}
            {localStorage.getItem('token') ? (
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
            ) : (
                <p className="login-to-comment">Connectez-vous pour laisser un commentaire.</p>
            )}

          </div>
        ) : (
          <div className="reddit-posts-section">
            {article.related_reddit_posts?.length > 0 ? (
              article.related_reddit_posts.map((post, index) => (
                <a
                  key={index} // Using index as key is okay if list order is stable and items are not added/removed/reordered
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="reddit-post-card"
                >
                  <h4 className="reddit-post-title">{post.title || 'Untitled Reddit Post'}</h4> {/* Fallback */}
                  <div className="reddit-post-meta">
                    <span className="subreddit">r/{post.subreddit || 'Unknown Subreddit'}</span> {/* Fallback */}
                    <div className="engagement-metrics">
                      <span className="upvotes">▲ {post.upvotes || 0}</span> {/* Fallback */}
                      <span className="comments">💬 {post.comments || 0}</span> {/* Fallback */}
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
