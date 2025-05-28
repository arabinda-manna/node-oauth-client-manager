// routes/clientRoutes.js
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto'); // Still needed for generating random strings
const db = require('../models'); // Import Sequelize models

// Helper function to generate a random client secret (plain text)
const generatePlainClientSecret = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

// GET /api/clients: List all registered OAuth clients.
router.get('/', async (req, res) => {
  try {
    const clients = await db.Client.findAll();
    // When sending to frontend, do NOT send the actual secret (hashed or plain)
    const clientsForDisplay = clients.map(client => ({
      id: client.id,
      name: client.name,
      // secret: client.secret, // Explicitly omitted for security
      grants: client.grants,
      redirectUris: client.redirectUris,
    }));
    res.json(clientsForDisplay);
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

// POST /api/clients: Create a new OAuth client.
// Takes 'name' as input, auto-generates 'id' and 'secret'.
router.post('/', async (req, res) => {
  const { name, grants, redirectUris } = req.body;

  if (!name || !Array.isArray(grants) || !Array.isArray(redirectUris)) {
    return res.status(400).json({ error: 'Invalid client data. Required: name (string), grants (array of strings), redirectUris (array of strings)' });
  }

  try {
    const clientId = uuidv4();
    const plainClientSecret = generatePlainClientSecret(); // Generate plain text secret
    const hashedClientSecret = db.Client.hashClientSecret(plainClientSecret); // Hash it for storage

    const newClient = await db.Client.create({
      id: clientId,
      name: name,
      secret: hashedClientSecret, // Store the HASHED secret
      grants: grants,
      redirectUris: redirectUris
    });

    // Return the plain text secret to the frontend ONLY ONCE at creation
    res.status(201).json({
      id: newClient.id,
      name: newClient.name,
      secret: plainClientSecret, // Return PLAIN TEXT secret for initial display
      grants: newClient.grants,
      redirectUuris: newClient.redirectUris
    });
  } catch (error) {
    console.error('Error creating client:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      res.status(409).json({ error: 'Client name already exists. Please choose a different name.' });
    } else {
      res.status(500).json({ error: 'Failed to create client' });
    }
  }
});

// PUT /api/clients/:clientId: Update an existing OAuth client.
// This endpoint allows updating name, grants, and redirectUris.
// Secret is NOT updated via this route; it must be regenerated via a separate endpoint.
router.put('/:clientId', async (req, res) => {
  const clientIdToUpdate = req.params.clientId;
  const { name, grants, redirectUris } = req.body;

  const updateFields = {};
  if (name !== undefined) updateFields.name = name;
  if (grants !== undefined && Array.isArray(grants)) updateFields.grants = grants;
  if (redirectUris !== undefined && Array.isArray(redirectUris)) updateFields.redirectUris = redirectUris;

  if (Object.keys(updateFields).length === 0) {
    return res.status(400).json({ error: 'No valid fields provided for update.' });
  }

  try {
    const [updatedRows] = await db.Client.update(
      updateFields,
      { where: { id: clientIdToUpdate } }
    );
    if (updatedRows) {
      const updatedClient = await db.Client.findByPk(clientIdToUpdate);
      // Do not send the secret back on update
      res.json({
        id: updatedClient.id,
        name: updatedClient.name,
        grants: updatedClient.grants,
        redirectUris: updatedClient.redirectUris
      });
    } else {
      res.status(404).json({ error: 'Client not found' });
    }
  } catch (error) {
    console.error('Error updating client:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      res.status(409).json({ error: 'Client name already exists. Please choose a different name.' });
    } else {
      res.status(500).json({ error: 'Failed to update client' });
    }
  }
});

// POST /api/clients/:clientId/regenerate-secret: Regenerate a client secret.
router.post('/:clientId/regenerate-secret', async (req, res) => {
  const { clientId } = req.params;
  try {
    const plainNewSecret = generatePlainClientSecret(); // Generate new plain text secret
    const hashedNewSecret = db.Client.hashClientSecret(plainNewSecret); // Hash it for storage

    const [updatedRows] = await db.Client.update(
      { secret: hashedNewSecret }, // Store the HASHED new secret
      { where: { id: clientId } }
    );
    if (updatedRows) {
      res.status(200).json({ secret: plainNewSecret }); // Return the PLAIN TEXT new secret to frontend
    } else {
      res.status(404).json({ error: 'Client not found' });
    }
  } catch (error) {
    console.error('Error regenerating client secret:', error);
    res.status(500).json({ error: 'Failed to regenerate client secret' });
  }
});

// DELETE /api/clients/:clientId: Delete an OAuth client.
router.delete('/:clientId', async (req, res) => {
  const { clientId } = req.params;
  try {
    const deletedRows = await db.Client.destroy({ where: { id: clientId } });
    if (deletedRows) {
      res.status(204).send();
    } else {
      res.status(404).json({ error: 'Client not found' });
    }
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({ error: 'Failed to delete client' });
  }
});

module.exports = router;