# Project Structure

## Directory Layout

```
NetSuite-Portfolio-ExpenseSystem/
├── src/
│   ├── 01_ClientScript/     # Client-side scripts (UI logic, field validation, saveRecord)
│   ├── 02_UserEvent/        # User Event scripts (beforeLoad, beforeSubmit, afterSubmit)
│   ├── 03_Suitelet/         # Suitelet scripts (custom pages, external-facing endpoints)
│   └── 04_MapReduce/        # Map/Reduce scripts (bulk data processing)
├── tests/                   # Jest unit tests — mirrors src/ structure
├── mocks/
│   └── N/                   # Mock files for NetSuite modules (N/log, N/ui/dialog, etc.)
├── jest.config.js           # Jest configuration (testMatch, moduleNameMapper, setupFiles)
├── jest.setup.js            # Global AMD define() polyfill for Jest
├── package.json
└── README.md
```

## File Naming Conventions

Scripts use a suffix that identifies the script type:

| Script Type   | Suffix | Example                        |
| ------------- | ------ | ------------------------------ |
| Client Script | `_cs`  | `validate_expenses_cs.js`      |
| User Event    | `_ue`  | `approve_expenses_ue.js`       |
| Suitelet      | `_sl`  | `expense_dashboard_sl.js`      |
| Map/Reduce    | `_mr`  | `bulk_expense_processor_mr.js` |

Test files mirror the source filename with a `.test.js` suffix:

- `src/01_ClientScript/validate_expenses_cs.js` → `tests/validate_expenses_cs.test.js`

## Code Conventions

- All scripts use the AMD `define()` pattern with arrow function callback
- Each file starts with a JSDoc block including `@NApiVersion`, `@NScriptType`, `@NModuleScope`, `@author`, and `@version`
- Constants (e.g. `MAX_AMOUNT`) are defined at the top of the `define()` callback, outside functions
- All entry point functions are wrapped in `try/catch`; errors are logged with `N/log` and return `false`
- Only the public entry point functions are exported in the `return {}` object

## Adding a New Script

1. Create the source file in the appropriate `src/0N_*/` folder with the correct suffix
2. Add the JSDoc header with all required `@N` tags
3. Create a corresponding test file in `tests/`
4. Add any new NetSuite module mocks to `mocks/N/` and register them in `jest.config.js`
5. Run `npm test` to confirm all tests pass before deploying
