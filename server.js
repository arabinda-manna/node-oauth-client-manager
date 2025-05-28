// Load environment variables from .env file at the very beginning
require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const OAuthServer = require('@node-oauth/express-oauth-server');
const path = require('path');

// Import database connection and models
const db = require('./models');

// Import routes
const clientRoutes = require('./routes/clientRoutes');
const oauthRoutes = require('./routes/oauthRoutes');

const app = express();
// Use process.env.PORT, fallback to 3000 if not set
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Define the OAuth model object by referencing static methods from Sequelize models
const oauthModel = {
  getClient: db.Client.getClient,
  saveToken: db.Token.saveToken,
  getAccessToken: db.Token.getAccessToken,
  getRefreshToken: db.Token.getRefreshToken,
  revokeToken: db.Token.revokeToken,
  saveAuthorizationCode: db.AuthorizationCode.saveAuthorizationCode,
  getAuthorizationCode: db.AuthorizationCode.getAuthorizationCode,
  revokeAuthorizationCode: db.AuthorizationCode.revokeAuthorizationCode,
  getUser: async (username, password) => {
    console.log(`OAuth Model (server.js): getUser called for username: ${username}`);
    return null;
  },
  // In your server.js, within the oauthModel:
  getUserFromClient: async (client) => {
    if (client.clientName) {
      return { id: client.clientName }; // Return a user object
    }
    return null; // No user associated with this client
  },
};

// Initialize OAuth Server with the new model object
const oauth = new OAuthServer({
  model: oauthModel,
  grants: ['authorization_code', 'refresh_token', 'client_credentials', 'password'],
  accessTokenLifetime: process.env.OAUTH_ACCESS_TOKEN_LIFETIME || 3600,
  refreshTokenLifetime: process.env.OAUTH_REFRESH_TOKEN_LIFETIME || 86400,
});

// Pass the oauth instance to the oauthRoutes module
oauthRoutes.setOauthServerInstance(oauth);

// --- Route Mounting ---
app.use('/api/clients', clientRoutes);
app.use('/oauth', oauthRoutes.router);

// --- Frontend Serving ---
app.get('/admin/clients', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.use('/static', express.static(path.join(__dirname, 'public')));

// --- Server Start ---
db.sequelize.authenticate() // Optional: Check database connection
  .then(() => {
    app.listen(port, () => {
      console.log(`OAuth Client Management API server listening at http://localhost:${port}`);
      console.log(`Client Management UI: http://localhost:${port}/admin/clients`);
      console.log(`OAuth Token Endpoint: http://localhost:${port}/oauth/token (POST)`);
      console.log(`OAuth Authorization Endpoint: http://localhost:${port}/oauth/authorize (GET)`);
    });
  })
  .catch((err) => {
    console.error('Unable to connect to the database:', err);
    process.exit(1);
  });