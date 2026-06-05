/**
 * @NApiVersion 2.1
 * @NModuleScope SameAccount
 *
 * @file expenseApprovalDAO.js
 * @description Data Access Object for Expense Approval business logic.
 *              Centralizes record operations and email notifications,
 *              making them reusable across User Event, Suitelet, and Map/Reduce scripts.
 * @author Adi Yohanes
 * @version 1.0.0
 */
define(["N/record", "N/email", "N/runtime", "N/log", "N/search"], (
  record,
  email,
  runtime,
  log,
  search,
) => {
  /**
   * Sends an approval notification email to the employee's supervisor.
   * Silently skips if no supervisor or manager email is found.
   *
   * @param {Object} params
   * @param {number} params.employeeId  - Internal ID of the submitting employee
   * @param {number} params.expenseId   - Internal ID of the Expense Report
   * @param {number} params.amount      - Expense total amount
   * @param {Object} params.record      - NetSuite record object (unused, reserved for future use)
   */
  const sendApprovalNotification = (params) => {
    try {
      const { employeeId, expenseId, amount } = params;

      const employeeRecord = record.load({
        type: record.Type.EMPLOYEE,
        id: employeeId,
      });
      const employeeName = employeeRecord.getValue({ fieldId: "entityid" });
      const managerId = employeeRecord.getValue({ fieldId: "supervisor" });

      if (!managerId) {
        log.warning({
          title: "No Manager Found",
          details: `Employee ${employeeId} (${employeeName}) has no supervisor assigned`,
        });
        return;
      }

      const managerRecord = record.load({
        type: record.Type.EMPLOYEE,
        id: managerId,
      });
      const managerEmail = managerRecord.getValue({ fieldId: "email" });

      if (!managerEmail) {
        log.warning({
          title: "No Manager Email",
          details: `Manager ${managerId} has no email address`,
        });
        return;
      }

      const formattedAmount = new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
      }).format(amount);

      email.send({
        author: runtime.getCurrentUser().id,
        recipients: managerEmail,
        subject: `Expense Approval Required: ${employeeName} - ${formattedAmount}`,
        body: `
Dear Manager,

A new expense report requires your approval:

Employee: ${employeeName}
Expense ID: ${expenseId}
Amount: ${formattedAmount}
Submission Date: ${new Date().toLocaleDateString("id-ID")}

Please review and approve/reject via the Expense Approval Dashboard.

Thank you.

---
This is an automated notification from NetSuite Expense Approval System.
        `.trim(),
        relatedRecords: { transactionId: expenseId },
      });

      log.audit({
        title: "Approval Notification Sent",
        details: `Email sent to ${managerEmail} for expense ${expenseId} (${formattedAmount})`,
      });
    } catch (error) {
      log.error({
        title: "Error in sendApprovalNotification",
        details: `Employee: ${params.employeeId}, Expense: ${params.expenseId}, Error: ${error.message}`,
      });
      // Do not throw — notification failure must not block the record save
    }
  };

  /**
   * Approves or rejects an Expense Report and notifies the employee.
   * Throws on record load failure so the caller can handle it.
   *
   * @param {Object} params
   * @param {number} params.expenseId  - Internal ID of the Expense Report
   * @param {string} params.action     - "APPROVE" or "REJECT"
   * @param {string} params.notes      - Approver notes (optional)
   * @param {number} params.approverId - Internal ID of the approver employee
   */
  const processApproval = (params) => {
    try {
      const { expenseId, action, notes, approverId } = params;

      const expenseRecord = record.load({
        type: record.Type.EXPENSE_REPORT,
        id: expenseId,
      });
      const newStatus = action === "APPROVE" ? "APPROVED" : "REJECTED";

      expenseRecord.setValue({
        fieldId: "custbody_approval_status",
        value: newStatus,
      });
      expenseRecord.setValue({
        fieldId: "custbody_approval_date",
        value: new Date(),
      });
      expenseRecord.setValue({
        fieldId: "custbody_approved_by",
        value: approverId,
      });

      if (notes) {
        expenseRecord.setValue({
          fieldId: "custbody_approval_notes",
          value: notes,
        });
      }

      expenseRecord.save({
        enableSourcing: false,
        ignoreMandatoryFields: true,
      });

      sendStatusNotification({
        employeeId: expenseRecord.getValue({ fieldId: "entityid" }),
        expenseId,
        status: newStatus,
        amount: expenseRecord.getValue({ fieldId: "total" }),
        notes,
      });

      log.audit({
        title: "Expense Approval Processed",
        details: `Expense ${expenseId} ${action.toLowerCase()}d by employee ${approverId}`,
      });
    } catch (error) {
      log.error({
        title: "Error in processApproval",
        details: `Expense: ${params.expenseId}, Action: ${params.action}, Error: ${error.message}`,
      });
      throw error; // Re-throw so the caller (Suitelet/MapReduce) can handle it
    }
  };

  /**
   * Sets an Expense Report to REJECTED_AUTO and notifies the employee.
   * Intended for use by the Map/Reduce script to handle stale pending reports.
   * Throws on record load failure so the caller can handle it.
   *
   * @param {Object} params
   * @param {number} params.expenseId  - Internal ID of the Expense Report
   * @param {string} params.reason     - Reason for auto-rejection
   * @param {number} params.employeeId - Internal ID of the submitting employee
   */
  const autoRejectExpense = (params) => {
    try {
      const { expenseId, reason, employeeId } = params;

      const expenseRecord = record.load({
        type: record.Type.EXPENSE_REPORT,
        id: expenseId,
      });

      expenseRecord.setValue({
        fieldId: "custbody_approval_status",
        value: "REJECTED_AUTO",
      });
      expenseRecord.setValue({
        fieldId: "custbody_approval_notes",
        value: reason,
      });
      expenseRecord.setValue({
        fieldId: "custbody_approval_date",
        value: new Date(),
      });

      expenseRecord.save({
        enableSourcing: false,
        ignoreMandatoryFields: true,
      });

      sendStatusNotification({
        employeeId,
        expenseId,
        status: "REJECTED_AUTO",
        amount: expenseRecord.getValue({ fieldId: "total" }),
        notes: reason,
      });

      log.audit({
        title: "Expense Auto-Rejected",
        details: `Expense ${expenseId} auto-rejected: ${reason}`,
      });
    } catch (error) {
      log.error({
        title: "Error in autoRejectExpense",
        details: `Expense: ${params.expenseId}, Error: ${error.message}`,
      });
      throw error; // Re-throw so the caller (MapReduce) can handle it
    }
  };

  /**
   * Sends an approval/rejection status email to the employee.
   * Silently skips if no employee email is found.
   *
   * @param {Object} params
   * @param {number} params.employeeId - Internal ID of the employee
   * @param {number} params.expenseId  - Internal ID of the Expense Report
   * @param {string} params.status     - New status: APPROVED | REJECTED | REJECTED_AUTO
   * @param {number} params.amount     - Expense total amount
   * @param {string} [params.notes]    - Approver notes (optional)
   */
  const sendStatusNotification = (params) => {
    try {
      const { employeeId, expenseId, status, amount, notes } = params;

      const employeeRecord = record.load({
        type: record.Type.EMPLOYEE,
        id: employeeId,
      });
      const employeeEmail = employeeRecord.getValue({ fieldId: "email" });

      if (!employeeEmail) {
        log.warning({
          title: "No Employee Email",
          details: `Employee ${employeeId} has no email address`,
        });
        return;
      }

      const statusText =
        {
          APPROVED: "Approved",
          REJECTED: "Rejected",
          REJECTED_AUTO: "Auto-Rejected",
        }[status] || status;
      const formattedAmount = new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
      }).format(amount);
      const nextAction =
        status === "APPROVED"
          ? "Your expense has been approved and will be processed for payment."
          : "Please review the feedback and resubmit if needed.";

      email.send({
        author: runtime.getCurrentUser().id,
        recipients: employeeEmail,
        subject: `Expense ${statusText}: ID ${expenseId}`,
        body: `
Dear Employee,

Your expense report has been ${statusText.toLowerCase()}:

Expense ID: ${expenseId}
Amount: ${formattedAmount}
Status: ${statusText}
${notes ? `Notes: ${notes}` : ""}

${nextAction}

Thank you.

---
This is an automated notification from NetSuite Expense Approval System.
        `.trim(),
        relatedRecords: { transactionId: expenseId },
      });

      log.audit({
        title: "Status Notification Sent",
        details: `Email sent to ${employeeEmail} for expense ${expenseId} (${statusText})`,
      });
    } catch (error) {
      log.error({
        title: "Error in sendStatusNotification",
        details: `Employee: ${params.employeeId}, Expense: ${params.expenseId}, Error: ${error.message}`,
      });
      // Do not throw — notification failure must not block the approval process
    }
  };

  /**
   * Retrieves all Expense Reports with status PENDING_APPROVAL.
   * Returns an empty array on search failure (non-fatal).
   *
   * @returns {Array<{id: string, employee: string, amount: string, submissionDate: string, createdDate: string}>}
   */
  const getPendingExpenses = () => {
    try {
      const searchResults = search
        .create({
          type: search.Type.EXPENSE_REPORT,
          filters: [["custbody_approval_status", "is", "PENDING_APPROVAL"]],
          columns: [
            search.createColumn({ name: "internalid", label: "ID" }),
            search.createColumn({ name: "entity", label: "Employee" }),
            search.createColumn({ name: "total", label: "Amount" }),
            search.createColumn({
              name: "custbody_submission_date",
              label: "Submission Date",
            }),
            search.createColumn({ name: "datecreated", label: "Created Date" }),
          ],
        })
        .run()
        .getRange({ start: 0, end: 1000 });

      return searchResults.map((result) => ({
        id: result.getValue({ name: "internalid" }),
        employee: result.getText({ name: "entity" }),
        amount: result.getValue({ name: "total" }),
        submissionDate: result.getValue({ name: "custbody_submission_date" }),
        createdDate: result.getValue({ name: "datecreated" }),
      }));
    } catch (error) {
      log.error({
        title: "Error in getPendingExpenses",
        details: error.message,
      });
      return [];
    }
  };

  return {
    sendApprovalNotification,
    processApproval,
    autoRejectExpense,
    sendStatusNotification,
    getPendingExpenses,
  };
});
