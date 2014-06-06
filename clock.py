import logging

from apscheduler.scheduler import Scheduler

from community_share import config

logger = logging.getLogger(__name__)

logger.info('Loading settings from environment')
config.load_from_environment()

sched = Scheduler()

@sched.interval_schedule(minutes=1)
def timed_job():
    logger.info('This job is run every minute.')

sched.start()
input("Press enter to exit.")
sched.shutdown()
