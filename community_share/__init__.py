import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class Store(object):

    def __init__(self):
        pass

    def set_config(self, config):
        self._engine = create_engine(config.DB_CONNECTION)
        self._session = scoped_session(sessionmaker(bind=self._engine))

    @property
    def engine(self):
        return self._engine

    @property
    def session(self):
        return self._session

store = Store()


class Config(object):
    NAMES = (
        # Database
        'DB_CONNECTION',
        # Email 
        'MAILER_TYPE', # Can be 'MAILGUN' or 'DUMMY' or 'QUEUE'
        'MAILGUN_API_KEY', 'MAILGUN_DOMAIN', 'DONOTREPLY_EMAIL_ADDRESS',
        # Location
        'BASEURL',
        # Logging
        'LOGGING_LEVEL',
        # S3 bucket
        'S3_BUCKETNAME', 'S3_KEY', 'S3_USERNAME', 'UPLOAD_LOCATION',
        # Version
        'COMMIT_HASH',
    )
    def load_from_dict(self, d):
        assert(set(d.keys()) == set(self.NAMES))
        for key, value in d.items():
            setattr(self, key, value)
        store.set_config(self)

    def load_from_environment(self):
        data = {
            'DB_CONNECTION': os.environ['DATABASE_URL'],
            'MAILER_TYPE': os.environ['COMMUNITYSHARE_MAILER_TYPE'],
            'MAILGUN_API_KEY': os.environ['MAILGUN_API_KEY'],
            'MAILGUN_DOMAIN': os.environ['MAILGUN_DOMAIN'],
            'LOGGING_LEVEL': os.environ['COMMUNITYSHARE_LOGGING_LEVEL'],
            'DONOTREPLY_EMAIL_ADDRESS': os.environ['COMMUNITYSHARE_DONOTREPLY_EMAIL_ADDRESS'],
            'BASEURL': os.environ['COMMUNITYSHARE_BASEURL'],
            'S3_BUCKETNAME': os.environ['COMMUNITYSHARE_S3_BUCKETNAME'],
            'S3_KEY': os.environ['COMMUNITYSHARE_S3_KEY'],
            'S3_USERNAME': os.environ['COMMUNITYSHARE_S3_USERNAME'],
            'UPLOAD_LOCATION': os.environ['COMMUNITYSHARE_UPLOAD_LOCATION'],
            'COMMIT_HASH': os.environ['COMMIT_HASH'],
        }
        self.load_from_dict(data)

config = Config()
