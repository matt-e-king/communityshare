from community_share.models.search import Search
from community_share.routes import base_routes

def register_search_routes(app):

    search_blueprint = base_routes.make_blueprint(Search, 'search')
    app.register_blueprint(search_blueprint)
