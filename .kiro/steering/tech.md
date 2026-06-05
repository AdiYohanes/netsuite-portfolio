# Tech Stack

## Runtime & Language

- **SuiteScript 2.1** — NetSuite's server/client scripting API, uses AMD module pattern (`define()`)
- **JavaScript (ES6+)** — Arrow functions, `const`/`let`, template literals, destructuring
- **Node.js ≥ 18.x** — Local runtime for testing only (scripts run on NetSuite in production)

## Module System

SuiteScript uses AMD (`define()`), not CommonJS or ESM. Every script file must follow this pattern:

```js
define(["N/module1", "N/module2"], (module1, module2) => {
  // implementation
  return { functionName };
});
```

Scripts do **not** use `require()` or `import` directly.

## Testing

- **Jest ^30.x** — Unit testing framework
- Tests run locally against mocked NetSuite modules
- AMD `define()` is polyfilled globally in `jest.setup.js`, which stores the module export in `global.__ssModule`
- NetSuite module mocks live in `mocks/N/` and are mapped via `moduleNameMapper` in `jest.config.js`

### Adding a New Mock

When a script depends on a new NetSuite module (e.g., `N/record`), add a mock file at `mocks/N/<module>.js` and register it in `jest.config.js`:

```js
moduleNameMapper: {
  "^N/record$": "<rootDir>/mocks/N/record.js",
}
```

## Common Commands

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run tests with coverage report
npm test -- --coverage
```

## Deployment (Manual)

1. Upload `.js` file to NetSuite File Cabinet under `SuiteScripts/`
2. Create a Script Record (Customization > Scripting > Scripts > New)
3. Deploy to the target form or record type

## Deployment (SDF)

```bash
npm install -g @oracle/suitecloud-cli
suitecloud project:create
suitecloud project:deploy
```
