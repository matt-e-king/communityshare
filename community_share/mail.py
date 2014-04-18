import logging

from community_share import settings

logger = logging.getLogger(__name__)

dummy_template = '''
----------------------------
SENDING AN EMAIL
----------------------------
from: {email.from_address}
to: {email.to_address}
subject: {email.subject}
content: {email.content}
'''

class Email(object):
    def __init__(self, from_address, to_address, subject, content):
        self.from_address = from_address
        self.to_address = to_address
        self.subject = subject
        self.content = content

class DummyMailer(object):
    def send(email):
        text = dummy_template.format(email=email)
        logger.info(text)

class MailgunMailer(object):
    def send(email):
        pass

mailer_type_to_mail = {
    'DUMMY': DummyMailer,
    'MAILGUN': MailgunMailer,
}

mailer = mailer_type_to_mail[settings.MAILER_TYPE]
