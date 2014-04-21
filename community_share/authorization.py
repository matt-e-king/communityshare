import logging

from flask import request

from community_share.store import session
from community_share.models.user import User

logger = logging.getLogger(__name__)

class NotAuthorizedException(Exception):
    pass

class ForbiddenException(Exception):
    pass

def get_requesting_user():
    authorization = request.headers.get('Authorization', None)
    authorized_user = None
    if authorization is not None:
        bits = authorization.split(':')
        if len(bits) == 3 and bits[0] == 'Basic':
            email = bits[1]
            password = bits[2]
            logger.debug('Authorizing with email={0}'.format(email))
            if email == 'api':
                authorized_user = User.from_api_key(password)
            else:
                user = session.query(User).filter_by(email=email).first()
                if user is not None:
                    if user.is_password_correct(password):
                        authorized_user = user
    return authorized_user

