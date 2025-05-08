from flask import current_app, g
from pymongo import MongoClient
import click
import bcrypt

def get_db():
    # store/get the db connection in/from the g Object
    if 'db' not in g:
        g.db_client = MongoClient(current_app.config['MONGO_URI'])
        g.db = g.db_client[current_app.config['MONGO_DB_NAME']]
    return g.db

def close_db(e=None):
    # close db connection and remove from the g object
    db_client = g.pop('db_client', None)

    if db_client is not None:
        db_client.close()

# def init_db():
#     db = get_db()
#
#     db.articles.create_index("title")
#     db.users.create_index("email", unique=True)
#
#     # Default admin user
#     if db.users.count_documents({}) == 0:
#         db.users.insert_one({"username": "admin", "email": "admin@gmail.com"})

def init_db():
    """Initialize MongoDB collections (if needed)."""
    db = get_db()

    # Define indexes for faster queries (example)
    db.articles.create_index("title")
    db.users.create_index("email", unique=True)

    # Optional: Insert initial data
    if db.users.count_documents({}) == 0:
        # Création de l'admin avec mot de passe
        hashed_pw = bcrypt.hashpw('admin_password'.encode('utf-8'), bcrypt.gensalt())  # Hash du mot de passe
        db.users.insert_one({
            "username": "admin",
            "email": "admin@gmail.com",
            "password": hashed_pw,
            "role": "admin",
            "points": 0,

        })
    click.echo('Initialized the MongoDB database.')

@click.command('init-db')
def init_db_command():
    # CLI command to init db
    # run: flask init-db
    init_db()
    click.echo('Initialized the MongoDB database.')

def init_app(app):
    # close db conn after requests
    app.teardown_appcontext(close_db)
    # add the CLI command
    app.cli.add_command(init_db_command)
