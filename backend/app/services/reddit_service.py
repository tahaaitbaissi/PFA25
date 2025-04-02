import praw
from flask import current_app
from typing import List, Dict

class RedditService:
    @staticmethod
    def search_reddit(article_title: str) -> List[Dict[str, any]]:
        """Search for relevant Reddit discussions based on the article title."""
        try:
            reddit = praw.Reddit(
                client_id=current_app.config["REDDIT_CLIENT_ID"],
                client_secret=current_app.config["REDDIT_CLIENT_SECRET"],
                user_agent="news_fetcher"
            )

            results = []
            for submission in reddit.subreddit("all").search(article_title, limit=5):
                results.append({
                    "title": submission.title,
                    "url": submission.url,
                    "upvotes": submission.score,
                    "comments": submission.num_comments
                })

            return results
        except Exception as e:
            current_app.logger.error(f"Error fetching Reddit posts: {str(e)}")
            return []
