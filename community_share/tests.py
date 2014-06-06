import re
import os
import unittest
import logging
import json
import datetime

from flask import jsonify

from community_share import setup, app, mail, config, time_format

logger = logging.getLogger(__name__)

sample_userA = {
    'institution_associations': [],
    'name': 'Charles',
    'bio': 'I am Charles.',
    'zipcode' :'12345',
    'email': "charlies@notarealemail.com",
    'password': 'booooooo'
}

sample_userB = {
    'institution_associations': [],
    'name': 'Rob',
    'bio': 'I am Rob.',
    'zipcode' :'12345',
    'email': "rob@notarealemail.com",
    'password': 'oiuh298n[;w',
}

sample_userC = {
    'institution_associations': [],
    'name': 'Charlie',
    'bio': 'AAAAAAAAAAAAAhhhhhhhhhhh!!!!',
    'zipcode' :'12345',
    'email': "charlie@notarealemail.com",
    'password': 'oiuh298n[;wbosijdfkow',
}

def chop_link(link):
    start = config.BASEURL
    assert(link.startswith(start))
    chopped_link = link[len(start):]
    chopped_link = chopped_link.split('#')[0]
    return chopped_link

def compare_data(userA, userB, exclusions=set([])):
    for key, value in userA.items():
        if key not in exclusions:
            assert(userA[key] == userB[key])

def make_headers(api_key=None, email=None, password=None):
    headers = [('Content-Type', 'application/json')]
    if api_key:
        authorization_header = 'Basic:api:{0}'.format(api_key)
    elif email and password:
        authorization_header = 'Basic:{0}:{1}'.format(email, password)
    else:
        authorization_header = None
    if authorization_header:
        headers.append(('Authorization', authorization_header))
    return headers

