module.exports = {
  testEnvironment: "node",
  // Memberitahu Jest di mana mencari file test
  testMatch: ["**/tests/**/*.test.js"],
  // Setup file untuk memalsukan fungsi 'define' agar tidak error di Node.js
  setupFiles: ["<rootDir>/jest.setup.js"],
  moduleNameMapper: {
    // Memetakan require 'N/log' ke file mock kita
    "^N/log$": "<rootDir>/mocks/N/log.js",
    "^N/ui/dialog$": "<rootDir>/mocks/N/ui.js",
  },
};
