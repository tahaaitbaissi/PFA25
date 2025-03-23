from flask import Flask
from .config import DevelopmentConfig
from . import db

def create_app(config_class=DevelopmentConfig):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize MongoEngine
    db.init_app(app)

    # Import and register blueprints here
    # from .routes import auth_routes, article_routes
    # app.register_blueprint(auth_routes.bp)

    from .routes import articles
    app.register_blueprint(articles.bp)
    
    return app
