import logging
from datetime import datetime

from sqlalchemy import Table, ForeignKey, DateTime, Column, Integer, String, Boolean
from sqlalchemy.orm import relationship

from community_share.store import Base, session
from community_share.models.base import Serializable

logger = logging.getLogger(__name__)

search_label_table = Table('search_label', Base.metadata,
    Column('search_id', Integer, ForeignKey('search.id')),
    Column('label_id', Integer, ForeignKey('label.id'))
)

class Search(Base, Serializable):
    __tablename__ = 'search'
    
    MANDATORY_FIELDS = [
        'searcher_user_id', 'searcher_role', 'searching_for_role', 'labels']
    WRITEABLE_FIELDS = [
        'searcher_user_id', 'searcher_role', 'searching_for_role', 'labels',
        'active_only']
    STANDARD_READABLE_FIELDS = [
        'id', 'searcher_user_id', 'searcher_role', 'searching_for_role',
        'labels']
    ADMIN_READABLE_FIELDS = [
        'id', 'searcher_user_id', 'searcher_role', 'searching_for_role', 'labels',
        'created', 'active_only']

    COMMUNITY_PARTNER_ROLE = 'partner'
    EDUCATOR_ROLE = 'educator'

    id = Column(Integer, primary_key=True)
    searcher_user_id = Column(Integer, ForeignKey('user.id'))
    searcher_role = Column(String(20), nullable=False)
    searching_for_role = Column(String(20), nullable=False)
    created = Column(DateTime, nullable=False, default=datetime.utcnow)
    active_only = Column(Boolean, nullable=False, default=False)
    
    labels = relationship("Label", secondary=search_label_table)

    @classmethod
    def has_add_rights(cls, data, user):
        has_rights = False
        if int(data.get('searcher_user_id', -1)) == user.id:
            has_rights = True
        return has_rights

    def has_admin_rights(self, user):
        has_rights = False
        if user.is_administrator:
            has_rights = True
        elif user.id == self.searcher_user_id:
            has_rights = True
        return has_rights

    def standard_serialize(self):
        d = {}
        for fieldname in self.STANDARD_READABLE_FIELDS:
            if fieldname == 'labels':
                d[fieldname] = [l.name for l in self.labels]
            else:
                d[fieldname] = getattr(self, fieldname)
        return d

    def admin_serialize(self):
        d = {}
        for fieldname in self.ADMIN_READABLE_FIELDS:
            if fieldname == 'labels':
                d[fieldname] = [l.name for l in self.labels]
            else:
                d[fieldname] = getattr(self, fieldname)
        return d
                
    def admin_deserialize_update(self, data, add=False):
        for fieldname in data.keys():
            if fieldname == 'labels':
                labelnames = data.get('labels', [])
                logger.debug('labelnames is {0}'.format(labelnames))
                self.labels = session.query(Label).filter(Label.name.in_(labelnames)).all()
            else:
                setattr(self, fieldname, data[fieldname])


class Label(Base, Serializable):
    __tablename__ = 'label'

    id = Column(Integer, primary_key=True)
    name = Column(String(50), nullable=False, unique=True)
    description = Column(String)

    
    
