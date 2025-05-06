from flask import Blueprint, request, jsonify
from ..services.newsapi_service import NewsAPIService

bp = Blueprint("news", __name__, url_prefix="/news")


@bp.route("/headlines", methods=["GET"])
def get_headlines():
    """Fetch top headlines."""
    country = request.args.get("country", "us")  # Default to US
    page_size = int(request.args.get("page_size", 5))

    results = NewsAPIService.get_top_headlines(country, page_size)
    return jsonify(results)


@bp.route("/search", methods=["GET"])
def search_news():
    """Search news headlines."""
    data = request.get_json()
    query = data.get("query")
    if not query:
        return jsonify({"error": "Query parameter is required"}), 400

    page_size = int(data.get("page_size", 5))
    results = NewsAPIService.search_headlines(query, page_size)
    return jsonify(results)

@bp.route("/fetch-content", methods=["POST"])
def fetch_content():
    data = request.json
    url = data.get("url")

    if not url:
        return jsonify({"error": "URL parameter is required"}), 400

    full_content = NewsAPIService.fetch_full_content(url)
    
    if full_content:
        return jsonify({"content": full_content}), 200
    return jsonify({"error": "Failed to retrieve content"}), 500
