/**
 * @file ExpenseApprovalDAO.js
 * @description Jest mock for the ExpenseApprovalDAO module.
 *              All public functions are replaced with jest.fn() stubs
 *              so User Event and other script tests can assert on calls
 *              without executing real DAO logic.
 */
module.exports = {
  sendApprovalNotification: jest.fn(),
  processApproval: jest.fn(),
  autoRejectExpense: jest.fn(),
  getPendingExpenses: jest.fn(),
};
