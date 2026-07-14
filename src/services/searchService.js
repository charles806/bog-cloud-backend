const VaultEntry = require('../models/VaultEntry');

const searchEntries = async (userId, query, options = {}) => {
  const { folderId, isFavorite, tags, limit = 50, offset = 0 } = options;
  
  const filter = { userId };
  
  if (folderId !== undefined) {
    filter.folderId = folderId === 'null' ? null : folderId;
  }
  
  if (isFavorite !== undefined) {
    filter.isFavorite = isFavorite === 'true' || isFavorite === true;
  }
  
  if (tags && tags.length > 0) {
    filter.tags = { $in: tags };
  }
  
  if (query && query.trim()) {
    const searchTerm = query.trim();
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
      .skip(offset)
      .limit(limit)
      .populate('folderId'),
    VaultEntry.countDocuments(filter)
  ]);
  
  return { entries, total, offset, limit };
};

module.exports = { searchEntries };