/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 *
 * @file validate_expenses_cs.js
 * @description Validates the Amount field on the Expense Report before save.
 *              Acceptable range: 0 – 5,000,000.
 * @author Adi Yohanes
 * @version 1.0.0
 */
define(["N/ui/dialog", "N/log"], (dialog, log) => {
  const MAX_AMOUNT = 5000000;

  // --- Helpers ---

  /** Safely parse a raw field value to a number. Non-numeric defaults to 0. */
  const parseAmount = (rawValue) => {
    const parsed = Number(rawValue);
    return isNaN(parsed) ? 0 : parsed;
  };

  /** Show a "Validation Failed" alert dialog with the given message. */
  const showValidationAlert = (message) => {
    dialog.alert({ title: "Validation Failed", message });
  };

  // --- Entry Point ---

  /**
   * saveRecord — runs before the Expense Report record is saved.
   * Returns false (and shows an alert) when validation fails.
   *
   * @param {Object} context
   * @param {Record} context.currentRecord
   * @returns {boolean}
   */
  const saveRecord = (context) => {
    try {
      const amount = parseAmount(
        context.currentRecord.getValue({ fieldId: "amount" }),
      );

      if (amount < 0) {
        showValidationAlert("Amount cannot be less than 0.");
        return false;
      }

      if (amount > MAX_AMOUNT) {
        showValidationAlert(
          `Amount cannot exceed ${MAX_AMOUNT.toLocaleString("en-US")}.`,
        );
        return false;
      }

      return true;
    } catch (error) {
      log.error({ title: "Error CS Validation", details: error });
      return false;
    }
  };

  return { saveRecord };
});
