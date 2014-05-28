import logging
import random

from sqlalchemy.exc import IntegrityError, InvalidRequestError

from community_share.models.search import Label, Search
from community_share.models.user import User
from community_share.models.secret import Secret
from community_share.models.survey import Question, SuggestedAnswer
from community_share.models.conversation import Conversation, Message
from community_share.store import session, Base, engine
from community_share import settings

logger = logging.getLogger(__name__)

def make_email(first_name, last_name):
    email = '{0}.{1}@notarealemail.com'.format(first_name, last_name)
    return email

skills = ['cooking', 'meterology', 'paleontology', 'dinosaurs', 'biology', 'fish',
          'rockets', 'horses', 'farming', 'accounting']

first_names = ['Bob', 'Susan', 'Joe', 'Charlotte', 'Rufus', 'Esmerelda', 'Ethelred', 'Ethelmay',
               'John', 'Mary', 'Sam', 'Emma', 'Robert', 'Cary', 'Mohammed', 'Pierre', 'Mina',
               'Antonio', 'Fatima', 'Antonia', 'Pedro', 'Fang', 'Ai'
           ]
last_names = ['Smith', 'Wu', 'Williams', 'Johnson', 'Jones', 'Davis',
              'Rodriguez', 'Garcia', 'Gonzalez', 'White', 'Lopez', 'Robinson',
              'Walker', 'Perez', 'Wright', 'King', 'Campbell', 'Evans', 'Carter']

labels = {
    'GradeLevels': [
        'K-5', '6-8', '9-12', 'College', 'Adult',
    ],
    'SubjectAreas': [
        'STEM', 'Arts',
        'Science', 'Technology', 'Engineering', 'Math',
        'Visual Arts', 'Digital Media', 'Film & Photography', 'Literature',
        'Performing Arts',
    ],
    'LevelOfEngagement': [
        'Guest Speaker', 'Field Trip Host', 'Student Competition Judget',
        'Individual Mentor', 'Small Group Mentor', 'Curriculuum Development',
        'Career Day Participant', 'Classroom Materials Provider',
        'Short-term', 'Long-term'
    ]
}

def get_labels():
    my_labels = []
    label_sets = [
        (labels['GradeLevels'], 0.5),
        (labels['SubjectAreas'], 0.2),
        (labels['LevelOfEngagement'], 0.2),
        (skills, 0.3),
    ]
    for label_set, probability in label_sets:
        for label in label_set:
            if random.random() < probability:
                my_labels.append(label)
    return my_labels

def random_item_from_list(ll):
    item = ll[random.randint(0, len(ll)-1)]
    return item

def make_random_location():
    latitude = 32.223303 + (random.random()-0.5)+0.1
    longitude = -110.970905 + (random.random()-0.5)+0.1
    return (latitude, longitude)

user_names_used = set()
def make_random_user():
    # Make the user
    finished = False
    while not finished:
        first_name = random_item_from_list(first_names)
        last_name = random_item_from_list(last_names)
        combined = (first_name, last_name)
        if combined not in user_names_used:
            finished = True
            user_names_used.add(combined)
    password = Secret.make_key(20)
    email = make_email(first_name, last_name)
    password_hash = User.pwd_context.encrypt(password)
    name = '{0} {1}'.format(first_name, last_name)
    new_user = User(name=name, email=email, password_hash=password_hash,
                    is_administrator=False)
    session.add(new_user)
    session.commit()
    randombinary = random.randint(0, 1)
    if randombinary:
        searcher_role = 'educator'
        searching_for_role = 'partner'
    else:
        searcher_role = 'partner'
        searching_for_role = 'educator'
    # Make the search
    location = make_random_location()
    search = Search(
        searcher_user_id=new_user.id,
        searcher_role=searcher_role,
        searching_for_role=searching_for_role,
        latitude=location[0],
        longitude=location[1],
    )
    search.labels = Label.name_list_to_object_list(get_labels())
    session.add(search)
    session.commit()
        
def make_labels():
    all_labels = labels['GradeLevels'] + labels['SubjectAreas'] + labels['LevelOfEngagement']
    for name in all_labels:
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
        new_user = None
    return new_user

def make_questions(creator):
    logger.debug('creator is {0}'.format(creator))
    question_one = Question(
        text='To what extent have you worked with educators/educational institutions before?',
        creator=creator,
        question_type='signup_community_partner',
        public=True,
        only_suggested_answers=False,
        order=0,
        suggested_answers=[
            SuggestedAnswer(creator=creator,
                            text='Never'),
            SuggestedAnswer(creator=creator,
                            text='A few times'),
            SuggestedAnswer(creator=creator,
                            text='6+ times'),
            SuggestedAnswer(creator=creator,
                            text='Dozens'),
        ]
    )
    question_two = Question(
        text='If you have worked with educators/educational institutions before, please list them here.',
        creator=creator,
        question_type='signup_community_partner',
        public=True,
        only_suggested_answers=False,
        order=1,
    )
    question_three = Question(
        text='How did you hear about Community Share?',
        creator=creator,
        question_type='signup',
        public=True,
        only_suggested_answers=False,
        order=2,
        suggested_answers=[
            SuggestedAnswer(creator=creator,
                            text='Colleague'),
            SuggestedAnswer(creator=creator,
                            text='Friend'),
            SuggestedAnswer(creator=creator,
                            text='Media'),
            SuggestedAnswer(creator=creator,
                            text='Web search'),
        ],
    )
    session.add(question_one)
    session.add(question_two)
    try:
        session.commit()
    except (IntegrityError, InvalidRequestError):
        session.rollback()

def setup():
    first_admin = None
    Base.metadata.reflect(engine)
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
            user = make_admin_user(email, email, Secret.make_key(20))
            if user is not None and first_admin is None:
                first_admin = user
    logger.info('made admin users')
    make_questions(first_admin)
    # Make 100 random users
    for i in range(100):
        make_random_user()
    session.commit()
    
if __name__ == '__main__':
    settings.setup_logging(logging.DEBUG)
    setup()
              
