<div align="center">

# 🧾 Expense Approval System

[![Status](https://img.shields.io/badge/Status-In_Progress-orange?style=for-the-badge)]()
[![Phase](https://img.shields.io/badge/Phase-2_of_4-blue?style=for-the-badge)]()
[![Client Script](https://img.shields.io/badge/Client_Script-Complete-brightgreen?style=flat-square)]()
[![User Event](https://img.shields.io/badge/User_Event-Complete-brightgreen?style=flat-square)]()
[![Suitelet](https://img.shields.io/badge/Suitelet-Coming_Soon-lightgrey?style=flat-square)]()
[![Map/Reduce](https://img.shields.io/badge/Map%2FReduce-Coming_Soon-lightgrey?style=flat-square)]()

Automated validation and multi-layer approval workflow for NetSuite Expense Reports.

**[← Back to Portfolio](../../README.md)**

</div>

---

## The Problem

Manual expense processing introduces three recurring issues:

| #   | Problem              | Impact                                                      |
| --- | -------------------- | ----------------------------------------------------------- |
| 1   | No input validation  | Negative or excessive amounts enter the database unchecked  |
| 2   | No approval workflow | Finance reviews each report manually with no tracking       |
| 3   | No notifications     | Employees and managers rely on email chains to check status |

---

## Solution Architecture

Four automation layers work together to cover the full lifecycle of an Expense Report.

```
Employee fills form
       │
       ▼
┌──────────────────────────────────────┐
│  Layer 1 · Client Script             │  validate_expenses_cs.js
│  Real-time validation before save    │  ✅ Complete
│  → Rejects invalid amount on-screen  │
└──────────────────┬───────────────────┘
                   │ valid
                   ▼
┌──────────────────────────────────────┐
│  Layer 2 · User Event                │  approve_expenses_ue.js
│  beforeSubmit: auto-set status       │  ✅ Complete
│  afterSubmit: send email to manager  │
└──────────────────┬───────────────────┘
                   │
                   ▼
┌──────────────────────────────────────┐
│  Layer 3 · Suitelet                  │  expense_dashboard_sl.js
│  Manager approval dashboard          │  🔜 Phase 3
│  → Bulk approve / reject in one view │
└──────────────────┬───────────────────┘
                   │
                   ▼
┌──────────────────────────────────────┐
│  Layer 4 · Map/Reduce                │  bulk_expense_processor_mr.js
│  Scheduled: auto-reject pending >30d │  🔜 Phase 4
│  → No report left without decision   │
└──────────────────────────────────────┘
```

---

## Components

| File                           | Type          | Responsibility                         | Status     |
| ------------------------------ | ------------- | -------------------------------------- | ---------- |
| `validate_expenses_cs.js`      | Client Script | Block invalid amount before save       | ✅ Phase 1 |
| `approve_expenses_ue.js`       | User Event    | Auto-set status, email manager         | ✅ Phase 2 |
| `expenseApprovalDAO.js`        | DAO Module    | Shared business logic (email, search)  | ✅ Phase 2 |
| `expense_dashboard_sl.js`      | Suitelet      | Bulk approval UI for managers          | 🔜 Phase 3 |
| `bulk_expense_processor_mr.js` | Map/Reduce    | Auto-reject expenses pending > 30 days | 🔜 Phase 4 |

---

## Business Rules

| Rule                                                  | Enforced By   | Priority    |
| ----------------------------------------------------- | ------------- | ----------- |
| Amount must not be negative                           | Client Script | 🔴 Critical |
| Amount must not exceed Rp 5,000,000                   | Client Script | 🔴 Critical |
| New submission auto-sets status to "Pending Approval" | User Event    | 🟡 High     |
| Manager notified on submission via email              | User Event    | 🟡 High     |
| Employee notified on approve/reject                   | DAO Module    | 🟡 High     |
| Auto-reject if pending > 30 days                      | Map/Reduce    | 🟢 Medium   |
| Bulk approve/reject via dashboard                     | Suitelet      | 🟢 Medium   |

---

## Custom Fields (Expense Report Record)

| Field ID                   | Type     | Description                                                 |
| -------------------------- | -------- | ----------------------------------------------------------- |
| `custbody_approval_status` | List     | `PENDING_APPROVAL`, `APPROVED`, `REJECTED`, `REJECTED_AUTO` |
| `custbody_submission_date` | Date     | Date when the expense was submitted                         |
| `custbody_submitted_by`    | Employee | Employee who submitted the expense                          |
| `custbody_approval_date`   | Date     | Date when the expense was approved/rejected                 |
| `custbody_approved_by`     | Employee | Approver employee reference                                 |
| `custbody_approval_notes`  | Text     | Notes from approver or auto-reject reason                   |

---

## Phase 1 — Client Script

**File:** `src/scripts/validate_expenses_cs.js`

Runs in the browser at `saveRecord`, validates the `amount` field, and cancels the save if the value is out of range.

### Validation Flow

```
saveRecord(context)
  └── parseAmount(getValue("amount"))
        ├── amount < 0         → alert("Amount cannot be less than 0.") + return false
        ├── amount > 5,000,000 → alert("Amount cannot exceed 5,000,000.") + return false
        └── otherwise          → return true
```

### Design Decisions

| Decision                       | Reason                                                          |
| ------------------------------ | --------------------------------------------------------------- |
| `parseAmount()` helper         | Safely converts empty, `null`, or non-numeric input to `0`      |
| `showValidationAlert()` helper | Single-responsibility; easy to mock in tests                    |
| `try/catch` on `saveRecord`    | Prevents any uncaught exception from crashing the NetSuite form |
| Only `saveRecord` exported     | Keeps internal helpers private                                  |

### Source

```javascript
/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 * @author Adi Yohanes
 * @version 1.0.0
 */
define(["N/ui/dialog", "N/log"], (dialog, log) => {
  const MAX_AMOUNT = 5_000_000;

  const parseAmount = (rawValue) => {
    const parsed = Number(rawValue);
    return isNaN(parsed) ? 0 : parsed;
  };

  const showValidationAlert = (message) => {
    dialog.alert({ title: "Validation Failed", message });
  };

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
```

---

## Phase 2 — User Event + DAO Module

### User Event Script

**File:** `src/scripts/approve_expenses_ue.js`

Runs server-side on the Expense Report record. Uses two entry points that work in tandem.

### Flow

```
Record saved (CREATE only)
       │
       ▼
beforeSubmit(context)
  ├── set custbody_approval_status  = "PENDING_APPROVAL"
  ├── set custbody_submission_date  = new Date()
  ├── set custbody_submitted_by     = currentUser.id
  └── log.audit("beforeSubmit - Status Set")
       │
       ▼  (record committed to database)
       │
afterSubmit(context)
  ├── read expenseId, employeeId, amount from newRecord
  ├── ExpenseApprovalDAO.sendApprovalNotification({ employeeId, expenseId, amount })
  └── log.audit("afterSubmit - Notification Sent")
```

> Both entry points are wrapped in `try/catch` — failures are logged but never thrown,
> so the user experience is never interrupted by automation errors.

### DAO Module

**File:** `src/modules/expenseApprovalDAO.js`

Centralizes all data access and email logic. Reusable across User Event, Suitelet, and Map/Reduce scripts.

#### Public API

| Function                     | Description                                                  |
| ---------------------------- | ------------------------------------------------------------ |
| `sendApprovalNotification()` | Loads employee & supervisor records, sends email to manager  |
| `processApproval()`          | Updates status to `APPROVED`/`REJECTED`, notifies employee   |
| `autoRejectExpense()`        | Sets status to `REJECTED_AUTO`, notifies employee            |
| `sendStatusNotification()`   | Internal helper — sends approval/rejection email to employee |
| `getPendingExpenses()`       | Search all expenses with `PENDING_APPROVAL` status           |

#### `sendApprovalNotification()` Flow

```
sendApprovalNotification({ employeeId, expenseId, amount })
  ├── record.load(EMPLOYEE, employeeId)  → get employeeName, supervisorId
  ├── supervisorId == null?              → log.warning("No Manager Found") + return
  ├── record.load(EMPLOYEE, supervisorId) → get managerEmail
  ├── managerEmail == null?              → log.warning("No Manager Email") + return
  └── email.send(to: managerEmail, subject: "Expense Approval Required: ...")
        └── log.audit("Approval Notification Sent")
```

#### `processApproval()` Flow

```
processApproval({ expenseId, action, notes, approverId })
  ├── record.load(EXPENSE_REPORT, expenseId)
  ├── setValue custbody_approval_status  = "APPROVED" | "REJECTED"
  ├── setValue custbody_approval_date    = new Date()
  ├── setValue custbody_approved_by      = approverId
  ├── setValue custbody_approval_notes   = notes
  ├── record.save()
  └── sendStatusNotification({ employeeId, expenseId, status, amount })
        └── email.send(to: employeeEmail, subject: "Expense APPROVED/REJECTED: ...")
```

---

## Testing

Tests run locally with Jest against mocked NetSuite modules. No NetSuite instance required.

```bash
# Run tests for this project
npx jest projects/expense-approval-system

# With coverage report
npx jest projects/expense-approval-system --coverage

# Verbose output
npx jest projects/expense-approval-system --verbose
```

### Results

```
PASS  projects/expense-approval-system/tests/expenseApprovalDAO.test.js
  ExpenseApprovalDAO
    sendApprovalNotification
      ✓ should send email to manager when all data is valid
      ✓ should log warning when employee has no supervisor
      ✓ should log warning when manager has no email
      ✓ should catch and log error without throwing
    processApproval
      ✓ should update expense status to APPROVED
      ✓ should update expense status to REJECTED
      ✓ should throw error if record load fails
    autoRejectExpense
      ✓ should set status to REJECTED_AUTO
    getPendingExpenses
      ✓ should return array of pending expenses
      ✓ should return empty array on error

PASS  projects/expense-approval-system/tests/approve_expenses_ue.test.js
  approve_expenses_ue
    beforeSubmit
      ✓ should set status to PENDING_APPROVAL on CREATE
      ✓ should set submission date on CREATE
      ✓ should NOT run on EDIT
      ✓ should catch and log errors without throwing
    afterSubmit
      ✓ should send notification on CREATE
      ✓ should NOT send notification on EDIT
      ✓ should catch and log errors without throwing

PASS  projects/expense-approval-system/tests/validate_expenses_cs.test.js
  validate_expenses_cs — saveRecord()
    when amount is negative
      ✓ returns false
      ✓ shows a Validation Failed alert
      ✓ does NOT log an error
    when amount exceeds the maximum (5,000,000)
      ✓ returns false
      ✓ shows a Validation Failed alert
    when amount is valid
      ✓ returns true for a mid-range amount
      ✓ returns true for the boundary value 0
      ✓ returns true for the maximum boundary (5,000,000)
      ✓ shows no alert for a valid amount
    when amount is non-numeric
      ✓ treats an empty string as 0 and returns true
      ✓ treats a text string as 0 and returns true
      ✓ treats null as 0 and returns true
    when a system exception is thrown
      ✓ returns false
      ✓ logs the error via N/log.error
      ✓ does NOT show a dialog alert on system error

Test Suites: 3 passed, 3 total
Tests:       32 passed, 32 total
```

### Test Coverage Map

#### Phase 1 — Client Script

| Scenario           | Input     | Expected              |
| ------------------ | --------- | --------------------- |
| Negative amount    | `-100000` | `false` + alert       |
| Over limit         | `6000000` | `false` + alert       |
| Valid mid-range    | `1000000` | `true`                |
| Boundary minimum   | `0`       | `true`                |
| Boundary maximum   | `5000000` | `true`                |
| Non-numeric: empty | `""`      | `true` (treated as 0) |
| Non-numeric: text  | `"abc"`   | `true` (treated as 0) |
| Non-numeric: null  | `null`    | `true` (treated as 0) |
| System exception   | throws    | `false` + log.error   |

#### Phase 2 — User Event

| Scenario           | Input       | Expected                          |
| ------------------ | ----------- | --------------------------------- |
| CREATE event       | type=create | status set + date set + user set  |
| EDIT event         | type=edit   | no field changes                  |
| System error       | throws      | log.error, no throw to caller     |
| afterSubmit CREATE | type=create | `sendApprovalNotification` called |
| afterSubmit EDIT   | type=edit   | notification NOT sent             |

#### DAO — sendApprovalNotification

| Scenario                 | Input                    | Expected                        |
| ------------------------ | ------------------------ | ------------------------------- |
| Valid employee + manager | supervisor + email exist | `email.send` + `log.audit`      |
| No supervisor assigned   | supervisor = null        | `log.warning`, no email         |
| Manager has no email     | email = null             | `log.warning`, no email         |
| Record load throws       | DB error                 | `log.error`, no throw to caller |

#### DAO — processApproval

| Scenario         | Input          | Expected                          |
| ---------------- | -------------- | --------------------------------- |
| Approve          | action=APPROVE | status = APPROVED + save + notify |
| Reject           | action=REJECT  | status = REJECTED + save          |
| Record not found | load throws    | error re-thrown to caller         |

---

## Project Structure

```
expense-approval-system/
├── src/
│   ├── scripts/
│   │   ├── validate_expenses_cs.js   ← Phase 1: Client Script
│   │   └── approve_expenses_ue.js    ← Phase 2: User Event
│   └── modules/
│       └── expenseApprovalDAO.js     ← Phase 2: Shared DAO
├── tests/
│   ├── validate_expenses_cs.test.js
│   ├── approve_expenses_ue.test.js
│   └── expenseApprovalDAO.test.js
├── mocks/
│   ├── ExpenseApprovalDAO.js         ← jest.fn() stubs for DAO
│   └── N/
│       ├── email.js                  ← re-exports root mock
│       ├── log.js                    ← re-exports root mock
│       ├── record.js                 ← re-exports root mock
│       ├── runtime.js                ← re-exports root mock
│       └── search.js                 ← re-exports root mock
└── docs/
    └── screenshots/
```

---

## Deployment

### Phase 1 — Client Script

1. Upload `src/scripts/validate_expenses_cs.js` to `SuiteScripts/ExpenseApprovalSystem/`
2. **Customization > Scripting > Scripts > New** → select file
3. Script Type: `Client Script`, Save Record Function: `saveRecord`
4. Deploy to: **Expense Report** form

### Phase 2 — User Event Script

1. Upload `src/scripts/approve_expenses_ue.js` to `SuiteScripts/ExpenseApprovalSystem/`
2. Upload `src/modules/expenseApprovalDAO.js` to `SuiteScripts/ExpenseApprovalSystem/modules/`
3. **Customization > Scripting > Scripts > New** → select `approve_expenses_ue.js`
4. Script Type: `User Event`
   - beforeSubmit Function: `beforeSubmit`
   - afterSubmit Function: `afterSubmit`
5. Deploy to: **Expense Report** record type

### Custom Fields Required

Before deploying Phase 2, create these custom body fields on the Expense Report record:

| Field ID                   | Type              |
| -------------------------- | ----------------- |
| `custbody_approval_status` | List/Record       |
| `custbody_submission_date` | Date              |
| `custbody_submitted_by`    | Select (Employee) |
| `custbody_approval_date`   | Date              |
| `custbody_approved_by`     | Select (Employee) |
| `custbody_approval_notes`  | Free-Form Text    |

### Sandbox Verification

| Scenario                            | Expected                                |
| ----------------------------------- | --------------------------------------- |
| Submit new expense, amount -100000  | Alert shown, record not saved           |
| Submit new expense, amount 10000000 | Alert shown, record not saved           |
| Submit new expense, amount 500000   | Record saves, status = PENDING_APPROVAL |
| Submit new expense                  | Manager receives approval email         |
| Edit existing expense               | Status unchanged, no email sent         |

---

## Screenshots

> To be added after sandbox testing.

| Scenario              | File                                         |
| --------------------- | -------------------------------------------- |
| Negative amount alert | `docs/screenshots/negative-amount-alert.png` |
| Over-limit alert      | `docs/screenshots/over-limit-alert.png`      |
| Valid save            | `docs/screenshots/valid-save.png`            |
| Jest test output      | `docs/screenshots/jest-test-results.png`     |
| Script Record config  | `docs/screenshots/script-record.png`         |
| Approval email        | `docs/screenshots/approval-email.png`        |

---

## Roadmap

**Phase 1 — Input Validation** ✅

- [x] Client Script with `saveRecord` validation
- [x] 15 unit tests, full coverage
- [ ] Sandbox screenshots

**Phase 2 — Status Automation & Notification** ✅

- [x] User Event: `beforeSubmit` sets status, date, submitted-by
- [x] User Event: `afterSubmit` sends email to manager
- [x] DAO Module: `sendApprovalNotification`, `processApproval`, `autoRejectExpense`, `getPendingExpenses`
- [x] 17 unit tests across User Event and DAO
- [ ] Custom fields created in NetSuite Sandbox
- [ ] Sandbox screenshots

**Phase 3 — Approval Interface** 🔜

- [ ] Suitelet: manager dashboard (uses `getPendingExpenses()` from DAO)
- [ ] Bulk approve / reject (uses `processApproval()` from DAO)
- [ ] Filter by status, date, amount

**Phase 4 — Bulk Automation** 🔜

- [ ] Map/Reduce: scheduled auto-reject (uses `autoRejectExpense()` from DAO)
- [ ] Employee notification on auto-reject
- [ ] Error handling and retry logic

---

## Resources

- [SuiteScript 2.1 Client Script API](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_1559364894.html)
- [SuiteScript 2.1 User Event Script API](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_4387799721.html)
- [N/record Module](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_4267255811.html)
- [N/email Module](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_4358552361.html)
- [Jest Documentation](https://jestjs.io/docs/getting-started)

---

<div align="center">
Made with ❤️ by Adi Yohanes
</div>
