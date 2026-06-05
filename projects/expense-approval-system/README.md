<div align="center">

# 🧾 Expense Approval System

[![Status](https://img.shields.io/badge/Status-🔄_In_Progress-orange?style=for-the-badge)]()
[![Client Script](https://img.shields.io/badge/Client_Script-✅_Complete-brightgreen?style=flat-square)]()
[![User Event](https://img.shields.io/badge/User_Event-🔜_Coming_Soon-lightgrey?style=flat-square)]()
[![Suitelet](https://img.shields.io/badge/Suitelet-🔜_Coming_Soon-lightgrey?style=flat-square)]()
[![Map/Reduce](https://img.shields.io/badge/Map/Reduce-🔜_Coming_Soon-lightgrey?style=flat-square)]()

_Automated validation and approval workflow for NetSuite Expense Reports_

</div>

---

## 🎯 Business Problem

Perusahaan mengalami masalah dengan Expense Report yang disubmit dengan data tidak valid:

- **Amount negatif** — input salah yang lolos ke database
- **Amount melebihi batas** — pengeluaran di atas Rp 5.000.000 tanpa approval khusus
- **Tidak ada feedback real-time** — user baru tahu error setelah record tersimpan

**Dampak bisnis:** Data kotor di sistem, proses rekonsiliasi keuangan terhambat, potensi fraud dari amount yang tidak wajar.

---

## 💡 Technical Solution

Implementasi multi-layer automation menggunakan 4 tipe SuiteScript yang bekerja bersama:

```
User fills form  →  [Client Script]  →  saveRecord validation  →  record saved
                                                                        ↓
                                                              [User Event]
                                                              beforeSubmit / afterSubmit
                                                                        ↓
                                                         Status updated, notification sent
                                                                        ↓
Manager opens  →  [Suitelet]  →  Custom dashboard  →  bulk approve/reject
                                                                        ↓
                                                              [Map/Reduce]
                                                         Bulk processing at scale
```

---

## 🏗️ Architecture & Components

### Component Overview

| Component                      | Script Type   | Entry Point(s)                               | Status      |
| ------------------------------ | ------------- | -------------------------------------------- | ----------- |
| `validate_expenses_cs.js`      | Client Script | `saveRecord`                                 | ✅ Complete |
| `approve_expenses_ue.js`       | User Event    | `beforeSubmit`, `afterSubmit`                | 🔜 Planned  |
| `expense_dashboard_sl.js`      | Suitelet      | `onRequest`                                  | 🔜 Planned  |
| `bulk_expense_processor_mr.js` | Map/Reduce    | `getInputData`, `map`, `reduce`, `summarize` | 🔜 Planned  |

### File Structure

```
expense-approval-system/
├── README.md                             ← This file
├── src/
│   └── scripts/
│       ├── validate_expenses_cs.js       ✅ Client Script — real-time form validation
│       ├── approve_expenses_ue.js        🔜 User Event — status automation
│       ├── expense_dashboard_sl.js       🔜 Suitelet — manager approval UI
│       └── bulk_expense_processor_mr.js  🔜 Map/Reduce — bulk processing
├── tests/
│   └── validate_expenses_cs.test.js      ✅ Jest tests (15 tests, 100% coverage)
└── docs/
    └── screenshots/                      📸 Visual documentation
```

---

## 📋 Business Rules

| Rule                 | Description                                      | Enforced By   |
| -------------------- | ------------------------------------------------ | ------------- |
| No negative amounts  | `amount < 0` → reject + alert                    | Client Script |
| Maximum Rp 5,000,000 | `amount > 5,000,000` → reject + alert            | Client Script |
| Status transitions   | Submitted → Pending Approval → Approved/Rejected | User Event    |
| Manager notification | Email sent on status change                      | User Event    |
| Bulk approval        | Process 100+ reports in one action               | Map/Reduce    |

---

## ✅ Component 1: Client Script — `validate_expenses_cs.js`

Validates the Expense Report form in real-time — before the record is saved to the database.

### Flow

```
User clicks Save
      ↓
saveRecord() fires  (ClientScript entry point)
      ↓
getValue("amount")  →  parseAmount()  →  Number
      ↓
amount < 0       →  dialog.alert("Validation Failed")  →  return false
amount > 5,000,000  →  dialog.alert("Validation Failed")  →  return false
      ↓
return true  (allow save)
```

### Key Design Decisions

- `parseAmount()` — converts any non-numeric input to `0` rather than crashing; safe for empty fields, `null`, and `"abc"`
- `showValidationAlert()` — extracted helper keeps `saveRecord()` readable and makes the alert independently testable
- `try/catch` on the entry point — any unexpected runtime error is caught, logged via `N/log.error`, and returns `false` (fail-safe; never throws to the NetSuite runtime)
- Only `saveRecord` is exported — internal helpers remain private to the module closure

### Source Highlights

```js
/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(["N/ui/dialog", "N/log"], (dialog, log) => {
  const MAX_AMOUNT = 5_000_000;

  // Safe parser — non-numeric input becomes 0
  const parseAmount = (rawValue) => {
    const parsed = Number(rawValue);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Single-responsibility helper
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

## 🧪 Testing

### Run Tests

```bash
# From the repository root:

# This project only
npm run test:expense

# With coverage report
npm run test:coverage:expense

# Verbose output (shows each test name)
npx jest projects/expense-approval-system --verbose

# Watch mode (re-runs on file save — great for TDD)
npm run test:watch:expense
```

### Test Results

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

Test Suites: 1 passed, 1 total
Tests:       15 passed, 15 total
Coverage:    100%
```

### Test Coverage Map

| Scenario                                   | Covered |
| ------------------------------------------ | ------- |
| Negative amount                            | ✅      |
| Amount > 5,000,000                         | ✅      |
| Valid mid-range amount                     | ✅      |
| Boundary: `0` (minimum)                    | ✅      |
| Boundary: `5,000,000` (maximum, inclusive) | ✅      |
| Non-numeric: empty string, `"abc"`, `null` | ✅      |
| System exception → returns `false` + logs  | ✅      |
| System exception → does NOT show alert     | ✅      |

### How the Test Setup Works

The source script uses AMD `define()` — NetSuite's module pattern — which doesn't exist in Node.js. `jest.setup.js` polyfills `define()` globally: when `require()` loads the script, the polyfill intercepts the call, resolves `N/log` and `N/ui/dialog` to their mocks under `mocks/N/`, executes the factory, and stores the returned module in `global.__ssModule`. Tests then destructure `saveRecord` from there.

---

## 🚀 Deployment

### Step 1 — Upload to File Cabinet

1. Login to NetSuite
2. Navigate to **Documents > Files > File Cabinet**
3. Create (or navigate to) folder: `SuiteScripts/ExpenseApprovalSystem/`
4. Upload `src/scripts/validate_expenses_cs.js`

### Step 2 — Create Script Record

1. Go to **Customization > Scripting > Scripts > New**
2. Select the uploaded `.js` file
3. Script Type: **Client Script**
4. Entry point — `Save Record Function`: `saveRecord`
5. Save

### Step 3 — Create Deployment

1. Click **Deploy Script** on the Script Record
2. Record Type: **Expense Report**
3. Status: **Testing** (switch to Released when verified)
4. Save

### Step 4 — Verify in Sandbox

| Action                          | Expected Behaviour                    |
| ------------------------------- | ------------------------------------- |
| Enter a negative amount → Save  | Alert shown, record does **not** save |
| Enter amount > 5,000,000 → Save | Alert shown, record does **not** save |
| Enter valid amount → Save       | Record saves normally                 |

---

## 📸 Screenshots

_Screenshots will be added after UI testing in NetSuite Sandbox._

| Scenario                         | File                                         |
| -------------------------------- | -------------------------------------------- |
| Negative amount validation alert | `docs/screenshots/negative-amount-alert.png` |
| Over-limit validation alert      | `docs/screenshots/over-limit-alert.png`      |
| Successful save (valid amount)   | `docs/screenshots/valid-save.png`            |

---

<div align="center">

[← Back to Portfolio](../../README.md)

</div>
