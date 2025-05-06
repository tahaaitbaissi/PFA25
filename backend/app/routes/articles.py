from flask import Blueprint, request, jsonify
from ..services.article_service import ArticleService
from flask import g
from flask import current_app # Import current_app for logging

bp = Blueprint("articles", __name__, url_prefix="/articles")

@bp.route("/", methods=["GET"])
def get_articles():
    """Retrieve all articles."""
    articles = ArticleService.get_all_articles()
    return jsonify(articles), 200

@bp.route("/<article_id>", methods=["GET"])
def get_article(article_id):
    """Retrieve a single article by ID."""
    article, error = ArticleService.get_article_by_id(article_id)
    if error:
        return jsonify({"error": error}), 404
    return jsonify(article), 200

@bp.route("/", methods=["POST"])
def create_article():
    """Create a new article."""
    data = request.json
    article_id, error = ArticleService.create_article(data, user=g.get("user"))

    if error:
        current_app.logger.error(f"Error creating article: {error}")
        return jsonify({"error": error}), 400

    return jsonify({"message": "Article created", "article_id": article_id}), 201

@bp.route("/<article_id>", methods=["PUT"])
def update_article(article_id):
    """Update an existing article."""
    data = request.json
    success, error = ArticleService.update_article(article_id, data, user=g.get("user"))

    if error:
        current_app.logger.error(f"Error updating article {article_id}: {error}")
        return jsonify({"error": error}), 400

    return jsonify({"message": "Article updated successfully"}), 200

@bp.route("/<article_id>", methods=["DELETE"])
def delete_article(article_id):
    """Delete an article."""
    success, error = ArticleService.delete_article(article_id, user=g.get("user"))

    if error:
        current_app.logger.error(f"Error deleting article {article_id}: {error}")
        return jsonify({"error": error}), 400

    return jsonify({"message": "Article deleted successfully"}), 200

# --- OpenSearch Endpoints ---
@bp.route("/basic-search", methods=["GET"])
def basic_search_articles():
    """Basic search articles by title or keywords using OpenSearch."""
    query = request.args.get("q", "").strip()
    if not query:
        return jsonify({"error": "Query parameter 'q' is required"}), 400

    articles = ArticleService.search_articles(query)
    return jsonify(articles), 200

@bp.route("/search", methods=["GET"])
def search_articles():
    """Primary search endpoint using OpenSearch"""
    query = request.args.get("q", "").strip()
    if not query:
        return jsonify({"error": "Query parameter 'q' is required"}), 400

    articles = ArticleService.search_articles(query)
    return jsonify(articles), 200


@bp.route("/recommended", methods=["GET"])
def get_recommended_articles():
    """Retrieve recommended articles based on user ID using OpenSearch."""
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"error": "User ID is required"}), 400

    articles = ArticleService.get_recommended_articles(user_id)
    return jsonify(articles), 200


@bp.route("/similar/<article_id>", methods=["GET"])
def get_similar_articles(article_id):
    """Find similar articles using OpenSearch MLT."""
    try:
        # Use the class method to get the OpenSearchService instance
        os_service = ArticleService.get_opensearch()
        similar_articles = os_service.find_similar(article_id)
        return jsonify(similar_articles), 200
    except Exception as e:
        current_app.logger.error(f"Error finding similar articles for {article_id}: {str(e)}")
        return jsonify({"error": "Failed to retrieve similar articles"}), 500

@bp.route("/stats/keywords", methods=["GET"])
def get_keyword_stats():
    """Get keyword statistics from OpenSearch."""
    try:
        os_service = ArticleService.get_opensearch()
        response = os_service.os.search(
            index="articles",
            body={
                "size": 0,
                "aggs": {
                    "popular_keywords": {
                        "terms": {
                            "field": "keywords",
                            "size": 10 # Top 10 popular keywords
                        }
                    },
                    "fake_news_keywords": {
                        "terms": {
                            "field": "keywords",
                            "size": 10,
                        },
                        "aggs": {
                            "avg_ai_score": {
                                "avg": {"field": "ai_score"}
                            }
                        }
                    }
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

