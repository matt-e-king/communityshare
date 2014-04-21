import logging

from sqlalchemy.exc import IntegrityError, InvalidRequestError

from community_share.models.search import Label
from community_share.models.user import User
from community_share.store import session, Base, engine
from community_share import settings

logger = logging.getLogger(__name__)

def make_labels():
    labels = [
        # Grade levels
        'K-3', '4-5', '6-8', '9-12',
        # Subject area
        'STEM', 'Arts',
        'Science', 'Technology', 'Engineering', 'Math',
        'Visual Arts', 'Digital Media', 'Film & Photography', 'Literature',
        'Performing Arts',
        # Level of Engagement
        'Guest Speaker', 'Field Trip Host', 'Student Competition Judget',
        'Individual Mentor', 'Small Group Mentor', 'Curriculuum Development',
        'Career Day Participant', 'Classroom Materials Provider',
        'Short-term', 'Long-term'
    ]
    for name in labels:
        label = Label(name=name)
        session.add(label)
        try:
            session.commit()
        except (IntegrityError, InvalidRequestError):
            session.rollback()


def make_admin_user(name, email, password):
    password_hash = User.pwd_context.encrypt(password)
    new_user = User(name=name, email=email, password_hash=password_hash,
                    is_administrator=True)
    session.add(new_user)
    try:
        session.commit()
    except (IntegrityError, InvalidRequestError):
        session.rollback()


def setup():
    Base.metadata.drop_all(engine);
    Base.metadata.create_all(engine);
    make_labels()
    import os
    from community_share.models.secret import Secret
    admin_emails = os.environ.get('COMMUNITYSHARE_ADMIN_EMAILS', '').split(',')
    admin_emails = [x.strip() for x in admin_emails]
    logger.info('admin_emails is {0}'.format(admin_emails))
    for email in admin_emails:
        if email:
            make_admin_user(email, email, Secret.make_key(20))
    
if __name__ == '__main__':
    settings.setup_logging(logging.DEBUG)
    setup()
              
