import requests
from flask import current_app
from typing import Optional, Dict, Any

from newspaper import Article

class NewsAPIService:
    BASE_URL = "https://newsapi.org/v2/"
    
    @staticmethod
    def get_top_headlines(country: str = "us", page_size: int = 5) -> Dict[str, Any]:
        """Fetch top headlines from NewsAPI (Free-tier compliant)."""
        api_key = current_app.config.get("NEWS_API_KEY")
        if not api_key:
            return {"error": "API key is missing"}

        url = f"{NewsAPIService.BASE_URL}top-headlines"
        params = {
            "country": country,  # Allowed in free tier
            "pageSize": page_size,  # Limit number of results
            "apiKey": api_key
        }

        try:
            response = requests.get(url, params=params)
            data = response.json()
            if data.get("status") == "ok":
                return {"articles": data.get("articles", [])}
            return {"error": data.get("message", "Failed to fetch news")}
        except requests.RequestException as e:
            current_app.logger.error(f"NewsAPI request failed: {str(e)}")
            return {"error": "Unable to fetch news"}

    @staticmethod
    def search_headlines(query: str, page_size: int = 5) -> Dict[str, Any]:
        api_key = current_app.config.get("NEWS_API_KEY")
        if not api_key:
            return {"error": "API key is missing"}

        url = f"{NewsAPIService.BASE_URL}/everything"
        params = {
            "q": query,
            "pageSize": page_size,
            "sources": "bbc-news",
            "apiKey": api_key
        }
#elastic search
        try:
            response = requests.get(url, params=params)
            data = response.json()
            if data.get("status") == "ok":
                return {"articles": data.get("articles", [])}
            return {"error": data.get("message", "Failed to fetch news")}
        except requests.RequestException as e:
            current_app.logger.error(f"NewsAPI request failed: {str(e)}")
            return {"error": "Unable to fetch news"}
    
    @staticmethod
    def fetch_full_content(url: str) -> Optional[str]:
        try:
            article = Article(url)
            article.download()
            article.parse()
            return article.text
        except Exception as e:
            current_app.logger.error(f"Error scraping article: {str(e)}")
            return None
