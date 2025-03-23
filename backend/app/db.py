from flask import current_app, g
from pymongo import MongoClient
import click

def get_db():
    """Get the MongoDB client connection for the current request."""
    if 'db' not in g:
        g.db_client = MongoClient(current_app.config['MONGO_URI'])
        g.db = g.db_client[current_app.config['MONGO_DB_NAME']]
    return g.db

def close_db(e=None):
    """Close the database connection after the request ends."""
    db_client = g.pop('db_client', None)

    if db_client is not None:
        db_client.close()

def init_db():
    """Initialize MongoDB collections (if needed)."""
    db = get_db()

    # Define indexes for faster queries (example)
    db.articles.create_index("title")
    db.users.create_index("email", unique=True)

    # Optional: Insert initial data
    if db.users.count_documents({}) == 0:
        db.users.insert_one({"username": "admin", "email": "admin@gmail.com"})

@click.command('init-db')
def init_db_command():
    """CLI command to initialize the database."""
    init_db()
    click.echo('Initialized the MongoDB database.')

def init_app(app):
    """Register database functions with the Flask app."""
    app.teardown_appcontext(close_db)
    app.cli.add_command(init_db_command)
