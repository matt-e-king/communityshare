from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from community_share import settings

engine = create_engine(settings.DB_CONNECTION)

Session = sessionmaker(bind=engine)
session = Session()
