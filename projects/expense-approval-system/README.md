<div align="center">

# 🧾 Expense Approval System

[![Status](https://img.shields.io/badge/Status-In_Progress-orange?style=for-the-badge)]()
[![Phase](https://img.shields.io/badge/Phase-1_of_4-blue?style=for-the-badge)]()
[![Client Script](https://img.shields.io/badge/Client_Script-Complete-brightgreen?style=flat-square)]()
[![User Event](https://img.shields.io/badge/User_Event-Coming_Soon-lightgrey?style=flat-square)]()
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
│  afterSubmit: set status + notify    │  🔜 Phase 2
│  → Manager receives email instantly  │
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
| `approve_expenses_ue.js`       | User Event    | Auto-set status, email manager         | 🔜 Phase 2 |
| `expense_dashboard_sl.js`      | Suitelet      | Bulk approval UI for managers          | 🔜 Phase 3 |
| `bulk_expense_processor_mr.js` | Map/Reduce    | Auto-reject expenses pending > 30 days | 🔜 Phase 4 |

---

## Business Rules

| Rule                                                  | Enforced By   | Priority    |
| ----------------------------------------------------- | ------------- | ----------- |
| Amount must not be negative                           | Client Script | 🔴 Critical |
| Amount must not exceed Rp 5,000,000                   | Client Script | 🔴 Critical |
| New submission auto-sets status to "Pending Approval" | User Event    | 🟡 High     |
| Manager notified on submission                        | User Event    | 🟡 High     |
| Bulk approve/reject via dashboard                     | Suitelet      | 🟢 Medium   |
| Pending > 30 days → auto-reject + notify              | Map/Reduce    | 🟢 Medium   |

---

## Phase 1 — Client Script

**File:** `src/scripts/validate_expenses_cs.js`

Runs in the browser at `saveRecord`, validates the `amount` field, and cancels the save if the value is out of range.

### Validation Flow

```
saveRecord(context)
  └── parseAmount(getValue("amount"))
        ├── amount < 0        → alert + return false
        ├── amount > 5,000,000 → alert + return false
        └── otherwise         → return true
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

Tests: 15 passed  |  Coverage: 100%
```

### Coverage Map

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

---

## Deployment

### 1 — Upload to File Cabinet

1. Navigate to **Documents > Files > File Cabinet**
2. Create folder: `SuiteScripts/ExpenseApprovalSystem/`
3. Upload `src/scripts/validate_expenses_cs.js`

### 2 — Create Script Record

1. Go to **Customization > Scripting > Scripts > New**
2. Select the uploaded file
3. Script Type: `Client Script`
4. Save Record Function: `saveRecord`
5. Save

### 3 — Deploy

1. Click **Deploy Script**
2. Set **Applies To**: Expense Report
3. Set **Status**: Testing → Released after verification
4. Save

### 4 — Verify in Sandbox

| Input             | Expected                      |
| ----------------- | ----------------------------- |
| `-100000` → Save  | Alert shown, record not saved |
| `10000000` → Save | Alert shown, record not saved |
| `500000` → Save   | Record saves normally         |

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

---

## Roadmap

**Phase 1 — Input Validation** ✅

- [x] Client Script with `saveRecord` validation
- [x] 15 unit tests, 100% coverage
- [ ] Sandbox screenshots

**Phase 2 — Status Automation** 🔜

- [ ] User Event: `beforeSubmit` / `afterSubmit`
- [ ] Auto-set status field
- [ ] Email notification to manager

**Phase 3 — Approval Interface** 🔜

- [ ] Suitelet: manager dashboard
- [ ] Bulk approve / reject
- [ ] Filter by status, date, amount

**Phase 4 — Bulk Automation** 🔜

- [ ] Map/Reduce: scheduled auto-reject
- [ ] Employee notification on auto-reject
- [ ] Error handling and retry logic

---

## Resources

- [SuiteScript 2.1 Client Script API](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_1559364894.html)
- [Jest Documentation](https://jestjs.io/docs/getting-started)

---

<div align="center">
Made with ❤️ by Adi Yohanes
</div>
