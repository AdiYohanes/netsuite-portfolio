// Mock for N/runtime
module.exports = {
  getCurrentUser: jest.fn(),
  getCurrentSession: jest.fn(),
  isFeatureInEffect: jest.fn(),
  accountId: "TSTDRV123456",
  EnvType: {
    SANDBOX: "SANDBOX",
    PRODUCTION: "PRODUCTION",
  },
  ContextType: {
    USER_INTERFACE: "UI",
    SCHEDULED: "SCHEDULED",
    WEBSERVICES: "WEBSERVICES",
  },
};
