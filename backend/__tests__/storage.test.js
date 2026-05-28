const path = require('path');
const fs = require('fs');
const os = require('os');

// Force local provider
process.env.STORAGE_PROVIDER = 'local';
process.env.UPLOAD_DIR = os.tmpdir();

const storage = require('../src/services/storage/storageProvider');
const localProvider = require('../src/services/storage/localStorageProvider');

describe('Storage Provider', () => {
  const tmpFile = path.join(os.tmpdir(), `test-${Date.now()}.jpg`);

  beforeAll(() => {
    fs.writeFileSync(tmpFile, 'fake-image-data');
  });

  afterAll(() => {
    try { fs.unlinkSync(tmpFile); } catch { /* already deleted */ }
  });

  it('name() returns local when STORAGE_PROVIDER=local', () => {
    process.env.STORAGE_PROVIDER = 'local';
    expect(storage.name()).toBe('local');
  });

  it('localProvider.saveFile returns url, storageKey, provider', async () => {
    const mockFile = {
      filename: path.basename(tmpFile),
      path: tmpFile,
      size: 15,
    };
    const result = await localProvider.saveFile(mockFile);
    expect(result.url).toContain(mockFile.filename);
    expect(result.storageKey).toBe(mockFile.filename);
    expect(result.provider).toBe('local');
  });

  it('localProvider.deleteFile removes file', async () => {
    const file = path.join(os.tmpdir(), `del-test-${Date.now()}.txt`);
    fs.writeFileSync(file, 'data');
    process.env.UPLOAD_DIR = os.tmpdir();
    await localProvider.deleteFile(path.basename(file));
    expect(fs.existsSync(file)).toBe(false);
  });

  it('localProvider.deleteFile does not throw for missing file', async () => {
    await expect(localProvider.deleteFile('nonexistent-file-abc.jpg')).resolves.not.toThrow();
  });

  it('storage.saveFile delegates to local provider', async () => {
    const mockFile = {
      filename: path.basename(tmpFile),
      path: tmpFile,
      size: 15,
    };
    const result = await storage.saveFile(mockFile);
    expect(result.provider).toBe('local');
  });
});
