from flask import Blueprint, request, jsonify
from bson import ObjectId
from ..models.article import Article

bp = Blueprint("articles", __name__, url_prefix="/articles")

@bp.route("/", methods=["GET"])
def get_articles():
    """Retrieve all articles."""
    articles = Article.get_all()
    return jsonify(articles), 200

@bp.route("/<article_id>", methods=["GET"])
def get_article(article_id):
    """Retrieve a single article by ID."""
    article = Article.get_by_id(article_id)
    if article:
        return jsonify(article), 200
    return jsonify({"error": "Article not found"}), 404

@bp.route("/", methods=["POST"])
def create_article():
    """Create a new article."""
    data = request.json
    required_fields = ["title", "content", "source_url", "ai_score"]

    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing required fields"}), 400

    article = Article(
        title=data["title"],
        content=data["content"],
        source_url=data["source_url"],
        ai_score=data["ai_score"],
        user_id=data.get("user_id")
    )
    article_id = article.save()
    return jsonify({"message": "Article created", "article_id": article_id}), 201

@bp.route("/<article_id>", methods=["PUT"])
def update_article(article_id):
    """Update an article by ID."""
    data = request.json
    article = Article(
        title=data.get("title", ""),
        content=data.get("content", ""),
        source_url=data.get("source_url", ""),
        ai_score=data.get("ai_score", 0),
        user_id=data.get("user_id")
    )
    updated_article = article.update(article_id)
    
    if updated_article:
        return jsonify({"message": "Article updated successfully"}), 200
    return jsonify({"error": "Article not found"}), 404

@bp.route("/<article_id>", methods=["DELETE"])
def delete_article(article_id):
    """Delete an article by ID."""
    success = Article.delete(article_id)
    if success:
        return jsonify({"message": "Article deleted successfully"}), 200
    return jsonify({"error": "Article not found"}), 404
