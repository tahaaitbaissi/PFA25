import praw
from flask import current_app
from typing import List, Dict, Optional
from urllib.parse import urlparse
import re

class RedditService:
    # News-focused subreddits to search first
    NEWS_SUBREDDITS = [
        "news",
        "worldnews",
        "politics",
        "TrueReddit",
        "UpliftingNews",
        "nottheonion"
    ]
    
    @staticmethod
    def _clean_search_query(query: str) -> str:
        """Clean and optimize search queries for Reddit."""
        # Remove special characters and stopwords
        query = re.sub(r'[^\w\s]', '', query.lower())
        words = query.split()
        # Keep only meaningful words (5-7 max for better results)
        return ' '.join(words[:7])
    
    @staticmethod
    def _search_by_url(reddit: praw.Reddit, url: str) -> List[Dict[str, any]]:
        """Search for submissions with the exact URL in news subreddits."""
        results = []
        try:
            for subreddit_name in RedditService.NEWS_SUBREDDITS:
                subreddit = reddit.subreddit(subreddit_name)
                for submission in subreddit.search(f'url:"{url}"', limit=3):
                    results.append({
                        "title": submission.title,
                        "url": submission.url,
                        "upvotes": submission.score,
                        "comments": submission.num_comments,
                        "subreddit": subreddit_name,
                        "source": "url_search"
                    })
                    # Early exit if we find good matches
                    if len(results) >= 5:
                        return results
        except Exception as e:
            current_app.logger.warning(f"URL search error: {str(e)}")
        return results
    
    @staticmethod
    def _search_by_title(reddit: praw.Reddit, title: str) -> List[Dict[str, any]]:
        """Search for submissions by title in all subreddits."""
        results = []
        try:
            clean_title = RedditService._clean_search_query(title)
            for submission in reddit.subreddit("all").search(clean_title, limit=10):
                # Skip results that are just links without discussion
                if submission.num_comments < 3:
                    continue
                    
                results.append({
                    "title": submission.title,
                    "url": submission.url,
                    "upvotes": submission.score,
                    "comments": submission.num_comments,
                    "subreddit": submission.subreddit.display_name,
                    "source": "title_search"
                })
        except Exception as e:
            current_app.logger.warning(f"Title search error: {str(e)}")
        return results
    
    @staticmethod
    def search_reddit(article_title: str, article_url: Optional[str] = None) -> List[Dict[str, any]]:
        """Search for relevant Reddit discussions, trying URL first then title."""
        try:
            reddit = praw.Reddit(
                client_id=current_app.config["REDDIT_CLIENT_ID"],
                client_secret=current_app.config["REDDIT_CLIENT_SECRET"],
                user_agent="FakeNewsDetector/1.0 (by /u/YOUR_REDDIT_USERNAME)"
            )
            
            results = []
            
            # First try searching by URL in news subreddits
            if article_url:
                # Normalize URL by removing tracking parameters
                parsed_url = urlparse(article_url)
                clean_url = f"{parsed_url.scheme}://{parsed_url.netloc}{parsed_url.path}"
                results = RedditService._search_by_url(reddit, clean_url)
            
            # If URL search found nothing, try title search
            if not results and article_title:
                title_results = RedditService._search_by_title(reddit, article_title)
                results.extend(title_results)
            
            # Sort results by comment count then upvotes
            results.sort(key=lambda x: (-x['comments'], -x['upvotes']))
            
            return results[:10]  # Return max 10 best results
            
        except Exception as e:
            current_app.logger.error(f"Reddit search failed: {str(e)}")
            return []