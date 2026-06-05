// Mock for N/search
module.exports = {
  create: jest.fn(),
  load: jest.fn(),
  lookupFields: jest.fn(),
  createColumn: jest.fn((opts) => opts),
  createFilter: jest.fn((opts) => opts),
  Type: {
    EXPENSE_REPORT: "expensereport",
    EMPLOYEE: "employee",
  },
  Operator: {
    IS: "is",
    EQUALTO: "equalto",
    GREATERTHAN: "greaterthan",
    LESSTHAN: "lessthan",
    CONTAINS: "contains",
    STARTSWITH: "startswith",
    ANYOF: "anyof",
  },
  Summary: {
    COUNT: "COUNT",
    SUM: "SUM",
    MAX: "MAX",
    MIN: "MIN",
    AVG: "AVG",
  },
};
