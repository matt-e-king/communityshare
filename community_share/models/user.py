import datetime

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship, backref

import passlib
from passlib import context

from community_share import settings

engine = create_engine(settings.DB_CONNECTION)

Base = declarative_base()


class AdministratorRole(Base):
    __tablename__ = 'administrator_role'
    id = Column(Integer, primary_key=True)


class User(Base):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(50), nullable=False)
    email = Column(String(50), nullable=False)
    passwordhash = Column(String(120), nullable=False)
    datecreated = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)
    administrator_role_id = Column(Integer, ForeignKey('administrator_role.id')) 
    lastactive = Column(DateTime)

    administrator_role = relationship('AdministratorRole',
                                      backref=backref('user', uselist=False))

    def __repr__(self):
        output = "<User(email={email})>".format(email=self.email) 
        return output


pwd_context = passlib.context.CryptContext(
    schemes=['sha512_crypt'],
    default='sha512_crypt',
    all__vary_rounds = 0.1,
    sha512_crypt__vary_rounds = 8000,
)

def make_admin_user(name, email, password):
    from sqlalchemy.orm import sessionmaker
    Base.metadata.create_all(engine) 
    Session = sessionmaker(bind=engine)
    session = Session()
    passwordhash = pwd_context.encrypt(password)
    new_user = User(name=name, email=email, passwordhash=passwordhash)
    new_role = AdministratorRole()
    new_user.administrator_role = new_role
    session.add(new_user)
    session.add(new_role)
    session.commit()
    
if __name__ == '__main__':
    make_admin_user('Ben Reynwar', 'ben@reynwar.net', 'viewable')
    
    
