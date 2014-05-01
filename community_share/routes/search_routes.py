from flask import jsonify

from community_share.models.search import Search
from community_share import search_matching
from community_share.routes import base_routes
from community_share.authorization import get_requesting_user
from community_share.utils import is_integer
from community_share.store import session

def register_search_routes(app):

    search_blueprint = base_routes.make_blueprint(Search, 'search')
    app.register_blueprint(search_blueprint)

    @app.route(base_routes.API_SINGLE_FORMAT.format('search') + '/results', methods=['GET'])
    def get_search_results(id):
        requester = get_requesting_user()
        if requester is None:
            response = base_routes.make_not_authorized_response()
        elif not is_integer(id):
            response = base_routes.make_bad_request_response()
        else:
            search = session.query(Search).filter_by(id=id).first()
            if search is None:
                response = base_routes.make_not_found_response()
            else:
                if search.has_admin_rights(requester):
                    matching_searches = search_matching.find_matching_searches(search)

                    serialized = [
                        search.standard_serialize(include_searcher_user=True)
                        for search in matching_searches]
                    response_data = {'data': serialized}
                    response = jsonify(response_data)
                else:
                    response = base_routes.make_forbidden_response()
        return response
        