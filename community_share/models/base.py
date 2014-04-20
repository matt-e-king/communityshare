import logging
from datetime import datetime, timedelta
import string, json, random

from sqlalchemy import Column, String, DateTime, Boolean

from community_share.store import Base

logger = logging.getLogger(__name__)

class Serializable(object):
    """
    Doesn't implement a necessary 'get' method.
    """
    
    MANDATORY_FIELDS = []
    WRITEABLE_FIELDS = []
    STANDARD_READABLE_FIELDS = ['id']
    ADMIN_READABLE_FIELDS = ['id']

    PERMISSIONS = {
        'standard_can_ready_many': False
    }

    @classmethod
    def has_add_rights(cls, requester):
        return (requester is not None and requester.is_administrator)

    def has_admin_rights(self, requester):
        return (requester is not None and requester.is_administrator)

    def standard_serialize(self):
        d = {}
        for fieldname in self.STANDARD_READABLE_FIELDS:
            d[fieldname] = getattr(self, fieldname)
        return d

    def admin_serialize(self):
        d = {}
        for fieldname in self.ADMIN_READABLE_FIELDS:
            d[fieldname] = getattr(self, fieldname)
        return d

    @classmethod
    def admin_deserialize_add(cls, data):
        for fieldname in cls.MANDATORY_FIELDS:
            if not fieldname in data:
                raise Exception('Missing necessary field: {0}'.format(fieldname))
        item = cls()
        item.admin_deserialize_update(data, add=True)
        return item

    def admin_deserialize_update(self, data, add=False):
        if add:
            fieldnames = set(self.MANDATORY_FIELDS) | set(self.WRITEABLE_FIELDS)
        else:
            fieldnames = self.WRITEABLE_FIELDS
        logger.debug('FIELDnames is {0}'.format(fieldnames))
        for fieldname in data.keys():
            if fieldname in fieldnames and hasattr(self, fieldname):
                setattr(self, fieldname, data[fieldname])
            
    @classmethod
    def admin_deserialize(self, data):
        if 'id' in data:
            item = self.get(data['id'])
            item.admin_deserialize_update(data)
        else:
            item = self.admin_deserialize_add(data)
        return item


class Secret(Base):
    __tablename__ = 'secret'
    KEY_LENGTH = 200
    
    key = Column(String(KEY_LENGTH), primary_key=True)
    info = Column(String)
    expiration = Column(DateTime, default=datetime.utcnow)
    used = Column(Boolean, default=False)

    @classmethod
    def make_key(cls):
        chars = string.ascii_uppercase + string.ascii_lowercase + string.digits
        key = ''.join(random.choice(chars) for _ in range(cls.KEY_LENGTH))
        return key

    @classmethod
    def make(cls, info, hours_duration):
        info_as_json = json.dumps(info)
        key = cls.make_key()
        expiration = datetime.now() + timedelta(hours=hours_duration)
        secret = Secret(key=key, info=info_as_json, expiration=expiration)
        return secret

    def get_info(self):
        info = None
        try:
            info = json.loads(self.info)
        except ValueError:
            logger.error("Invalid JSON data in secret.info")
        return info

