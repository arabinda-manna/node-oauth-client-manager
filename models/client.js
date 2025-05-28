// models/client.js
const crypto = require('crypto'); // Import the crypto module for hashing

module.exports = (sequelize, DataTypes) => {
  const Client = sequelize.define('Client', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      field: 'id'
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: 'name'
    },
    secret: { // This column will now store the SHA512 hash
      type: DataTypes.STRING,
      allowNull: false,
      field: 'secret'
    },
    grants: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      field: 'grants'
    },
    redirectUris: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      field: 'redirect_uris'
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at'
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: 'updated_at'
    }
  }, {
    tableName: 'clients',
    underscored: true,
  });

  // --- OAuth Model Methods ---

  // Helper function to hash the client secret using SHA512
  Client.hashClientSecret = (secret) => {
    if (!secret) return null; // Handle null/undefined input gracefully
    return crypto.createHash('sha512').update(secret).digest('hex');
  };

  // getClient: Retrieves a client for OAuth server validation.
  // This method is called by @node-oauth/express-oauth-server to validate client credentials.
  Client.getClient = async (clientId, clientSecret) => {
    console.log(`Client Model: getClient called for ID: ${clientId}`);
    const client = await Client.findByPk(clientId);

    if (client) {
      // If a clientSecret is provided (meaning an authentication attempt),
      // hash it and compare with the stored hashed secret.
      if (clientSecret) {
        const hashedProvidedSecret = Client.hashClientSecret(clientSecret);
        if (hashedProvidedSecret === client.secret) {
          // Return the client object as expected by the OAuth server
          return {
            clientId: client.id,
            clientName: client.name,
            clientSecret: client.secret, // This is the HASHED secret, not plain text
            grants: client.grants,
            redirectUris: client.redirectUris,
          };
        }
      } else {
        // If no clientSecret is provided (e.g., internal lookup, not authentication),
        // return the client details without secret comparison.
        // The OAuth server might call getClient without a secret for certain flows.
        return {
          clientId: client.id,
          // clientSecret: client.secret, // Optionally return hashed secret if needed internally
          grants: client.grants,
          redirectUris: client.redirectUris,
        };
      }
    }
    return null; // Client not found or secret mismatch
  };

  return Client;
};