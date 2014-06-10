import logging

from community_share import setup, config, store

from questions import questions

logger = logging.getLogger(__name__)

def main():
    logger.info('Loading settings from environment')    
    config.load_from_environment()
    setup.update_db()
    creator = setup.get_creator()
    setup.update_questions(get_questions(creator))
    store.session.commit()

if __name__ == '__main__':
    main()
