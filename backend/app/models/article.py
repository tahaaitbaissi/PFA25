from datetime import datetime
from bson import ObjectId
from ..db import get_db


class Article:
    def __init__(self, title, content, source_url, date_soumission=None, user_id=None, summary="", keywords=None, ai_score=None, related_reddit_posts=None):
        self.title = title
        self.content = content
        self.source_url = source_url
        self.date_soumission = date_soumission or datetime.utcnow()
        self.user_id = user_id
        self.summary = summary
        self.ai_score = ai_score
        self.keywords = keywords or []
        self.related_reddit_posts = related_reddit_posts or []

    def save(self):
        """Insert the article into the database."""
        db = get_db()
        article_data = {
            "title": self.title,
            "content": self.content,
            "source_url": self.source_url,
            "ai_score": self.ai_score,
            "date_soumission": self.date_soumission,
            "summary": self.summary,
            "keywords": self.keywords,
            "user_id": self.user_id,
            "related_reddit_posts": self.related_reddit_posts
        }
        result = db.articles.insert_one(article_data)
        return str(result.inserted_id)

    @staticmethod
    def get_all():
        """Retrieve all articles from MongoDB."""
        db = get_db()
        return [{**article, "_id": str(article["_id"])} for article in db.articles.find()]

    @staticmethod
    def get_by_id(article_id):
        """Retrieve an article by its ID."""
        db = get_db()
        article = db.articles.find_one({"_id": ObjectId(article_id)})
        if article:
            article["_id"] = str(article["_id"])
        return article

    def update(self, article_id):
        """Update an existing article."""
        db = get_db()
        updated_data = {
            "title": self.title,
            "content": self.content,
            "source_url": self.source_url,
            "ai_score": self.ai_score,
            "date_soumission": self.date_soumission,
            "summary": self.summary,
            "keywords": self.keywords,
            "user_id": self.user_id,
            "related_reddit_posts": self.related_reddit_posts
        }
        updated_article = db.articles.find_one_and_update(
            {"_id": ObjectId(article_id)},
            {"$set": updated_data},
            return_document=True
        )
        return updated_article
