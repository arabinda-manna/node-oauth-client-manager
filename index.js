// my-oauth-server-package/index.js
require('dotenv').config();

const createOauthServerApp = require('./app');
const db = require('./models');

// Export a function that accepts oauthModelOverrides
module.exports = (oauthModelOverrides = {}) => {
  const oauthRouter = createOauthServerApp(oauthModelOverrides); // Pass the overrides

  return {
    oauthRouter: oauthRouter,
    authenticateToken: oauthRouter.authenticateToken,
    sequelize: db.sequelize,
    models: db,
    initializeDatabase: async () => {
      try {
        await db.sequelize.authenticate();
        console.log('OAuth package database connection established successfully.');
      } catch (error) {
        console.error('Unable to connect to the OAuth package database:', error);
        throw error;
      }
    }
  };
};