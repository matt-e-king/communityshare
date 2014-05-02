from datetime import datetime

from sqlalchemy import Column, Integer, Boolean, DateTime, Table, ForeignKey
from sqlalchemy import String, or_
from sqlalchemy.orm import relationship

from community_share.store import Base, session
from community_share.models.base import Serializable

conversation_user_table = Table('conversation_user', Base.metadata,
    Column('conversation_id', Integer, ForeignKey('conversation.id')),
    Column('user_id', Integer, ForeignKey('user.id'))
)


class Conversation(Base, Serializable):
    __tablename__ = 'conversation'

    MANDATORY_FIELDS = [
        'title', 'search_id', 'userA_id', 'userB_id',
    ]
    WRITEABLE_FIELDS = [
        'title',
    ]
    STANDARD_READABLE_FIELDS = []
    ADMIN_READABLE_FIELDS = [
        'id', 'title', 'search_id', 'userA_id', 'userB_id', 'date_created', 'active'
    ]

    id = Column(Integer, primary_key=True)
    active = Column(Boolean, default=True, nullable=False)
    date_created = Column(DateTime, nullable=False, default=datetime.utcnow)
    title = Column(String(200), nullable=False)
    search_id = Column(Integer, ForeignKey('search.id'), nullable=False)
    userA_id = Column(Integer, ForeignKey('user.id'), nullable=False)
    userB_id = Column(Integer, ForeignKey('user.id'), nullable=False)

    messages = relationship('Message', backref='conversation')
    userA = relationship('User', primaryjoin='Conversation.userA_id == User.id')
    userB = relationship('User', primaryjoin='Conversation.userB_id == User.id')

    @classmethod
    def has_add_rights(cls, data, user):
        '''
        A user has rights to add a conversation if they are
        one of the users.
        '''
        has_rights = False
        if ((int(data.get('userA_id', -1)) == user.id ) or
            (int(data.get('userB_id', -1)) == user.id )):
            has_rights = True
        return has_rights

    def has_standard_rights(self, requester):
        has_rights = self.has_admin_rights(requester)
        return has_rights

    def has_admin_rights(self, requester):
        has_rights = False
        if requester is not None:
            if requester.is_administrator:
                has_rights = True
            else:
                if (requester.id == self.userA_id) or (requester.id == self.userB_id):
                    has_rights = True
        return has_rights

    def admin_serialize(self):
        d = {}
        for fieldname in self.ADMIN_READABLE_FIELDS:
            d[fieldname] = getattr(self, fieldname)
        d['messages'] = [message.admin_serialize() for message in self.messages]
        d['userA'] = self.userA.standard_serialize()
        d['userB'] = self.userB.standard_serialize()
        return d


class Message(Base, Serializable):
    __tablename__ = 'message'

    MANDATORY_FIELDS = [
        'conversation_id', 'sender_user_id', 'content',
    ]
    WRITEABLE_FIELDS = []
    STANDARD_READABLE_FIELDS = []
    ADMIN_READABLE_FIELDS = [
        'id', 'conversation_id', 'sender_user_id', 'content', 'date_created'
    ]

    id = Column(Integer, primary_key=True)
    conversation_id = Column(Integer, ForeignKey('conversation.id'))
    sender_user_id = Column(Integer, ForeignKey('user.id'))
    content = Column(String, nullable=False)
    date_created = Column(DateTime, nullable=False, default=datetime.utcnow)

    @classmethod
    def has_add_rights(cls, data, user):
        '''
        A user has rights to add a message if the sender_user_id is correct
        and it is to a conversation of which they are a member.
        '''
        has_rights = False
        if int(data.get('sender_user_id', -1)) == user.id:
            conversation_id = data.get('conversation_id', -1)
            conversation = session.query(Conversation).filter(
                Conversation.id==conversation_id).first()
            if (conversation.userA_id == user.id) or (conversation.userB_id == user.id):
                has_rights = True
        return has_rights



