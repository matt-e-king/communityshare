import os
import unittest
import logging
import json

from flask import jsonify

from community_share import settings, setup, app, mail, config

logger = logging.getLogger(__name__)

sample_user = {
    'institution_associations': [],
    'name': 'Charles',
    'bio': 'I am Charles.',
    'zipcode' :'12345',
    'email': "charlies@notarealemail.com",
    'zipcode': '12345',
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
        return rv

    def test_empty_db(self):
        # Make sure we get an OK when requesting index.
        rv = self.app.get('/')
        assert(rv.status_code == 200)
        # Now try to get user from API
        # Expect forbidden (401)
        rv = self.app.get('/api/user/1')
        assert(rv.status_code == 401)
        # Now sign up
        rv = self.sign_up(sample_user)
        assert(rv.status_code == 200)
        data = json.loads(rv.data.decode('utf8'))
        user_id = data['data']['id']
        assert(user_id == 1)
        api_key = data['apiKey']
        authorization_header = 'Basic:api:{0}'.format(api_key)
        headers = [('Authorization', authorization_header)]
        # Create an authentication header
        # And try to retrieve user
        rv = self.app.get('/api/user/1', headers=headers)
        assert(rv.status_code == 200)
        data = json.loads(rv.data.decode('utf8'))
        # User details should match
        compare_user_data(sample_user, data['data'])
        # We should have one email in queue (email confimation from signup)
        assert(len(mail.get_mailer().queue) == 1)
        
    def tearDown(self):
        #os.rmdir(self.SQLLITE_FILE)
        pass

if __name__ == '__main__':
    settings.setup_logging(logging.DEBUG)
    logger.debug('la la la')
    unittest.main()
    
        
