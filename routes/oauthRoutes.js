// routes/oauthRoutes.js
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid'); // For generating unique IDs
const db = require('../models'); // Import Sequelize models

// This function will be passed from server.js
let oauthServerInstance;

// Setter function to receive the oauthServerInstance
const setOauthServerInstance = (instance) => {
  oauthServerInstance = instance;
};

// Token Endpoint: Clients request access tokens here.
router.post('/token', (req, res, next) => {
  if (!oauthServerInstance) {
    return res.status(500).json({ error: 'OAuth server not initialized.' });
  }
  oauthServerInstance.token()(req, res, next);
});

// Authorization Endpoint: User grants permission to a client.
// This is a simplified version for demonstration. In a real app, this would involve:
// 1. User authentication (e.g., login page).
// 2. User consent screen to approve client's access.
router.get('/authorize', async (req, res) => {
  const { client_id, redirect_uri, response_type, scope, state } = req.query;

  // Validate client and redirect URI
  const client = await db.Client.findByPk(client_id);
  if (!client || !client.redirectUris.includes(redirect_uri)) {
    return res.status(400).send('Invalid client or redirect URI');
  }

  // Simulate user authentication and consent (auto-approve for simplicity)
  const user = { id: 'testuser' }; // A dummy user

  // Generate a unique authorization code
  const authorizationCode = uuidv4();
  // Set expiration for the authorization code (e.g., 5 minutes)
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  // Save the authorization code in the database
  await db.AuthorizationCode.create({
    authorization_code: authorizationCode,
    expires_at: expiresAt,
    redirect_uri: redirect_uri,
    scope: scope,
    client_id: client.id,
    user_id: user.id,
  });

  // Redirect the user back to the client's redirect_uri with the authorization code
  const redirectUrl = new URL(redirect_uri);
  redirectUrl.searchParams.append('code', authorizationCode);
  if (state) {
    redirectUrl.searchParams.append('state', state);
  }
  res.redirect(redirectUrl.toString());
});

module.exports = { router, setOauthServerInstance };