/**
 * jest.setup.js
 *
 * Global AMD define() polyfill for Jest.
 *
 * SuiteScript 2.1 uses AMD (Asynchronous Module Definition) pattern — the
 * `define()` function is provided by the NetSuite runtime but does NOT exist
 * in Node.js. This polyfill intercepts `define()` calls, resolves the declared
 * dependencies to their mock counterparts, then invokes the factory callback
 * and stores the result in `global.__ssModule` so test files can access it.
 *
 * Usage in tests:
 *   require("../../src/scripts/my_script_cs.js");
 *   const { myFunction } = global.__ssModule;
 */
global.define = (dependencies, callback) => {
  const resolved = dependencies.map((dep) => {
    switch (dep) {
      case "N/log":
        return require("./mocks/N/log.js");
      case "N/ui/dialog":
        return require("./mocks/N/ui.js").dialog;
      // Extend this switch as you add more mocks:
      // case "N/record":   return require("./mocks/N/record.js");
      // case "N/search":   return require("./mocks/N/search.js");
      // case "N/runtime":  return require("./mocks/N/runtime.js");
      default:
        return {};
    }
  });

  const result = callback(...resolved);
  global.__ssModule = result;
  return result;
};
