import logging
import hashlib, hmac

from flask import request

from community_share import settings
from community_share.routes import base_routes

logger = logging.getLogger(__name__)


def verify(api_key, token, timestamp, signature):
    return signature == hmac.new(
        key=api_key,
        msg='{}{}'.format(timestamp, token),
        digestmod=hashlib.sha256).hexdigest()

def register_email_routes(app):

    @app.route('/api/email', methods=['POST'])
    def receive_email():
        recipient = request.values.get('recipient', None)
        stripped_text = request.values.get('stripped-text', None)
        sender = request.values.get('sender', None)
        subject = request.values.get('subject', None)
        headers = request.values.get('message-headers', [])
        signature = request.values.get('signature', None)
        token = request.values.get('token', None)
        timestamp = request.values.get('timestamp', None)
        verified = verify(settings.MAILGUN_API_KEY, token, timestamp, signature)

        data = {
            'recipient': recipient,
            'stripped_text': stripped_text,
            'sender': sender,
            'subject': subject,
            'verified': verified,
        }

        logger.info('Received email with data: {0}'.format(data))

        response = base_routes.make_ok_reponse()
        return response
