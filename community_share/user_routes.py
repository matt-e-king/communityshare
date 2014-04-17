from community_share.store import session
from community_share.models.user import User
from community_share.authorization import get_requesting_user

from community_share import routes

def register_user_routes(app):

    routes.register_routes(User, 'user', app)

    @app.route('/api/userbyemail/<string:email>')
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

