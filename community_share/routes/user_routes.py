import logging
import os

import tinys3
from flask import request, jsonify, send_from_directory
from werkzeug.utils import secure_filename

from community_share.store import session
from community_share.models.user import User
from community_share.models.institution import Institution
from community_share.authorization import get_requesting_user
from community_share import mail_actions
from community_share.routes import base_routes

logger = logging.getLogger(__name__)

def register_user_routes(app):

    user_blueprint = base_routes.make_blueprint(User, 'user')
    app.register_blueprint(user_blueprint)

    institution_blueprint = base_routes.make_blueprint(Institution, 'institution')
    app.register_blueprint(institution_blueprint)

    @app.route('/api/usersignup', methods=['POST'])
    def usersignup():
        data = request.json
        user = data.get('user', None)
        email = user.get('email', '')
        password = data.get('password', None)
        # Check that the email isn't in use.
        existing_user = session.query(User).filter_by(email=email).first()
        if existing_user is not None:
            response = base_routes.make_bad_request_response(
                'That email address is already associated with an account.')
        elif password is None:
            response = base_routes.make_bad_request_response(
                'A password was not specified.');
        else:
            user = User.admin_deserialize_add(user)
            user.set_password(password)
            session.add(user)
            session.commit()
            secret = user.make_api_key()
            serialized = user.admin_serialize()
            response_data = {
                'data': serialized,
                'apiKey': secret.key
            }
            response = jsonify(response_data)
        return response

    @app.route('/api/userbyemail/<string:email>', methods=['GET'])
    def userbyemail(email):
        requester = get_requesting_user()
        if requester is None:
            response = base_routes.make_not_authorized_response()
        elif requester.email != email:
            response = base_routes.make_forbidden_response()
        else:
            user = session.query(User).filter_by(email=email).first()
            if user is None:
                response = base_routes.make_not_found_response()
            else:
                response = base_routes.make_admin_single_response(user)
        return response

    @app.route('/api/requestresetpassword/<string:email>', methods=['GET'])
    def request_reset_password(email):
        user = session.query(User).filter_by(email=email).first()
        if user is None:
            response = base_routes.make_not_found_response()
        else:
            error_message = mail_actions.request_password_reset(user)
            if error_message:
                response = base_routes.make_server_error_response(error_message)
            else:
                response = base_routes.make_OK_response()
        return response
        
    @app.route('/api/requestapikey/', methods=['GET'])
    def request_api_key():
        requester = get_requesting_user()
        if requester is None:
            response = base_routes.make_not_authorized_response()
        else:
            secret = requester.make_api_key()
            response_data = {
                'apiKey': secret.key
            }
            response = jsonify(response_data)
        return response

    @app.route('/api/resetpassword', methods=['POST'])
    def reset_password():
        data = request.json
        key = data.get('key', '')
        password = data.get('password', '')
        if key == '' or password == '':
            response = base_routes.make_bad_request_response()
        else:
            user = mail_actions.process_password_reset(key, password)
            if user is None:
                response = base_routes.make_bad_request_response()
            else:
                response = base_routes.make_admin_single_response(user)
        return response
        

    UPLOAD_FOLDER = os.environ.get('COMMUNITYSHARE_UPLOAD_FOLDER', None)
    ALLOWED_EXTENSIONS = set(['.txt', '.pdf', '.png', '.jpg', '.jpeg', '.gif'])

    def process_filename(filename, user_id):
        base, extension = os.path.splitext(filename)
        if extension in ALLOWED_EXTENSIONS:
            # Maximum filename length = 100
            # Use 50 to be safe
            base = base[:50]
            processed = 'user_{0}_{1}{2}'.format(user_id, base, extension)
        else:
            processed = None
        return processed

    @app.route('/api/user/<int:user_id>/picture', methods=['PUT', 'POST', 'PATCH'])
    def post_picture(user_id):
        requester = get_requesting_user()
        if (user_id == requester.id):
            user = requester
            f = request.files['file']
            if f:
                filename = process_filename(f.filename, user_id)
                if filename is None:
                    response = base_routes.make_bad_request_response()
                else:
                    S3_ACCESS_KEY = os.environ.get('COMMUNITYSHARE_S3_USERNAME', None)
                    S3_SECRET_KEY = os.environ.get('COMMUNITYSHARE_S3_KEY', None)
                    S3_BUCKETNAME = os.environ.get('COMMUNITYSHARE_S3_BUCKETNAME', None)
                    
                    if ((S3_ACCESS_KEY is None) or (S3_SECRET_KEY is None) or
                        (S3_BUCKETNAME is None)):
                        response = base_routes.make_server_error_response(
                            "Server does not have access codes for S3.")
                    else:
                        conn = tinys3.Connection(S3_ACCESS_KEY,S3_SECRET_KEY,tls=True)
                        # Upload it.  Set cache expiry time to 1 hr.
                        conn.upload(filename, f, S3_BUCKETNAME, expires=3600)
                        user.picture_filename = filename
                        session.add(user)
                        session.commit()
                        response = base_routes.make_OK_response()
            else:
                response = base_routes.make_bad_request_response()
        else:
            response = base.routes.make_forbidden_response()
        return response

    @app.route('/api/user/<int:user_id>/picture', methods=['GET'])
    def get_picture(user_id):
        user = session.query(User).filter_by(id=user_id).first()
        if user is None:
            response = base_routes.make_not_found_response()
        else:
            if not user.picture_filename:
                response = base_routes.make_not_found_response()
            else:
                response = send_from_directory(
                    UPLOAD_FOLDER, user.picture_filename)
        return response
            
        
        
