module.exports = {
  testEnvironment: "node",

  // Match all test files under any projects/ subfolder, or the legacy tests/ folder
  testMatch: ["**/projects/**/tests/**/*.test.js", "**/tests/**/*.test.js"],

  // Global AMD define() polyfill
  setupFiles: ["<rootDir>/jest.setup.js"],

  // Map NetSuite module imports to mocks
  moduleNameMapper: {
    "^N/log$": "<rootDir>/mocks/N/log.js",
    "^N/ui/dialog$": "<rootDir>/mocks/N/ui.js",
    // Add new mocks here as the portfolio grows:
    // "^N/record$":     "<rootDir>/mocks/N/record.js",
    // "^N/search$":     "<rootDir>/mocks/N/search.js",
    // "^N/runtime$":    "<rootDir>/mocks/N/runtime.js",
    // "^N/redirect$":   "<rootDir>/mocks/N/redirect.js",
    // "^N/email$":      "<rootDir>/mocks/N/email.js",
  },

  // Coverage collection covers all projects
  collectCoverageFrom: [
    "projects/**/src/**/*.js",
    "src/**/*.js",
    "!**/node_modules/**",
  ],

  // Group coverage output by project
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "clover"],
};
