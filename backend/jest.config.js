module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  globalSetup: './jest.globalSetup.js',
  setupFiles: ['./jest.setup.js'],
};
