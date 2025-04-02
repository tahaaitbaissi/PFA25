import os

class BaseConfig:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'super-secret-key')
    DEBUG = False
    TESTING = False
    NEWS_API_KEY = "test"

    # MongoDB Configuration
    MONGO_DB_NAME = "fake_news"
    MONGO_URI = os.environ.get('MONGO_URI', 'mongodb://localhost:27017/fake_news')

class DevelopmentConfig(BaseConfig):
    DEBUG = True

class TestingConfig(BaseConfig):
    TESTING = True
    MONGO_URI = os.environ.get('MONGO_URI_TEST', 'mongodb://localhost:27017/fake_news_test')

class ProductionConfig(BaseConfig):
    DEBUG = False
