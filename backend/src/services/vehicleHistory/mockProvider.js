const { registerProvider } = require('./vehicleHistoryProvider');

/**
 * Mock provider — returns plausible-looking data for development and testing.
 * Replace with a real LTO / third-party integration before going live.
 */
registerProvider('mock', {
  async fetch(identifier) {
    // Simulate network latency
    await new Promise((r) => setTimeout(r, 120));

    return {
      provider: 'mock',
      plateNumber: identifier || null,
      chassisNumber: null,
      ownerCount: 2,
      registrationHistory: [
        { date: '2021-03-15', event: 'First registration — Metro Manila LTO' },
        { date: '2022-03-10', event: 'Registration renewed' },
        { date: '2023-03-12', event: 'Registration renewed' },
        { date: '2024-03-08', event: 'Transfer of ownership recorded' },
      ],
      incidents: [],
      ownershipHistory: [
        { from: '2021-03-15', to: '2024-03-08', ownerType: 'private' },
        { from: '2024-03-08', to: null, ownerType: 'private' },
      ],
      hasLien: false,
      lienholder: null,
      fetchedAt: new Date().toISOString(),
    };
  },
});

module.exports = {};
