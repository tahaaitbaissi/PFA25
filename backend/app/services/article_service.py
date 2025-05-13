from bson import ObjectId
from ..db import get_db
from ..models.article import Article
from ..services.newsapi_service import NewsAPIService
from ..services.reddit_service import RedditService
from .opensearch_service import OpenSearchService # Ensure this is correctly imported
from flask import current_app
import requests
from typing import Optional, Tuple, Dict, Any, List
from urllib.parse import urlparse
from datetime import datetime

class ArticleService:
    _os_instance: Optional[OpenSearchService] = None # Use type hint, changed from _es_instance

    @classmethod
    def get_opensearch(cls) -> OpenSearchService:
        """Get the OpenSearch service instance (singleton pattern)."""
        if cls._os_instance is None:
            with current_app.app_context():
                os_url = current_app.config.get("OPENSEARCH_URL")
                if not os_url:
                     current_app.logger.critical("OPENSEARCH_URL is not configured!")
                     raise ValueError("OPENSEARCH_URL is not configured")

                # Initialize OpenSearchService using the config values
                cls._os_instance = OpenSearchService(
                    os_url=os_url,
                    http_auth=(
                         current_app.config.get("OPENSEARCH_USER", "admin"),
                         current_app.config.get("OPENSEARCH_PASSWORD", "admin")
                    ),
                    use_ssl=current_app.config.get("OPENSEARCH_USE_SSL", False),
                    verify_certs=current_app.config.get("OPENSEARCH_VERIFY_CERTS", False)
                )
                # Ensure the index exists when the service is first obtained
                cls._os_instance.create_index()

        return cls._os_instance

    @staticmethod
    def get_all_articles() -> List[Dict[str, Any]]:
        """Retrieve all articles from MongoDB (consider fetching from OpenSearch for performance)."""
        articles = Article.get_all()
        # Removed re-indexing logic here as it's inefficient. Indexing should happen on save/update.
        return articles

    @staticmethod
    def get_article_by_id(article_id: str) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
        """Retrieve a single article by ID, trying OpenSearch first, then MongoDB."""
        if not ObjectId.is_valid(article_id):
             return None, "Invalid article ID format"

        try:
            os_service = ArticleService.get_opensearch()
            article_from_os = os_service.get_article(article_id)
            if article_from_os:
                 current_app.logger.debug(f"Found article {article_id} in OpenSearch.")
                 return article_from_os, None
        except Exception as e:
            current_app.logger.warning(f"Failed to get article {article_id} from OpenSearch: {str(e)}")

        article_from_db = Article.get_by_id(article_id)
        if article_from_db:
            return article_from_db, None

        return None, "Article not found"


    @staticmethod
    def get_recommended_articles(user_id: str) -> List[Dict[str, Any]]:
        """Retrieve recommended articles based on user's categories."""
        try:
            db = get_db()
            
            # Get user's categories
            user = db.users.find_one({"_id": ObjectId(user_id)})
            if not user or not user.get("categories"):
                return []
                
            user_categories = user["categories"]
            
            # Get all articles
            articles = Article.get_all()
            
            # Filter articles based on user's categories
            recommended = []
            for article in articles:
                # Get article's categories from keywords
                article_categories = []
                for keyword in article.get("keywords", []):
                    category = db.categories.find_one({"label": keyword})
                    if category:
                        article_categories.append(str(category["_id"]))
                
                # Check if any of the article's categories match user's categories
                if any(cat in user_categories for cat in article_categories):
                    recommended.append(article)
            
            # Sort by date (newest first) and limit to 10 results
            recommended.sort(key=lambda x: x.get("date_soumission", datetime.min), reverse=True)
            return recommended[:10]
            
        except Exception as e:
            current_app.logger.error(f"Error getting recommended articles: {str(e)}")
            return []

    @staticmethod
    def search_articles(query: str) -> List[Dict[str, Any]]:
        """Search articles using OpenSearch with proper error handling."""
        try:
            os_service = ArticleService.get_opensearch()
            return os_service.search(query)
        except Exception as e:
            current_app.logger.error(f"OpenSearch search failed: {str(e)}")
            current_app.logger.warning("Falling back to MongoDB for search.")
            all_articles = Article.get_all()
            return [
                article for article in all_articles
                if query.lower() in article.get("title", "").lower() or
                query.lower() in " ".join(article.get("keywords", [])).lower()
            ]

    @staticmethod
    def article_exists(url: str) -> bool:
        """Check if an article with this URL already exists in MongoDB."""
        db = get_db()
        return bool(db.articles.find_one({"source_url": url}))

    @staticmethod
    def fetch_and_save_news():
        """Fetch articles from NewsAPI, analyze them, and save to DB with OpenSearch indexing"""
        news_data = NewsAPIService.get_top_headlines(country="us", page_size=5)

        if "articles" not in news_data:
            current_app.logger.error(f"Error fetching news: {news_data.get('error')}")
            return

        for news in news_data["articles"]:
            title = news.get("title")
            source_url = news.get("url")

            if not title or not source_url:
                current_app.logger.warning("Skipping article with missing title or URL.")
                continue

            if ArticleService.article_exists(source_url):
                current_app.logger.debug(f"Article already exists: {source_url}")
                continue

            content = NewsAPIService.fetch_full_content(source_url)
            if not content:
                current_app.logger.warning(f"Could not fetch full content for {source_url}")
                continue

            image = NewsAPIService.fetch_article_images(source_url)["top_image"]
            if not image:
                current_app.logger.warning(f"Could not fetch image url for {source_url}")
                
            # Analyze the article content
            analysis = ArticleService._analyze_content(content)
    
            if not analysis or analysis.get("score") is None or analysis.get("is_fake_label") is None or not analysis.get("keywords"):
                current_app.logger.warning(f"Could not analyze content or extract required fields for {source_url}. Analysis: {analysis}")
                continue

            # Use top 2-3 keywords for Reddit search
            top_keywords = analysis["keywords"][:3]
            keyword_query = " ".join(top_keywords)

            related_reddit_posts = []
            if keyword_query.strip():
                 related_reddit_posts = RedditService.search_reddit(
                     article_title=keyword_query,
                     article_url=source_url
                 )
            else:
                 current_app.logger.warning(f"No meaningful keywords extracted for Reddit search for {source_url}")

            
            article = Article(
                title=title.strip(),
                content=content.strip(),
                source_url=source_url,
                ai_score=analysis["score"],
                is_fake_label=analysis["is_fake_label"],
                image=image,
                summary=analysis["summary"],
                keywords=analysis["keywords"],
                related_reddit_posts=related_reddit_posts
            )

            try:
                article_id = article.save()
                saved_article = Article.get_by_id(article_id)
                if saved_article:
                    ArticleService.get_opensearch().index_article(saved_article)
                return article_id, None
            except Exception as e:
                current_app.logger.error(f"Error saving article: {str(e)}")
                return None, "Internal server error"

        current_app.logger.info("Finished processing batch of news articles.")


    @staticmethod
    def _analyze_content(content: str) -> Optional[Dict[str, Any]]:
        """Send content to AI service to calculate score, generate summary, and extract keywords."""
        try:
            ai_service_url = current_app.config.get("AI_SERVICE_URL", "http://127.0.0.1:8000/analyze")
            response = requests.post(ai_service_url, json={"text": content})
            response.raise_for_status()
            data = response.json()

            # Extract score and label from AI service response
            confidence_score = data.get("score") # The confidence (0-1)
            is_fake_label = data.get("is_fake") # The label ("LABEL_0", "LABEL_1")

            # Basic validation for expected fields and types
            if confidence_score is None or not isinstance(confidence_score, (int, float)):
                 current_app.logger.error(f"AI service returned invalid or missing 'score': {data.get('score')}")
                 return None
            if is_fake_label is None or not isinstance(is_fake_label, str) or is_fake_label not in ["LABEL_0", "LABEL_1"]:
                 current_app.logger.error(f"AI service returned invalid or missing 'is_fake' label: {data.get('is_fake')}")
                 return None

            fakeness_score = float(confidence_score)

            # Adjust fakeness_score based on the label
            # Assuming "LABEL_0" means fake and "LABEL_1" means real
            if is_fake_label == "LABEL_1":
                fakeness_score = 1.0 - fakeness_score

            fakeness_score = max(0.0, min(1.0, fakeness_score))

            return {
                "is_fake_label": is_fake_label, # Store the original label
                "score": fakeness_score, # Store the derived fakeness score (0-1)
                "summary": data.get("summary", "Summary not available"),
                "keywords": data.get("keywords", []) # Ensure keywords is a list
            }

        except requests.RequestException as e:
            current_app.logger.error(f"Error analyzing content with AI service: {str(e)}", exc_info=True)
            return None
        except Exception as e:
            current_app.logger.error(f"Unexpected error during content analysis: {str(e)}", exc_info=True)
            return None



    @staticmethod
    def create_article(data: Dict[str, Any], user: Optional[Dict[str, Any]] = None) -> Tuple[Optional[str], Optional[str]]:
        """Validate and create a new article with AI-generated fields and Reddit posts."""
        required_fields = ["title", "content", "source_url"]

        if not all(field in data and data[field] for field in required_fields):
            return None, "Missing or empty required fields"

        if not ArticleService._validate_title(data["title"]):
            return None, "Title must be at least 5 characters long"

        if not ArticleService._validate_url(data["source_url"]):
            return None, "Invalid source URL"

        if ArticleService.article_exists(data["source_url"]):
             return None, "Article with this URL already exists"

        # Analyze content
        analysis = ArticleService._analyze_content(data["content"])
        if not analysis or analysis.get("score") is None or analysis.get("is_fake_label") is None or not analysis.get("keywords"):
             current_app.logger.error(f"Failed to get complete analysis for new article: {data.get('title')}. Analysis: {analysis}")
             return None, "Failed to analyze content properly"

        score = analysis["score"]
        is_fake_label = analysis["is_fake_label"]
        summary = analysis["summary"]
        keywords = analysis["keywords"]

        # Use top 2-3 keywords for Reddit search in create
        top_keywords = keywords[:3]
        keyword_query = " ".join(top_keywords)

        related_reddit_posts = []
        if keyword_query.strip():
             related_reddit_posts = RedditService.search_reddit(
                 article_title=keyword_query,
                 article_url=data["source_url"]
             )
        else:
             current_app.logger.warning(f"No meaningful keywords for Reddit search for new article: {data.get('title')}")

        image = NewsAPIService.fetch_article_images(data["source_url"])["top_image"]
        if not image:
            current_app.logger.warning(f"Could not fetch image url for {data["source_url"]}")


        user_id = str(user["_id"]) if user and "_id" in user else None

        article = Article(
                title=data["title"].strip(),
                content=data["content"].strip(),
                source_url=data["source_url"],
                ai_score=analysis["score"],
                is_fake_label=analysis["is_fake_label"],
                user_id=user_id,
                summary=analysis["summary"],
                image=image,
                keywords=analysis["keywords"],
                related_reddit_posts=related_reddit_posts
            )

        try:
            article_id = article.save()
            saved_article = Article.get_by_id(article_id)
            if saved_article:
                ArticleService.get_opensearch().index_article(saved_article)
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

        if existing_article.get("user_id") and (not user or str(existing_article["user_id"]) != str(user.get("_id"))):
             return None, "Permission denied: You can only update your own articles"

        update_data = {k: v for k, v in data.items() if v is not None}

        content_updated = False
        if "content" in update_data:
            if not update_data["content"].strip():
                 return None, "Content cannot be empty"
            analysis = ArticleService._analyze_content(update_data["content"])

            if not analysis or analysis.get("score") is None or analysis.get("is_fake_label") is None or not analysis.get("keywords"):
                 current_app.logger.error(f"Failed to get complete analysis during update for article {article_id}. Analysis: {analysis}")
                 return None, "Failed to analyze content properly during update"

            update_data["ai_score"] = analysis["score"]
            update_data["is_fake_label"] = analysis["is_fake_label"]
            update_data["summary"] = analysis["summary"]
            update_data["keywords"] = analysis["keywords"]
            content_updated = True

        if "title" in update_data or content_updated:
            if content_updated and "keywords" in update_data:
                 top_keywords = update_data["keywords"][:3]
                 keyword_query = " ".join(top_keywords)
            elif "title" in update_data:
                 keyword_query = update_data["title"].strip()
            else:
                 keyword_query = existing_article.get("title", "").strip()
                 current_app.logger.warning(f"Unexpected update logic for article {article_id}, falling back to existing title for Reddit search.")


            related_reddit_posts = []
            if keyword_query.strip():
                 related_reddit_posts = RedditService.search_reddit(
                     article_title=keyword_query,
                     article_url=update_data.get("source_url", existing_article.get("source_url"))
                 )
            else:
                 current_app.logger.warning(f"No meaningful query for Reddit search during update for article {article_id}")

            update_data["related_reddit_posts"] = related_reddit_posts


        update_data["date_updated"] = datetime.utcnow()

        # Update in MongoDB
        success = Article.update(article_id, update_data)

        if success:
            # If update in MongoDB is successful, update in OpenSearch
            try:
                 os_service = ArticleService.get_opensearch()
                 updated_article_from_db = Article.get_by_id(article_id)
                 if updated_article_from_db:
                      article_data_for_os = updated_article_from_db.to_dict() # Assuming to_dict includes is_fake_label
                      article_data_for_os['_id'] = str(updated_article_from_db._id)
                      os_service.index_article(article_data_for_os)
                      current_app.logger.info(f"Article ID {article_id} updated in OpenSearch.")
                 else:
                      current_app.logger.error(f"Could not fetch updated article {article_id} from DB for OpenSearch indexing.")

            except Exception as e:
                 current_app.logger.error(f"Error indexing updated article {article_id} in OpenSearch: {str(e)}", exc_info=True)
                 pass

            return True, None
        return None, "Failed to update article in database"

    # @staticmethod
    # def delete_article(article_id: str, user: Optional[Dict[str, Any]] = None) -> Tuple[Optional[bool], Optional[str]]:
    #     """Delete an article from MongoDB and OpenSearch."""
    #     if not ObjectId.is_valid(article_id):
    #         return None, "Invalid article ID format"
    #
    #     existing_article = Article.get_by_id(article_id)
    #     if not existing_article:
    #         return None, "Article not found"
    #
    #     if existing_article.get("user_id") and (not user or str(existing_article["user_id"]) != str(user.get("_id"))):
    #          return None, "Permission denied: You can only delete your own articles"
    #
    #     # Delete from MongoDB
    #     success_db = Article.delete(article_id)
    #
    #     if success_db:
    #         current_app.logger.info(f"Article ID {article_id} deleted from MongoDB.")
    #         # If deleted from DB, try to delete from OpenSearch
    #         try:
    #              os_service = ArticleService.get_opensearch()
    #              success_os = os_service.delete_article(article_id)
    #              if success_os:
    #                   current_app.logger.info(f"Article ID {article_id} deleted from OpenSearch.")
    #              else:
    #                   current_app.logger.warning(f"Failed to delete article ID {article_id} from OpenSearch.")
    #              return True, None
    #         except Exception as e:
    #              current_app.logger.error(f"Error deleting article {article_id} from OpenSearch: {str(e)}", exc_info=True)
    #              return True, None
    #
    #     return None, "Failed to delete article from database"

    @staticmethod
    def get_articles_by_user(user_id: str) -> Tuple[List[Dict[str, Any]], Optional[str]]:
        """Retrieve all articles created by a specific user from MongoDB."""
        try:
            db = get_db()
            # Find all articles where the 'user_id' field matches the provided user_id string
            # Assumes user_id is stored as a string in the article document
            articles_cursor = db.articles.find({"user_id": user_id}).sort("date_soumission", -1) # Sort newest first

            articles_list = []
            for article_doc in articles_cursor:
                 # Convert ObjectId to string for JSON serialization if needed
                 article_doc['_id'] = str(article_doc['_id'])
                 # Ensure other ObjectIds (like user_id) are strings too if they exist
                 if 'user_id' in article_doc and isinstance(article_doc['user_id'], ObjectId):
                      article_doc['user_id'] = str(article_doc['user_id'])
                 articles_list.append(article_doc)

            return articles_list, None

        except Exception as e:
            current_app.logger.error(f"Error retrieving articles for user {user_id}: {str(e)}", exc_info=True)
            return [], f"Failed to retrieve articles for user {user_id}"

    @staticmethod
    def delete_article(article_id: str, user: Optional[Dict[str, Any]] = None) -> Tuple[Optional[bool], Optional[str]]:
        """
        Delete an article from MongoDB and OpenSearch.

        Args:
            article_id: ID of the article to delete
            user: User object or None for admin override

        Returns:
            Tuple (success, error_message)
        """
        # Validation de l'ID
        if not ObjectId.is_valid(article_id):
            return None, "Invalid article ID format"

        # Récupération de l'article
        existing_article = Article.get_by_id(article_id)
        if not existing_article:
            return None, "Article not found"

        # Vérification des permissions (sauf si user=None pour admin)
        if user is not None:  # Seulement pour les utilisateurs normaux
            if existing_article.get("user_id") and str(existing_article["user_id"]) != str(user.get("_id")):
                return None, "Permission denied: You can only delete your own articles"

        # Suppression dans MongoDB
        success_db = Article.delete(article_id)
        if not success_db:
            return None, "Failed to delete article from database"

        # Suppression dans OpenSearch (optionnelle)
        try:
            os_service = ArticleService.get_opensearch()
            os_service.delete_article(article_id)
            current_app.logger.info(f"Article {article_id} deleted from OpenSearch")
        except Exception as e:
            current_app.logger.error(f"Error deleting from OpenSearch: {str(e)}")
            # On continue même si OpenSearch échoue

        return True, None

    @staticmethod
    def _validate_title(title: str) -> bool:
        """Basic title validation."""
        return len(title.strip()) >= 5

    @staticmethod
    def _validate_url(url: str) -> bool:
        """Basic URL validation."""
        try:
            result = urlparse(url)
            return all([result.scheme, result.netloc])
        except:
            return False
