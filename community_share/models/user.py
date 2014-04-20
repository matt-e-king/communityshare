from datetime import datetime

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship, backref

import passlib
from passlib import context

from community_share.store import Base
from community_share.models.base import Serializable

class User(Base, Serializable):
    __tablename__ = 'user'

    MANDATORY_FIELDS = ['name', 'email']
    WRITEABLE_FIELDS = ['name', 'is_administrator']
    STANDARD_READABLE_FIELDS = ['id', 'name', 'is_administrator', 'last_active']
    ADMIN_READABLE_FIELDS = ['id', 'name', 'email' , 'date_created', 'last_active',
                             'is_administrator']
    
    id = Column(Integer, primary_key=True)
    name = Column(String(50), nullable=False)
    email = Column(String(50), nullable=False)
    password_hash = Column(String(120), nullable=True)
    date_created = Column(DateTime, nullable=False, default=datetime.utcnow)
    is_administrator = Column(Boolean, nullable=False, default=False) 
    last_active = Column(DateTime)

    pwd_context = passlib.context.CryptContext(
        schemes=['sha512_crypt'],
        default='sha512_crypt',
        all__vary_rounds = 0.1,
        sha512_crypt__vary_rounds = 8000,
    )

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
    def has_add_rights(cls, user):
        return True

    def has_admin_rights(self, user):
        has_admin_rights = False
        if user is not None:
            if user.is_administrator:
                has_admin_rights = True
            elif user.id == self.id:
                has_admin_rights = True
        return has_admin_rights
            
