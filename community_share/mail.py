import logging

logger = logging.getLogger(__name__)

dummy_template = '''
----------------------------
SENDING AN EMAIL
----------------------------
from: {from_address}
to: {to_address}
subject: {subject}
content: {content}
'''

class DummyMailer(object):
    def send(from_address, to_address, subject, content):
        text = dummy_template.format(
            from_address=from_address,
            to_address=to_address,
            subject=subject,
            content=content)
        logger.info(text)

class MailgunMailer(object):
    def send(from_address, to_address, subject, contents):
        pass

mailer_type_to_mail = {
    'DUMMY': DummyMailer,
    'MAILGUN': MailgunMailer,
}
