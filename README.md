<div align="center">

# 💼 NetSuite Developer Portfolio

**SuiteScript 2.1 · Real-World ERP Customizations · Unit Tested**

[![NetSuite](https://img.shields.io/badge/NetSuite-SuiteScript_2.1-0066CC?style=for-the-badge&logo=oracle&logoColor=white)](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/chapter_4387172221.html)
[![Jest](https://img.shields.io/badge/Jest-^30.x-C21325?style=for-the-badge&logo=jest&logoColor=white)](https://jestjs.io/)
[![Node.js](https://img.shields.io/badge/Node.js-≥18.x-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-F7DF1E?style=for-the-badge)](LICENSE)
[![Tests](https://img.shields.io/badge/Tests-15_Passing_✅-brightgreen?style=for-the-badge)]()
[![Coverage](https://img.shields.io/badge/Coverage-100%25-brightgreen?style=for-the-badge)]()

<br/>

_A growing collection of production-ready NetSuite customizations — each project ships with clean code, JSDoc, and a Jest test suite._

</div>

---

## 👋 About Me

Halo! Saya **Adi Yohanes**, NetSuite Developer / Technical Consultant yang fokus pada otomatisasi bisnis dan kustomisasi ERP menggunakan SuiteScript 2.1.

Repository ini adalah portofolio aktif saya — setiap project dirancang untuk menyelesaikan kebutuhan bisnis nyata dengan kode yang bersih, terstruktur, dan telah diuji unit test.

---

## 🗂️ Projects

| #   | Project                                                        | Script Types                                       | Status         | Tests                    |
| --- | -------------------------------------------------------------- | -------------------------------------------------- | -------------- | ------------------------ |
| 1   | [Expense Approval System](./projects/expense-approval-system/) | Client Script · User Event · Suitelet · Map/Reduce | 🔄 In Progress | ✅ 15 passing · 100% cov |
| 2   | _(coming soon)_                                                | —                                                  | ⬜ Planned     | —                        |

### Project Status Legend

- ✅ **Complete** — fully implemented & tested
- 🔄 **In Progress** — actively being developed
- ⬜ **Planned** — scoped, not yet started

---

## 🏗️ Repository Structure

```
NetSuite-Portfolio-ExpenseSystem/
│
├── README.md                       ← You are here (global portfolio overview)
├── .gitignore
├── package.json                    ← Root devDependencies (Jest ^30.x)
├── package-lock.json               ← Committed for reproducible installs
├── jest.config.js                  ← Global Jest config (covers all projects)
├── jest.setup.js                   ← AMD define() polyfill for Node.js/Jest
│
├── mocks/                          ← NetSuite module mocks (shared across all projects)
│   └── N/
│       ├── log.js                  ← Mock for N/log
│       └── ui.js                   ← Mock for N/ui/dialog
│
└── projects/                       ← Per-project source code
    └── expense-approval-system/    ← Project 1
        ├── README.md               ← Project-specific documentation
        ├── src/
        │   └── scripts/            ← SuiteScript source files
        ├── tests/                  ← Jest unit tests (mirrors src/)
        └── docs/
            └── screenshots/        ← Visual documentation
```

---

## 🛠️ Tech Stack

| Technology   | Version | Role                                              |
| ------------ | ------- | ------------------------------------------------- |
| SuiteScript  | 2.1     | NetSuite scripting API (AMD `define()` pattern)   |
| JavaScript   | ES6+    | Arrow functions, destructuring, template literals |
| Node.js      | ≥ 18.x  | Local runtime for test execution                  |
| Jest         | ^30.x   | Unit testing framework                            |
| NetSuite SDF | latest  | Deployment toolchain (optional)                   |

---

## ⚡ Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/AdiYohanes/netsuite-portfolio.git
cd NetSuite-Portfolio-ExpenseSystem

# 2. Install dependencies
npm install

# 3. Run all tests to verify setup
npm test
```

Expected output:

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

Tests: 15 passed, 15 total
Coverage: 100%
```

---

## 🧪 Test Commands

```bash
# Run all tests across all projects
npm test

# Run tests for a specific project
npm run test:expense

# Run all tests with coverage report
npm run test:coverage

# Run coverage for a specific project
npm run test:coverage:expense

# Run in watch mode (re-runs on file save — great for TDD)
npm run test:watch

# Run with verbose output (shows individual test names)
npm run test:verbose

# Run in CI mode (single pass, no failures on empty test suite)
npm run test:ci
```

---

## ✅ Best Practices Applied

- **AMD `define()` pattern** — matches NetSuite's runtime module system exactly
- **JSDoc headers** — every script documents `@NApiVersion`, `@NScriptType`, `@NModuleScope`, `@author`, `@version`
- **try/catch on all entry points** — errors are caught, logged via `N/log`, and return `false` (fail-safe)
- **Unit tested** — Jest tests cover happy path, boundary values, and error paths
- **Naming conventions** — `_cs`, `_ue`, `_sl`, `_mr` suffixes identify script type at a glance
- **Per-project isolation** — each project lives under `projects/` and is independently testable

---

## 🚀 Deploying to NetSuite

<details>
<summary><strong>Manual Upload (Quick)</strong></summary>

1. Login to NetSuite
2. Go to **Documents > Files > File Cabinet**
3. Navigate to `SuiteScripts/` (or create a subfolder)
4. Upload the `.js` file from `projects/<project>/src/scripts/`
5. Go to **Customization > Scripting > Scripts > New**
6. Select the uploaded file, configure Script Type and entry points
7. Create a Script Deployment and attach to the target record/form

</details>

<details>
<summary><strong>Via SuiteCloud Development Framework (SDF)</strong></summary>

```bash
# Install SuiteCloud CLI globally
npm install -g @oracle/suitecloud-cli

# Authenticate to your account
suitecloud account:setup

# Deploy the project
suitecloud project:deploy
```

</details>

---

## 📬 Contact

|             |                                                                                                                 |
| ----------- | --------------------------------------------------------------------------------------------------------------- |
| 💼 LinkedIn | [linkedin.com/in/yohanes-wicaksono-adi-807316165](https://www.linkedin.com/in/yohanes-wicaksono-adi-807316165/) |
| 📧 Email    | adiyohanes19@gmail.com                                                                                          |
| 🐙 GitHub   | [github.com/AdiYohanes](https://github.com/AdiYohanes)                                                          |

---

<div align="center">

> ⚠️ **Disclaimer:** This repository is for educational and portfolio purposes only. It is not affiliated with Oracle NetSuite. Always test in a Sandbox before deploying to Production.

<br/>

_Made with ☕ by Adi Yohanes · NetSuite Developer_

</div>
