from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session
from sqlalchemy.ext.declarative import declarative_base

from community_share import settings

Base = declarative_base()

engine = create_engine(settings.DB_CONNECTION)

Session = sessionmaker(bind=engine)
session = scoped_session(sessionmaker(bind=engine))
