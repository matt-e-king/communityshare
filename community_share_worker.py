import logging

from community_share import worker

logger = logging.getLogger(__name__)

if __name__ == '__main__':
    logger.info('Loading settings from environment')
    config.load_from_environment()
    logger.info('Debug={0}'.format(app.debug))
    worker.work_loop()
