/**
 * @file validate_expenses_cs.js
 * @description Client Script for validating the Amount field on save.
 *              Ensures the amount is within the acceptable range of 0 to 5,000,000.
 *
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 *
 * @author Adi Yohanes
 * @version 1.0.0
 */
define(["N/ui/dialog", "N/log"], (dialog, log) => {
  const MAX_AMOUNT = 5000000;

  /**
   * Validates that the Amount field is within the acceptable range (0 - 5,000,000)
   * before the record is saved. Displays an alert dialog if validation fails.
   *
   * @param {Object} context - The save record context object provided by NetSuite
   * @param {Record} context.currentRecord - The current record being saved
   * @returns {boolean} Returns true if validation passes, false to cancel the save
   */
  const saveRecord = (context) => {
    try {
      const rawValue = context.currentRecord.getValue({ fieldId: "amount" });
      const amount = isNaN(Number(rawValue)) ? 0 : Number(rawValue);

      if (amount < 0) {
        dialog.alert({
          title: "Validation Failed",
          message: "Amount cannot be less than 0.",
        });

        return false;
      }

      if (amount > MAX_AMOUNT) {
        dialog.alert({
          title: "Validation Failed",
          message: `Amount cannot exceed ${MAX_AMOUNT.toLocaleString(
            "en-US",
          )}.`,
        });

        return false;
      }

      return true;
    } catch (error) {
      log.error({
        title: "Error CS Validation",
        details: error,
      });

      return false;
    }
  };

  return {
    saveRecord,
  };
});
