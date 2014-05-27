import logging
import datetime

import dateutil
from dateutil import parser

from sqlalchemy import Column, String, DateTime, Boolean

from community_share.store import Base, session

logger = logging.getLogger(__name__)

class ValidationException(Exception):
    pass

class Serializable(object):
    """
    Doesn't implement a necessary 'get' method.
    """
    
    MANDATORY_FIELDS = []
    WRITEABLE_FIELDS = []
    STANDARD_READABLE_FIELDS = ['id']
    ADMIN_READABLE_FIELDS = ['id']

    PERMISSIONS = {
        'all_can_read_many': False,
        'standard_can_read_many': False
    }

    @classmethod
    def has_add_rights(cls, data, requester):
        return (requester is not None and requester.is_administrator)

    def has_standard_rights(self, requester):
        has_rights = False
        if requester is not None:
            has_rights = True
        return has_rights

    def has_admin_rights(self, requester):
        return (requester is not None and requester.is_administrator)

    custom_serializers = {}

    def _base_standard_serialize(self, exclude=[]):
        d = {}
        for fieldname in self.STANDARD_READABLE_FIELDS:
            if fieldname not in exclude:
                if fieldname in self.custom_serializers:
                    d[fieldname] = self.custom_serializers[fieldname]['standard'](self)
                else:
                    d[fieldname] = getattr(self, fieldname)
        return d

    def standard_serialize(self, exclude=[]):
        return self._base_standard_serialize(exclude)

    def _base_admin_serialize(self, exclude=[]):
        d = {}
        for fieldname in self.ADMIN_READABLE_FIELDS:
            if fieldname not in exclude:
                if fieldname in self.custom_serializers:
                    d[fieldname] = self.custom_serializers[fieldname]['admin'](self)
                else:
                    d[fieldname] = getattr(self, fieldname)
        return d

    def admin_serialize(self, exclude=[]):
        return self._base_admin_serialize(exclude)

    def on_edit(self, requester, unchanged=False):
        pass

    custom_deserializers = {}

    @classmethod
    def admin_deserialize_add(cls, data):
        for fieldname in cls.MANDATORY_FIELDS:
            if not fieldname in data:
                raise ValidationException('Missing necessary field: {0}'.format(fieldname))
        item = cls()
        item.admin_deserialize_update(data, add=True)
        return item

    def admin_deserialize_update(self, data, add=False):
        if add:
            fieldnames = set(self.MANDATORY_FIELDS) | set(self.WRITEABLE_FIELDS)
        else:
            fieldnames = self.WRITEABLE_FIELDS
        for fieldname in data.keys():
            if fieldname in self.custom_deserializers:
                value = data.get(fieldname, None)
                self.custom_deserializers[fieldname](self, value)
            elif fieldname in fieldnames and hasattr(self, fieldname):
                current = getattr(self, fieldname)
                # Force type conversion of datetime beforehand so sqlalchemy doesn't
                # falsely label things as dirty.
                new_value = data[fieldname]
                if type(current) == datetime.datetime:
                    new_value = dateutil.parser.parse(data[fieldname])
                    new_value = new_value.replace(tzinfo=None)
                if current != new_value:
                    logger.debug('{0} - changing attr from {1} to {2}'.format(
                        fieldname, current, data[fieldname]))
                    setattr(self, fieldname, data[fieldname])
            
    @classmethod
    def admin_deserialize(self, data):
        if 'id' in data:
            item = self.get(data['id'])
            item.admin_deserialize_update(data)
        else:
            item = self.admin_deserialize_add(data)
        return item

    CONDITION_MAPPING = {
        'greaterthanorequal': lambda x, y: (x >= y),
        'greaterthan': lambda x, y: (x > y),
        'lessthanorequal': lambda x, y: (x <= y),
        'lessthan': lambda x, y: (x < y),
    }

    @classmethod
    def _args_to_filter_params(cls, args):
        filter_args = []
        for key in args.keys():
            bits = key.split('.')
            if hasattr(cls, bits[0]):
                if len(bits) > 2:
                    raise Exception('Unknown filter parameter')
                elif len(bits) == 2:
                    if bits[1] in ('like', 'ilike'):
                        new_arg = getattr(getattr(cls, bits[0]), bits[1])(args[key])
                        filter_args.append(new_arg)
                    elif bits[1] in cls.CONDITION_MAPPING.keys():
                        field = getattr(cls, bits[0])
                        value = args[key]
                        condition = cls.CONDITION_MAPPING[bits[1]](field, value)
                        filter_args.append(condition)
                    else:
                        raise Exception('Unknown filter parameter')
                elif len(bits) == 1:
                    typ = getattr(cls, key).property.columns[0].type
                    value = args[key]
                    if (isinstance(typ, Boolean)):
                        if (value == 'true'):
                            value = True
                        elif (value == 'false'):
                            value = False
                    criterium = (getattr(cls, key) == value)
                    filter_args.append(criterium)
        return filter_args

    @classmethod
    def _args_to_query(cls, args, requester=None):
        filter_args = cls._args_to_filter_params(args)
        query = session.query(cls).filter(*filter_args)
        return query

    @classmethod
    def args_to_query(cls, args, requester=None):
        query = cls._args_to_query(args, requester)
        return query
