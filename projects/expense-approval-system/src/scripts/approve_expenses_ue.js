/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 *
 * @description
 * Auto-set status Expense Report to "Pending Approval" on create.
 * Send email notification to manager.
 *
 * Entry Points:
 * - beforeSubmit: Set status & submission info
 * - afterSubmit: Send notification (after record is saved)
 */
define(["N/record", "N/log", "../modules/ExpenseApprovalDAO"], (
  record,
  log,
  ExpenseApprovalDAO,
) => {
  /**
   * beforeSubmit - Runs before record is saved to database
   * Use this to set field values before save
   */
  const beforeSubmit = (context) => {
    try {
      // Only run on CREATE (new expense reports)
      if (context.type !== context.UserEventType.CREATE) {
        return;
      }

      const newRecord = context.newRecord;

      // 1. Auto-set status to Pending Approval
      newRecord.setValue({
        fieldId: "custbody_approval_status",
        value: "PENDING_APPROVAL",
      });

      // 2. Set submission date
      newRecord.setValue({
        fieldId: "custbody_submission_date",
        value: new Date(),
      });

      // 3. Set submitted by (current user)
      const currentUser = require("N/runtime").getCurrentUser();
      newRecord.setValue({
        fieldId: "custbody_submitted_by",
        value: currentUser.id,
      });

      log.audit({
        title: "beforeSubmit - Status Set",
        details: `Expense will be set to PENDING_APPROVAL`,
      });
    } catch (error) {
      log.error({
        title: "Error in beforeSubmit",
        details: error.message,
      });
      // Don't throw - let record save even if automation fails
    }
  };

  /**
   * afterSubmit - Runs after record is saved to database
   * Use this for actions that need the record ID (like sending emails)
   */
  const afterSubmit = (context) => {
    try {
      // Only run on CREATE
      if (context.type !== context.UserEventType.CREATE) {
        return;
      }

      const newRecord = context.newRecord;
      const expenseId = newRecord.id;
      const employeeId = newRecord.getValue({ fieldId: "entityid" });
      const amount = newRecord.getValue({ fieldId: "total" });

      // Send email notification to manager
      ExpenseApprovalDAO.sendApprovalNotification({
        employeeId: employeeId,
        expenseId: expenseId,
        amount: amount,
        record: newRecord,
      });

      log.audit({
        title: "afterSubmit - Notification Sent",
        details: `Notification sent for expense ${expenseId}`,
      });
    } catch (error) {
      log.error({
        title: "Error in afterSubmit",
        details: error.message,
      });
      // Don't throw - notification failure shouldn't affect user experience
    }
  };

  return {
    beforeSubmit: beforeSubmit,
    afterSubmit: afterSubmit,
  };
});
