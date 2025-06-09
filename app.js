// my-oauth-server-package/oauth-server-app.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const OAuthServer = require('@node-oauth/express-oauth-server');
const clientRoutes = require('./routes/clientRoutes');
const oauthRoutes = require('./routes/oauthRoutes');
const db = require('./models');
const path = require('path');
const fs = require('fs');

// This function now accepts an oauthModelOverrides object
module.exports = (oauthModelOverrides = {}) => { // Default to empty object if no overrides are provided
  const oauthServerApp = express();

  oauthServerApp.use(cors());
  oauthServerApp.use(bodyParser.json());
  oauthServerApp.use(bodyParser.urlencoded({ extended: true }));

  // Define the core OAuth model functions
  const coreOAuthModel = {
    getClient: db.Client.getClient,
    saveToken: db.Token.saveToken,
    getAccessToken: db.Token.getAccessToken,
    getRefreshToken: db.Token.getRefreshToken,
    revokeToken: db.Token.revokeToken,
    saveAuthorizationCode: db.AuthorizationCode.saveAuthorizationCode,
    getAuthorizationCode: db.AuthorizationCode.getAuthorizationCode,
    revokeAuthorizationCode: db.AuthorizationCode.revokeAuthorizationCode,

    // Default getUser implementation (can be overridden)
    getUser: async (username, password) => {
      console.log(`OAuth Model (oauth-server-app - Default getUser): getUser called for username: ${username}`);
      return null;
    },

    // Default getUserFromClient implementation (can be overridden)
    getUserFromClient: async (client) => {
      console.log(`OAuth Model (oauth-server-app - Default getUserFromClient): getUserFromClient called for client: ${client.clientId}`);
      return null; // By default, no user associated with client credentials
    },
  };

  // Merge core model with overrides
  const finalOAuthModel = {
    ...coreOAuthModel,
    // Override default implementations if provided in options
    getUser: oauthModelOverrides.getUser || coreOAuthModel.getUser,
    getUserFromClient: oauthModelOverrides.getUserFromClient || coreOAuthModel.getUserFromClient,
  };


  const oauth = new OAuthServer({
    model: finalOAuthModel, // Use the final, potentially overridden model
    grants: ['authorization_code', 'refresh_token', 'client_credentials', 'password'],
    accessTokenLifetime: process.env.OAUTH_ACCESS_TOKEN_LIFETIME || 3600,
    refreshTokenLifetime: process.env.OAUTH_REFRESH_TOKEN_LIFETIME || 86400,
  });

  oauthRoutes.setOauthServerInstance(oauth);

  // --- Route Mounting within this OAuth Server App ---
  oauthServerApp.use('/token', oauth.token());
  oauthServerApp.use('/authorize', oauth.authorize());
  oauthServerApp.use('/clients', clientRoutes); // Client management API

  oauthServerApp.get('/admin/clients', (req, res) => {
    const oauthBaseUrlForFrontend = req.baseUrl || '';

    fs.readFile(path.join(__dirname, 'public', 'index.html'), 'utf8', (err, data) => {
      if (err) {
        console.error('Error reading index.html:', err);
        return res.status(500).send('Error loading UI.');
      }

      const modifiedHtml = data.replace(
        '',
        `<script>window.OAUTH_BASE_URL = "${oauthBaseUrlForFrontend}";</script>`
      );
      res.send(modifiedHtml);
    });
  });

  // --- Serve the Client Management UI from within the package ---
  oauthServerApp.use('/admin/static', express.static(path.join(__dirname, 'public')));


  // --- Authentication Middleware for Parent App ---
  oauthServerApp.authenticateToken = async (req, res, next) => {
    const authorizationHeader = req.headers.authorization;

    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      return res.status(401).send('Unauthorized: No Bearer token');
    }

    const accessToken = authorizationHeader.split(' ')[1];

    try {
      const tokenInfo = await oauth.authenticate({
        token: accessToken,
        allowBearerTokensInQueryString: false
      });

      if (tokenInfo) {
        req.oauth = tokenInfo;
        next();
      } else {
        return res.status(401).send('Unauthorized: Invalid access token');
      }
    } catch (err) {
      console.error('Error authenticating token:', err);
      return res.status(401).send('Unauthorized: Invalid access token');
    }
  };

  return oauthServerApp;
};