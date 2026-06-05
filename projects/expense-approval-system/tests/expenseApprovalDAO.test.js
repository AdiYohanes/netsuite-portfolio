/**
 * Unit tests for ExpenseApprovalDAO
 */

// Mock dependencies
const recordMock = require("../mocks/N/record");
const emailMock = require("../mocks/N/email");
const runtimeMock = require("../mocks/N/runtime");
const logMock = require("../mocks/N/log");
const searchMock = require("../mocks/N/search");

// Load DAO module — AMD define() is intercepted by jest.setup.js polyfill,
// which executes the factory and stores the result in global.__ssModule.
require("../src/modules/ExpenseApprovalDAO");
const ExpenseApprovalDAO = global.__ssModule;

describe("ExpenseApprovalDAO", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks
    runtimeMock.getCurrentUser.mockReturnValue({ id: 123 });
    recordMock.load.mockReturnValue({
      getValue: jest.fn((params) => {
        const mockData = {
          entityid: "John Doe",
          supervisor: 456,
          email: "manager@company.com",
          total: 1000000,
        };
        return mockData[params.fieldId] || null;
      }),
    });
  });

  describe("sendApprovalNotification", () => {
    it("should send email to manager when all data is valid", () => {
      const params = {
        employeeId: 789,
        expenseId: 1001,
        amount: 500000,
        record: {},
      };

      ExpenseApprovalDAO.sendApprovalNotification(params);

      expect(emailMock.send).toHaveBeenCalledWith(
        expect.objectContaining({
          recipients: "manager@company.com",
          subject: expect.stringContaining("Expense Approval Required"),
        }),
      );
      expect(logMock.audit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Approval Notification Sent",
        }),
      );
    });

    it("should log warning when employee has no supervisor", () => {
      recordMock.load.mockReturnValue({
        getValue: jest.fn((params) => {
          if (params.fieldId === "supervisor") return null;
          return "John Doe";
        }),
      });

      const params = {
        employeeId: 789,
        expenseId: 1001,
        amount: 500000,
        record: {},
      };

      ExpenseApprovalDAO.sendApprovalNotification(params);

      expect(logMock.warning).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "No Manager Found",
        }),
      );
      expect(emailMock.send).not.toHaveBeenCalled();
    });

    it("should log warning when manager has no email", () => {
      recordMock.load
        .mockReturnValueOnce({
          getValue: jest.fn((params) => {
            if (params.fieldId === "supervisor") return 456;
            return "John Doe";
          }),
        })
        .mockReturnValueOnce({
          getValue: jest.fn((params) => {
            if (params.fieldId === "email") return null;
            return "Manager Name";
          }),
        });

      const params = {
        employeeId: 789,
        expenseId: 1001,
        amount: 500000,
        record: {},
      };

      ExpenseApprovalDAO.sendApprovalNotification(params);

      expect(logMock.warning).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "No Manager Email",
        }),
      );
      expect(emailMock.send).not.toHaveBeenCalled();
    });

    it("should catch and log error without throwing", () => {
      recordMock.load.mockImplementation(() => {
        throw new Error("Database error");
      });

      const params = {
        employeeId: 789,
        expenseId: 1001,
        amount: 500000,
        record: {},
      };

      expect(() => {
        ExpenseApprovalDAO.sendApprovalNotification(params);
      }).not.toThrow();

      expect(logMock.error).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Error in sendApprovalNotification",
        }),
      );
    });
  });

  describe("processApproval", () => {
    it("should update expense status to APPROVED", () => {
      const mockExpenseRecord = {
        setValue: jest.fn(),
        save: jest.fn(),
        getValue: jest.fn((params) => {
          const mockData = {
            entityid: 789,
            total: 1000000,
          };
          return mockData[params.fieldId];
        }),
      };
      const mockEmployeeRecord = {
        getValue: jest.fn((params) => {
          const mockData = {
            email: "employee@company.com",
          };
          return mockData[params.fieldId] || null;
        }),
      };
      // First call: load expense record; second call: load employee record for notification
      recordMock.load
        .mockReturnValueOnce(mockExpenseRecord)
        .mockReturnValueOnce(mockEmployeeRecord);

      const params = {
        expenseId: 1001,
        action: "APPROVE",
        notes: "Approved by manager",
        approverId: 456,
      };

      ExpenseApprovalDAO.processApproval(params);

      expect(mockExpenseRecord.setValue).toHaveBeenCalledWith(
        expect.objectContaining({
          fieldId: "custbody_approval_status",
          value: "APPROVED",
        }),
      );
      expect(mockExpenseRecord.save).toHaveBeenCalled();
      expect(emailMock.send).toHaveBeenCalled();
    });

    it("should update expense status to REJECTED", () => {
      const mockRecord = {
        setValue: jest.fn(),
        save: jest.fn(),
        getValue: jest.fn((params) => {
          const mockData = {
            entityid: 789,
            total: 1000000,
          };
          return mockData[params.fieldId];
        }),
      };
      recordMock.load.mockReturnValue(mockRecord);

      const params = {
        expenseId: 1001,
        action: "REJECT",
        notes: "Rejected: invalid receipt",
        approverId: 456,
      };

      ExpenseApprovalDAO.processApproval(params);

      expect(mockRecord.setValue).toHaveBeenCalledWith(
        expect.objectContaining({
          fieldId: "custbody_approval_status",
          value: "REJECTED",
        }),
      );
    });

    it("should throw error if record load fails", () => {
      recordMock.load.mockImplementation(() => {
        throw new Error("Record not found");
      });

      const params = {
        expenseId: 9999,
        action: "APPROVE",
        notes: "Test",
        approverId: 456,
      };

      expect(() => {
        ExpenseApprovalDAO.processApproval(params);
      }).toThrow("Record not found");
    });
  });

  describe("autoRejectExpense", () => {
    it("should set status to REJECTED_AUTO", () => {
      const mockRecord = {
        setValue: jest.fn(),
        save: jest.fn(),
        getValue: jest.fn((params) => {
          if (params.fieldId === "total") return 1000000;
          return null;
        }),
      };
      recordMock.load.mockReturnValue(mockRecord);

      const params = {
        expenseId: 1001,
        reason: "Auto-rejected: pending > 30 days",
        employeeId: 789,
      };

      ExpenseApprovalDAO.autoRejectExpense(params);

      expect(mockRecord.setValue).toHaveBeenCalledWith(
        expect.objectContaining({
          fieldId: "custbody_approval_status",
          value: "REJECTED_AUTO",
        }),
      );
      expect(mockRecord.save).toHaveBeenCalled();
    });
  });

  describe("getPendingExpenses", () => {
    it("should return array of pending expenses", () => {
      const mockSearch = {
        run: jest.fn().mockReturnValue({
          getRange: jest.fn().mockReturnValue([
            {
              getValue: jest.fn((params) => {
                const mockData = {
                  internalid: "1001",
                  total: 500000,
                  custbody_submission_date: "2024-01-15",
                };
                return mockData[params.name];
              }),
              getText: jest.fn((params) => {
                if (params.name === "entity") return "John Doe";
                return "";
              }),
            },
          ]),
        }),
      };
      searchMock.create.mockReturnValue(mockSearch);

      const result = ExpenseApprovalDAO.getPendingExpenses();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(
        expect.objectContaining({
          id: "1001",
          employee: "John Doe",
          amount: 500000,
        }),
      );
    });

    it("should return empty array on error", () => {
      searchMock.create.mockImplementation(() => {
        throw new Error("Search error");
      });

      const result = ExpenseApprovalDAO.getPendingExpenses();

      expect(result).toEqual([]);
      expect(logMock.error).toHaveBeenCalled();
    });
  });
});
