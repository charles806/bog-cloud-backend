const VaultEntry = require('../models/VaultEntry');
const VaultFolder = require('../models/VaultFolder');
const { encrypt, decrypt } = require('../utils/encryption');
const crypto = require('crypto');
const { broadcastUpdate } = require('../websocket/syncSocket');
const { pushChange } = require('../services/syncService');

// ===================== HELPER FUNCTIONS =====================

const checkStrength = (password) => {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  return Math.min(4, score);
};

const generatePassword = (length = 24, includeSpecial = true) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const specials = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  const all = chars + (includeSpecial ? specials : '');
  let password = '';
  for (let i = 0; i < length; i++) {
    password += all.charAt(crypto.randomInt(all.length));
  }
  return password;
};

// ===================== VAULT ENTRY CRUD =====================

const createEntry = async (req, res) => {
  try {
    const { siteName, username, password, url, notes, folderId, tags, isFavorite, deviceId = 'web' } = req.body;
    const userId = req.user._id;

    if (!siteName || !password) {
      return res.status(400).json({
        success: false,
        message: 'Site name and password are required'
      });
    }

    const encryptedPassword = encrypt(password);
    const encryptedNotes = notes ? encrypt(notes) : '';

    const entry = await VaultEntry.create({
      userId,
      folderId: folderId || null,
      siteName,
      username: username || '',
      password: encryptedPassword,
      url: url || '',
      notes: encryptedNotes,
      tags: tags || [],
      isFavorite: isFavorite || false,
      strength: checkStrength(password)
    });

    // Sync: Push change to all devices
    await pushChange(
      userId,
      deviceId,
      'password_created',
      'password',
      entry._id,
      { siteName: entry.siteName, username: entry.username }
    );
    broadcastUpdate(userId, 'password_created', 'password', entry._id, { siteName: entry.siteName });

    res.status(201).json({
      success: true,
      message: 'Password saved successfully',
      data: entry
    });
  } catch (error) {
    console.error('Create entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const getEntries = async (req, res) => {
  try {
    const userId = req.user._id;
    const { folderId } = req.query;
    const filter = { userId };
    if (folderId !== undefined && folderId !== 'null') {
      filter.folderId = folderId;
    } else if (folderId === 'null') {
      filter.folderId = null;
    }

    const entries = await VaultEntry.find(filter)
      .sort({ isFavorite: -1, updatedAt: -1 })
      .populate('folderId');

    res.status(200).json({
      success: true,
      message: 'Entries retrieved successfully',
      data: entries
    });
  } catch (error) {
    console.error('Get entries error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const getEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const entry = await VaultEntry.findOne({ _id: id, userId: req.user._id }).populate('folderId');
    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Entry not found'
      });
    }
    res.status(200).json({
      success: true,
      message: 'Entry retrieved successfully',
      data: entry
    });
  } catch (error) {
    console.error('Get entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const updateEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const { siteName, username, password, url, notes, folderId, tags, isFavorite, deviceId = 'web' } = req.body;
    const entry = await VaultEntry.findOne({ _id: id, userId: req.user._id });
    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Entry not found'
      });
    }

    if (siteName) entry.siteName = siteName;
    if (username !== undefined) entry.username = username;
    if (password) {
      if (!entry.passwordHistory) entry.passwordHistory = [];
      entry.passwordHistory.push({ password: entry.password });
      if (entry.passwordHistory.length > 10) {
        entry.passwordHistory = entry.passwordHistory.slice(-10);
      }
      entry.password = encrypt(password);
      entry.strength = checkStrength(password);
    }
    if (url !== undefined) entry.url = url;
    if (notes !== undefined) entry.notes = notes ? encrypt(notes) : '';
    if (folderId !== undefined) entry.folderId = folderId;
    if (tags !== undefined) entry.tags = tags;
    if (isFavorite !== undefined) entry.isFavorite = isFavorite;

    await entry.save();

    // Sync: Push change to all devices
    await pushChange(
      req.user._id,
      deviceId,
      'password_updated',
      'password',
      entry._id,
      { siteName: entry.siteName, username: entry.username }
    );
    broadcastUpdate(req.user._id, 'password_updated', 'password', entry._id, { siteName: entry.siteName });

    res.status(200).json({
      success: true,
      message: 'Entry updated successfully',
      data: entry
    });
  } catch (error) {
    console.error('Update entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const deleteEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const { deviceId = 'web' } = req.body;
    const entry = await VaultEntry.findOneAndDelete({ _id: id, userId: req.user._id });
    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Entry not found'
      });
    }

    // Sync: Push change to all devices
    await pushChange(
      req.user._id,
      deviceId,
      'password_deleted',
      'password',
      entry._id,
      { siteName: entry.siteName }
    );
    broadcastUpdate(req.user._id, 'password_deleted', 'password', entry._id, { siteName: entry.siteName });

    res.status(200).json({
      success: true,
      message: 'Entry deleted successfully'
    });
  } catch (error) {
    console.error('Delete entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ===================== FOLDER CRUD =====================

const createFolder = async (req, res) => {
  try {
    const { name, parentFolderId, deviceId = 'web' } = req.body;
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Folder name is required'
      });
    }

    const folder = await VaultFolder.create({
      userId: req.user._id,
      name,
      parentFolderId: parentFolderId || null
    });

    // Sync: Push change to all devices
    await pushChange(
      req.user._id,
      deviceId,
      'folder_created',
      'folder',
      folder._id,
      { name: folder.name }
    );
    broadcastUpdate(req.user._id, 'folder_created', 'folder', folder._id, { name: folder.name });

    res.status(201).json({
      success: true,
      message: 'Folder created successfully',
      data: folder
    });
  } catch (error) {
    console.error('Create folder error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const getFolders = async (req, res) => {
  try {
    const folders = await VaultFolder.find({ userId: req.user._id })
      .sort({ name: 1 });
    res.status(200).json({
      success: true,
      message: 'Folders retrieved successfully',
      data: folders
    });
  } catch (error) {
    console.error('Get folders error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const deleteFolder = async (req, res) => {
  try {
    const { id } = req.params;
    const { deviceId = 'web' } = req.body;
    const folder = await VaultFolder.findOneAndDelete({ _id: id, userId: req.user._id });
    if (!folder) {
      return res.status(404).json({
        success: false,
        message: 'Folder not found'
      });
    }
    await VaultEntry.updateMany({ folderId: id }, { folderId: null });

    // Sync: Push change to all devices
    await pushChange(
      req.user._id,
      deviceId,
      'folder_deleted',
      'folder',
      folder._id,
      { name: folder.name }
    );
    broadcastUpdate(req.user._id, 'folder_deleted', 'folder', folder._id, { name: folder.name });

    res.status(200).json({
      success: true,
      message: 'Folder deleted successfully'
    });
  } catch (error) {
    console.error('Delete folder error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ===================== MOVE ENTRY =====================

const moveEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const { folderId, deviceId = 'web' } = req.body;
    const entry = await VaultEntry.findOne({ _id: id, userId: req.user._id });
    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Entry not found'
      });
    }
    entry.folderId = folderId || null;
    await entry.save();

    // Sync: Push change to all devices
    await pushChange(
      req.user._id,
      deviceId,
      'password_updated',
      'password',
      entry._id,
      { siteName: entry.siteName, folderId: entry.folderId }
    );
    broadcastUpdate(req.user._id, 'password_updated', 'password', entry._id, { siteName: entry.siteName });

    res.status(200).json({
      success: true,
      message: 'Entry moved successfully',
      data: entry
    });
  } catch (error) {
    console.error('Move entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ===================== FAVORITES =====================
const toggleFavorite = async (req, res) => {
  try {
    const { id } = req.params;

    const entry = await VaultEntry.findOne({ _id: id, userId: req.user._id });
    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Entry not found'
      });
    }

    entry.isFavorite = !entry.isFavorite;
    await entry.save();

    res.status(200).json({
      success: true,
      message: `Favorite ${entry.isFavorite ? 'added' : 'removed'}`,
      data: entry
    });

  } catch (error) {
    console.error('Toggle favorite error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const getFavorites = async (req, res) => {
  try {
    const entries = await VaultEntry.find({
      userId: req.user._id,
      isFavorite: true
    }).sort({ updatedAt: -1 });
    res.status(200).json({
      success: true,
      message: 'Favorites retrieved',
      data: entries
    });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ===================== SEARCH =====================

const searchEntries = async (req, res) => {
  try {
    const { q, folderId, isFavorite, tags, limit = 50, offset = 0 } = req.query;
    const filter = { userId: req.user._id };

    if (folderId !== undefined && folderId !== 'null') {
      filter.folderId = folderId;
    } else if (folderId === 'null') {
      filter.folderId = null;
    }

    if (isFavorite !== undefined) {
      filter.isFavorite = isFavorite === 'true' || isFavorite === true;
    }

    if (tags && tags.length > 0) {
      const tagArray = tags.split(',');
      filter.tags = { $in: tagArray };
    }

    if (q && q.trim()) {
      const searchTerm = q.trim();
      filter.$or = [
        { siteName: { $regex: searchTerm, $options: 'i' } },
        { username: { $regex: searchTerm, $options: 'i' } },
        { url: { $regex: searchTerm, $options: 'i' } },
        { tags: { $in: [new RegExp(searchTerm, 'i')] } }
      ];
    }

    const [entries, total] = await Promise.all([
      VaultEntry.find(filter)
        .sort({ isFavorite: -1, updatedAt: -1 })
        .skip(parseInt(offset))
        .limit(parseInt(limit))
        .populate('folderId'),
      VaultEntry.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      message: 'Search results',
      data: { entries, total, offset, limit }
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ===================== BULK OPERATIONS =====================

const bulkDelete = async (req, res) => {
  try {
    const { entryIds, deviceId = 'web' } = req.body;
    if (!entryIds || !Array.isArray(entryIds) || entryIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Entry IDs required'
      });
    }
    const result = await VaultEntry.deleteMany({
      _id: { $in: entryIds },
      userId: req.user._id
    });

    // Sync: Push change to all devices
    await pushChange(
      req.user._id,
      deviceId,
      'password_deleted',
      'password',
      entryIds[0],
      { count: result.deletedCount }
    );
    broadcastUpdate(req.user._id, 'password_deleted', 'password', entryIds[0], { count: result.deletedCount });

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} entries deleted`
    });
  } catch (error) {
    console.error('Bulk delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const bulkMove = async (req, res) => {
  try {
    const { entryIds, folderId, deviceId = 'web' } = req.body;
    if (!entryIds || !Array.isArray(entryIds) || entryIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Entry IDs required'
      });
    }
    const result = await VaultEntry.updateMany(
      { _id: { $in: entryIds }, userId: req.user._id },
      { folderId: folderId || null }
    );

    // Sync: Push change to all devices
    await pushChange(
      req.user._id,
      deviceId,
      'password_updated',
      'password',
      entryIds[0],
      { count: result.modifiedCount, folderId }
    );
    broadcastUpdate(req.user._id, 'password_updated', 'password', entryIds[0], { count: result.modifiedCount });

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} entries moved`
    });
  } catch (error) {
    console.error('Bulk move error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ===================== IMPORT / EXPORT =====================

const importEntries = async (req, res) => {
  try {
    const { format, data, folderId, deviceId = 'web' } = req.body;

    if (!data) {
      return res.status(400).json({
        success: false,
        message: 'Data required'
      });
    }

    let parsed;
    if (format === 'json') {
      parsed = typeof data === 'string' ? JSON.parse(data) : data;
      if (!Array.isArray(parsed)) parsed = [parsed];
    } else {
      return res.status(400).json({
        success: false,
        message: 'Format must be json'
      });
    }

    const imported = [];
    const errors = [];
    for (let i = 0; i < parsed.length; i++) {
      const entry = parsed[i];
      try {
        if (!entry.siteName || !entry.password) {
          errors.push({ index: i, error: 'Missing siteName or password' });
          continue;
        }
        const newEntry = await VaultEntry.create({
          userId: req.user._id,
          folderId: folderId || null,
          siteName: entry.siteName,
          username: entry.username || '',
          password: encrypt(entry.password),
          url: entry.url || '',
          notes: entry.notes ? encrypt(entry.notes) : '',
          tags: Array.isArray(entry.tags) ? entry.tags : (entry.tags ? entry.tags.split(',').map(t => t.trim()) : []),
          isFavorite: entry.isFavorite || false
        });
        imported.push(newEntry);
      } catch (error) {
        errors.push({ index: i, error: error.message });
      }
    }

    // Sync: Push change to all devices
    if (imported.length > 0) {
      await pushChange(
        req.user._id,
        deviceId,
        'password_created',
        'password',
        imported[0]._id,
        { count: imported.length }
      );
      broadcastUpdate(req.user._id, 'password_created', 'password', imported[0]._id, { count: imported.length });
    }

    res.status(200).json({
      success: true,
      message: `Imported ${imported.length} entries`,
      data: { imported, errors, total: parsed.length }
    });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

const exportEntries = async (req, res) => {
  try {
    const { format = 'json' } = req.query;
    const entries = await VaultEntry.find({ userId: req.user._id });

    if (format === 'json') {
      const data = entries.map(entry => ({
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
      res.status(200).json({
        success: true,
        data
      });
    } else if (format === 'csv') {
      let csv = 'Site Name,Username,Password,URL,Notes,Tags,Favorite,Created At,Updated At\n';
      entries.forEach(entry => {
        const row = [
          entry.siteName,
          entry.username || '',
          decrypt(entry.password),
          entry.url || '',
          entry.notes ? decrypt(entry.notes) : '',
          (entry.tags || []).join('; '),
          entry.isFavorite ? 'Yes' : 'No',
          entry.createdAt.toISOString(),
          entry.updatedAt.toISOString()
        ];
        csv += row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',') + '\n';
      });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=passwords.csv');
      res.status(200).send(csv);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Format must be json or csv'
      });
    }
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ===================== PASSWORD HISTORY =====================

const getPasswordHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const entry = await VaultEntry.findOne({ _id: id, userId: req.user._id });
    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Entry not found'
      });
    }
    const history = entry.passwordHistory || [];
    const decryptedHistory = history.map(item => ({
      ...item,
      password: decrypt(item.password)
    }));
    res.status(200).json({
      success: true,
      message: 'Password history retrieved',
      data: decryptedHistory
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ===================== UTILITIES =====================

const generate = async (req, res) => {
  try {
    const length = parseInt(req.query.length) || 24;
    const includeSpecial = req.query.special !== 'false';
    const password = generatePassword(length, includeSpecial);
    res.status(200).json({
      success: true,
      message: 'Password generated',
      data: { password, strength: checkStrength(password) }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

const checkStrengthController = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password required'
      });
    }
    const score = checkStrength(password);
    const labels = ['Weak', 'Weak', 'Medium', 'Strong', 'Very Strong'];
    res.status(200).json({
      success: true,
      data: {
        strength: score,
        label: labels[score],
        score
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

// ===================== EXPORTS =====================

module.exports = {
  createEntry,
  getEntries,
  getEntry,
  updateEntry,
  deleteEntry,
  createFolder,
  getFolders,
  deleteFolder,
  moveEntry,
  toggleFavorite,
  getFavorites,
  searchEntries,
  bulkDelete,
  bulkMove,
  importEntries,
  exportEntries,
  getPasswordHistory,
  generate,
  checkStrengthController
};