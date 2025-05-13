import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import './styles/SearchResults.css';

const SearchResults = () => {
  const location = useLocation();
  const { results = [], query = '' } = location.state || {};

  if (!results || results.length === 0) {
    return (
      <div className="search-results-container">
        <h2>Résultats de recherche pour "{query}"</h2>
        <p className="no-results">Aucun résultat trouvé.</p>
      </div>
    );
  }

  return (
    <div className="search-results-container">
      <h2>Résultats de recherche pour "{query}"</h2>
      <div className="results-grid">
        {results.map((article) => (
          <Link 
            to={`/article/${article._id}`} 
            key={article._id} 
            className="result-card"
          >
            {article.image && (
              <img 
                src={article.image} 
                alt={article.title}
                className="result-image"
              />
            )}
            <div className="result-content">
              <h3>{article.title}</h3>
              <p>{article.description?.substring(0, 150)}...</p>
              <div className="result-meta">
                <span>Par {article.author}</span>
                <span>{new Date(article.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default SearchResults;