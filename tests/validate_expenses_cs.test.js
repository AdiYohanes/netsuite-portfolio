/**
 * Tests for validate_expenses_cs.js
 *
 * The script uses AMD define(), so we require() it to trigger jest.setup.js's
 * global polyfill, then read the exported module from global.__ssModule.
 */
const dialogMock = require("../mocks/N/ui.js").dialog;
const logMock = require("../mocks/N/log.js");

require("../src/01_ClientScript/validate_expenses_cs.js");
const { saveRecord } = global.__ssModule;

// Helper: build a mock context with a given amount value
const makeContext = (amountValue) => ({
  currentRecord: {
    getValue: jest.fn().mockReturnValue(amountValue),
  },
});

describe("saveRecord — Expense Amount Validation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns false and shows alert when amount is negative", () => {
    const result = saveRecord(makeContext("-50000"));

    expect(result).toBe(false);
    expect(dialogMock.alert).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Validation Failed" }),
    );
  });

  it("returns false and shows alert when amount exceeds maximum", () => {
    const result = saveRecord(makeContext("6000000"));

    expect(result).toBe(false);
    expect(dialogMock.alert).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Validation Failed" }),
    );
  });

  it("returns true and shows no alert when amount is valid", () => {
    const result = saveRecord(makeContext("1000000"));

    expect(result).toBe(true);
    expect(dialogMock.alert).not.toHaveBeenCalled();
  });

  it("returns false and logs error when a system exception is thrown", () => {
    const errorContext = {
      currentRecord: {
        getValue: jest.fn().mockImplementation(() => {
          throw new Error("Field not found");
        }),
      },
    };

    const result = saveRecord(errorContext);

    expect(result).toBe(false);
    expect(logMock.error).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Error CS Validation" }),
    );
  });
});
