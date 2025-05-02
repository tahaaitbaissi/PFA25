import praw
from flask import current_app
from typing import List, Dict, Optional
from urllib.parse import urlparse
import re

from ..utils.google_scraper import GoogleScraper

class RedditService:
    NEWS_SUBREDDITS = [
        "news", "worldnews", "politics",
        "TrueReddit", "UpliftingNews", "nottheonion"
    ]

    @staticmethod
    def _clean_search_query(query: str) -> str:
        """Clean and optimize search queries for Reddit."""
        query = re.sub(r'[^\w\s]', '', query.lower())
        words = query.split()
        return ' '.join(words[:7])

    @staticmethod
    def _extract_post_id_from_url(url: str) -> Optional[str]:
        match = re.search(r'reddit\.com\/r\/[^\/]+\/comments\/([a-z0-9]{6,})', url)
        return match.group(1) if match else None

    @staticmethod
    def _search_by_url(reddit: praw.Reddit, url: str) -> List[Dict[str, any]]:
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
                    if len(results) >= 5:
                        return results
        except Exception as e:
            current_app.logger.warning(f"URL search error: {str(e)}")
        return results

    @staticmethod
    def _search_by_title(reddit: praw.Reddit, title: str) -> List[Dict[str, any]]:
        results = []
        try:
            clean_title = RedditService._clean_search_query(title)
            for submission in reddit.subreddit("all").search(clean_title, limit=10):
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
    def _search_with_google(reddit: praw.Reddit, query: str) -> List[Dict[str, any]]:
        """Use Google to find Reddit posts, then fetch details using Reddit API."""

        s = GoogleScraper()

        results = []
        try:
            res = s.search(f'site:reddit.com "{query}"', 10)
            seen_ids = set()

            for x in res:
                post_id = RedditService._extract_post_id_from_url(x["link"])
                if not post_id or post_id in seen_ids:
                    continue
                seen_ids.add(post_id)

                try:
                    submission = reddit.submission(id=post_id)
                    if submission.num_comments < 3:
                        continue
                    results.append({
                        "title": submission.title,
                        "url": submission.url,
                        "upvotes": submission.score,
                        "comments": submission.num_comments,
                        "subreddit": submission.subreddit.display_name,
                        "source": "google_search"
                    })
                except Exception as e:
                    current_app.logger.warning(f"Failed to fetch Reddit post {post_id}: {str(e)}")
        except Exception as e:
            current_app.logger.warning(f"Google search method failed: {str(e)}")
        return results

    @staticmethod
    def search_reddit(article_title: str, article_url: Optional[str] = None) -> List[Dict[str, any]]:
        try:
            reddit = praw.Reddit(
                client_id=current_app.config["REDDIT_CLIENT_ID"],
                client_secret=current_app.config["REDDIT_CLIENT_SECRET"],
                user_agent="FakeNewsDetector/1.0 (by /u/YOUR_REDDIT_USERNAME)"
            )

            results = []

            # 1. Try URL match in news subreddits
            if article_url:
                parsed_url = urlparse(article_url)
                clean_url = f"{parsed_url.scheme}://{parsed_url.netloc}{parsed_url.path}"
                results = RedditService._search_by_url(reddit, clean_url)

            # 3. Final fallback using Google search
            if not results and article_title:
                results = RedditService._search_with_google(reddit, article_title)
            
            # 2. Fallback to title search
            if not results and article_title:
                results = RedditService._search_by_title(reddit, article_title)

            results.sort(key=lambda x: (-x['comments'], -x['upvotes']))
            return results[:10]

        except Exception as e:
            current_app.logger.error(f"Reddit search failed: {str(e)}")
            return []
