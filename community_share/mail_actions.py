import json
import logging
from datetime import datetime

from community_share.models.user import User
from community_share.models.secret import Secret
from community_share.store import session
from community_share import mail, settings

logger = logging.getLogger(__name__)

def request_password_reset(user):
    secret_info = {
        'userId': user.id,
        'action': 'password_reset',
    }
    hours_duration = 48
    secret = Secret.create_secret(secret_info, hours_duration)
    content='''We received a request to reset your password for CommunityShare.
    
To reset your password please click on the following link and follow the instructions.
    
{BASEURL}/#/resetpassword?key={secret_key}
    
If you cannot click on the link copy it into the addressbar of your browser.
'''
    content = content.format(BASEURL=settings.BASEURL, secret_key=secret.key)
    email = mail.Email(
        from_address=settings.DONOTREPLY_EMAIL_ADDRESS,
        to_address=user.email,
        subject='CommunityShare Password Reset Request',
        content=content
    )
    mail.mailer.send(email)

def process_password_reset(secret_key, new_password):
    logger.debug('password reset secret key is {0}'.format(secret_key))
    secret = Secret.lookup_secret(secret_key)
    user = None
    if secret is not None:
        secret_info = secret.get_info()
        userId = secret_info.get('userId', None)
        action = secret_info.get('action', None)
        if action == 'password_reset' and userId is not None:
            user = session.query(User).filter_by(id=userId).first()
            if user is not None:
                user.set_password(new_password)
                secret.used = True
                session.add(user)
                session.add(secret)
                session.commit()
    return user
        
