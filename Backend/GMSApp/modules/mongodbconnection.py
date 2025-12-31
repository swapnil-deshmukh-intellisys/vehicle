#privious code
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
from urllib.parse import quote_plus
from django.shortcuts import render, redirect
from django.conf import settings


def get_mongo_db():
    """Returns a MongoDB database connection."""
    try:
        client = MongoClient(settings.MONGO_URI, server_api=ServerApi('1'))
        db = client[settings.MONGO_DB_NAME]  # Database name
        return db
    except Exception as e:
        return None




