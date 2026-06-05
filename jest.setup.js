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
    // N/ui/dialog needs special handling: the mock exports { dialog: { alert } }
    // but SuiteScript receives just the dialog object (with .alert, .confirm, etc.)
    if (dep === "N/ui/dialog") {
      return require("N/ui/dialog").dialog;
    }

    // All other deps (N/* modules and relative paths like ../modules/SomeDAO)
    // are resolved through Jest's require() so moduleNameMapper applies.
    try {
      return require(dep);
    } catch (e) {
      return {};
    }
  });

  const result = callback(...resolved);
  global.__ssModule = result;
  return result;
};
