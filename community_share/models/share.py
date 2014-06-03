import logging
from datetime import datetime

from sqlalchemy import Table, ForeignKey, DateTime, Column
from sqlalchemy import Integer, String, Boolean, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql.expression import func
from sqlalchemy import or_

from community_share import store, Base
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
        'description', 'conversation_id', 'active', 'event', 'educator',
        'community_partner'
    ]
    ADMIN_READABLE_FIELDS = [
        'id', 'educator_user_id', 'community_partner_user_id', 'title' ,'description',
        'educator_approved', 'community_partner_approved', 'date_created',
        'conversation_id', 'active', 'events', 'educator', 'community_partner'
    ]

    PERMISSIONS = {
        'standard_can_read_many': True
    }

    id = Column(Integer, primary_key=True)
    conversation_id = Column(Integer, ForeignKey('conversation.id'), nullable=False)
    educator_user_id = Column(Integer, ForeignKey('user.id'), nullable=False)
    community_partner_user_id = Column(Integer, ForeignKey('user.id'), nullable=False)
    educator_approved = Column(Boolean, default=False, nullable=False)
    community_partner_approved = Column(Boolean, default=False, nullable=False)
    title = Column(String(100), nullable=False)
    active = Column(Boolean, default=True, nullable=False)
    description = Column(String, nullable=False)
    date_created = Column(DateTime, nullable=False, default=datetime.utcnow)

    events = relationship("Event")
    educator = relationship('User', primaryjoin='Share.educator_user_id == User.id')
    community_partner = relationship('User', primaryjoin='Share.community_partner_user_id == User.id')

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

    def standard_serialize_events(self):
        serialized = [e.standard_serialize(exclude=['share'])
                      for e in self.events if e.active]
        return serialized

    def admin_serialize_events(self):
        serialized = [e.admin_serialize(exclude=['share'])
                      for e in self.events if e.active]
        return serialized

    custom_serializers = {
        'educator': {
            'standard': lambda self: self.educator.standard_serialize(),
            'admin': lambda self: self.educator.standard_serialize(),
        },
        'community_partner': {
            'standard': lambda self: self.community_partner.standard_serialize(),
            'admin': lambda self: self.community_partner.standard_serialize(),
        },
        'events': {
            'standard': standard_serialize_events,
            'admin': admin_serialize_events,
        }
    }

    def on_edit(self, requester, unchanged=False):
        logger.debug('share: on_edit')
        if not unchanged:
            self.educator_approved = False
            self.community_partner_approved = False
        if requester.id == self.educator_user_id:
            self.educator_approved = True
        if requester.id == self.community_partner_user_id:
            self.community_partner_approved = True
        session.add(self)

    @classmethod
    def args_to_query(cls, args, requester):
        # user_id matches to educator_id or community_partner_id
        user_id = args.get('user_id', None)
        query = cls._args_to_query(args, requester)
        if user_id is not None:
            try:
                user_id = int(user_id)
                query = query.filter(
                    or_(Share.educator_user_id==user_id,
                        Share.community_partner_user_id==user_id))
            except ValueError:
                pass
        return query


class Event(Base, Serializable):
    __tablename__ = 'event'

    MANDATORY_FIELDS = [
        'share_id', 'datetime_start', 'datetime_stop', 'location',]
    WRITEABLE_FIELDS = [
        'datetime_start', 'datetime_stop', 'title', 'description', 'location',]
    STANDARD_READABLE_FIELDS = [
        'id', 'share_id', 'datetime_start', 'datetime_stop', 'title',
        'description', 'location', 'active', 'share']
    ADMIN_READABLE_FIELDS = [
        'id', 'share_id', 'datetime_start', 'datetime_stop', 'title',
        'description', 'location', 'active', 'share']

    PERMISSIONS = {
        'standard_can_read_many': True
    }

    id = Column(Integer, primary_key=True)
    share_id = Column(Integer, ForeignKey('share.id'), nullable=False)
    active = Column(Boolean, default=True, nullable=False)
    datetime_start = Column(DateTime, nullable=False)
    datetime_stop = Column(DateTime, nullable=False)
    title = Column(String(100), nullable=True)
    description = Column(String, nullable=True)
    location = Column(String(100), nullable=False)

    share = relationship('Share')

    @classmethod
    def has_add_rights(cls, data, user):
        has_rights = False
        share_id = int(data.get('share_id', -1))
        if share_id >= 0:
            query = session.query(Share).filter(Share.id==share_id)
            share = query.first()
            if share is not None:
                if user.id == share.educator_user_id:
                    has_rights = True
                elif user.id == share.community_partner_user_id:
                    has_rights = True
        return has_rights

    def on_edit(self, requester, unchanged=False):
        logger.debug('event: on_edit')
        if not unchanged:
            share = self.share
            if share is None:
                share = session.query(Share).filter_by(id=self.share_id).first()
            share.educator_approved = False
            share.community_partner_approved = False
            if requester.id == share.educator_user_id:
                share.educator_approved = True
            if requester.id == share.community_partner_user_id:
                share.community_partner_approved = True
            logger.debug('ed {0} cp {1}'.format(
                share.educator_approved, share.community_partner_approved))
            session.add(share)

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

    custom_serializers = {
        'share': {
            'standard': lambda self: self.share.standard_serialize(
                exclude=['events']),
            'admin': lambda self: self.share.admin_serialize(
                exclude=['events']),
        }
    }

    @classmethod
    def args_to_query(cls, args, requester):
        # user_id matches to educator_id or community_partner_id of Share
        user_id = args.get('user_id', None)
        query = cls._args_to_query(args, requester)
        if user_id is not None:
            try:
                user_id = int(user_id)
                query = query.join(Share)
                query = query.filter(
                    or_(Share.educator_user_id==user_id,
                        Share.community_partner_user_id==user_id))
            except ValueError(e):
                logger.warning('Error trying to get user_id: {0}'.format(e))
        
        return query
