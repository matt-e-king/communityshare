import re
import os
import unittest
import logging
import json

from flask import jsonify

from community_share import settings, setup, app, mail, config

logger = logging.getLogger(__name__)

sample_userA = {
    'institution_associations': [],
    'name': 'Charles',
    'bio': 'I am Charles.',
    'zipcode' :'12345',
    'email': "charlies@notarealemail.com",
}

sample_userB = {
    'institution_associations': [],
    'name': 'Rob',
    'bio': 'I am Rob.',
    'zipcode' :'12345',
    'email': "rob@notarealemail.com",
}

def compare_user_data(userA, userB):
    for key, value in userA.items():
        assert(userA[key] == userB[key])

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
        self.app = app.make_app().test_client()

    def sign_up(self, user_data):
        data = {
            'password': 'aaaaaaaa',
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
        compare_user_data(user_data, data['data'])
        mailer = mail.get_mailer()
        # We should have one email in queue (email confimation from signup)
        assert(len(mailer.queue) == 1)
        email = mailer.pop()
        links = email.find_links()
        assert(len(links)==1)
        key = re.search('key=(.*)', links[0]).groups()[0]
        # Confirm email for new user
        headers = [('Content-Type', 'application/json')]
        data = json.dumps({'key': key})
        rv = self.app.post('/api/confirmemail', data=data,
                           headers=headers)
        assert(rv.status_code == 200)
        return user_id, api_key

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
        authorization_header = 'Basic:api:{0}'.format(api_key)
        headers = [('Authorization', authorization_header),
                   ('Content-Type', 'application/json')]
        rv = self.app.post('/api/search', data=serialized, headers=headers)
        assert(rv.status_code == 200)
        data = json.loads(rv.data.decode('utf8'))
        search_id = data['data']['id']
        return search_id

    def test_empty_db(self):
        # Make sure we get an OK when requesting index.
        rv = self.app.get('/')
        assert(rv.status_code == 200)
        # Now try to get user from API
        # Expect forbidden (401)
        rv = self.app.get('/api/user/1')
        assert(rv.status_code == 401)
        # Now sign up 2 new users
        userA_id, userA_api_key = self.sign_up(sample_userA)
        userB_id, userB_api_key = self.sign_up(sample_userB)
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
        authorization_header = 'Basic:api:{0}'.format(userA_api_key)
        headers = [('Authorization', authorization_header),
                   ('Content-Type', 'application/json')]
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
        message_data = {
            'conversation_id': conversation_id,
            'sender_user_id': userA_id,
            'content': 'Are you interested in going to the moon?',
        }
        serialized = json.dumps(message_data)
        rv = self.app.post(
            '/api/message', headers=headers, data=serialized)
        assert(rv.status_code == 200)
        data = json.loads(rv.data.decode('utf8'))
        message_id = data['data']['id']
        mailer = mail.get_mailer()
        # We should have one email in queue (email about new message)
        assert(len(mailer.queue) == 1)
        email = mailer.pop()
        assert(email.subject == conversation_data['title'])
        assert(email.content.startswith(message_data['content']))
        assert(email.to_address == sample_userB['email'])
        new_reply_content = 'Sure, sounds great!'
        reply_email = email.make_reply(new_reply_content)
        assert(reply_email.subject == conversation_data['title'])
        assert(reply_email.content.startswith(new_reply_content))
        assert(reply_email.from_address == email.to_address)
        assert(reply_email.to_address == email.from_address)
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
        assert(messages_data[0]['content'] == message_data['content'])
        assert(messages_data[0]['sender_user_id'] == userA_id)
        assert(messages_data[1]['content'] == new_reply_content)
        assert(messages_data[1]['sender_user_id'] == userB_id)
        
    def tearDown(self):
        #os.rmdir(self.SQLLITE_FILE)
        pass

if __name__ == '__main__':
    settings.setup_logging(logging.DEBUG)
    logger.debug('la la la')
    unittest.main()
    
        
