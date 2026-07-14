const csv = require('csv-parser');
const { Readable } = require('stream');
const { encrypt } = require('../utils/encryption');

const parseCSV = (csvData) => {
  return new Promise((resolve, reject) => {
    const results = [];
    const stream = Readable.from(csvData);
    stream
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
};

const parseJSON = (jsonData) => {
  try {
    const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
    return Array.isArray(data) ? data : [data];
  } catch (error) {
    throw new Error('Invalid JSON format');
  }
};

const importEntries = async (userId, entries, folderId = null) => {
  const imported = [];
  const errors = [];
  
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    try {
      if (!entry.siteName || !entry.password) {
        errors.push({ index: i, error: 'Missing siteName or password' });
        continue;
      }
      
      const newEntry = {
        userId,
        folderId: folderId || null,
        siteName: entry.siteName,
        username: entry.username || '',
        password: encrypt(entry.password),
        url: entry.url || '',
        notes: entry.notes ? encrypt(entry.notes) : '',
        tags: Array.isArray(entry.tags) ? entry.tags : (entry.tags ? entry.tags.split(',').map(t => t.trim()) : [])
      };
      
      const created = await VaultEntry.create(newEntry);
      imported.push(created);
    } catch (error) {
      errors.push({ index: i, error: error.message });
    }
  }
  
  return { imported, errors, total: entries.length };
};

module.exports = { parseCSV, parseJSON, importEntries };