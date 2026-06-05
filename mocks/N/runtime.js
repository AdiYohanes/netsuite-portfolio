// Mock for N/runtime
module.exports = {
  getCurrentUser: jest.fn(),
  getCurrentSession: jest.fn(),
  getCurrentScript: jest.fn().mockReturnValue({
    getParameter: jest.fn().mockReturnValue(null),
    id: 'customscript_mock',
    deploymentId: 'customdeploy_mock',
    getRemainingUsage: jest.fn().mockReturnValue(1000)
  }),
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
