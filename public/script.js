const clientsTableBody = document.getElementById('clients-table-body');
const addClientForm = document.getElementById('add-client-form');
const addClientError = document.getElementById('add-client-error');
const generatedCredentialsDiv = document.getElementById('generated-credentials');
const displayClientId = document.getElementById('display-client-id');
const displayClientSecret = document.getElementById('display-client-secret');

const editClientForm = document.getElementById('edit-client-form');
const editClientIdInput = document.getElementById('edit-client-id');
const editClientNameInput = document.getElementById('edit-client-name');
const editClientRedirectUrisInput = document.getElementById('edit-client-redirect-uris');
const editClientError = document.getElementById('edit-client-error');
const cancelEditButton = document.getElementById('cancel-edit');

const addClientGrantsCheckboxesDiv = document.getElementById('add-client-grants-checkboxes');
const editClientGrantsCheckboxesDiv = document.getElementById('edit-client-grants-checkboxes');

// Define available grants (must match grants configured in OAuthServer)
const availableGrants = ['authorization_code', 'refresh_token', 'client_credentials', 'password'];

// Function to create grant checkboxes for a given container
const createGrantCheckboxes = (containerElement, formPrefix, selectedGrants = []) => {
  containerElement.innerHTML = ''; // Clear existing checkboxes
  availableGrants.forEach(grant => {
    const checkboxId = `${formPrefix}-${grant}`;
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = checkboxId;
    checkbox.name = 'grants';
    checkbox.value = grant;
    checkbox.checked = selectedGrants.includes(grant);

    const label = document.createElement('label');
    label.htmlFor = checkboxId;
    label.textContent = grant.replace(/_/g, ' '); // Make it more readable for display

    const div = document.createElement('div'); // Wrap checkbox and label for styling
    div.appendChild(checkbox);
    div.appendChild(label);
    containerElement.appendChild(div);
  });
};

// Initialize checkboxes for add form on load
document.addEventListener('DOMContentLoaded', () => {
  createGrantCheckboxes(addClientGrantsCheckboxesDiv, 'add-client-grants', availableGrants); // Default all selected for new clients
});


// Function to fetch and render the list of clients
const fetchClients = async () => {
  try {
    const response = await fetch('/api/clients');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const clients = await response.json();
    renderClients(clients);
  } catch (error) {
    console.error('Failed to fetch clients:', error);
    // Display error message to the user if needed
  }
};

// Function to render clients into the table
const renderClients = (clients) => {
  clientsTableBody.innerHTML = ''; // Clear existing rows
  clients.forEach(client => {
    const row = clientsTableBody.insertRow();
    row.insertCell().textContent = client.id;
    row.insertCell().textContent = client.name;
    row.insertCell().textContent = '********'; // Always hide the secret in the list
    row.insertCell().textContent = client.grants.join(', ');
    row.insertCell().textContent = client.redirectUris.join(', ');

    const actionsCell = row.insertCell();
    // Edit button
    const editButton = document.createElement('button');
    editButton.textContent = 'Edit';
    editButton.addEventListener('click', () => showEditForm(client));
    actionsCell.appendChild(editButton);

    // Regenerate Secret button
    const regenerateSecretButton = document.createElement('button');
    regenerateSecretButton.textContent = 'Regenerate Secret';
    regenerateSecretButton.style.backgroundColor = '#ffc107'; // Yellow/amber color
    regenerateSecretButton.style.marginLeft = '5px';
    regenerateSecretButton.addEventListener('click', () => regenerateClientSecret(client.id));
    actionsCell.appendChild(regenerateSecretButton);

    // Delete button
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.style.backgroundColor = '#dc3545';
    deleteButton.style.marginLeft = '5px';
    deleteButton.addEventListener('click', () => deleteClient(client.id));
    actionsCell.appendChild(deleteButton);
  });
};

// Event listener for adding a new client
addClientForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  addClientError.textContent = '';
  generatedCredentialsDiv.style.display = 'none'; // Hide previous generated credentials

  const clientName = document.getElementById('client-name').value.trim();
  // Get selected grants from checkboxes
  const grants = Array.from(addClientGrantsCheckboxesDiv.querySelectorAll('input[type="checkbox"]:checked'))
    .map(checkbox => checkbox.value);
  const redirectUris = document.getElementById('client-redirect-uris').value.split('\n').map(uri => uri.trim()).filter(uri => uri !== '');

  if (!clientName || grants.length === 0 || redirectUris.length === 0) {
    addClientError.textContent = 'Client Name, at least one Grant, and Redirect URIs are required.';
    return;
  }

  try {
    const response = await fetch('/api/clients', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: clientName, grants, redirectUris }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      addClientError.textContent = errorData.error || 'Failed to add client.';
      return;
    }

    const newClient = await response.json(); // Backend now returns generated ID and Plain Text Secret

    // Display generated credentials
    displayClientId.textContent = newClient.id;
    displayClientSecret.textContent = newClient.secret; // This is the plain text secret
    generatedCredentialsDiv.style.display = 'block';

    addClientForm.reset(); // Clear the form
    // Reset grants checkboxes to default (all selected) for the next creation
    createGrantCheckboxes(addClientGrantsCheckboxesDiv, 'add-client-grants', availableGrants);
    fetchClients(); // Refresh the client list
  } catch (error) {
    console.error('Error adding client:', error);
    addClientError.textContent = 'An unexpected error occurred while adding the client.';
  }
});

