// Mock global fungsi 'define' agar file SuiteScript 2.1 bisa di-load oleh Jest.
// Karena SuiteScript menggunakan pola AMD (define), kita perlu menyimpan hasil
// callback-nya ke global.__ssModule agar bisa diakses oleh test setelah require().
global.define = (dependencies, callback) => {
  const mocks = dependencies.map((dep) => {
    if (dep === "N/log") return require("./mocks/N/log.js");
    if (dep === "N/ui/dialog") return require("./mocks/N/ui.js").dialog;
    return {};
  });
  const result = callback(...mocks);
  // Simpan ke global agar test bisa mengaksesnya
  global.__ssModule = result;
  return result;
};
