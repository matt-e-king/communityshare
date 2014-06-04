from community_share import config, settings
config.load_from_environment()
settings.setup_logging(config.LOGGING_LEVEL)
app = make_app()
app.debug = True
app.run()
