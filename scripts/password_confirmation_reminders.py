'''
Send an email to users who haven't confirmed their passwords asking them to confirm.
'''

import logging

from community_share.models.user import User
from community_share.models.share import Event
from community_share.models.conversation import Conversation
from community_share import mail_actions, config, store

def send_reminders():
    users = store.session.query(User).filter_by(
        active=True, email_confirmed=False).all()
    for user in users:
        template = mail_actions.CONFIRM_EMAIL_REMINDER_TEMPLATE
        subject = 'Please confirm email address.'
        mail_actions.request_signup_email_confirmation(
            user, template=template, subject=subject)
        
if __name__ == '__main__':
    config.load_from_environment()
    logger = logging.getLogger(__name__)
    send_reminders()
        
