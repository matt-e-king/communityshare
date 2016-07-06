# Community Share

We're working on creating an application to connect educators with community partners.

See [communityshare.us](http://www.communityshare.us) for more details.


## Contributing

We currently develop community share locally by means of a Docker image. The image will boot up and load the current app, letting you make code changes without rebuilding the container. **The first step is thus to install [Docker](https://www.docker.com) on your computer**. Please consult the Docker project or guides online for issues installing and running Docker.

> Note that for OSX and Windows users you might need to enroll in the [Docker Private Beta program](https://beta.docker.com) in order to get the newer and more integrated native Docker clients.

### Running a local development environment

Clone the reposity…

```bash
git clone https://github.com/communityshare/communityshare.git
```

…and then start the Docker containers.

```bash
cd communityshare
docker-compose up
```

After this you should be able to see the servers initialize. You should be able to open up a browser to [http://localhost:5000](http://localhost:5000) and see the CommunityShare site.

If you experience any issues getting CommunityShare running locally, please [file an issue](https://github.com/communityshare/communityshare/issues/new) and describe the problems you encountered.

Should you have need to inspect the running logs, they can be found mounted at `/communitysharelogs` within the Docker container. While the server is running, you can login to the container and explore:

```bash
docker-container exec server sh
```