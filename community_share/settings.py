import os
import logging

DB_CONNECTION = 'postgresql://ben@localhost/communityshare'

MAILER_TYPE = 'DUMMY'
# MAILER_TYPE = 'MAILGUN'
MAILGUN_API_KEY = os.environ('MAILERGUN_API_KEY')

def setup_logging(level):
    "Utility function for setting up logging."
    ch = logging.StreamHandler()
    ch.setLevel(logging.DEBUG)
    formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
    ch.setFormatter(formatter)
    # Which packages do we want to log from.
    packages = ('__main__', 'communityshare',)
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
    
