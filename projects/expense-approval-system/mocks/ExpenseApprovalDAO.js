// Mock for ExpenseApprovalDAO module
module.exports = {
  sendApprovalNotification: jest.fn(),
  processApproval: jest.fn(),
  autoRejectExpense: jest.fn(),
  getPendingExpenses: jest.fn(),
};
