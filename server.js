// Main Project's server.js
require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

// Import the function from your OAuth server NPM package
const createOauthPackage = require('./index');

// --- Define your custom getUser and getUserFromClient logic ---
// These functions will interact with YOUR main application's user database/logic.
const myCustomGetUser = async (username, password) => {
  console.log(`Main App: Custom getUser called for: ${username}`);
  // Example: Replace with actual user database lookup and password verification (e.g., bcrypt)
  return null;
};

const myCustomGetUserFromClient = async (client) => {
  console.log(`Main App: Custom getUserFromClient called for client: ${client.clientId}`);
  // Example: If certain clients are associated with a specific service user
  if (client.clientName) {
    return { id: client.clientName.toLowerCase().replace(" ", "-"), name: client.clientName };
  }
  return null;
};
// --- End custom user logic ---


// Initialize the OAuth package with your custom model overrides
const { oauthRouter, authenticateToken, sequelize, models, initializeDatabase } = createOauthPackage({
  getUser: myCustomGetUser,
  getUserFromClient: myCustomGetUserFromClient,
});


const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// --- Mount the OAuth Server Routes ---
const OAUTH_BASE_ROUTE = process.env.OAUTH_BASE_ROUTE || '/auth'; // Get base route from .env
app.use(OAUTH_BASE_ROUTE, oauthRouter);

// --- Main Application Routes ---
app.get('/', (req, res) => {
  res.send('Welcome to the Main Application!');
});

// Example protected route using the imported authentication middleware
app.get('/api/data', authenticateToken, (req, res) => {
  res.json({
    message: 'This is protected data!',
    authenticatedUserOrClient: req.oauth.user ? req.oauth.user.id : (req.oauth.client ? req.oauth.client.clientId : 'unknown'),
    tokenScope: req.oauth.scope,
    // Access details from your custom user object if associated
    userName: req.oauth.user ? req.oauth.user.name : undefined
  });
});

// Unprotected route
app.get('/api/public', (req, res) => {
  res.send('This is public data.');
});

// --- Client Management UI ---
// Remember: The UI is now served by the OAuth package itself, under /admin/clients
// e.g., http://localhost:3000/auth/admin/clients
app.get('/admin/clients-ui', (req, res) => {
  // This is just a redirect or a simple link to the actual UI provided by the package
  res.redirect(`${OAUTH_BASE_ROUTE}/admin/clients`);
});


// --- Database Initialization and Server Start ---
initializeDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`Main application listening on port ${port}`);
      console.log(`OAuth Server & Client Management UI mounted under ${OAUTH_BASE_ROUTE}`);
      console.log(`Client Management UI available at http://localhost:${port}${OAUTH_BASE_ROUTE}/admin/clients`);
      console.log(`Test protected route: http://localhost:${port}/api/data (requires Bearer token)`);
      console.log(`OAuth Token Endpoint: http://localhost:${port}${OAUTH_BASE_ROUTE}/token`);
      console.log(`OAuth Authorize Endpoint: http://localhost:${port}${OAUTH_BASE_ROUTE}/authorize`);
    });
  })
  .catch(err => {
    console.error('Failed to start main application: Database connection error.', err);
    process.exit(1);
  });