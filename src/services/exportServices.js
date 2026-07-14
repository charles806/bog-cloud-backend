const VaultEntry = require('../models/VaultEntry');
const { decrypt } = require('../utils/encryption');

const exportToJSON = async (userId) => {
  const entries = await VaultEntry.find({ userId });
  return entries.map(entry => ({
    siteName: entry.siteName,
    username: entry.username,
    password: decrypt(entry.password),
    url: entry.url,
    notes: entry.notes ? decrypt(entry.notes) : '',
    tags: entry.tags,
    isFavorite: entry.isFavorite,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt
  }));
};

const exportToCSV = async (userId) => {
  const entries = await VaultEntry.find({ userId });
  const headers = ['Site Name', 'Username', 'Password', 'URL', 'Notes', 'Tags', 'Favorite', 'Created At', 'Updated At'];
  const rows = entries.map(entry => [
    entry.siteName,
    entry.username || '',
    decrypt(entry.password),
    entry.url || '',
    entry.notes ? decrypt(entry.notes) : '',
    (entry.tags || []).join(', '),
    entry.isFavorite ? 'Yes' : 'No',
    entry.createdAt.toISOString(),
    entry.updatedAt.toISOString()
  ]);
  return { headers, rows };
};

module.exports = { exportToJSON, exportToCSV };