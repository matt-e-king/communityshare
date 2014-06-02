import os
import logging

DB_CONNECTION = os.environ.get('DATABASE_URL', '')

# MAILER_TYPE can be 'MAILGUN' or 'DUMMY'
MAILER_TYPE = os.environ.get('MAILER_TYPE')
MAILGUN_API_KEY = os.environ.get('MAILGUN_API_KEY', 'invalidapikey')
MAILGUN_DOMAIN = os.environ.get('MAILGUN_DOMAIN')

DONOTREPLY_EMAIL_ADDRESS = os.environ.get('COMMUNITYSHARE_DONOTREPLY_EMAIL_ADDRESS',
                                          'donotreply@invalid.email.address')

BASEURL = os.environ.get('COMMUNITYSHARE_BASEURL', 'localhost:5000')

def setup_logging(level):
    "Utility function for setting up logging."
    ch = logging.StreamHandler()
    ch.setLevel(logging.DEBUG)
    formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
    ch.setFormatter(formatter)
    # Which packages do we want to log from.
    packages = ('__main__', 'community_share',)
    for package in packages:
        logger = logging.getLogger(package)
        logger.addHandler(ch)
        logger.setLevel(level)
    # Warning only packages
    packages = []
    for package in packages:
        logger = logging.getLogger(package)
        logger.addHandler(ch)
        logger.setLevel(logging.WARNING)
    
