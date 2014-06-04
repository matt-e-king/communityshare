from community_share import config, settings, app
config.load_from_environment()
settings.setup_logging(config.LOGGING_LEVEL)
app = app.make_app()
app.debug = True
