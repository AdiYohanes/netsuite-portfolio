// Tiruan sederhana dari N/log
module.exports = {
  debug: jest.fn(),
  audit: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(), // Kita akan cek apakah fungsi ini dipanggil saat error
};
