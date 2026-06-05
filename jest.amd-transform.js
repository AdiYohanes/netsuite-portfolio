/**
 * jest.amd-transform.js
 *
 * A minimal Jest code transform that makes AMD define() files compatible
 * with CommonJS require(). It wraps the file content so that the value
 * returned by define() is also assigned to module.exports, making direct
 * require() calls return the module's public API instead of undefined.
 */
module.exports = {
  process(sourceCode) {
    // Prepend a local define() wrapper that captures the return value and
    // assigns it to module.exports, then falls back to the global polyfill.
    const wrapper = `
var __define_orig = global.define;
var define = function(deps, factory) {
  var result = __define_orig(deps, factory);
  module.exports = result;
  return result;
};
`;
    return { code: wrapper + sourceCode };
  },
};
