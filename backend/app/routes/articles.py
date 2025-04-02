from flask import Blueprint, request, jsonify
from ..services.article_service import ArticleService
from flask import g

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
#    article_id, error = ArticleService.create_article(data, user=g.get("user"))
    article_id, error = ArticleService.create_article(data)

    if error:
        return jsonify({"error": error}), 400

    return jsonify({"message": "Article created", "article_id": article_id}), 201

@bp.route("/<article_id>", methods=["PUT"])
def update_article(article_id):
    """Update an existing article."""
    data = request.json
    success, error = ArticleService.update_article(article_id, data, user=g.get("user"))

    if error:
        return jsonify({"error": error}), 400

    return jsonify({"message": "Article updated successfully"}), 200

@bp.route("/<article_id>", methods=["DELETE"])
def delete_article(article_id):
    """Delete an article."""
    success, error = ArticleService.delete_article(article_id, user=g.get("user"))

    if error:
        return jsonify({"error": error}), 400

    return jsonify({"message": "Article deleted successfully"}), 200

@bp.route("/search", methods=["GET"])
def search_articles():
    """Search articles by title or keywords."""
    query = request.args.get("q", "").strip()
    if not query:
        return jsonify({"error": "Query parameter is required"}), 400

    articles = ArticleService.search_articles(query)
    return jsonify(articles), 200


@bp.route("/recommended", methods=["GET"])
def get_recommended_articles():
    """Retrieve recommended articles based on user ID."""
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"error": "User ID is required"}), 400

    articles = ArticleService.get_recommended_articles(user_id)
    return jsonify(articles), 200