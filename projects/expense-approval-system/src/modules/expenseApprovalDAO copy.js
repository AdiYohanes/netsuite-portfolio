/**
 * @NApiVersion 2.1
 * @NModuleScope SameAccount
 *
 * @description
 * Data Access Object for Expense Approval business logic.
 * Centralized functions reusable across multiple scripts.
 */
define(["N/record", "N/email", "N/runtime", "N/log", "N/search"], (
  record,
  email,
  runtime,
  log,
  search,
) => {
  /**
   * Send email notification to manager for expense approval
   *
   * @param {Object} params
   * @param {number} params.employeeId - Employee ID who submitted
   * @param {number} params.expenseId - Expense Report ID
   * @param {number} params.amount - Expense amount
   * @param {Object} params.record - NetSuite record object
   */
  const sendApprovalNotification = (params) => {
    try {
      const { employeeId, expenseId, amount, record: expenseRecord } = params;

      // Get employee name
      const employeeRecord = record.load({
        type: record.Type.EMPLOYEE,
        id: employeeId,
      });
      const employeeName = employeeRecord.getValue({ fieldId: "entityid" });

      // Get manager (supervisor)
      const managerId = employeeRecord.getValue({ fieldId: "supervisor" });

      if (!managerId) {
        log.warning({
          title: "No Manager Found",
          details: `Employee ${employeeId} (${employeeName}) has no supervisor assigned`,
        });
        return;
      }

      // Get manager email
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

      // Format amount for display
      const formattedAmount = new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
      }).format(amount);

      // Send email
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
        relatedRecords: {
          transactionId: expenseId,
        },
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
      // Don't throw - notification failure shouldn't block record save
    }
  };

  /**
   * Process approval or rejection of expense
   *
   * @param {Object} params
   * @param {number} params.expenseId - Expense Report ID
   * @param {string} params.action - 'APPROVE' or 'REJECT'
   * @param {string} params.notes - Approval/rejection notes
   * @param {number} params.approverId - Approver employee ID
   */
  const processApproval = (params) => {
    try {
      const { expenseId, action, notes, approverId } = params;

      const expenseRecord = record.load({
        type: record.Type.EXPENSE_REPORT,
        id: expenseId,
      });

      const newStatus = action === "APPROVE" ? "APPROVED" : "REJECTED";

      // Update status
      expenseRecord.setValue({
        fieldId: "custbody_approval_status",
        value: newStatus,
      });

      // Set approval date
      expenseRecord.setValue({
        fieldId: "custbody_approval_date",
        value: new Date(),
      });

      // Set approver
      expenseRecord.setValue({
        fieldId: "custbody_approved_by",
        value: approverId,
      });

      // Set notes
      if (notes) {
        expenseRecord.setValue({
          fieldId: "custbody_approval_notes",
          value: notes,
        });
      }

      // Save record
      expenseRecord.save({
        enableSourcing: false,
        ignoreMandatoryFields: true,
      });

      // Get employee info for notification
      const employeeId = expenseRecord.getValue({ fieldId: "entityid" });
      const amount = expenseRecord.getValue({ fieldId: "total" });

      // Send notification to employee
      sendStatusNotification({
        employeeId: employeeId,
        expenseId: expenseId,
        status: newStatus,
        amount: amount,
        notes: notes,
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
      throw error;
    }
  };

  /**
   * Auto-reject expense that has been pending too long
   *
   * @param {Object} params
   * @param {number} params.expenseId - Expense Report ID
   * @param {string} params.reason - Rejection reason
   * @param {number} params.employeeId - Employee ID
   */
  const autoRejectExpense = (params) => {
    try {
      const { expenseId, reason, employeeId } = params;

      const expenseRecord = record.load({
        type: record.Type.EXPENSE_REPORT,
        id: expenseId,
      });

      // Set status to auto-rejected
      expenseRecord.setValue({
        fieldId: "custbody_approval_status",
        value: "REJECTED_AUTO",
      });

      // Set rejection reason
      expenseRecord.setValue({
        fieldId: "custbody_approval_notes",
        value: reason,
      });

      // Set approval date
      expenseRecord.setValue({
        fieldId: "custbody_approval_date",
        value: new Date(),
      });

      // Save record
      expenseRecord.save({
        enableSourcing: false,
        ignoreMandatoryFields: true,
      });

      // Get amount for notification
      const amount = expenseRecord.getValue({ fieldId: "total" });

      // Notify employee
      sendStatusNotification({
        employeeId: employeeId,
        expenseId: expenseId,
        status: "REJECTED_AUTO",
        amount: amount,
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
      throw error;
    }
  };

  /**
   * Send status notification to employee
   *
   * @param {Object} params
   * @param {number} params.employeeId - Employee ID
   * @param {number} params.expenseId - Expense Report ID
   * @param {string} params.status - New status (APPROVED, REJECTED, REJECTED_AUTO)
   * @param {number} params.amount - Expense amount
   * @param {string} params.notes - Approval/rejection notes
   */
  const sendStatusNotification = (params) => {
    try {
      const { employeeId, expenseId, status, amount, notes } = params;

      // Get employee email
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

      // Format status text
      const statusText =
        {
          APPROVED: "Approved",
          REJECTED: "Rejected",
          REJECTED_AUTO: "Auto-Rejected",
        }[status] || status;

      // Format amount
      const formattedAmount = new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
      }).format(amount);

      // Determine next action message
      const nextAction =
        status === "APPROVED"
          ? "Your expense has been approved and will be processed for payment."
          : "Please review the feedback and resubmit if needed.";

      // Send email
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
        relatedRecords: {
          transactionId: expenseId,
        },
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
      // Don't throw - notification failure shouldn't block process
    }
  };

  /**
   * Get list of pending expenses for dashboard
   *
   * @returns {Array} Array of pending expense objects
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

  // Public API
  return {
    sendApprovalNotification,
    processApproval,
    autoRejectExpense,
    sendStatusNotification,
    getPendingExpenses,
  };
});
