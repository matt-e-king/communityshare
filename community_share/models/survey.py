from datetime import datetime
import logging

from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy import ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship

from community_share.store import Base, session
from community_share.models.base import Serializable


logger = logging.getLogger(__name__)


class Question(Base, Serializable):
    __tablename__ = 'question'

    MANDATORY_FIELDS = ['text', 'question_type', 'public']
    WRITEABLE_FIELDS = ['public', 'order', 'only_suggested_answers', 'suggested_answers']
    STANDARD_READABLE_FIELDS = [
        'text', 'question_type', 'public', 'only_suggested_answers', 'order',
        'suggested_answers']
    ADMIN_READABLE_FIELDS = [
        'text', 'creator', 'date_created', 'question_type', 'public',
        'only_suggested_answers', 'order', 'suggested_answers']
    
    id = Column(Integer, primary_key=True)
    text = Column(String, nullable=True)
    creator_id = Column(Integer, ForeignKey('user.id'), nullable=False)
    active = Column(Boolean, nullable=False, default=True)
    date_created = Column(DateTime, nullable=False, default=datetime.utcnow)
    question_type = Column(String(50), nullable=False)
    public = Column(Boolean, nullable=False)
    only_suggested_answers = Column(Boolean, nullable=False, default=False)
    only_rating = Column(Boolean, nullable=False, default=False)
    order = Column(Integer)

    creator = relationship('User')
    suggested_answers = relationship('SuggestedAnswer')

    PERMISSIONS = {
        'all_can_read_many': True,
        'standard_can_read_many': True
    }

    def has_standard_rights(self, requester):
        return True
    
    def serialize_suggested_answers(self):
        serialized = [sa.text for sa in self.suggested_answers if sa.active]
        return serialized

    @classmethod
    def args_to_query(cls, args, requester=None):
        query = cls._args_to_query(args, requester)
        query = query.order_by(cls.order)
        return query

    custom_serializers = {
        'suggested_answers': {
            'standard': serialize_suggested_answers,
            'admin': serialize_suggested_answers,
        }
    }


class SuggestedAnswer(Base, Serializable):
    __tablename__ = 'suggested_answer'

    id = Column(Integer, primary_key=True)
    question_id = Column(Integer, ForeignKey('question.id'), nullable=False)
    creator_id = Column(Integer, ForeignKey('user.id'), nullable=False)
    text = Column(String)
    active = Column(Boolean, nullable=False, default=True)
    date_created = Column(DateTime, nullable=False, default=datetime.utcnow)

    creator = relationship('User')
    question = relationship('Question')


class Answer(Base, Serializable):
    __tablename__ = 'answer'

    id = Column(Integer, primary_key=True)
    question_id = Column(Integer, ForeignKey('question.id'), nullable=False)
    responder_id = Column(Integer, ForeignKey('user.id'), nullable=False)
    text = Column(String)
    rating = Column(Integer)
    active = Column(Boolean, default=True)
    date_created = Column(DateTime, nullable=False, default=datetime.utcnow)
    about_user_id = Column(Integer, ForeignKey('user.id'), nullable=True)
    about_share_id = Column(Integer, ForeignKey('share.id'), nullable=True)
    about_event_id = Column(Integer, ForeignKey('event.id'), nullable=True)

    __table_args__ = (
        CheckConstraint(rating >= 0, name='check_rating_min'),
        CheckConstraint(rating <= 5, name='check_rating_max'),
        {})

    question = relationship('Question')