class CommunityShareTestCase(unittest.TestCase):
    
    SQLLITE_FILE = '/tmp/test.db'

    def setUp(self):
        data = {
            'DB_CONNECTION': 'sqlite:///{}'.format(self.SQLLITE_FILE),
            'MAILER_TYPE': 'QUEUE',
            'MAILGUN_API_KEY': 'whatever',
            'MAILGUN_DOMAIN': 'whatever',
            'LOGGING_LEVEL': 'DEBUG',
            'DONOTREPLY_EMAIL_ADDRESS': 'whatever@communityshare.us',
            'BASEURL': 'localhost:5000/',
            'S3_BUCKETNAME': os.environ['COMMUNITYSHARE_S3_BUCKETNAME'],
            'S3_KEY': os.environ['COMMUNITYSHARE_S3_KEY'],
            'S3_USERNAME': os.environ['COMMUNITYSHARE_S3_USERNAME'],
            'UPLOAD_LOCATION': os.environ['COMMUNITYSHARE_UPLOAD_LOCATION'],
            'COMMIT_HASH': 'dummy123',
        }
        config.load_from_dict(data)
        setup.init_db()
        # Clear mail queue
        mailer = mail.get_mailer()
        while len(mailer.queue):
            mailer.pop()
        self.app = app.make_app().test_client()

    def sign_up(self, user_data):
        data = {
            'password': user_data['password'],
            'user': user_data,
            }
        serialized = json.dumps(data)
        headers = [('Content-Type', 'application/json')]
        rv = self.app.post('/api/usersignup', data=serialized, headers=headers)
        assert(rv.status_code == 200)
        data = json.loads(rv.data.decode('utf8'))
        user_id = data['data']['id']
        api_key = data['apiKey']
        authorization_header = 'Basic:api:{0}'.format(api_key)
        headers = [('Authorization', authorization_header)]
        # Create an authentication header
        # And try to retrieve user
        rv = self.app.get('/api/user/{0}'.format(user_id), headers=headers)
        assert(rv.status_code == 200)
        data = json.loads(rv.data.decode('utf8'))
        # User details should match
        compare_data(user_data, data['data'], exclusions=['password'])
        mailer = mail.get_mailer()
        # We should have one email in queue (email confimation from signup)
        assert(len(mailer.queue) == 1)
        email = mailer.pop()
        links = email.find_links()
        assert(len(links)==1)
        email_key = re.search('key=(.*)', links[0]).groups()[0]
        return user_id, api_key, email_key

    def confirm_email(self, key):
        # Confirm email for new user
        headers = [('Content-Type', 'application/json')]
        data = json.dumps({'key': key})
        rv = self.app.post('/api/confirmemail', data=data,
                           headers=headers)
        assert(rv.status_code == 200)
        

    def save_search(self, user_id, api_key,
                    searcher_role, searching_for_role, labels):
        data = {
            'searcher_user_id': user_id,
            'searcher_role': searcher_role,
            'searching_for_role': searching_for_role,
            'labels': labels,
            'zipcode': 12345
        }
        serialized = json.dumps(data)
        headers = make_headers(api_key)
        rv = self.app.post('/api/search', data=serialized, headers=headers)
        assert(rv.status_code == 200)
        data = json.loads(rv.data.decode('utf8'))
        search_id = data['data']['id']
        return search_id

    def send_message(self, conversation_id, sender_user_id, content, api_key):
        message_data = {
            'conversation_id': conversation_id,
            'sender_user_id': sender_user_id,
            'content': content,
        }
        serialized = json.dumps(message_data)
        headers = make_headers(api_key)
        rv = self.app.post(
            '/api/message', headers=headers, data=serialized)
        assert(rv.status_code == 200)
        return rv
        
    def test_share(self):
        # Signup users and confirm emails
        userA_id, userA_api_key, userA_email_key = self.sign_up(sample_userA)
        self.confirm_email(userA_email_key)
        userB_id, userB_api_key, userB_email_key = self.sign_up(sample_userB)
        self.confirm_email(userB_email_key)
        userC_id, userC_api_key, userC_email_key = self.sign_up(sample_userC)
        self.confirm_email(userC_email_key)
        noone_headers = make_headers()
        userA_headers = make_headers(api_key=userA_api_key)
        userB_headers = make_headers(api_key=userB_api_key)
        userC_headers = make_headers(api_key=userC_api_key)
        # userA creates a search of educator for partner
        searchA_id = self.save_search(
            userA_id, userA_api_key, 'educator', 'partner',
            ['robot dogs', 'walks on the beach'])
        assert(searchA_id >= 0)
        # userB creates a search of partner to educator
        searchB_id = self.save_search(
            userB_id, userB_api_key, 'partner', 'educator',
            ['robot dogs', 'walks on the beach'])
        assert(searchB_id >= 0)
        # userA starts a conversation
        conversation_data = {
            'search_id': searchA_id,
            'title': 'Trip to moon',
            'userA_id': userA_id,
            'userB_id': userB_id,
        }
        serialized = json.dumps(conversation_data)
        rv = self.app.post(
            '/api/conversation', headers=userA_headers, data=serialized)
        assert(rv.status_code == 200)
        data = json.loads(rv.data.decode('utf8'))
        conversation_id = data['data']['id']
        # userA creates a share
        headers = make_headers(userA_api_key)
        now = datetime.datetime.now()
        starting = now + datetime.timedelta(hours=100)
        ending = now + datetime.timedelta(hours=101)
        share_data = {
            'title': 'Trip to moon Still',
            'description': 'Is the moon made of Cheese?',
            'conversation_id': conversation_id,
            'educator_user_id': userA_id,
            'community_partner_user_id': userB_id,
            'events': [
                {'location': 'Somewhere',
                 'datetime_start': time_format.to_iso8601(starting),
                 'datetime_stop': time_format.to_iso8601(ending),},
            ]
        }
        serialized = json.dumps(share_data)
        rv = self.app.post(
            '/api/share', headers=userA_headers, data=serialized)
        assert(rv.status_code == 200)
        data = json.loads(rv.data.decode('utf8'))
        share_id = data['data']['id']
        assert(len(data['data']['events']) == 1)
        # This should send an email to userB that a share has been created.
        mailer = mail.get_mailer()
        assert(len(mailer.queue) == 1)
        email = mailer.pop()
        assert(email.to_address == sample_userB['email'])
        # Check link is valid
        links = email.find_links()
        assert(len(links) == 1)
        chopped_link = chop_link(links[0])
        rv = self.app.get(chopped_link)
        assert(rv.status_code==200)
        # We should not be able to get this share if unauthenticated
        rv = self.app.get(
            '/api/share/{0}'.format(share_id), headers=noone_headers)
        assert(rv.status_code == 401)
        # Logged on users can access share info
        # FIXME: Need to check if this should be more private.
        rv = self.app.get(
            '/api/share/{0}'.format(share_id), headers=userC_headers)
        assert(rv.status_code == 200)
        # User B should be able to access it.
        rv = self.app.get(
            '/api/share/{0}'.format(share_id), headers=userB_headers)
        assert(rv.status_code == 200)
        share_data = json.loads(rv.data.decode('utf8'))['data']
        assert(share_data['id'] == share_id)
        assert(share_data['educator_approved'] == True)
        assert(share_data['community_partner_approved'] == False)
        # Now let's edit the share.
        share_data = {
            'description': 'Is the moon made of Cheese?  There is only one way to find out!',
        }
        serialized = json.dumps(share_data)
        # Unauthenticated person should not be able to edit it.
        rv = self.app.put(
            '/api/share/{0}'.format(share_id), headers=noone_headers, data=serialized)
        assert(rv.status_code == 401)
        # User C should not be able to edit it.
        rv = self.app.put(
            '/api/share/{0}'.format(share_id), headers=userC_headers, data=serialized)
        assert(rv.status_code == 403)
        # User B should be able to edit it.
        rv = self.app.put(
            '/api/share/{0}'.format(share_id), headers=userB_headers, data=serialized)
        assert(rv.status_code == 200)
        data = json.loads(rv.data.decode('utf8'))['data']
        # There should still be one event there.
        assert(len(data['events']) == 1)
        # This should send an email to userA that a share has been edited.
        mailer = mail.get_mailer()
        assert(len(mailer.queue) == 1)
        email = mailer.pop()
        assert(email.to_address == sample_userA['email'])
        # And who has given approval is switched.
        assert(data['educator_approved'] == False)
        assert(data['community_partner_approved'] == True)
        # User A can do a put with no changes to approve.
        rv = self.app.put(
            '/api/share/{0}'.format(share_id), headers=userA_headers, data=serialized)
        assert(rv.status_code == 200)
        data = json.loads(rv.data.decode('utf8'))['data']
        assert(data['educator_approved'] == True)
        assert(data['community_partner_approved'] == True)
        # This should send an email to userB that changes have been approved.
        mailer = mail.get_mailer()
        assert(len(mailer.queue) == 1)
        email = mailer.pop()
        assert(email.to_address == sample_userB['email'])
        # Now userB deletes the events
        share_data = {
            'events': []
        }
        serialized = json.dumps(share_data)
        # Unauthenticated person should not be able to edit it.
        rv = self.app.put(
            '/api/share/{0}'.format(share_id), headers=userB_headers, data=serialized)
        assert(rv.status_code == 200)
        data = json.loads(rv.data.decode('utf8'))['data']
        assert(len(data['events']) == 0)


    def test_password_reset(self):
        # Signup userA
        userA_id, userA_api_key, userA_email_key = self.sign_up(sample_userA)
        self.confirm_email(userA_email_key)
        rv = self.app.get('/api/requestresetpassword/{0}'.format(
            sample_userA['email']))
        assert(rv.status_code == 200)
        mailer = mail.get_mailer()
        # Check that we can authenticate with email and password
        headers = make_headers(email=sample_userA['email'], password=sample_userA['password'])
        rv = self.app.get('/api/requestapikey/', headers=headers)
        assert(rv.status_code == 200)
        # We should have one email in queue (email from password reset request)
        assert(len(mailer.queue) == 1)
        email = mailer.pop()
        links = email.find_links()
        assert(len(links)==1)
        email_key = re.search('key=(.*)', links[0]).groups()[0]
        logger.debug('email key is {0}'.format(email_key))
        # Now try to reset password
        new_password = 'mynewpassword'
        headers = make_headers()
        rv = self.app.post(
            '/api/resetpassword',
            data=json.dumps({'key': email_key, 'password': new_password}),
            headers=headers)
        assert(rv.status_code==200)
        # Check that we can't authenticate with email and old password
        headers = make_headers(email=sample_userA['email'], password=sample_userA['password'])
        rv = self.app.get('/api/requestapikey/', headers=headers)
        assert(rv.status_code == 401)
        # Check that we can authenticate with email and new password
        headers = make_headers(email=sample_userA['email'], password=new_password)
        rv = self.app.get('/api/requestapikey/', headers=headers)
        assert(rv.status_code == 200)

    def test_two(self):
        # Now sign up 2 new users but don't confirm their email addresses
        userA_id, userA_api_key, userA_email_key = self.sign_up(sample_userA)
        userB_id, userB_api_key, userB_email_key = self.sign_up(sample_userB)
        # userA creates a search of educator for partner
        searchA_id = self.save_search(
            userA_id, userA_api_key, 'educator', 'partner',
            ['robot dogs', 'walks on the beach'])
        assert(searchA_id >= 0)
        # userB creates a search of partner to educator
        searchB_id = self.save_search(
            userB_id, userB_api_key, 'partner', 'educator',
            ['robot dogs', 'walks on the beach'])
        assert(searchB_id >= 0)
        # Get all the results for userA's search
        headers = make_headers(userA_api_key)
        rv = self.app.get('/api/search/{0}/results'.format(searchA_id),
                          headers=headers)
        data = json.loads(rv.data.decode('utf8'))
        searches = data['data']
        assert(len(searches) == 0)
        # Now userB will confirm their email.
        self.confirm_email(userB_email_key)
        # So that they should appear in userA's search.
        headers = make_headers(userA_api_key)
        rv = self.app.get('/api/search/{0}/results'.format(searchA_id),
                          headers=headers)
        data = json.loads(rv.data.decode('utf8'))
        searches = data['data']
        assert(len(searches) == 1)
        # But userA shouldn't be able to start a conversation until they have
        # confirmed their email
        headers = make_headers(userA_api_key)
        conversation_data = {
            'search_id': searchA_id,
            'title': 'Trip to moon',
            'userA_id': userA_id,
            'userB_id': userB_id,
        }
        serialized = json.dumps(conversation_data)
        rv = self.app.post(
            '/api/conversation', headers=headers, data=serialized)
        assert(rv.status_code == 400)
        # Now userA will confirm their email.
        self.confirm_email(userA_email_key)
        # And try to save the conversation again.
        rv = self.app.post(
            '/api/conversation', headers=headers, data=serialized)
        assert(rv.status_code == 200)

    def test_one(self):
        # Make sure we get an OK when requesting index.
        rv = self.app.get('/')
        assert(rv.status_code == 200)
        # Now try to get user from API
        # Expect forbidden (401)
        rv = self.app.get('/api/user/1')
        assert(rv.status_code == 401)
        # Now sign up UserA
        userA_id, userA_api_key, userA_email_key = self.sign_up(sample_userA)
        # Get userA and check that email is not confirmed
        headers = make_headers(userA_api_key)
        rv = self.app.get('/api/user/1', headers=headers)
        assert(rv.status_code == 200)
        data = json.loads(rv.data.decode('utf8'))['data']
        assert(data['email_confirmed'] == False)
        # Confirm email
        self.confirm_email(userA_email_key)
        # Get userA and check that email is confirmed
        rv = self.app.get('/api/user/1', headers=headers)
        assert(rv.status_code == 200)
        data = json.loads(rv.data.decode('utf8'))['data']
        assert(data['email_confirmed'] == True)
        # Sign up UserB
        userB_id, userB_api_key, userB_email_key = self.sign_up(sample_userB)
        self.confirm_email(userB_email_key)
        # userA creates a search of educator for partner
        searchA_id = self.save_search(
            userA_id, userA_api_key, 'educator', 'partner',
            ['robot dogs', 'walks on the beach'])
        assert(searchA_id >= 0)
        # userB creates a search of partner to educator
        searchB_id = self.save_search(
            userB_id, userB_api_key, 'partner', 'educator',
            ['robot dogs', 'walks on the beach'])
        assert(searchB_id >= 0)
        # Get all the results for userA's search
        headers = make_headers(userA_api_key)
        rv = self.app.get('/api/search/{0}/results'.format(searchA_id),
                          headers=headers)
        data = json.loads(rv.data.decode('utf8'))
        searches = data['data']
        assert(len(searches) == 1)
        assert(searches[0]['searcher_user_id'] == userB_id)
        # Now userA starts a conversation with userB
        conversation_data = {
            'search_id': searchA_id,
            'title': 'Trip to moon',
            'userA_id': userA_id,
            'userB_id': userB_id,
        }
        serialized = json.dumps(conversation_data)
        rv = self.app.post(
            '/api/conversation', headers=headers, data=serialized)
        assert(rv.status_code == 200)
        data = json.loads(rv.data.decode('utf8'))
        conversation_id = data['data']['id']
        # And send the first message
        message_content = 'Are you interested in going to the moon?'
        rv = self.send_message(
            conversation_id=conversation_id,
            sender_user_id=userA_id,
            content=message_content,
            api_key=userA_api_key)
        data = json.loads(rv.data.decode('utf8'))
        message_id = data['data']['id']
        mailer = mail.get_mailer()
        # We should have one email in queue (email about new message)
        assert(len(mailer.queue) == 1)
        email = mailer.pop()
        assert(email.subject == conversation_data['title'])
        assert(email.content.startswith(message_content))
        assert(email.to_address == sample_userB['email'])
        new_reply_content = 'Sure, sounds great!'
        reply_email = email.make_reply(new_reply_content)
        assert(reply_email.subject == conversation_data['title'])
        assert(reply_email.content.startswith(new_reply_content))
        assert(reply_email.from_address == email.to_address)
        assert(reply_email.to_address == email.from_address)
        # That email should contain a link to the conversation
        # We're not running the javascript so we can't test it properly.
        links = email.find_links()
        assert(len(links) == 1)
        chopped_link = chop_link(links[0])
        rv = self.app.get(chopped_link)
        assert(rv.status_code==200)
        # Send the reply email to our email API in the form of a Mailgun
        # request.
        rv = self.app.post(
            '/api/email', data=reply_email.make_mailgun_data())
        assert(rv.status_code==200)
        # It should have been forwarded to the other user.
        assert(len(mailer.queue) == 1)
        email = mailer.pop()
        assert(email.subject == conversation_data['title'])
        assert(email.content.startswith(new_reply_content))
        assert(email.to_address == sample_userA['email'])
        # And we should now have two messages in the conversation
        # We'll hit the conversation API to confirm this.
        rv = self.app.get(
            '/api/conversation/{0}'.format(conversation_id),
            headers=headers)
        rcvd_conversation_data = json.loads(rv.data.decode('utf8'))['data']
        assert(rcvd_conversation_data['id'] == conversation_id)
        assert(rcvd_conversation_data['title'] == conversation_data['title'])
        messages_data = rcvd_conversation_data['messages']
        assert(len(messages_data) == 2)
        assert(messages_data[0]['content'] == message_content)
        assert(messages_data[0]['sender_user_id'] == userA_id)
        assert(messages_data[1]['content'] == new_reply_content)
        assert(messages_data[1]['sender_user_id'] == userB_id)

        # To do:
        # Make sure that conversation link works in email
        
    def tearDown(self):
        #os.rmdir(self.SQLLITE_FILE)
        pass

if __name__ == '__main__':
    unittest.main()
    
        
