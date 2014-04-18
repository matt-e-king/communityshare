from flask import request

from community_share.store import session
from community_share.models.user import User
from community_share.authorization import get_requesting_user

from community_share import routes, mail_actions

def register_user_routes(app):

    routes.register_routes(User, 'user', app)

    @app.route('/api/userbyemail/<string:email>', methods=['GET'])
    def userbyemail(email):
        requester = get_requesting_user()
        if requester is None:
            response = routes.make_not_authorized_response()
        elif requester.email != email:
            response = routes.make_forbidden_response()
        else:
            user = session.query(User).filter_by(email=email).first()
            if user is None:
                response = routes.make_not_found_response()
            else:
                response = routes.make_admin_single_response(user)
        return response

    @app.route('/api/requestresetpassword/<string:email>', methods=['GET'])
    def request_reset_password(email):
        user = session.query(User).filter_by(email=email).first()
        if user is None:
            response = routes.make_not_found_response()
        else:
            mail_actions.request_password_reset(user)
            response = routes.make_OK_response()
        return response

    @app.route('/api/resetpassword', methods=['POST'])
    def reset_password():
        data = request.json
        key = data.get('key', '')
        password = data.get('password', '')
        if key == '' or password == '':
            response = routes.make_bad_request_response()
        else:
            user = mail_actions.process_password_reset(key, password)
            if user is None:
                response = routes.make_bad_request_response()
            else:
                response = routes.make_admin_single_response(user)
        return response
        
                

