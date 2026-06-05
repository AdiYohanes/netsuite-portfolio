module.exports = {
  testEnvironment: "node",

  // Match all test files under any projects/ subfolder, or the legacy tests/ folder
  testMatch: ["**/projects/**/tests/**/*.test.js", "**/tests/**/*.test.js"],

  // Global AMD define() polyfill
  setupFiles: ["<rootDir>/jest.setup.js"],

  // Map NetSuite bare module IDs to root-level mock files.
  // Project-local mocks (projects/**/mocks/N/*.js) re-export these same files
  // so require('../mocks/N/record') in tests resolves to the same instance.
  moduleNameMapper: {
    "^N/log$": "<rootDir>/mocks/N/log.js",
    "^N/ui/dialog$": "<rootDir>/mocks/N/ui.js",
    "^N/record$": "<rootDir>/mocks/N/record.js",
    "^N/search$": "<rootDir>/mocks/N/search.js",
    "^N/runtime$": "<rootDir>/mocks/N/runtime.js",
    "^N/email$": "<rootDir>/mocks/N/email.js",
    "^N/https$": "<rootDir>/mocks/N/https.js",
    "^N/error$": "<rootDir>/mocks/N/error.js",
    // Map the relative AMD dep ../modules/ExpenseApprovalDAO used inside
    // approve_expenses_ue.js to the project-local mock with jest.fn() stubs
    "\\.\\./modules/ExpenseApprovalDAO$":
      "<rootDir>/projects/expense-approval-system/mocks/ExpenseApprovalDAO.js",
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
