from bson import ObjectId
from ..models.article import Article
from flask import current_app
import requests
from typing import Optional, Tuple, Dict, Any, List


class ArticleService:
    @staticmethod
    def get_all_articles() -> List[Dict[str, Any]]:
        """Retrieve all articles."""
        return Article.get_all()

    @staticmethod
    def get_article_by_id(article_id: str) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
        """Retrieve an article by its ID."""
        if not ObjectId.is_valid(article_id):
            return None, "Invalid article ID format"

        article = Article.get_by_id(article_id)
        if not article:
            return None, "Article not found"

        return article, None

    @staticmethod
    def _validate_title(title: str) -> bool:
        return len(title) >= 5

    @staticmethod
    def _validate_url(url: str) -> bool:
        return url.startswith(("http://", "https://"))

    @staticmethod
    def _analyze_content(content: str) -> Optional[Dict[str, Any]]:
        """Send content to AI service to calculate score, generate summary, and extract keywords."""
        try:
            response = requests.post("http://localhost:8000/analyze", json={"text": content})
            response.raise_for_status()
            data = response.json()
            return {
                "score": data.get("score"),
                "summary": data.get("summary", "Summary not available"),
                "keywords": data.get("keywords", [])
            }
        except requests.RequestException as e:
            current_app.logger.error(f"Error analyzing content: {str(e)}")
            return None

    @staticmethod
    def create_article(data: Dict[str, Any], user: Optional[Dict[str, Any]] = None) -> Tuple[Optional[str], Optional[str]]:
        """Validate and create a new article with AI-generated fields."""
        required_fields = ["title", "content", "source_url"]

        # Validate input data
        if not all(field in data for field in required_fields):
            return None, "Missing required fields"

        if not ArticleService._validate_title(data["title"]):
            return None, "Title must be at least 5 characters long"

        if not ArticleService._validate_url(data["source_url"]):
            return None, "Invalid source URL"

        # Analyze content
        analysis = ArticleService._analyze_content(data["content"])
        if analysis is None:
            return None, "Failed to analyze content"

        # Prepare AI data
        scoreai_score = analysis["score"]
        summary = analysis["summary"]
        keywords = analysis["keywords"]

        user_id = user["_id"] if user else None

        # Create article instance
        article = Article(
            title=data["title"].strip(),
            content=data["content"].strip(),
            source_url=data["source_url"],
        scoreai_score=score,
            user_id=user_id,
            summary=summary,
            keywords=keywords,
        )

        # Save to database
        try:
            article_id = article.save()
            return article_id, None
        except Exception as e:
            current_app.logger.error(f"Error saving article: {str(e)}")
            return None, "Internal server error"

    @staticmethod
    def update_article(article_id: str, data: Dict[str, Any], user: Optional[Dict[str, Any]] = None) -> Tuple[Optional[bool], Optional[str]]:
        """Validate and update an existing article, regenerating AI fields if needed."""
        if not ObjectId.is_valid(article_id):
            return None, "Invalid article ID format"

        existing_article = Article.get_by_id(article_id)
        if not existing_article:
            return None, "Article not found"

        if existing_article.get("user_id") and existing_article["user_id"] != user["_id"]:
            return None, "Permission denied: You can only update your own articles"

        update_data = {k: v for k, v in data.items() if v is not None}

        if "title" in update_data and not ArticleService._validate_title(update_data["title"]):
            return None, "Title must be at least 5 characters long"

        if "source_url" in update_data and not ArticleService._validate_url(update_data["source_url"]):
            return None, "Invalid source URL"

        # Recalculate AI-generated fields if content is updated
        if "content" in update_data:
            analysis = ArticleService._analyze_content(update_data["content"])
            if analysis is None:
                return None, "Failed to analyze content"

            update_data["score"] = analysis["score"]
            update_data["summary"] = analysis["summary"]
            update_data["keywords"] = analysis["keywords"]

        success = Article.update(article_id, update_data)
        if success:
            return True, None
        return None, "Failed to update article"

    @staticmethod
    def delete_article(article_id: str, user: Optional[Dict[str, Any]] = None) -> Tuple[Optional[bool], Optional[str]]:
        """Delete an article, checking if the user has permission."""
        if not ObjectId.is_valid(article_id):
            return None, "Invalid article ID format"

        article = Article.get_by_id(article_id)
        if not article:
            return None, "Article not found"

        if article.get("user_id") and article["user_id"] != user["_id"]:
            return None, "Permission denied: You can only delete your own articles"

        success = Article.delete(article_id)
        if success:
            return True, None
        return None, "Failed to delete article"