// Function to populate and show the edit form
const showEditForm = (client) => {
  editClientForm.style.display = 'block';
  editClientIdInput.value = client.id;
  editClientNameInput.value = client.name;
  // No secret input in edit form
  createGrantCheckboxes(editClientGrantsCheckboxesDiv, 'edit-client-grants', client.grants); // Populate grants
  editClientRedirectUrisInput.value = client.redirectUris.join('\n');
  editClientError.textContent = '';
};

// Event listener for updating a client
editClientForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  editClientError.textContent = '';

  const clientId = editClientIdInput.value;
  const clientName = editClientNameInput.value.trim();
  // Get selected grants from checkboxes for edit form
  const grants = Array.from(editClientGrantsCheckboxesDiv.querySelectorAll('input[type="checkbox"]:checked'))
    .map(checkbox => checkbox.value);
  const redirectUris = editClientRedirectUrisInput.value.split('\n').map(uri => uri.trim()).filter(uri => uri !== '');

  if (!clientName || grants.length === 0 || redirectUris.length === 0) {
    editClientError.textContent = 'Client Name, at least one Grant, and Redirect URIs are required for update.';
    return;
  }

  try {
    const response = await fetch(`/api/clients/${clientId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: clientName, grants, redirectUris }), // Secret is not sent here
    });

    if (!response.ok) {
      const errorData = await response.json();
      editClientError.textContent = errorData.error || 'Failed to update client.';
      return;
    }

    editClientForm.style.display = 'none';
    fetchClients();
  } catch (error) {
    console.error('Error updating client:', error);
    editClientError.textContent = 'An unexpected error occurred while updating the client.';
  }
});

// Function to handle regenerating the client secret
const regenerateClientSecret = async (clientId) => {
  if (window.confirm(`Are you sure you want to regenerate the secret for client ID "${clientId}"? The old secret will be lost and cannot be recovered.`)) {
    try {
      const response = await fetch(`/api/clients/${clientId}/regenerate-secret`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to regenerate secret:', errorData.error || response.status);
        // Use a custom message box instead of alert in a real app
        alert('Failed to regenerate client secret. Check console for details.');
        return;
      }

      const data = await response.json();
      displayClientId.textContent = clientId;
      displayClientSecret.textContent = data.secret; // This is the new plain text secret
      generatedCredentialsDiv.querySelector('h3').textContent = 'New Client Secret Generated!';
      generatedCredentialsDiv.querySelector('p:first-of-type').textContent = 'Please save this new secret, it will not be shown again:';
      generatedCredentialsDiv.style.display = 'block';
    } catch (error) {
      console.error('Error regenerating client secret:', error);
      alert('An unexpected error occurred while regenerating the client secret.');
    }
  }
};


// Function to delete a client
const deleteClient = async (clientId) => {
  if (window.confirm(`Are you sure you want to delete client "${clientId}"? This action cannot be undone.`)) {
    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to delete client:', errorData.error || response.status);
        alert('Failed to delete client. Check console for details.');
        return;
      }

      fetchClients();
    } catch (error) {
      console.error('Error deleting client:', error);
      alert('An unexpected error occurred while deleting the client.');
    }
  }
};

// Event listener for canceling edit
cancelEditButton.addEventListener('click', () => {
  editClientForm.style.display = 'none';
  editClientError.textContent = '';
});

// Copy to clipboard functionality
document.querySelectorAll('.copy-button').forEach(button => {
  button.addEventListener('click', () => {
    const targetId = button.dataset.target;
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      const textToCopy = targetElement.textContent;
      // Using document.execCommand('copy') for better iframe compatibility
      const tempInput = document.createElement('textarea');
      tempInput.value = textToCopy;
      document.body.appendChild(tempInput);
      tempInput.select();
      try {
        document.execCommand('copy');
        button.textContent = 'Copied!';
        setTimeout(() => {
          button.textContent = 'Copy';
        }, 2000);
      } catch (err) {
        console.error('Failed to copy text: ', err);
        button.textContent = 'Error!';
      }
      document.body.removeChild(tempInput);
    }
  });
});


// Initial load of clients when the page loads
document.addEventListener('DOMContentLoaded', fetchClients);