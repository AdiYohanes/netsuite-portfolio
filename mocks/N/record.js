// Mock for N/record
module.exports = {
  load: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  submitFields: jest.fn(),
  delete: jest.fn(),
  Type: {
    EXPENSE_REPORT: "expensereport",
    EMPLOYEE: "employee",
  },
};
