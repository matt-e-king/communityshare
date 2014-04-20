from sqlalchemy.exc import IntegrityError, InvalidRequestError

from community_share.models.search import Label
from community_share.models.user import User
from community_share.store import session, Base, engine

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
    Base.metadata.create_all(engine);
    make_labels()
    make_admin_user('Ben Reynwar', 'ben@reynwar.net', 'evaporatingfish')    
    
if __name__ == '__main__':
    setup()
              
