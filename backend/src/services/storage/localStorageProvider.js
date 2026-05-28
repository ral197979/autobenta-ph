const path = require('path');
const fs = require('fs');

const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';

module.exports = {
  async saveFile(file) {
    // multer already wrote the file to disk; just build the public URL
    const url = `/uploads/${file.filename}`;
    return {
      url,
      storageKey: file.filename,
      provider: 'local',
    };
  },

  async deleteFile(storageKey) {
    const filePath = path.resolve(UPLOAD_DIR, storageKey);
    try {
      fs.unlinkSync(filePath);
    } catch {
      // file already gone — fine
    }
  },
};
