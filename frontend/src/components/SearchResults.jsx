import React, { useEffect } from 'react'; // Import useEffect
import { useLocation, Link } from 'react-router-dom';
import './styles/SearchResults.css'; // Ensure this file exists and has styles

// Helper function to format date (optional, but good for display)
const formatArticleDate = (isoString) => {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return 'Invalid Date'; // Check for invalid date object
    return date.toLocaleDateString();
  } catch (e) {
    console.error("Error formatting date:", isoString, e);
    return 'Unknown Date';
  }
};

const SearchResults = () => {
  const location = useLocation();
  // Destructure results and query, providing default empty values
  const { results = [], query = '' } = location.state || {};

  // Log the received data to the console for inspection
  useEffect(() => {
    console.log('Search Results Component Mounted');
    console.log('Search Query:', query);
    console.log('Received Results:', results);

    if (results && results.length > 0) {
        console.log('--- First Search Result Data Check ---');
        console.log('Full Object:', results[0]);
        // Log specific fields from _source to verify names returned by backend
        const source = results[0]._source; // Get the _source object
        console.log('_id:', results[0]._id); // _id is often at the top level
        console.log('title:', source?.title); // Access from _source
        console.log('image:', source?.image); // Access from _source
        console.log('content (for preview):', source?.content); // Access from _source
        console.log('user_id (for author):', source?.user_id); // Access from _source
        console.log('date_soumission (for date):', source?.date_soumission); // Access from _source
        console.log('ai_score:', source?.ai_score); // Access from _source
        console.log('is_fake_label:', source?.is_fake_label); // Access from _source
        console.log('--- End First Search Result Data Check ---');
    } else if (results && results.length === 0) {
        console.log('Search returned 0 results.');
    } else {
        console.log('Results state is null or undefined.');
    }

  }, [results, query]); // Re-run effect if results or query change

  // Render message if no results or results is not an array/is empty
  if (!Array.isArray(results) || results.length === 0) {
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
        {/* Ensure article._id is a string for the key and URL */}
        {results.map((article) => {
            // Get the actual source data from the _source property
            const source = article._source || {}; // Use empty object as fallback

            return (
                <Link
                  to={`/article/${article._id}`} // _id is usually at the top level
                  key={article._id ? article._id.toString() : `article-${Math.random()}`} // Use toString() for ObjectId, add fallback key
                  className="result-card"
                >
                  {/* Display image, use fallback if missing or add onError */}
                  {source.image ? ( // Access image from source
                    <img
                      src={source.image} // Access image from source
                      alt={source.title || 'Article image'} // Access title from source for alt text
                      className="result-image"
                      onError={(e) => {
                         // Optional: Set a default placeholder image on error
                         e.target.src = 'https://via.placeholder.com/600x400?text=No+Image';
                         e.target.onerror = null; // Prevent infinite loop if placeholder also fails
                      }}
                    />
                  ) : (
                      // Optional: Display a placeholder div if no image URL
                      <div className="result-image-placeholder">No Image</div>
                  )}
                  <div className="result-content">
                    {/* Display title, provide fallback if missing */}
                    <h3>{source.title || 'Untitled Article'}</h3> {/* Access title from source */}
                    {/* Display content preview, handle missing or short content */}
                    <p className="content-preview">
                      {/* Use source.content for the preview */}
                      {source.content
                        ? `${source.content.substring(0, 150)}${source.content.length > 150 ? '...' : ''}`
                        : 'No content preview available.' // Fallback text
                      }
                    </p>
                    <div className="result-meta">
                      {/* Display author (using user_id as placeholder or 'User'), provide fallback */}
                      {/* Use source.user_id as the primary indicator of the author */}
                      <span>Par {source.user_id ? `User ID: ${source.user_id}` : source.author || 'Unknown Author'}</span> {/* Access user_id/author from source */}
                      {/* Display date, handle missing or invalid dates */}
                      <span>
                        {/* Use source.date_soumission for the date */}
                        {source.date_soumission // Access date_soumission from source
                          ? formatArticleDate(source.date_soumission)
                          : 'Unknown Date'}
                      </span>
                    </div>
                  </div>
                </Link>
            );
        })}
      </div>
    </div>
  );
};

export default SearchResults;
