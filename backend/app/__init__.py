from flask import Flask
import os
from .config import DevelopmentConfig
from . import db
from threading import Thread
import time
import socket


def start_cron_job(app):
    while True:
        print("Fetching latest news from NewsAPI...")
        with app.app_context():
            from .services.article_service import ArticleService
            article_service = ArticleService()
            article_service.fetch_and_save_news()
        print("Done!")
        time.sleep(1800)  # 30mins

def create_app(config_class=DevelopmentConfig):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Initialize database
    db.init_app(app)

    # Initialize OpenSearch index immediately
    with app.app_context():
        os_url = app.config.get("OPENSEARCH_URL", "http://localhost:9200")
        from .services.opensearch_service import OpenSearchService
        try:
            OpenSearchService(os_url).create_index()
        except Exception as e:
            print(f"Warning: could not create OpenSearch index: {e}")

    # Register blueprints
    from .routes import articles
    app.register_blueprint(articles.bp)

    from .routes import news
    app.register_blueprint(news.bp)

    # from .routes import auth
    # app.register_blueprint(auth.bp)

    from .routes import admin_auth
    app.register_blueprint(admin_auth.bp)

    from .routes import user_auth
    app.register_blueprint(user_auth.bp)

    from .routes import common_auth
    app.register_blueprint(common_auth.bp)

    from .routes import bookmark
    app.register_blueprint(bookmark.bp)

    from .routes import comments
    app.register_blueprint(comments.bp)

    # Start background job if not in reloader
    if not os.environ.get("WERKZEUG_RUN_MAIN"):
        Thread(target=start_cron_job, args=(app,), daemon=True).start()
    
    return app
