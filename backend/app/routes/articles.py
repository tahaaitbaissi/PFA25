from flask import Blueprint, request, jsonify
from ..services.article_service import ArticleService
# from flask import g # g is typically used for request-specific data, but current_user from token_required is more direct for authentication
from flask import current_app
from .common_auth import token_required # Assuming common_auth.py contains the token_required decorator
from bson.errors import InvalidId # Import for potential ID validation in paths

bp = Blueprint("articles", __name__, url_prefix="/articles")

@bp.route("/", methods=["GET"])
def get_articles():
    """Retrieve all articles."""
    try:
        articles = ArticleService.get_all_articles()
        return jsonify(articles), 200
    except Exception as e:
        current_app.logger.error(f"Error retrieving all articles: {str(e)}", exc_info=True)
        return jsonify({"error": "Failed to retrieve articles"}), 500


@bp.route("/<article_id>", methods=["GET"])
def get_article(article_id):
    """Retrieve a single article by ID."""
    try:
        # Optional: Validate article_id format if using ObjectId
        # ObjectId(article_id)
        article, error = ArticleService.get_article_by_id(article_id)
        if error:
            return jsonify({"error": error}), 404
        return jsonify(article), 200
    except InvalidId:
         return jsonify({"error": "Invalid article ID format"}), 400
    except Exception as e:
        current_app.logger.error(f"Error retrieving article {article_id}: {str(e)}", exc_info=True)
        return jsonify({"error": "Failed to retrieve article"}), 500


@bp.route("/", methods=["POST"])
@token_required # Requires authentication
def create_article(current_user):
    """Create a new article."""
    data = request.json
    # Pass the authenticated user object to the service
    article_id, error = ArticleService.create_article(data, user=current_user)

    if error:
        current_app.logger.error(f"Error creating article for user {current_user.get('_id')}: {error}")
        return jsonify({"error": error}), 400

    # Optionally, add user points for creating an article
    # User.add_points(current_user["_id"], points_for_creating_article)

    return jsonify({"message": "Article created", "article_id": article_id}), 201


@bp.route("/<article_id>", methods=["PUT"])
@token_required # Requires authentication
def update_article(current_user, article_id):
    """Update an existing article."""
    data = request.json
    try:
        # Optional: Validate article_id format
        # ObjectId(article_id)
        # Pass the authenticated user object for authorization check within the service
        success, error = ArticleService.update_article(article_id, data, user=current_user)

        if error:
            current_app.logger.error(f"Error updating article {article_id} by user {current_user.get('_id')}: {error}")
            # Return 403 if authorization failed within the service
            if "authorized" in error.lower(): # Assuming service returns an error message indicating auth failure
                 return jsonify({"error": error}), 403
            return jsonify({"error": error}), 400

        if success:
             return jsonify({"message": "Article updated successfully"}), 200
        else:
             # This case might be redundant if the service returns an error string on failure
             return jsonify({"error": "Article not found or no changes made"}), 404

    except InvalidId:
         return jsonify({"error": "Invalid article ID format"}), 400
    except Exception as e:
        current_app.logger.error(f"Unexpected error updating article {article_id} by user {current_user.get('_id')}: {str(e)}", exc_info=True)
        return jsonify({"error": "Failed to update article"}), 500


@bp.route("/<article_id>", methods=["DELETE"])
@token_required # Requires authentication
def delete_article(current_user, article_id):
    """Delete an article."""
    try:
        # Optional: Validate article_id format
        # ObjectId(article_id)
        # Pass the authenticated user object for authorization check within the service
        success, error = ArticleService.delete_article(article_id, user=current_user)

        if error:
            current_app.logger.error(f"Error deleting article {article_id} by user {current_user.get('_id')}: {error}")
            # Return 403 if authorization failed within the service
            if "authorized" in error.lower(): # Assuming service returns an error message indicating auth failure
                 return jsonify({"error": error}), 403
            return jsonify({"error": error}), 400

        if success:
            return jsonify({"message": "Article deleted successfully"}), 200
        else:
            # This case might be redundant if the service returns an error string on failure
             return jsonify({"error": "Article not found"}), 404

    except InvalidId:
         return jsonify({"error": "Invalid article ID format"}), 400
    except Exception as e:
        current_app.logger.error(f"Unexpected error deleting article {article_id} by user {current_user.get('_id')}: {str(e)}", exc_info=True)
        return jsonify({"error": "Failed to delete article"}), 500


# --- OpenSearch Endpoints ---
# These endpoints generally don't require authentication to search or view public data
@bp.route("/basic-search", methods=["GET"])
def basic_search_articles():
    """Basic search articles by title or keywords using OpenSearch."""
    query = request.args.get("q", "").strip()
    if not query:
        return jsonify({"error": "Query parameter 'q' is required"}), 400

    try:
        articles = ArticleService.search_articles(query) # Assuming this method uses basic search
        return jsonify(articles), 200
    except Exception as e:
        current_app.logger.error(f"Error during basic search for query '{query}': {str(e)}", exc_info=True)
        return jsonify({"error": "Failed to perform search"}), 500


