from opensearchpy import OpenSearch
from flask import current_app
import time
import socket
from urllib.parse import urlparse
from typing import Dict, List, Optional, Any, Union
from datetime import datetime

class OpenSearchService:
    def __init__(self, os_url: str):
        """Initialize OpenSearch connection with robust error handling.
        
        Args:
            os_url: OpenSearch connection URL (e.g., 'http://localhost:9200')
            
        Raises:
            ConnectionError: If connection to OpenSearch fails
            ValueError: If URL is invalid
        """
        print(f"Initializing OpenSearchService with URL: {os_url}")
        
        try:
            # Parse the URL to get host and port
            parsed_url = urlparse(os_url)
            if not parsed_url.hostname:
                raise ValueError("Invalid OpenSearch URL: missing hostname")

            connection_url = f"{parsed_url.scheme}://{parsed_url.hostname}:{parsed_url.port or 9200}"
            
            self.os = OpenSearch(
                hosts=[connection_url],
                http_compress=True,  # Enable compression
                timeout=30,          # Set timeout
                retry_on_timeout=True,
                max_retries=3
            )
            
            self.wait_for_opensearch()
            if not self.os.ping():
                raise ConnectionError("Could not connect to OpenSearch")
            
            print(f"Successfully connected to OpenSearch cluster: {self.os.info()['cluster_name']}")
            
        except Exception as e:
            current_app.logger.error(f"Failed to initialize OpenSearch: {str(e)}")
            raise ConnectionError(f"OpenSearch initialization failed: {str(e)}")

    def wait_for_opensearch(self, retries: int = 10, delay: int = 3) -> None:
        """Wait for OpenSearch to be ready with improved diagnostics.
        
        Args:
            retries: Number of connection attempts
            delay: Delay between attempts in seconds
            
        Raises:
            Exception: If connection fails after all retries
        """
        print(f"Starting OpenSearch connection attempts (max {retries}, delay {delay}s)")
        
        for attempt in range(retries):
            try:
                print(f"Attempt {attempt + 1}/{retries}: Pinging OpenSearch...")
                if self.os.ping():
                    info = self.os.info()
                    print(f"SUCCESS: Connected to OpenSearch {info['version']['number']} "
                          f"at {info['name']} (cluster: {info['cluster_name']})")
                    return
                print("Ping returned false")
                
            except Exception as e:
                print(f"Connection error: {e.__class__.__name__}: {str(e)}")
                # Print the actual hosts configuration
                print(f"Client config: {self.os.transport.hosts}")
            
            if attempt < retries - 1:
                print(f"Waiting {delay} seconds before next attempt...")
                time.sleep(delay)
        
        raise ConnectionError("Could not connect to OpenSearch after multiple retries. "
                             "Check network connectivity and OpenSearch status.")

    def create_index(self, index_name: str = "articles", retries: int = 5, delay: int = 5) -> None:
        """Create the articles index with custom mapping.
        
        Args:
            index_name: Name of the index to create
            retries: Number of creation attempts
            delay: Delay between attempts in seconds
        """
        for attempt in range(retries):
            try:
                print(f"Attempting to create index (attempt {attempt + 1}/{retries})")
                if not self.os.indices.exists(index=index_name):
                    print(f"Creating '{index_name}' index with mappings...")
                    self.os.indices.create(
                        index=index_name,
                        body={
                            "settings": {
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
                            },
                            "mappings": {
                                "properties": {
                                    "title": {
                                        "type": "text",
                                        "analyzer": "english",
                                        "fields": {
                                            "exact": {
                                                "type": "text",
                                                "analyzer": "english_exact"
                                            }
                                        }
                                    },
                                    "content": {"type": "text", "analyzer": "english"},
                                    "source_url": {"type": "keyword"},
                                    "ai_score": {"type": "float"},
                                    "keywords": {"type": "keyword"},
                                    "summary": {"type": "text"},
                                    "date_soumission": {"type": "date"},
                                    "related_reddit_posts": {
                                        "type": "nested",
                                        "properties": {
                                            "post_id": {"type": "keyword"},
                                            "title": {"type": "text"},
                                            "score": {"type": "integer"},
                                            "comments": {"type": "integer"}
                                        }
                                    }
                                }
                            }
                        }
                    )
                    print(f"✓ Index '{index_name}' created successfully")
                else:
                    print(f"✓ Index '{index_name}' already exists")
                return
                
            except Exception as e:
                print(f"Failed to create index: {e}")
                if attempt < retries - 1:
                    print(f"Waiting {delay} seconds before next attempt...")
                    time.sleep(delay)
        
        print(f"Warning: Failed to create index '{index_name}' after {retries} attempts")

    def index_article(self, article: Dict, index_name: str = "articles") -> bool:
        """Index an article in OpenSearch.
        
        Args:
            article: Article data to index
            index_name: Target index name
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            doc: Dict[str, Any] = {
                "title": article.get("title", ""),
                "content": article.get("content", ""),
                "source_url": article.get("source_url", ""),
                "ai_score": float(article.get("ai_score", 0)),
                "keywords": list(article.get("keywords", [])),
                "summary": article.get("summary", ""),
                "related_reddit_posts": list(article.get("related_reddit_posts", []))
            }
            
            # Handle date field properly
            if "date_soumission" in article:
                date_val = article["date_soumission"]
                if isinstance(date_val, datetime):
                    doc["date_soumission"] = date_val.isoformat()
                elif date_val:
                    doc["date_soumission"] = date_val
            
            response = self.os.index(
                index=index_name,
                id=str(article["_id"]),
                body=doc,
                refresh=True
            )
            
            if response["result"] not in ["created", "updated"]:
                current_app.logger.error(f"Unexpected OpenSearch response: {response}")
                return False
                
            return True
            
        except Exception as e:
            current_app.logger.error(f"Error indexing article {article.get('_id')}: {str(e)}", exc_info=True)
            return False

    def search(self, query: str, index_name: str = "articles", size: int = 10) -> List[Dict]:
        """Search articles by query.
        
        Args:
            query: Search query string
            index_name: Index to search in
            size: Maximum number of results to return
            
        Returns:
            List of matching documents with highlights
        """
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
                            "title": {"number_of_fragments": 1},
                            "content": {"fragment_size": 150, "number_of_fragments": 3},
                            "summary": {"number_of_fragments": 1}
                        }
                    }
                }
            )
            
            return [{
                "_id": hit["_id"],
                "_score": hit["_score"],
                "_source": hit["_source"],
                "highlight": hit.get("highlight", {})
            } for hit in response["hits"]["hits"]]
            
        except Exception as e:
            current_app.logger.error(f"OpenSearch search error: {str(e)}", exc_info=True)
            return []

    def find_similar(self, article_id: str, index_name: str = "articles", size: int = 5) -> List[Dict]:
        """Find similar articles using MLT (More Like This).
        
        Args:
            article_id: ID of the article to find similar documents for
            index_name: Index to search in
            size: Maximum number of results to return
            
        Returns:
            List of similar documents
        """
        try:
            response = self.os.search(
                index=index_name,
                size=size,
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
            
            return [{
                "_id": hit["_id"],
                "_score": hit["_score"],
                "_source": hit["_source"]
            } for hit in response["hits"]["hits"]]
            
        except Exception as e:
            current_app.logger.error(f"Similar articles search error: {str(e)}", exc_info=True)
            return []

    def delete_article(self, article_id: str, index_name: str = "articles") -> bool:
        """Delete an article from the index.
        
        Args:
            article_id: ID of the article to delete
            index_name: Index to delete from
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            response = self.os.delete(
                index=index_name,
                id=article_id
            )
            return response["result"] == "deleted"
            
        except Exception as e:
            current_app.logger.error(f"Error deleting article {article_id}: {str(e)}", exc_info=True)
            return False

    def get_article(self, article_id: str, index_name: str = "articles") -> Optional[Dict]:
        """Retrieve a single article by ID.
        
        Args:
            article_id: ID of the article to retrieve
            index_name: Index to search in
            
        Returns:
            The article document if found, None otherwise
        """
        try:
            response = self.os.get(
                index=index_name,
                id=article_id
            )
            return {
                "_id": response["_id"],
                **response["_source"]
            }
            
        except Exception as e:
            current_app.logger.error(f"Error getting article {article_id}: {str(e)}", exc_info=True)
            return None