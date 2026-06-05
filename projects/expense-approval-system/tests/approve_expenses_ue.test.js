/**
 * Unit tests for approve_expenses_ue.js
 */

const logMock = require("../mocks/N/log");
const recordMock = require("../mocks/N/record");
const runtimeMock = require("../mocks/N/runtime");
const ExpenseApprovalDAOMock = require("../mocks/ExpenseApprovalDAO");

// Load User Event script — AMD define() is intercepted by jest.setup.js polyfill,
// which executes the factory and stores the result in global.__ssModule.
require("../src/scripts/approve_expenses_ue");
const userEventScript = global.__ssModule;

describe("approve_expenses_ue", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks
    runtimeMock.getCurrentUser.mockReturnValue({ id: 123 });
  });

  describe("beforeSubmit", () => {
    it("should set status to PENDING_APPROVAL on CREATE", () => {
      const mockRecord = {
        setValue: jest.fn(),
      };

      const context = {
        type: "create",
        UserEventType: { CREATE: "create" },
        newRecord: mockRecord,
      };

      userEventScript.beforeSubmit(context);

      expect(mockRecord.setValue).toHaveBeenCalledWith(
        expect.objectContaining({
          fieldId: "custbody_approval_status",
          value: "PENDING_APPROVAL",
        }),
      );
    });

    it("should set submission date on CREATE", () => {
      const mockRecord = {
        setValue: jest.fn(),
      };

      const context = {
        type: "create",
        UserEventType: { CREATE: "create" },
        newRecord: mockRecord,
      };

      userEventScript.beforeSubmit(context);

      expect(mockRecord.setValue).toHaveBeenCalledWith(
        expect.objectContaining({
          fieldId: "custbody_submission_date",
        }),
      );
    });

    it("should NOT run on EDIT", () => {
      const mockRecord = {
        setValue: jest.fn(),
      };

      const context = {
        type: "edit",
        UserEventType: { CREATE: "create", EDIT: "edit" },
        newRecord: mockRecord,
      };

      userEventScript.beforeSubmit(context);

      expect(mockRecord.setValue).not.toHaveBeenCalled();
    });

    it("should catch and log errors without throwing", () => {
      const mockRecord = {
        setValue: jest.fn().mockImplementation(() => {
          throw new Error("Field not found");
        }),
      };

      const context = {
        type: "create",
        UserEventType: { CREATE: "create" },
        newRecord: mockRecord,
      };

      expect(() => {
        userEventScript.beforeSubmit(context);
      }).not.toThrow();

      expect(logMock.error).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Error in beforeSubmit",
        }),
      );
    });
  });

  describe("afterSubmit", () => {
    it("should send notification on CREATE", () => {
      const mockRecord = {
        id: 1001,
        getValue: jest.fn((params) => {
          const mockData = {
            entityid: 789,
            total: 500000,
          };
          return mockData[params.fieldId];
        }),
      };

      const context = {
        type: "create",
        UserEventType: { CREATE: "create" },
        newRecord: mockRecord,
      };

      userEventScript.afterSubmit(context);

      expect(
        ExpenseApprovalDAOMock.sendApprovalNotification,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          employeeId: 789,
          expenseId: 1001,
          amount: 500000,
        }),
      );
    });

    it("should NOT send notification on EDIT", () => {
      const mockRecord = {
        id: 1001,
        getValue: jest.fn(),
      };

      const context = {
        type: "edit",
        UserEventType: { CREATE: "create", EDIT: "edit" },
        newRecord: mockRecord,
      };

      userEventScript.afterSubmit(context);

      expect(
        ExpenseApprovalDAOMock.sendApprovalNotification,
      ).not.toHaveBeenCalled();
    });

    it("should catch and log errors without throwing", () => {
      const mockRecord = {
        id: 1001,
        getValue: jest.fn().mockImplementation(() => {
          throw new Error("Field error");
        }),
      };

      const context = {
        type: "create",
        UserEventType: { CREATE: "create" },
        newRecord: mockRecord,
      };

      expect(() => {
        userEventScript.afterSubmit(context);
      }).not.toThrow();

      expect(logMock.error).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Error in afterSubmit",
        }),
      );
    });
  });
});
