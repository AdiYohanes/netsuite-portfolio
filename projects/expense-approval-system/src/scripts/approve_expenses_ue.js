/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 *
 * @file approve_expenses_ue.js
 * @description User Event script for the Expense Report record.
 *              Automatically sets approval status on creation and notifies the manager.
 * @author Adi Yohanes
 * @version 1.0.0
 */
define(["N/record", "N/log", "../modules/ExpenseApprovalDAO"], (
  record,
  log,
  ExpenseApprovalDAO,
) => {
  /**
   * Runs before the record is committed to the database.
   * Sets approval status, submission date, and submitter on CREATE only.
   *
   * @param {Object} context
   * @param {string} context.type - Trigger type (create, edit, etc.)
   * @param {Object} context.UserEventType - Enum of trigger type constants
   * @param {Record} context.newRecord - The record being saved
   */
  const beforeSubmit = (context) => {
    try {
      if (context.type !== context.UserEventType.CREATE) return;

      const newRecord = context.newRecord;

      newRecord.setValue({
        fieldId: "custbody_approval_status",
        value: "PENDING_APPROVAL",
      });
      newRecord.setValue({
        fieldId: "custbody_submission_date",
        value: new Date(),
      });

      const currentUser = require("N/runtime").getCurrentUser();
      newRecord.setValue({
        fieldId: "custbody_submitted_by",
        value: currentUser.id,
      });

      log.audit({
        title: "beforeSubmit - Status Set",
        details: "Expense set to PENDING_APPROVAL",
      });
    } catch (error) {
      log.error({ title: "Error in beforeSubmit", details: error.message });
      // Do not throw — automation failure must not block the record save
    }
  };

  /**
   * Runs after the record is committed to the database.
   * Sends an approval notification email to the manager on CREATE only.
   *
   * @param {Object} context
   * @param {string} context.type - Trigger type (create, edit, etc.)
   * @param {Object} context.UserEventType - Enum of trigger type constants
   * @param {Record} context.newRecord - The saved record (ID is now available)
   */
  const afterSubmit = (context) => {
    try {
      if (context.type !== context.UserEventType.CREATE) return;

      const newRecord = context.newRecord;

      ExpenseApprovalDAO.sendApprovalNotification({
        employeeId: newRecord.getValue({ fieldId: "entityid" }),
        expenseId: newRecord.id,
        amount: newRecord.getValue({ fieldId: "total" }),
        record: newRecord,
      });

      log.audit({
        title: "afterSubmit - Notification Sent",
        details: `Expense ID: ${newRecord.id}`,
      });
    } catch (error) {
      log.error({ title: "Error in afterSubmit", details: error.message });
      // Do not throw — notification failure must not affect the user experience
    }
  };

  return { beforeSubmit, afterSubmit };
});
