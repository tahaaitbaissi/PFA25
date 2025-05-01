import os

class BaseConfig:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'super-secret-key')
    DEBUG = False
    TESTING = False
    NEWS_API_KEY = "222363ea5db04790a4ba63187ecbdc23"
    REDDIT_CLIENT_ID = "clfCIUEbRRYe2g1Ox5XavQ"
    REDDIT_CLIENT_SECRET = "t6jIghgiOF4QP-R4JsVA71lLFBmHSA"
    ELASTICSEARCH_URL = os.getenv("ELASTICSEARCH_URL", "http://localhost:9200")

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
