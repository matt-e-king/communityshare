#CommunityShare

We're working on creating an application to connect educators with community partners.

See http://www.communityshare.us/ for more details.


##  Development Environment Setup

### Get the code & install dependencies

First, clone the repo locally into your workspace:

```
 $ git clone https://github.com/benreynwar/communityshare.git
```

Install python3 if you don't already have it, using homebrew or your package manager of choice:

```
 $ brew install python3
```

Install postgres as your database

```
 $ brew install postgres
```

Install dependencies

```
 $ pip3 install -r requirements.txt
```

### Set up Your Database

Start your postgres server

```
 $ psql
```

Create a new communityshare user

```
 # CREATE USER communityshare;
```

Create a new communityshare database

```
 # CREATE DATABASE communityshare;
```

Grant communityshare database privileges to the communityshare user

```
 # grant all privileges on database communityshare to communityshare;
```

### Populate your Database

To populate your database, run

```
 $ python3 setup.py
```
  
*Note 1: Make sure to check your setup.py file to create a number of random users greater than 0*

*setup(n_random_users=40)*

*Note 2: Running this command will reset your database.*
 
 
### Start your app

Run

```
 $ python3 community_share_local_app.py 
```
 
Open in your browser at http://127.0.0.1:5000/
