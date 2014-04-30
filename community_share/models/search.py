import logging
from datetime import datetime

from sqlalchemy import Table, ForeignKey, DateTime, Column
from sqlalchemy import Integer, String, Boolean, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql.expression import func

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
        'searcher_user_id', 'searcher_role', 'searching_for_role', 'labels', 'zipcode']
    WRITEABLE_FIELDS = [
        'searcher_user_id', 'searcher_role', 'searching_for_role', 'labels',
        'active', 'latitude', 'longitude', 'address', 'distance', 'zipcode']
    STANDARD_READABLE_FIELDS = [
        'id', 'searcher_user_id', 'searcher_role', 'searching_for_role',
        'labels', 'longitude', 'latitude', 'address', 'zipcode', 'distance']
    ADMIN_READABLE_FIELDS = [
        'id', 'searcher_user_id', 'searcher_role', 'searching_for_role', 'labels',
        'created', 'active', 'longitude', 'latitude', 'address', 'zipcode', 'distance']

    PERMISSIONS = {
        'standard_can_read_many': True
    }

    COMMUNITY_PARTNER_ROLE = 'partner'
    EDUCATOR_ROLE = 'educator'

    id = Column(Integer, primary_key=True)
    searcher_user_id = Column(Integer, ForeignKey('user.id'))
    searcher_role = Column(String(20), nullable=False)
    searching_for_role = Column(String(20), nullable=False)
    created = Column(DateTime, nullable=False, default=datetime.utcnow)
    active = Column(Boolean, nullable=False, default=True)
    address = Column(String(200))
    zipcode = Column(String(20))
    latitude = Column(Float)
    longitude = Column(Float)
    distance = Column(Float, nullable=True)

    labels = relationship("Label", secondary=search_label_table)

    @classmethod
    def has_add_rights(cls, data, user):
        has_rights = False
        if int(data.get('searcher_user_id', -1)) == user.id:
            has_rights = True
        return has_rights

    @classmethod
    def get_many_ordered_by_label_matches(
            cls, labels, searcher_role, searching_for_role, max_number=10):
        labelnames = [label.name for label in labels]
        query = session.query(Search, func.count(Label.id).label('matches'))
        query = query.join(Search.labels)
        query = query.filter(Label.name.in_(labelnames))
        query = query.filter(Search.active==True)
        query = query.filter(Search.searcher_role==searcher_role)
        query = query.filter(Search.searching_for_role==searching_for_role)
        query = query.group_by(Search.id)
        query = query.order_by('matches DESC')
        searches_and_count = query.limit(max_number)
        searches = [sc[0] for sc in searches_and_count]
        return searches

    def has_standard_rights(self, requester):
        has_rights = False
        if requester is not None:
            has_rights = True
        return has_rights

    def has_admin_rights(self, user):
        has_rights = False
        if user.is_administrator:
            has_rights = True
        elif user.id == self.searcher_user_id:
            has_rights = True
        return has_rights

    def standard_serialize(self, include_searcher_user=False):
        d = {}
        if include_searcher_user:
            d['searcher_user'] = self.searcher_user.standard_serialize()
        for fieldname in self.STANDARD_READABLE_FIELDS:
            if fieldname == 'labels':
                d[fieldname] = [l.name for l in self.labels]
            else:
                d[fieldname] = getattr(self, fieldname)
        return d

    def admin_serialize(self, include_searcher_user=False):
        d = {}
        if include_searcher_user:
            d['searcher_user'] = self.searcher_user.standard_serialize()
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
                self.labels = Label.name_list_to_object_list(labelnames)
            else:
                setattr(self, fieldname, data[fieldname])


class Label(Base, Serializable):
    __tablename__ = 'label'

    id = Column(Integer, primary_key=True)
    name = Column(String(50), nullable=False, unique=True)
    active = Column(Boolean, default=True)
    description = Column(String)

    @classmethod
    def name_list_to_object_list(cls, names):
        labels = session.query(Label).filter(Label.name.in_(names)).all()
        missing_labelnames = set(names)
        for label in labels:
            missing_labelnames.remove(label.name)
        for labelname in missing_labelnames:
            new_label = Label(name=labelname)
            labels.append(new_label)
        return labels
        
    
    
