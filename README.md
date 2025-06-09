This whole application is create with Gemini 2.5 Flash Model

First Prompt

```
I want to create a OAuth Server with Client Management UI in nodeJS. I chose to use the npm package '@node-oauth/express-oauth-server'. But is doesn't come with the frontend for the client management. Can you create a nodeJS end to end application with required backend apis and frontend UI to manage the client tokens, creation, modification, deletion etc.
```

Output

```
├── package.json
├── package-lock.json
├── public
│   ├── index.html
│   └── script.js
├── README.md
└── server.js
```

```
After staring the server got issue 'ReferenceError: path is not defined'
So used 'npm i path' and imported the variable in the server.js
Server is started serving file from public folder in the root url
```

Second Prompt

```
modify the static file serve to a different specific API node
```

Output

```
├── package.json
├── package-lock.json
├── public
│   ├── index.html
│   └── script.js
├── README.md
└── server.js
```

```
The root url is no longer available. Public folder is being served through '/admin/clients'
```

Third Prompt

```
i don't see oauth variable in server.js is not being used anywhere. then what is the use of it?
```

Fourth Prompt

```
i don't see oauth variable in server.js is not being used anywhere. then what is the use of it?
store the data in the postgres database with sequelize ORM in place of in memory dictionary
```

Fifth Prompt

```
also add migration file for the database schema
```

Sixth Prompt

```
consider column names are in snake case not in camel case
```

Seventh Prompt

```
now modify the server.js file and create the routes in separate file and importable
```

Eighth Prompt

```
Can you move the OAuthServer model to the individual DB model and reuse in the server.js?
```

Ninth Prompt

```
create .env file for all the enviroment related setting and update the files accordingly
```

Tenth Prompt

```
why do we need to call "db.sequelize.sync()" in the server.js file?
as we are maintaining separate migration files, I don't think we need explicit db.sync call.
```

Eleventh Prompt

```
change config.json to config.js as env is not loading during the sequelize-cli run
```

Twelvth Prompt

```
After testing the application, I found that I need to manually input the client ID and client secret on every client creation. But it will be good if you take a client name as input, and client ID and client secret auto-generated and shared with the frontend
```

Thirteen Prompt

```
It is perfect. Now I need a little more modification. Once the client secret is generated, it will never be shown to the user again. If he forgets, he can regenerate the secret but can't she the old one. Also, for the Grants section, if they become a check box rather than comma separated field would be better.
```

Fourteen Prompt

```
Currently, the client_secret is being saved in clear text format. Can change it encrypted form like SHA512
```

![image](https://github.com/user-attachments/assets/842fafc8-e2f8-4738-af8a-b093064890f7)
