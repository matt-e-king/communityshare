import os
from datetime import datetime
import logging

from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy import ForeignKey
from sqlalchemy.orm import relationship, backref

import passlib
from passlib import context

from community_share.store import Base, session
from community_share.models.base import Serializable
from community_share.models.secret import Secret
from community_share.models.search import Search
from community_share.models.institution import InstitutionAssociation


logger = logging.getLogger(__name__)

class User(Base, Serializable):
    __tablename__ = 'user'

    MANDATORY_FIELDS = ['name', 'email']
    WRITEABLE_FIELDS = ['name', 'is_administrator', 'institution_associations',
                        'zipcode', 'website', 'twitter_handle', 'linkedin_link',
                        'year_of_birth', 'gender', 'ethnicity', 'bio']
    STANDARD_READABLE_FIELDS = [
        'id', 'name', 'is_administrator', 'last_active', 'is_educator',
        'is_community_partner', 'institution_associations',
        'zipcode', 'website', 'twitter_handle', 'linkedin_link',
        'year_of_birth', 'gender', 'ethnicity', 'bio', 'picture_url']

    ADMIN_READABLE_FIELDS = [
        'id', 'name', 'email' , 'date_created', 'last_active',
        'is_administrator', 'is_educator', 'is_community_partner',
        'institution_associations',
        'zipcode', 'website', 'twitter_handle', 'linkedin_link',
        'year_of_birth', 'gender', 'ethnicity', 'bio', 'picture_url']
    
    id = Column(Integer, primary_key=True)
    name = Column(String(50), nullable=False)
    email = Column(String(50), nullable=False, unique=True)
    active = Column(Boolean, default=True)
    password_hash = Column(String(120), nullable=True)
    date_created = Column(DateTime, nullable=False, default=datetime.utcnow)
    is_administrator = Column(Boolean, nullable=False, default=False) 
    last_active = Column(DateTime)

    picture_filename = Column(String(100))
    bio = Column(String(1000))
    zipcode = Column(String(50))
    website = Column(String(100))
    twitter_handle = Column(String(100))
    linkedin_link = Column(String(100))
    year_of_birth = Column(Integer)
    gender = Column(String(100))
    ethnicity = Column(String(100))
    
    searches = relationship("Search", backref="searcher_user")
    institution_associations = relationship("InstitutionAssociation")

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

    @classmethod
    def is_password_valid(cls, password):
        error_messages = []
        if len(password) < 8:
            error_messages.append(
                'Password must have a length of at least 8 characters')
        return error_messages

    def set_password(self, password):
        output = None
        error_messages = self.is_password_valid(password)
        if not error_messages:
            password_hash = User.pwd_context.encrypt(password)
            self.password_hash = password_hash
        return error_messages

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

    def serialize_institution_associations(self):
        associations = [i.standard_serialize()
                        for i in self.institution_associations]
        return associations

    def serialize_picture_url(self):
        url = ''
        upload_location = os.environ.get('COMMUNITYSHARE_UPLOAD_LOCATION', None)
        if (upload_location is not None) and self.picture_filename:
            url = upload_location + self.picture_filename
        return url

    custom_serializers = {
        'institution_associations': {
            'standard': serialize_institution_associations,
            'admin': serialize_institution_associations,
        },
        'picture_url': {
            'standard': serialize_picture_url,
            'admin': serialize_picture_url,
        }
    }
         
    def deserialize_institution_associations(self, data_list):
        if data_list is None:
            data_list = []
        self.institution_associations = [
            InstitutionAssociation.admin_deserialize(data) for data in data_list]
        for ia in self.institution_associations:
            ia.user = self

    custom_deserializers = {
        'institution_associations': deserialize_institution_associations,
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