@bp.route("/search", methods=["GET"])
def search_articles():
    """Primary search endpoint using OpenSearch"""
    query = request.args.get("q", "").strip()
    # Potentially other search parameters from request.args
    # filter_param = request.args.get("filter")
    # ...

    if not query:
        return jsonify({"error": "Query parameter 'q' is required"}), 400

    try:
        # Assuming ArticleService.search_articles can handle more complex search logic
        # based on additional parameters passed or internally
        articles = ArticleService.search_articles(query)
        return jsonify(articles), 200
    except Exception as e:
        current_app.logger.error(f"Error during primary search for query '{query}': {str(e)}", exc_info=True)
        return jsonify({"error": "Failed to perform search"}), 500


@bp.route("/recommended", methods=["GET"])
@token_required # Requires authentication to get user-specific recommendations
def get_recommended_articles(current_user):
    """Retrieve recommended articles based on user ID using OpenSearch."""
    # Get user ID from the authenticated user object
    user_id = str(current_user.get("_id")) # Ensure it's a string if needed by service

    # No need to check request.args.get("user_id") anymore as it comes from the token

    try:
        articles = ArticleService.get_recommended_articles(user_id)
        return jsonify(articles), 200
    except Exception as e:
        current_app.logger.error(f"Error retrieving recommended articles for user {user_id}: {str(e)}", exc_info=True)
        return jsonify({"error": "Failed to retrieve recommendations"}), 500


@bp.route("/similar/<article_id>", methods=["GET"])
def get_similar_articles(article_id):
    """Find similar articles using OpenSearch MLT."""
    try:
        # Optional: Validate article_id format
        # ObjectId(article_id)
        # Use the class method to get the OpenSearchService instance
        os_service = ArticleService.get_opensearch() # Assuming this returns the OpenSearch service instance
        similar_articles = os_service.find_similar(article_id)
        return jsonify(similar_articles), 200
    except InvalidId:
         return jsonify({"error": "Invalid article ID format"}), 400
    except Exception as e:
        current_app.logger.error(f"Error finding similar articles for {article_id}: {str(e)}", exc_info=True)
        return jsonify({"error": "Failed to retrieve similar articles"}), 500

@bp.route("/stats/keywords", methods=["GET"])
def get_keyword_stats():
    """Get keyword statistics from OpenSearch."""
    try:
        os_service = ArticleService.get_opensearch() # Assuming this returns the OpenSearch service instance
        response = os_service.os.search( # Access the underlying os client
            index="articles", # Ensure index name is correct
            body={
                "size": 0,
                "aggs": {
                    "popular_keywords": {
                        "terms": {
                            "field": "keywords.keyword", # Use .keyword for exact terms aggregation if keywords are analyzed
                            "size": 10 # Top 10 popular keywords
                        }
                    },
                    "fake_news_keywords": {
                        "terms": {
                            "field": "keywords.keyword", # Use .keyword for exact terms aggregation
                            "size": 10,
                            "order": { "avg_ai_score": "desc" } # Order by average AI score
                        },
                        "aggs": {
                            "avg_ai_score": {
                                "avg": {"field": "ai_score"} # Assuming 'ai_score' is a numeric field
                            }
                        }
                    }
                    # Add other potential aggregations like average readability_score per keyword, etc.
                }
            }
        )

        if "aggregations" in response:
             return jsonify(response["aggregations"]), 200
        else:
             current_app.logger.warning("OpenSearch keyword stats query returned no aggregations.")
             return jsonify({"message": "No keyword statistics found"}), 200

    except Exception as e:
        current_app.logger.error(f"Error getting keyword statistics from OpenSearch: {str(e)}", exc_info=True)
        return jsonify({"error": "Failed to retrieve keyword statistics"}), 500
    
@bp.route("/my-articles", methods=["GET"])
@token_required # Requires authentication to identify the user
def get_my_articles(current_user):
    """Retrieve all articles created by the authenticated user."""
    try:
        # Get the user ID from the authenticated user object
        user_id = str(current_user.get("_id")) # Ensure it's a string compatible with your service layer

        if not user_id:
             current_app.logger.error("Authenticated user object missing '_id' field.")
             return jsonify({"error": "Could not identify user"}), 500

        articles, error = ArticleService.get_articles_by_user(user_id)

        if error:
             current_app.logger.error(f"Error retrieving articles for user {user_id}: {error}")
             return jsonify({"error": error}), 500 # Or 404 if the error specifically means user found but no articles

        # If no articles are found, an empty list is usually returned, which is fine for 200
        return jsonify(articles), 200

    except Exception as e:
        # Log unexpected errors
        user_id_log = str(current_user.get("_id", "unknown")) # Handle case where _id might be missing in exception
        current_app.logger.error(f"Unexpected error retrieving articles for user {user_id_log}: {str(e)}", exc_info=True)
        return jsonify({"error": "Failed to retrieve your articles"}), 500