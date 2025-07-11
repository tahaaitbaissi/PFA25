from flask import Flask
import os
from .config import DevelopmentConfig
from . import db
from threading import Thread
import time
from flask_socketio import SocketIO
from flask_cors import CORS




# Initialize SocketIO globally
socketio = SocketIO(
                   logger=True,
                   engineio_logger=True,
                   cors_allowed_origins="*")

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
    # CORS(app, resources={r"/*": {"origins": "*"}}, methods={"PUT", "GET", "POST", "DELETE"})
    CORS(app, resources={
        r"/*": {
            "origins": "http://localhost:5173",
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization", "Accept"],
            "supports_credentials": True,
            "expose_headers": ["Content-Type"],
            "max_age": 600
        }
    })


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

    from .routes import notifications
    app.register_blueprint(notifications.bp)

    from .routes import categories
    app.register_blueprint(categories.bp)


    # Initialize SocketIO with app
    socketio.init_app(app)

    from .sockets.notifications import register_notification_handlers
    register_notification_handlers(socketio)

    # Start background job if not in reloader
    if not os.environ.get("WERKZEUG_RUN_MAIN"):
        Thread(target=start_cron_job, args=(app,), daemon=True).start()

    return app


__all__ = ['socketio']
