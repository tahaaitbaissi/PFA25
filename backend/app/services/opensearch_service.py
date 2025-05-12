from opensearchpy import OpenSearch
from flask import current_app
import time
import socket
from urllib.parse import urlparse
from typing import Dict, List, Optional, Any, Union, Tuple
from datetime import datetime

class OpenSearchService:
    def __init__(self, os_url: str, http_auth: Optional[Tuple[str, str]] = None, use_ssl: bool = False, verify_certs: bool = False):
        """Initialize OpenSearch connection with robust error handling."""
        print(f"Initializing OpenSearchService with URL: {os_url}")

        try:
            parsed_url = urlparse(os_url)
            if not parsed_url.hostname:
                raise ValueError("Invalid OpenSearch URL: missing hostname")

            connection_url = f"{parsed_url.scheme}://{parsed_url.netloc}"
            if not parsed_url.port and parsed_url.scheme in ['http', 'https']:
                 connection_url += f":{9200 if parsed_url.scheme == 'http' else 9200}"


            self.os = OpenSearch(
                hosts=[connection_url],
                http_auth=http_auth,
                use_ssl=use_ssl,
                verify_certs=verify_certs,
                http_compress=True,
                timeout=30,
                retry_on_timeout=True,
                max_retries=3
            )

            self.wait_for_opensearch()

            if not self.os.ping():
                raise ConnectionError("Could not connect to OpenSearch after waiting.")

            print(f"Successfully connected to OpenSearch cluster: {self.os.info()['cluster_name']}")

        except Exception as e:
            current_app.logger.error(f"Failed to initialize OpenSearch: {str(e)}", exc_info=True)
            raise ConnectionError(f"OpenSearch initialization failed: {str(e)}") from e


    def wait_for_opensearch(self, retries: int = 10, delay: int = 3) -> None:
        """Wait for OpenSearch to be ready with improved diagnostics."""
        print(f"Starting OpenSearch connection attempts (max {retries}, delay {delay}s)")

        configured_hosts = self.os.transport.hosts if hasattr(self.os, 'transport') and hasattr(self.os.transport, 'hosts') else ["(hosts not configured yet)"]
        print(f"Attempting to connect to hosts: {configured_hosts}")

        for attempt in range(retries):
            try:
                print(f"Attempt {attempt + 1}/{retries}: Pinging OpenSearch...")
                if self.os.ping():
                    info = self.os.info()
                    print(f"SUCCESS: Connected to OpenSearch {info.get('version', {}).get('number', 'N/A')} "
                          f"at {info.get('name', 'N/A')} (cluster: {info.get('cluster_name', 'N/A')})")
                    return
                print("Ping returned false, OpenSearch might not be fully ready.")

            except Exception as e:
                print(f"Connection error: {e.__class__.__name__}: {str(e)}")
                print(f"Client config hosts: {configured_hosts}")

            if attempt < retries - 1:
                print(f"Waiting {delay} seconds before next attempt...")
                time.sleep(delay)

        raise ConnectionError(f"Could not connect to OpenSearch after {retries} retries. "
                              f"Check network connectivity, OpenSearch status, and configuration ({configured_hosts}).")


    def create_index(self, index_name: str = "articles", retries: int = 5, delay: int = 5) -> None:
        """Create the articles index with custom mapping if it doesn't exist."""
        try:
            self.os.ping()
        except Exception:
            current_app.logger.error("OpenSearch client is not connected, cannot create index.")
            return

        for attempt in range(retries):
            try:
                print(f"Attempting to create index '{index_name}' (attempt {attempt + 1}/{retries})")
                if not self.os.indices.exists(index=index_name):
                    print(f"Index '{index_name}' does not exist. Creating...")
                    self.os.indices.create(
                        index=index_name,
                        body={
                            "settings": {
                                "index": {
                                    "number_of_shards": 1,
                                    "number_of_replicas": 1,
                                    "analysis": {
                                        "analyzer": {
                                            "english_exact": {
                                                "tokenizer": "standard",
                                                "filter": ["lowercase"]
                                            }
                                        }
                                    }
                                }
                            },
                            "mappings": {
                                "properties": {
                                    "title": {
                                        "type": "text",
                                        "analyzer": "english",
                                        "fields": {
                                            "keyword": {
                                                "type": "keyword",
                                                "ignore_above": 256
                                            }
                                        }
                                    },
                                    "content": {"type": "text", "analyzer": "english"},
                                    "source_url": {"type": "keyword"},
                                    "image": {"type": "keyword"},
                                    "ai_score": {"type": "float"},
                                    "is_fake_label": {"type": "keyword"}, 
                                    "keywords": {"type": "keyword"},
                                    "summary": {"type": "text", "analyzer": "english"},
                                    "date_soumission": {"type": "date"},
                                    "related_reddit_posts": {
                                        "type": "nested",
                                        "properties": {
                                            "title": {"type": "text"},
                                            "url": {"type": "keyword"},
                                            "upvotes": {"type": "integer"},
                                            "comments": {"type": "integer"},
                                            "subreddit": {"type": "keyword"},
                                            "source": {"type": "keyword"}
                                        }
                                    }
                                }
                            }
                        }
                    )
                    print(f"✓ Index '{index_name}' created successfully")
                    return
                else:
                    print(f"✓ Index '{index_name}' already exists")
                    return

            except Exception as e:
                current_app.logger.error(f"Failed to create index: {str(e)}", exc_info=True)
                if attempt < retries - 1:
                    print(f"Waiting {delay} seconds before next attempt...")
                    time.sleep(delay)

        current_app.logger.error(f"Warning: Failed to create index '{index_name}' after {retries} attempts")


    def index_article(self, article: Dict[str, Any], index_name: str = "articles") -> bool:
        """Index or update an article in OpenSearch.

        Args:
            article: Article data to index (must include '_id' as string)
            index_name: Target index name

        Returns:
            bool: True if successful, False otherwise
        """
        if "_id" not in article or not article["_id"]:
             current_app.logger.error("Cannot index article: Missing or empty '_id'.")
             return False

        doc: Dict[str, Any] = {
            "title": article.get("title", ""),
            "content": article.get("content", ""),
            "source_url": article.get("source_url", ""),
            "image": article.get("image", ""),
            "ai_score": float(article.get("ai_score", 0)),
            "is_fake_label": article.get("is_fake_label"),
            "keywords": article.get("keywords", []),
            "summary": article.get("summary", ""),
            "related_reddit_posts": article.get("related_reddit_posts", [])
        }

        date_val = article.get("date_soumission")
        if isinstance(date_val, datetime):
             doc["date_soumission"] = date_val.isoformat()
        elif isinstance(date_val, str):
             doc["date_soumission"] = date_val


        try:
            response = self.os.index(
                index=index_name,
                id=str(article["_id"]),
                body=doc,
                refresh="wait_for"
            )

            if response.get("result") in ["created", "updated"]:
                 current_app.logger.debug(f"Article ID {article['_id']} indexed/updated in OpenSearch. Result: {response['result']}")
                 return True
            else:
                 current_app.logger.error(f"Unexpected OpenSearch index response for ID {article['_id']}: {response}")
                 return False

        except Exception as e:
            current_app.logger.error(f"Error indexing article ID {article.get('_id')}: {str(e)}", exc_info=True)
            return False

    def search(self, query: str, index_name: str = "articles", size: int = 10) -> List[Dict]:
        """Search articles by query using OpenSearch multi_match."""
        if not query:
             return []

        try:
            response = self.os.search(
                index=index_name,
                size=size,
                body={
                    "query": {
                        "multi_match": {
                            "query": query,
                            "fields": ["title^3", "content", "summary^2", "keywords"],
                            "fuzziness": "AUTO",
                            "operator": "and"
                        }
                    },
                    "highlight": {
                        "pre_tags": ["<em>"],
                        "post_tags": ["</em>"],
                        "fields": {
                            "title": {"number_of_fragments": 0, "fragment_size": 100},
                            "content": {"fragment_size": 150, "number_of_fragments": 3},
                            "summary": {"number_of_fragments": 1, "fragment_size": 100}
                        }
                    }
                }
            )

            hits = response.get("hits", {}).get("hits", [])
            return [{
                "_id": hit.get("_id"),
                "_score": hit.get("_score"),
                "_source": hit.get("_source", {}),
                "highlight": hit.get("highlight", {})
            } for hit in hits]

        except Exception as e:
            current_app.logger.error(f"OpenSearch search error for query '{query}': {str(e)}", exc_info=True)
            return []

    def find_similar(self, article_id: str, index_name: str = "articles", size: int = 5) -> List[Dict]:
        """Find similar articles using MLT (More Like This)."""
        if not article_id:
             current_app.logger.warning("find_similar called with empty article_id.")
             return []

        try:
            response = self.os.search(
                index=index_name,
                size=size + 1,
                body={
                    "query": {
                        "more_like_this": {
                            "fields": ["title", "content", "summary", "keywords"],
                            "like": [{"_id": article_id}],
                            "min_term_freq": 1,
                            "max_query_terms": 25,
                            "min_doc_freq": 1,
                            "minimum_should_match": "30%"
                        }
                    }
                }
            )

            hits = response.get("hits", {}).get("hits", [])
            similar_articles = [{
                "_id": hit.get("_id"),
                "_score": hit.get("_score"),
                "_source": hit.get("_source", {})
            } for hit in hits if hit.get("_id") != article_id]

            return similar_articles[:size]

        except Exception as e:
            current_app.logger.error(f"OpenSearch 'More Like This' error for article ID '{article_id}': {str(e)}", exc_info=True)
            return []

    def delete_article(self, article_id: str, index_name: str = "articles") -> bool:
        """Delete an article from the index."""
        if not article_id:
             current_app.logger.warning("delete_article called with empty article_id.")
             return False

        try:
            response = self.os.delete(
                index=index_name,
                id=article_id,
                refresh="wait_for"
            )

            if response.get("result") == "deleted":
                 current_app.logger.debug(f"Article ID {article_id} deleted from OpenSearch.")
                 return True
            elif response.get("result") == "not_found":
                 current_app.logger.warning(f"Article ID {article_id} not found in OpenSearch for deletion.")
                 return True
            else:
                 current_app.logger.error(f"Unexpected OpenSearch delete response for ID {article_id}: {response}")
                 return False

        except Exception as e:
            current_app.logger.error(f"Error deleting article ID {article_id} from OpenSearch: {str(e)}", exc_info=True)
            return False

    def get_article(self, article_id: str, index_name: str = "articles") -> Optional[Dict]:
        """Retrieve a single article by ID from OpenSearch."""
        if not article_id:
             current_app.logger.warning("get_article called with empty article_id.")
             return None

        try:
            response = self.os.get(
                index=index_name,
                id=article_id
            )
            if response.get("found"):
                 return {
                     "_id": response.get("_id"),
                     **response.get("_source", {})
                 }
            else:
                 current_app.logger.debug(f"Article ID {article_id} not found in OpenSearch.")
                 return None

        except Exception as e:
            current_app.logger.error(f"Error getting article ID {article_id} from OpenSearch: {str(e)}", exc_info=True)
            return None

    def search_recommendations(self, user_id: str, index_name: str = "articles", size: int = 10) -> List[Dict]:
        """Placeholder for recommendation search logic using OpenSearch."""
        current_app.logger.warning(f"Recommendation search called for user {user_id}. Using basic search as placeholder.")
        # Implement your actual recommendation logic here.
        return self.search(query="news", size=size)
