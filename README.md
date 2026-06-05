<div align="center">

# 💼 NetSuite Developer Portfolio

**SuiteScript 2.1 · Real-World ERP Customizations · Unit Tested**

[![NetSuite](https://img.shields.io/badge/NetSuite-SuiteScript_2.1-0066CC?style=for-the-badge&logo=oracle&logoColor=white)](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/chapter_4387172221.html)
[![Jest](https://img.shields.io/badge/Jest-Unit_Tests-C21325?style=for-the-badge&logo=jest&logoColor=white)](https://jestjs.io/)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-F7DF1E?style=for-the-badge)](LICENSE)
[![Tests](https://img.shields.io/badge/Tests-Passing_✅-brightgreen?style=for-the-badge)]()
[![Coverage](https://img.shields.io/badge/Coverage-85%25-brightgreen?style=for-the-badge)]()

<br/>

_A growing collection of production-ready NetSuite customizations — each project ships with clean code, JSDoc, and a Jest test suite._

</div>

---

## 👋 About Me

Halo! Saya **Adi Yohanes**, NetSuite Developer / Technical Consultant yang fokus pada otomatisasi bisnis dan kustomisasi ERP menggunakan SuiteScript 2.1.

Repository ini adalah portofolio aktif saya — setiap project dirancang untuk menyelesaikan kebutuhan bisnis nyata dengan kode yang bersih, terstruktur, dan telah diuji unit test.

---

## 🗂️ Projects

| #   | Project                                                        | Type                                               | Status         | Tests      |
| --- | -------------------------------------------------------------- | -------------------------------------------------- | -------------- | ---------- |
| 1   | [Expense Approval System](./projects/expense-approval-system/) | Client Script + User Event + Suitelet + Map/Reduce | 🔄 In Progress | ✅ Passing |
| 2   | _(coming soon)_                                                | —                                                  | ⬜ Planned     | —          |

### Project Status Legend

- ✅ **Complete** — fully implemented & tested
- 🔄 **In Progress** — actively being developed
- ⬜ **Planned** — scoped, not yet started

---

## 🏗️ Repository Structure

```
NetSuite-Portfolio/
│
├── README.md                       ← You are here (global portfolio overview)
├── .gitignore
├── package.json                    ← Root devDependencies (Jest)
├── package-lock.json               ← Committed for reproducible installs
├── jest.config.js                  ← Global Jest config (covers all projects)
├── jest.setup.js                   ← AMD define() polyfill for Node.js/Jest
│
├── mocks/                          ← NetSuite module mocks (shared across all projects)
│   └── N/
│       ├── log.js                  ← Mock for N/log
│       └── ui.js                   ← Mock for N/ui/dialog
│
├── projects/                       ← Per-project source code
│   └── expense-approval-system/    ← Project 1
│       ├── README.md               ← Project-specific documentation
│       ├── src/scripts/            ← SuiteScript source files
│       ├── tests/                  ← Jest unit tests (mirrors src/)
│       └── docs/screenshots/       ← Visual documentation
│
└── shared-modules/                 ← (Future) shared utilities across projects
    ├── Logger.js
    └── ErrorHandler.js
```

---

## 🛠️ Tech Stack

| Technology   | Version | Role                                              |
| ------------ | ------- | ------------------------------------------------- |
| SuiteScript  | 2.1     | NetSuite scripting API (AMD pattern)              |
| JavaScript   | ES6+    | Arrow functions, destructuring, template literals |
| Node.js      | ≥ 18.x  | Local runtime for test execution                  |
| Jest         | ^30.x   | Unit testing framework                            |
| NetSuite SDF | latest  | Deployment toolchain (optional)                   |

---

## ⚡ Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/NetSuite-Portfolio.git
cd NetSuite-Portfolio

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
      ...

Tests: 11 passed, 11 total
```

---

## 🧪 Running Tests

<details>
<summary><strong>All available test commands</strong></summary>

```bash
# Run all tests across all projects
npm test

# Run tests for a specific project
npm run test:expense

# Run all tests with a coverage report
npm run test:coverage

# Run coverage for a specific project
npm run test:coverage:expense

# Run in watch mode (re-runs on file save — great for TDD)
npm run test:watch

# Run in watch mode for a specific project
npm run test:watch:expense

# Run with verbose output (shows individual test names)
npm run test:verbose

# Run a single test file directly
npx jest projects/expense-approval-system/tests/validate_expenses_cs.test.js

# Run tests matching a name pattern
npx jest -t "when amount is negative"
```

</details>

<details>
<summary><strong>How to write a new test</strong></summary>

1. Create a test file in the project's `tests/` folder, mirroring the source filename:
   - Source: `projects/my-project/src/scripts/my_script_cs.js`
   - Test: `projects/my-project/tests/my_script_cs.test.js`

2. Use this base template:

```js
// Load mock references for assertions
const dialogMock = require("../../../mocks/N/ui.js").dialog;
const logMock = require("../../../mocks/N/log.js");

// Require the script — this triggers the AMD define() polyfill in jest.setup.js
require("../src/scripts/my_script_cs.js");
const { myEntryPoint } = global.__ssModule;

describe("my_script_cs — myEntryPoint()", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns true for valid input", () => {
    // arrange
    const context = {
      currentRecord: { getValue: jest.fn().mockReturnValue("100") },
    };
    // act & assert
    expect(myEntryPoint(context)).toBe(true);
  });
});
```

</details>

<details>
<summary><strong>How to add a new NetSuite module mock</strong></summary>

When a new script depends on a NetSuite module that isn't mocked yet (e.g. `N/record`):

**Step 1** — Create the mock file at `mocks/N/record.js`:

```js
module.exports = {
  load: jest.fn(),
  create: jest.fn(),
  submitFields: jest.fn(),
  // add whatever the script calls
};
```

**Step 2** — Register it in `jest.config.js`:

```js
moduleNameMapper: {
  "^N/record$": "<rootDir>/mocks/N/record.js",
}
```

**Step 3** — Register it in `jest.setup.js`'s switch statement:

```js
case "N/record":
  return require("./mocks/N/record.js");
```

</details>

---

## ✅ Best Practices Applied

- **AMD `define()` pattern** — matches NetSuite's runtime module system exactly
- **JSDoc headers** — every file documents `@NApiVersion`, `@NScriptType`, `@author`
- **try/catch on all entry points** — errors are caught, logged via `N/log`, and return `false`
- **Unit tested** — Jest tests cover happy path, boundary values, and error paths
- **Naming conventions** — `_cs`, `_ue`, `_sl`, `_mr` suffixes identify script type at a glance
- **Per-project structure** — each project is isolated and independently testable

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

|             |                                                                        |
| ----------- | ---------------------------------------------------------------------- |
| 💼 LinkedIn | [linkedin.com/in/YOUR_LINKEDIN](https://linkedin.com/in/YOUR_LINKEDIN) |
| 📧 Email    | your.email@example.com                                                 |
| 🐙 GitHub   | [github.com/YOUR_USERNAME](https://github.com/YOUR_USERNAME)           |

---

<div align="center">

> ⚠️ **Disclaimer:** This repository is for educational and portfolio purposes only. It is not affiliated with Oracle NetSuite. Always test in a Sandbox before deploying to Production.

<br/>

_Made with ☕ by Adi Yohanes · NetSuite Developer_

</div>
