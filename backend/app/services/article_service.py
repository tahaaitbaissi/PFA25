from bson import ObjectId
from ..models.article import Article
from ..services.newsapi_service import NewsAPIService
from flask import current_app
import requests
from typing import Optional, Tuple, Dict, Any, List

class ArticleService:
    @staticmethod
    def get_all_articles() -> List[Dict[str, Any]]:
        """Retrieve all articles."""
        return Article.get_all()

    @staticmethod
    def get_recommended_articles(user_id: str) -> List[Dict[str, Any]]:
        """Retrieve recommended articles based on user's interests (dummy logic for now)."""
        articles = Article.get_all()
        recommended = [article for article in articles if user_id in article.get("keywords", [])]
        return recommended[:10]  # Limit recommendations

    @staticmethod
    def search_articles(query: str) -> List[Dict[str, Any]]:
        """Search articles by title or keywords."""
        all_articles = Article.get_all()
        filtered_articles = [
            article for article in all_articles
            if query.lower() in article["title"].lower() or query.lower() in " ".join(article.get("keywords", [])).lower()
        ]
        return filtered_articles

    @staticmethod
    def fetch_and_save_news():
        """Fetch articles from NewsAPI, analyze them, and save to DB."""
        news_data = NewsAPIService.get_top_headlines(country="us", page_size=5)

        if "articles" not in news_data:
            current_app.logger.error(f"Error fetching news: {news_data.get('error')}")
            return

        for news in news_data["articles"]:
            title = news.get("title")
            source_url = news.get("url")
            
            if not title or not source_url:
                continue  # Skip invalid articles

            content = NewsAPIService.fetch_full_content(source_url)
            if not content:
                continue  # Skip if content extraction fails

            # Analyze content
            analysis = ArticleService._analyze_content(content)
            if not analysis:
                continue  # Skip if AI analysis fails

            # Save article
            article = Article(
                title=title,
                content=content,
                source_url=source_url,
                ai_score=analysis["score"],
                summary=analysis["summary"],
                keywords=analysis["keywords"]
            )
            article.save()

    @staticmethod
    def _analyze_content(content: str) -> Optional[Dict[str, Any]]:
        """Send content to AI service to calculate score, generate summary, and extract keywords."""
        try:
            response = requests.post("http://127.0.0.1:8000/analyze", json={"text": content})
            response.raise_for_status()
            data = response.json()
            return {
                "score": data.get("is_fake"),
                "summary": data.get("summary", "Summary not available"),
                "keywords": data.get("keywords", [])
            }
        except requests.RequestException as e:
            current_app.logger.error(f"Error analyzing content: {str(e)}")
            return None

    @staticmethod
    def create_article(data: Dict[str, Any], user: Optional[Dict[str, Any]] = None) -> Tuple[Optional[str], Optional[str]]:
        """Validate and create a new article with AI-generated fields and Reddit posts."""
        required_fields = ["title", "content", "source_url"]

        if not all(field in data for field in required_fields):
            return None, "Missing required fields"

        if not ArticleService._validate_title(data["title"]):
            return None, "Title must be at least 5 characters long"

        if not ArticleService._validate_url(data["source_url"]):
            return None, "Invalid source URL"

        analysis = ArticleService._analyze_content(data["content"])
        if analysis is None:
            return None, "Failed to analyze content"

        score = analysis["score"]
        summary = analysis["summary"]
        keywords = analysis["keywords"]

        # Fetch related Reddit posts
        related_reddit_posts = RedditService.search_reddit(data["title"])

        user_id = user["_id"] if user else None

        article = Article(
            title=data["title"].strip(),
            content=data["content"].strip(),
            source_url=data["source_url"],
            ai_score=score,
            user_id=user_id,
            summary=summary,
            keywords=keywords,
            related_reddit_posts=related_reddit_posts
        )

        try:
            article_id = article.save()
            return article_id, None
        except Exception as e:
            current_app.logger.error(f"Error saving article: {str(e)}")
            return None, "Internal server error"

    @staticmethod
    def update_article(article_id: str, data: Dict[str, Any], user: Optional[Dict[str, Any]] = None) -> Tuple[Optional[bool], Optional[str]]:
        """Validate and update an existing article, regenerating AI fields and Reddit posts if needed."""
        if not ObjectId.is_valid(article_id):
            return None, "Invalid article ID format"

        existing_article = Article.get_by_id(article_id)
        if not existing_article:
            return None, "Article not found"

        if existing_article.get("user_id") and existing_article["user_id"] != user["_id"]:
            return None, "Permission denied: You can only update your own articles"

        update_data = {k: v for k, v in data.items() if v is not None}

        if "title" in update_data:
            if not ArticleService._validate_title(update_data["title"]):
                return None, "Title must be at least 5 characters long"
            update_data["related_reddit_posts"] = RedditService.search_reddit(update_data["title"])

        if "source_url" in update_data and not ArticleService._validate_url(update_data["source_url"]):
            return None, "Invalid source URL"

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
