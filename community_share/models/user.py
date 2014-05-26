from datetime import datetime
import logging

from sqlalchemy import Column, Integer, String, DateTime, Boolean, Table
from sqlalchemy import ForeignKey
from sqlalchemy.orm import relationship, backref

import passlib
from passlib import context

from community_share.store import Base, session
from community_share.models.base import Serializable
from community_share.models.secret import Secret
from community_share.models.search import Search

logger = logging.getLogger(__name__)

user_institution_table = Table('user_institution', Base.metadata,
    Column('user_id', Integer, ForeignKey('user.id')),
    Column('institution_id', Integer, ForeignKey('institution.id'))
)

class User(Base, Serializable):
    __tablename__ = 'user'

    MANDATORY_FIELDS = ['name', 'email']
    WRITEABLE_FIELDS = ['name', 'is_administrator', 'institutions']
    STANDARD_READABLE_FIELDS = [
        'id', 'name', 'is_administrator', 'last_active', 'is_educator',
        'is_community_partner', 'institutions',]
    ADMIN_READABLE_FIELDS = [
        'id', 'name', 'email' , 'date_created', 'last_active',
        'is_administrator', 'is_educator', 'is_community_partner',
        'institutions',]
    
    id = Column(Integer, primary_key=True)
    name = Column(String(50), nullable=False)
    email = Column(String(50), nullable=False, unique=True)
    active = Column(Boolean, default=True)
    password_hash = Column(String(120), nullable=True)
    date_created = Column(DateTime, nullable=False, default=datetime.utcnow)
    is_administrator = Column(Boolean, nullable=False, default=False) 
    last_active = Column(DateTime)

    searches = relationship("Search", backref="searcher_user")
    institutions = relationship("Institution", secondary=user_institution_table)

    pwd_context = passlib.context.CryptContext(
        schemes=['sha512_crypt'],
        default='sha512_crypt',
        all__vary_rounds = 0.1,
        sha512_crypt__vary_rounds = 8000,
    )
    
    def searches_as(self, role):
        searches = session.query(Search).filter_by(
            searcher_user_id=self.id, searcher_role=role).all()
        return searches
        
    @property
    def is_educator(self):
        output = (len(self.searches_as('educator')) > 0)
        return output

    @property
    def is_community_partner(self):
        output = (len(self.searches_as('partner')) > 0)
        return output

    def is_password_correct(self, password):
        if not self.password_hash:
            is_correct = False
        else:
            is_correct = self.pwd_context.verify(password, self.password_hash)
        return is_correct

    def set_password(self, password):
        password_hash = User.pwd_context.encrypt(password)
        self.password_hash = password_hash

    def __repr__(self):
        output = "<User(email={email})>".format(email=self.email) 
        return output

    @classmethod
    def has_add_rights(cls, data, user):
        return False

    def has_admin_rights(self, user):
        has_admin_rights = False
        if user is not None:
            if user.is_administrator:
                has_admin_rights = True
            elif user.id == self.id:
                has_admin_rights = True
        return has_admin_rights

    def standard_serialize(self):
        d = {}
        for fieldname in self.STANDARD_READABLE_FIELDS:
            if fieldname == 'institutions':
                d[fieldname] = [i.standard_serialize() for i in self.institutions]
            else:
                d[fieldname] = getattr(self, fieldname)
        return d

    def admin_serialize(self):
        d = {}
        for fieldname in self.ADMIN_READABLE_FIELDS:
            if fieldname == 'institutions':
                d[fieldname] = [i.standard_serialize() for i in self.institutions]
            else:
                d[fieldname] = getattr(self, fieldname)
        return d
            
    def deserialize_institutions(self, data_list):
        if data_list is None:
            data_list = []
        self.institutions = Institution.data_list_to_object_list(
            data_list)

    custom_deserializers = {
        'institutions': deserialize_institutions,
        }

    def make_api_key(self):
        secret_data = {
            'userId': self.id,
            'action': 'api_key',
        }
        secret = Secret.create_secret(info=secret_data, hours_duration=24)
        return secret
        
    @classmethod
    def from_api_key(self, key):
        secret = Secret.lookup_secret(key)
        logger.debug('key is {0}'.format(key))
        logger.debug('secret is {0}'.format(secret))
        user_id = None
        if secret is not None:
            info = secret.get_info()
            if info.get('action', None) == 'api_key':
                user_id = info.get('userId', None)
        if user_id is not None:
            user = session.query(User).filter_by(id=user_id).first()
            logger.debug('user from api_key is {0}'.format(user))
        else:
            user = None
        return user

        
class Institution(Base, Serializable):
    __tablename__ = 'institution'

    MANDATORY_FIELDS = ['name']
    WRITEABLE_FIELDS = ['name']
    STANDARD_READABLE_FIELDS = ['name']
    ADMIN_READABLE_FIELDS = ['name']

    id = Column(Integer, primary_key=True)
    name = Column(String(50), nullable=False, unique=True)
    institution_type = Column(String(50), nullable=True)
    active = Column(Boolean, default=True)
    description = Column(String)
    
    @classmethod
    def data_list_to_object_list(cls, data_list):
        names = [data.get('name', None) for data in data_list]
        names = [name for name in  names if ((name is not None) and (name != ''))]
        objs = session.query(cls).filter(cls.name.in_(names)).all()
        missing_names = set(names)
        for obj in objs:
            missing_names.remove(obj.name)
        for data in data_list:
            name = data.get('name', None)
            if name in missing_names and name is not None and name != '':
                new_obj = cls.admin_deserialize_add(data)
                objs.append(new_obj)
        return objs
