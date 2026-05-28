/**
 * Storage provider interface. Both implementations must expose this shape.
 * Selected via STORAGE_PROVIDER env var: 'local' (default) | 'r2'
 */

const localProvider = require('./localStorageProvider');
const r2Provider = require('./r2StorageProvider');

function getProvider() {
  const name = process.env.STORAGE_PROVIDER || 'local';
  if (name === 'r2') return r2Provider;
  return localProvider;
}

module.exports = {
  /**
   * Save a file from multer req.file to persistent storage.
   * Returns { url, storageKey, provider }
   */
  async saveFile(file) {
    return getProvider().saveFile(file);
  },

  /**
   * Delete a file by its storageKey.
   */
  async deleteFile(storageKey) {
    return getProvider().deleteFile(storageKey);
  },

  /**
   * Return provider name ('local' | 'r2').
   */
  name() {
    return process.env.STORAGE_PROVIDER || 'local';
  },
};
