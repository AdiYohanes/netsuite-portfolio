module.exports = {
  create: jest.fn().mockImplementation((options) => {
      return new Error(options.message || 'Custom SuiteScript Error');
  })
};
