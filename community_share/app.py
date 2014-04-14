from flask import Flask, send_from_directory
from flask.ext import login

def make_app():
    app = Flask(__name__)
    login_manager = login.LoginManager()
    login_manager.init_app(app)

    @app.route("/login", methods=["GET", "POST"])
    def logmein():
        form = login.LoginForm()
        if form.validate_on_submit():
            login.login_user(user)
            print("Logged in successfully.")
            response = redirect(request.args.get("next") or url_for("index"))
        else:
            response = render_template("login.html", form=form)
        return response

    @app.route('/static/js/<path:filename>')
    def js_static(filename):
        return send_from_directory(app.root_path + '/../static/js/', filename)

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
    app = make_app()
    app.run()
