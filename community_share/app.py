from flask import Flask, send_from_directory

from community_share import settings
from community_share.user_routes import register_user_routes

def make_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = settings.DB_CONNECTION

    register_user_routes(app)

    @app.route('/static/js/<path:filename>')
    def js_static(filename):
        return send_from_directory(app.root_path + '/../static/js/', filename)

    @app.route('/static/fonts/<path:filename>')
    def fonts_static(filename):
        return send_from_directory(app.root_path + '/../static/fonts/', filename)

    @app.route('/static/css/<path:filename>')
    def css_static(filename):
        return send_from_directory(app.root_path + '/../static/css/', filename)

    @app.route('/static/templates/<path:filename>')
    def templates_static(filename):
        return send_from_directory(app.root_path + '/../static/templates/', filename)

    @app.route('/')
    def index():
        return send_from_directory(app.root_path + '/../static/', 'index.html')
        
    return app
    
if __name__ == '__main__':
    settings.setup_logging(logging.DEBUG)
    app = make_app()
    app.debug = True
    app.run()
