import logging
from datetime import datetime

from sqlalchemy import Table, ForeignKey, DateTime, Column
from sqlalchemy import Integer, String, Boolean, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql.expression import func

from community_share.store import Base, session
from community_share.models.base import Serializable

logger = logging.getLogger(__name__)

class Share(Base, Serializable):
    __tablename__ = 'share'
    
    MANDATORY_FIELDS = [
        'educator_user_id', 'community_partner_user_id', 'conversation_id',
        'title', 'description']
    WRITEABLE_FIELDS = [
        'educator_approved', 'community_partner_approved', 'title', 'description']
    STANDARD_READABLE_FIELDS = [
        'id', 'educator_user_id', 'community_partner_user_id', 'title' ,
        'description', 'events'
    ]
    ADMIN_READABLE_FIELDS = [
        'id', 'educator_user_id', 'community_partner_user_id', 'title' ,'description',
        'educator_approved', 'community_partner_approved', 'date_created',
        'events'
    ]

    id = Column(Integer, primary_key=True)
    educator_user_id = Column(Integer, ForeignKey('user.id'), nullable=False)
    community_partner_user_id = Column(Integer, ForeignKey('user.id'), nullable=False)
    educator_approved = Column(Boolean, default=False, nullable=False)
    community_partner_approved = Column(Boolean, default=False, nullable=False)
    title = Column(String(100), nullable=False)
    active = Column(Boolean, default=True, nullable=False)
    description = Column(String, nullable=False)
    date_created = Column(DateTime, nullable=False, default=datetime.utcnow)

    events = relationship("Event")

    @classmethod
    def has_add_rights(cls, data, user):
        has_rights = False
        if int(data.get('educator_user_id', -1)) == user.id:
            has_rights = True
        elif int(data.get('community_partner_user_id', -1)) == user.id:
            has_rights = True
        return has_rights

    def has_standard_rights(self, requester):
        has_rights = False
        if requester is not None:
            has_rights = True
        return has_rights

    def has_admin_rights(self, user):
        has_rights = False
        if user.is_administrator:
            has_rights = True
        elif user.id == self.educator_user_id:
            has_rights = True
        elif user.id == self.community_partner_user_id:
            has_rights = True
        return has_rights

    def standard_serialize(self):
        for fieldname in self.STANDARD_READABLE_FIELDS:
            if fieldname == 'events':
                d[fieldname] = [e.standard_serialize() for e in self.events]
            else:
                d[fieldname] = getattr(self, fieldname)
        return d

    def admin_serialize(self):
        d = {}
        for fieldname in self.ADMIN_READABLE_FIELDS:
            if fieldname == 'events':
                d[fieldname] = [e.admin_serialize() for e in self.events]
            else:
                d[fieldname] = getattr(self, fieldname)
        return d


class Event(Base, Serializable):
    __tablename__ = 'event'

    MANDATORY_FIELDS = [
        'share_id', 'datetime_start', 'datetime_stop', 'location',]
    WRITEABLE_FIELDS = [
        'datetime_start', 'datetime_stop', 'title', 'description', 'location',]
    STANDARD_READABLE_FIELDS = [
        'id', 'share_id', 'datetime_start', 'datetime_stop', 'title',
        'description', 'location']
    ADMIN_READABLE_FIELDS = [
        'id', 'share_id', 'datetime_start', 'datetime_stop', 'title',
        'description', 'location']

    id = Column(Integer, primary_key=True)
    share_id = Column(Integer, ForeignKey('share.id'), nullable=False)
    active = Column(Boolean, default=True, nullable=False)
    datetime_start = Column(DateTime, nullable=False)
    datetime_stop = Column(DateTime, nullable=False)
    title = Column(String(100), nullable=True)
    description = Column(String, nullable=True)
    location = Column(String(100), nullable=False)

    @classmethod
    def has_add_rights(cls, data, user):
        has_rights = False
        share_id = int(data.get('share_id', -1))
        logger.debug('share id is {0}'.format(share_id))
        if share_id >= 0:
            query = session.query(Share).filter(Share.id==share_id)
            share = query.first()
            logger.debug('share is {0}'.format(share))
            if share is not None:
                if user.id == share.educator_user_id:
                    has_rights = True
                elif user.id == share.community_partner_user_id:
                    has_rights = True
        return has_rights

    def has_standard_rights(self, requester):
        has_rights = False
        if requester is not None:
            has_rights = True
        return has_rights

    def has_admin_rights(self, user):
        has_rights = False
        if user.is_administrator:
            has_rights = True
        else:
            share = session.query(Share).filter(Share.id==self.share_id).first()
            if share is not None:
                if user.id == share.educator_user_id:
                    has_rights = True
                elif user.id == share.community_partner_user_id:
                    has_rights = True
        return has_rights
