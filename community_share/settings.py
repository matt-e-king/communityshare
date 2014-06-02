import os
import logging

DB_CONNECTION = os.environ.get('DATABASE_URL', '')

# MAILER_TYPE can be 'MAILGUN' or 'DUMMY'
MAILER_TYPE = os.environ['COMMUNITYSHARE_MAILER_TYPE']
MAILGUN_API_KEY = os.environ['MAILGUN_API_KEY']
MAILGUN_DOMAIN = os.environ['MAILGUN_DOMAIN']

DONOTREPLY_EMAIL_ADDRESS = os.environ['COMMUNITYSHARE_DONOTREPLY_EMAIL_ADDRESS']

BASEURL = os.environ['COMMUNITYSHARE_BASEURL']

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
    
