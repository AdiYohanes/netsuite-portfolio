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

| Component                      | Script Type   | Entry Point                                  | Status      |
| ------------------------------ | ------------- | -------------------------------------------- | ----------- |
| `validate_expenses_cs.js`      | Client Script | `saveRecord`                                 | ✅ Complete |
| `approve_expenses_ue.js`       | User Event    | `beforeSubmit`, `afterSubmit`                | 🔜 Planned  |
| `expense_dashboard_sl.js`      | Suitelet      | `onRequest`                                  | 🔜 Planned  |
| `bulk_expense_processor_mr.js` | Map/Reduce    | `getInputData`, `map`, `reduce`, `summarize` | 🔜 Planned  |

### File Structure

```
expense-approval-system/
├── README.md                         ← This file
├── src/
│   └── scripts/
│       ├── validate_expenses_cs.js   ✅ Client Script — real-time form validation
│       ├── approve_expenses_ue.js    🔜 User Event — status automation
│       ├── expense_dashboard_sl.js   🔜 Suitelet — manager approval UI
│       └── bulk_expense_processor_mr.js  🔜 Map/Reduce — bulk processing
├── tests/
│   └── validate_expenses_cs.test.js  ✅ Jest tests for client script
└── docs/
    └── screenshots/                  📸 Visual documentation
```

---

## 📋 Business Rules

| Rule                 | Description                                      | Script That Enforces It |
| -------------------- | ------------------------------------------------ | ----------------------- |
| No negative amounts  | `amount < 0` → reject + alert                    | Client Script           |
| Maximum Rp 5,000,000 | `amount > 5000000` → reject + alert              | Client Script           |
| Status transitions   | Submitted → Pending Approval → Approved/Rejected | User Event              |
| Manager notification | Email sent when status changes                   | User Event              |
| Bulk approval        | Process 100+ reports in one action               | Map/Reduce              |

---

## ✅ Component 1: Client Script (Complete)

**File:** `src/scripts/validate_expenses_cs.js`

Validates the Expense Report form in real-time — before the record is saved to the database.

### How It Works

```
User clicks Save
      ↓
saveRecord() fires (ClientScript entry point)
      ↓
getValue("amount") → parse to Number
      ↓
amount < 0?   → dialog.alert("Validation Failed") → return false (cancel save)
amount > 5M?  → dialog.alert("Validation Failed") → return false (cancel save)
      ↓
return true (allow save)
```

### Key Design Decisions

- `parseAmount()` helper converts any non-numeric input to `0` rather than crashing
- `showValidationAlert()` is extracted as a helper to keep `saveRecord()` readable
- The `try/catch` block catches any unexpected runtime error, logs it via `N/log.error`, and returns `false` (fail safe)
- Only `saveRecord` is exported — internal helpers are private to the module closure

---

## 🧪 Testing

### Run Tests for This Project

```bash
# From repository root:
npm run test:expense

# With coverage report:
npm run test:coverage:expense

# In watch mode (re-runs on file save):
npm run test:watch:expense

# Verbose output:
npx jest projects/expense-approval-system --verbose
```

### Test Results

```
PASS  projects/expense-approval-system/tests/validate_expenses_cs.test.js
  validate_expenses_cs — saveRecord()
    when amount is negative
      ✓ returns false
      ✓ shows a Validation Failed alert
      ✓ does NOT log an error (17ms)
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
Snapshots:   0 total
Time:        ~0.5s
```

### Test Coverage

| Scenario                                      | Covered |
| --------------------------------------------- | ------- |
| Negative amount                               | ✅      |
| Amount > 5,000,000                            | ✅      |
| Valid mid-range amount                        | ✅      |
| Boundary: 0                                   | ✅      |
| Boundary: 5,000,000 exactly                   | ✅      |
| Non-numeric input (empty string, "abc", null) | ✅      |
| System exception → returns false + logs error | ✅      |
| System exception → does NOT show alert        | ✅      |

---

## 🚀 How to Deploy

### Step 1 — Upload Script to File Cabinet

1. Login to NetSuite
2. Navigate to **Documents > Files > File Cabinet**
3. Go to (or create) folder: `SuiteScripts/ExpenseApprovalSystem/`
4. Upload `src/scripts/validate_expenses_cs.js`

### Step 2 — Create Script Record

1. Go to **Customization > Scripting > Scripts > New**
2. Select the uploaded `.js` file
3. Script Type: **Client Script**
4. Set entry point:
   - `Save Record Function`: `saveRecord`
5. Save the Script Record

### Step 3 — Create Deployment

1. Click **Deploy Script** on the Script Record
2. Select:
   - **Record Type:** Expense Report
   - **Status:** Testing (then Released when ready)
3. Save the Deployment

### Step 4 — Test in Sandbox

1. Open an Expense Report record
2. Enter a negative amount → should see alert, record should NOT save
3. Enter an amount > 5,000,000 → same behavior
4. Enter a valid amount → record should save normally

---

## 📸 Screenshots

_Screenshots will be added after UI testing in NetSuite Sandbox._

| Scenario                         | Screenshot                                   |
| -------------------------------- | -------------------------------------------- |
| Negative amount validation alert | `docs/screenshots/negative-amount-alert.png` |
| Over-limit validation alert      | `docs/screenshots/over-limit-alert.png`      |
| Successful save (valid amount)   | `docs/screenshots/valid-save.png`            |

---

## 🔍 Code Quality Highlights

```js
// ✅ parseAmount: safe, no crashes on bad input
const parseAmount = (rawValue) => {
  const parsed = Number(rawValue);
  return isNaN(parsed) ? 0 : parsed;
};

// ✅ Single responsibility: each helper does one thing
const showValidationAlert = (message) => {
  dialog.alert({ title: "Validation Failed", message });
};

// ✅ try/catch on entry point — fail safe, never throws to NetSuite runtime
const saveRecord = (context) => {
  try {
    // ... validation logic
  } catch (error) {
    log.error({ title: "Error CS Validation", details: error });
    return false;
  }
};

// ✅ Only public API is exported
return { saveRecord };
```

---

<div align="center">

[← Back to Portfolio](../../README.md)

</div>
