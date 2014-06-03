import json
import logging
from datetime import datetime

from community_share.models.user import User
from community_share.models.secret import Secret
from community_share import mail, settings, config, store

logger = logging.getLogger(__name__)

def send_message(message):
    error_message = ''
    sender_user = message.sender_user
    conversation = message.conversation
    all_messages = conversation.messages
    receiver_user = None
    if (conversation.userA_id == message.sender_user_id):
        receiver_user = conversation.userA
    elif (conversation.userB_id == message.sender_user_id):
        receiver_user = conversation.userB
    subject = None
    if message.title:
        subject = message.title
    else:
        subject = conversation.title
    from_address = 'message{message_id}@{mailgun_domain}'.format(
        message_id=message.id,
        mailgun_domain=config.MAILGUN_DOMAIN
    )
    to_address = receiver_user.confirmed_email
    content = message.content
    if not to_address:
        error_message = 'Recipient has not confirmed their email address'
    else:
        email = mail.Email(
            from_address=from_address,
            to_address=to_address,
            subject='subject',
            content=content
        )
        error_message = mail.get_mailer().send(email)
    return error_message

def request_signup_email_confirmation(user):
    secret_info = {
        'userId': user.id,
        'email': user.email,
        'action': 'email_confirmation',
    }
    hours_duration = 48
    secret = Secret.create_secret(secret_info, hours_duration)
    content = '''A community share account has been created and attached to this email address.

To confirm that you created the account, please click on the following link.

{BASEURL}/#/confirmemail?key={secret_key}

If you did not create this account, simply ignore this email.
'''
    content = content.format(BASEURL=config.BASEURL, secret_key=secret.key)
    email = mail.Email(
        from_address=config.DONOTREPLY_EMAIL_ADDRESS,
        to_address=user.email,
        subject='CommunityShare Account Creation',
        content=content
    )
    error_message = mail.get_mailer().send(email)
    return error_message
    

def request_password_reset(user):
    secret_info = {
        'userId': user.id,
        'action': 'password_reset',
    }
    hours_duration = 48
    secret = Secret.create_secret(secret_info, hours_duration)
    content = '''We received a request to reset your password for CommunityShare.
    
To reset your password please click on the following link and follow the instructions.
    
{BASEURL}/#/resetpassword?key={secret_key}
    
If you cannot click on the link copy it into the addressbar of your browser.
'''
    content = content.format(BASEURL=config.BASEURL, secret_key=secret.key)
    if not user.email_confirmed:
        error_message = 'The email address is not confirmed.'
    else:
        email = mail.Email(
            from_address=config.DONOTREPLY_EMAIL_ADDRESS,
            to_address=user.confirmed_email,
            subject='CommunityShare Password Reset Request',
            content=content
        )
        error_message = mail.get_mailer().send(email)
    return error_message

def process_password_reset(secret_key, new_password):
    user = None
    error_messages = User.is_password_valid(new_password)
    if not error_messages:
        secret = Secret.lookup_secret(secret_key)
        error_message = ''
        if secret is not None:
            secret_info = secret.get_info()
            userId = secret_info.get('userId', None)
            action = secret_info.get('action', None)
            if action == 'password_reset' and userId is not None:
                user = store.session.query(User).filter_by(id=userId).first()
                if user is not None:
                    error_messages += user.set_password(new_password)
                    if not error_messages:
                        secret.used = True
                        store.session.add(user)
                        store.session.add(secret)
                        store.session.commit()
        else:
            error_messages.append('Authorization for this action is invalid or expired.')
    return (user, error_messages)

def process_confirm_email(secret_key):
    error_messages = []
    user = None
    secret = Secret.lookup_secret(secret_key)
    if secret is not None:
        secret_info = secret.get_info()
        userId = secret_info.get('userId', None)
        action = secret_info.get('action', None)
        if action == 'email_confirmation' and userId is not None:
            user = store.session.query(User).filter_by(id=userId).first()
            if user is not None:
                user.email_confirmed = True
                secret.used = True
                store.session.add(user)
                store.session.add(secret)
                store.session.commit()
            else:
                error_messages.append('Authorization is for an unknown user.')
        else:
            error_mesage('Authorization is not valid for this action.')
    else:
        error_messages.append('Authorization for this action is invalid or expired.')
    return (user, error_messages)
        
