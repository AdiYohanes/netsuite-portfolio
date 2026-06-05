/**
 * @file validate_expenses_cs.test.js
 * @description Unit tests for the Expense Report client-side validation script.
 *
 * HOW THIS WORKS
 * --------------
 * The source script uses AMD define() — a pattern used by NetSuite's runtime.
 * In Node.js / Jest, `define()` doesn't exist, so jest.setup.js polyfills it
 * globally. When we require() the script below, the polyfill intercepts the
 * define() call, resolves dependencies (N/log, N/ui/dialog) to their mocks,
 * invokes the factory function, and stores the returned module in
 * `global.__ssModule`. We then destructure what we need from there.
 *
 * MOCK LOCATIONS
 * --------------
 * mocks/N/log.js       → mock for N/log
 * mocks/N/ui.js        → mock for N/ui/dialog (exported as { dialog: { alert } })
 */

// --- Load mocks BEFORE requiring the script ---
// (jest.setup.js also loads them via the define polyfill, but we need direct
//  references here so we can assert on them with expect().)
const dialogMock = require("../../../mocks/N/ui.js").dialog;
const logMock = require("../../../mocks/N/log.js");

// Trigger AMD define() → polyfill executes the factory → stores in global.__ssModule
require("../src/scripts/validate_expenses_cs.js");
const { saveRecord } = global.__ssModule;

// ---------------------------------------------------------------------------
// Test Helpers
// ---------------------------------------------------------------------------

/**
 * Build a minimal mock context object that mimics NetSuite's ClientScript
 * context. The context.currentRecord.getValue() call returns amountValue.
 *
 * @param {*} amountValue - The raw value returned by the "amount" field
 * @returns {Object} Mock context
 */
const makeContext = (amountValue) => ({
  currentRecord: {
    getValue: jest.fn().mockReturnValue(amountValue),
  },
});

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------

describe("validate_expenses_cs — saveRecord()", () => {
  // Reset all mock call history before each test to prevent cross-test pollution
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Negative Amount ──────────────────────────────────────────────────────

  describe("when amount is negative", () => {
    it("returns false", () => {
      expect(saveRecord(makeContext("-1"))).toBe(false);
    });

    it("shows a Validation Failed alert", () => {
      saveRecord(makeContext("-50000"));
      expect(dialogMock.alert).toHaveBeenCalledTimes(1);
      expect(dialogMock.alert).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Validation Failed" }),
      );
    });

    it("does NOT log an error (validation failure is expected, not exceptional)", () => {
      saveRecord(makeContext("-1"));
      expect(logMock.error).not.toHaveBeenCalled();
    });
  });

  // ── Amount Exceeds Maximum ───────────────────────────────────────────────

  describe("when amount exceeds the maximum (5,000,000)", () => {
    it("returns false", () => {
      expect(saveRecord(makeContext("5000001"))).toBe(false);
    });

    it("shows a Validation Failed alert", () => {
      saveRecord(makeContext("6000000"));
      expect(dialogMock.alert).toHaveBeenCalledTimes(1);
      expect(dialogMock.alert).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Validation Failed" }),
      );
    });
  });

  // ── Valid Amount ─────────────────────────────────────────────────────────

  describe("when amount is valid", () => {
    it("returns true for a mid-range amount", () => {
      expect(saveRecord(makeContext("1000000"))).toBe(true);
    });

    it("returns true for the boundary value 0", () => {
      expect(saveRecord(makeContext("0"))).toBe(true);
    });

    it("returns true for the maximum boundary (5,000,000)", () => {
      expect(saveRecord(makeContext("5000000"))).toBe(true);
    });

    it("shows no alert for a valid amount", () => {
      saveRecord(makeContext("2500000"));
      expect(dialogMock.alert).not.toHaveBeenCalled();
    });
  });

  // ── Non-Numeric Input ────────────────────────────────────────────────────

  describe("when amount is non-numeric", () => {
    it("treats an empty string as 0 and returns true", () => {
      expect(saveRecord(makeContext(""))).toBe(true);
    });

    it("treats a text string as 0 and returns true", () => {
      expect(saveRecord(makeContext("abc"))).toBe(true);
    });

    it("treats null as 0 and returns true", () => {
      expect(saveRecord(makeContext(null))).toBe(true);
    });
  });

  // ── System Error Handling ────────────────────────────────────────────────

  describe("when a system exception is thrown", () => {
    const errorContext = {
      currentRecord: {
        getValue: jest.fn().mockImplementation(() => {
          throw new Error("NetSuite field lookup failed");
        }),
      },
    };

    it("returns false", () => {
      expect(saveRecord(errorContext)).toBe(false);
    });

    it("logs the error via N/log.error", () => {
      saveRecord(errorContext);
      expect(logMock.error).toHaveBeenCalledTimes(1);
      expect(logMock.error).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Error CS Validation" }),
      );
    });

    it("does NOT show a dialog alert on system error", () => {
      saveRecord(errorContext);
      expect(dialogMock.alert).not.toHaveBeenCalled();
    });
  });
});
