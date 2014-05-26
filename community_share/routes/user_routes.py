import logging

from flask import request, jsonify

from community_share.store import session
from community_share.models.user import User
from community_share.authorization import get_requesting_user
from community_share import mail_actions
from community_share.routes import base_routes

logger = logging.getLogger(__name__)

def register_user_routes(app):

    user_blueprint = base_routes.make_blueprint(User, 'user')
    app.register_blueprint(user_blueprint)

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
            mail_actions.request_password_reset(user)
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
        
                

