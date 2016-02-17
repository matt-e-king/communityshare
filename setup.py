import logging
import random

from sqlalchemy.exc import IntegrityError, InvalidRequestError

from community_share.models.search import Label, Search
from community_share.models.user import User, UserReview
from community_share.models.secret import Secret
from community_share.models.survey import Question, SuggestedAnswer
from community_share.models.conversation import Conversation, Message
from community_share.models.institution import InstitutionAssociation, Institution
from community_share.models.share import Share, Event, EventReminder
from community_share import store, Base, config, setup_data

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
        'Social Studies', 'English/Language Arts', 'Foreign Languages', 'PE/Health/Sports',
        'Mathematics', 'Goverment',
    ],
    'LevelOfEngagement': [
        'Guest', 'Speaker', 'Field Trip Host', 'Student Competition Judge',
        'Individual/Group Mentor', 'Share Curriculum Ideas', 'Curriculuum Development',
        'Career Day Participant', 'Collaborator on a Class Project'
    ],
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

profile_picture_filenames = [
    'aardvark.jpg', 'gila_monster.jpg', 'octopus.jpg', 'sloth.jpg',
    'ant.jpg', 'honey_badger.jpg', 'pig.jpg',
    'dolphin.jpg', 'llama.jpg', 'shiba.jpg',
]

school_infos = [
    ('School Number 42', 'School'),
    ('School Number 101', 'School')
]

educator_roles = [
    'Classroom Teacher',
    'Curriculum Coordinator',
]

partner_roles = [
    'Intern',
    'CEO',
    'Engineer',
    'Sales Representative',
]

company_infos = [('Big Univeristy', 'University'),
                ('Acme', 'Company'),
                ('City Opera', 'Nonprofit'),
                ('Widget Factory', 'Company'),
                ('Secret Goverment Research Lab', 'Goverment'),
                ('Myself', 'Freelancer'),
                ('Copper Mine', 'Company'),
            ]
specialties = ['robotic molluscs',
               'portmodern composition',
               'mass surveillance',
               'classical portraiture',
               'laying fibreoptic cable',
               'interpretative dance',
           ]
hobbies = ['underwater skiing.',
           'playing competitive hide-and-seek.',
           'playing minecraft',
           'french cooking',
           'watching reality TV',
           'training for marathons',
           'juggling'
       ]

def make_institutions(infos):
    institutions = []
    for name, institution_type in infos:
        institution = Institution(
            name=name,
            institution_type=institution_type,
         )
        institutions.append(institution)
    return institutions

companies = make_institutions(company_infos)
schools = make_institutions(school_infos)

def random_item_from_list(ll):
    item = ll[random.randint(0, len(ll)-1)]
    return item

def generate_expert_bio():
    bio_template = "I specialize in the area of {0}.  My main hobby is {1}."
    specialty = random_item_from_list(specialties)
    hobby = random_item_from_list(hobbies)
    bio = bio_template.format(specialty, hobby)
    return bio

def generate_educator_bio():
    bio_template = "My main hobby is {0}"
    hobby = random_item_from_list(hobbies)
    bio = bio_template.format(hobby)
    return bio

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
    picture_filename = random_item_from_list(profile_picture_filenames)
    randombinary = random.randint(0, 1)
    if randombinary:
        searcher_role = 'educator'
        searching_for_role = 'partner'
        bio = generate_educator_bio()
        institution_associations = [
            InstitutionAssociation(
                institution=random_item_from_list(schools),
                role=random_item_from_list(educator_roles)
            )]
    else:
        searcher_role = 'partner'
        searching_for_role = 'educator'
        bio = generate_expert_bio()
        n_institutions = random.randint(1, 2)
        institution_associations = [
            InstitutionAssociation(
                institution=random_item_from_list(companies),
                role=random_item_from_list(partner_roles))
            for x in range(n_institutions)]
    new_user = User(name=name, email=email, password_hash=password_hash,
                    picture_filename=picture_filename, bio=bio,
                    institution_associations=institution_associations,
                    is_administrator=False, email_confirmed=True)
    store.session.add(new_user)
    store.session.commit()
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
    store.session.add(search)
    store.session.commit()
    if search.searcher_role == 'educator':
        new_user.educator_profile_search = search
    else:
        new_user.community_partner_profile_search = search
    store.session.add(new_user)
    store.session.commit()
        
def make_labels():
    all_labels = labels['GradeLevels'] + labels['SubjectAreas'] + labels['LevelOfEngagement']
    for name in all_labels:
        label = Label(name=name)
        store.session.add(label)
        try:
            store.session.commit()
        except (IntegrityError, InvalidRequestError):
            store.session.rollback()


def make_admin_user(name, email, password):
    password_hash = User.pwd_context.encrypt(password)
    new_user = User(name=name, email=email, password_hash=password_hash,
                    is_administrator=True, email_confirmed=True)
    store.session.add(new_user)
    try:
        store.session.commit()
    except (IntegrityError, InvalidRequestError):
        store.session.rollback()
        new_user = None
    return new_user

def update_questions(questions):
    new_hashs = set([question.make_hash() for question in questions])
    existing_questions = store.session.query(Question).filter(Question.active == True).all()
    old_hashs = set([question.make_hash() for question in existing_questions])
    hashs_to_add = new_hashs - old_hashs
    hashs_to_delete = old_hashs - new_hashs
    for question in existing_questions:
        if question.make_hash() in hashs_to_delete:
            question.active = False
            store.session.add(question)
    for question in questions:
        if question.make_hash() in hashs_to_add:
            store.session.add(question)

def init_db():
    Base.metadata.reflect(store.engine)
    logger.info('Dropping all tables.')
    Base.metadata.drop_all(store.engine);
    logger.info('Creating all tables.')
    Base.metadata.create_all(store.engine);    

def update_db():
    Base.metadata.reflect(store.engine)
    logger.info('Creating all tables.')
    Base.metadata.create_all(store.engine, checkfirst=True);    
    logger.info('Created all tables.')

def get_creator():
    admin_emails = config.ADMIN_EMAIL_ADDRESSES.split(',')
    admin_emails = [x.strip() for x in admin_emails]
    admin_user = None
    for admin_email in admin_emails:
        admin_user = store.session.query(User).filter(
            User.active==True, User.email==admin_email).first()
        if admin_user is not None:
            break
    return admin_user

def setup(n_random_users=100):
    logger.info('Starting setup script.')
    init_db()
    first_admin = None
    logger.info('Making labels.')
    make_labels()
    import os
    from community_share.models.secret import Secret
    admin_emails = config.ADMIN_EMAIL_ADDRESSES.split(',')
    admin_emails = [x.strip() for x in admin_emails]
    logger.info('admin_emails is {0}'.format(admin_emails))
    logger.info('Making Admin Users')
    for email in admin_emails:
        if email:
            user = make_admin_user(email, email, Secret.make_key(20))
            if user is not None and first_admin is None:
                first_admin = user
    logger.info('Making {0} random users'.format(n_random_users))
    for i in range(n_random_users):
        make_random_user()
    creator = get_creator()
    logger.info('Creator of questions is {}'.format(creator.email))
    questions = setup_data.get_questions(creator)
    update_questions(questions)
    store.session.commit()
    creator = get_creator()
    questions = setup_data.get_questions(creator)
    update_questions(questions)
    store.session.commit()
    
if __name__ == '__main__':
    logger.info('Loading settings from environment')    
    config.load_from_file()
    logger.info('Finished loading settings')
    setup(n_random_users=0)
              
