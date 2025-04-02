from flask import Flask
from .config import DevelopmentConfig
from . import db
from .services.article_service import ArticleService
from threading import Thread
import time

def start_cron_job(app):
    while True:
        print("Fetching latest news from NewsAPI...")
        with app.app_context():
            ArticleService.fetch_and_save_news()
        time.sleep(1800)  # Run every 1 hour (adjust as needed)

def create_app(config_class=DevelopmentConfig):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize MongoEngine
    db.init_app(app)

    Thread(target=start_cron_job, args=(app,), daemon=True).start()

    from .routes import articles
    app.register_blueprint(articles.bp)

    from .routes import news
    app.register_blueprint(news.bp)
    
    return app
