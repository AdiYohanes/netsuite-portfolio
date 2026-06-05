// Import modul mock kita
const dialogMock = require("../mocks/N/ui.js").dialog;
const logMock = require("../mocks/N/log.js");

// Import file SuiteScript kita.
// SuiteScript menggunakan pola AMD (define()), sehingga require() tidak langsung
// mengembalikan module-nya. Kita perlu trigger require() terlebih dahulu agar
// global.define di jest.setup.js dieksekusi, lalu ambil hasilnya dari global.__ssModule.
require("../src/01_ClientScript/validate_expenses_cs.js");
const myClientScript = global.__ssModule;

describe("Validate Expense Amount Value", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Error in negative value ", () => {
    // Input
    const mockContext = {
      currentRecord: {
        getValue: jest.fn().mockReturnValue("-50000"), // Simulasikan user input -50000
      },
    };

    // Call the Function
    const result = myClientScript.saveRecord(mockContext);

    // Result
    expect(result).toBe(false);
    expect(dialogMock.alert).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Validation Failed",
      }),
    );
  });

  it("Amount Valid ", () => {
    // Input
    const mockContext = {
      currentRecord: {
        getValue: jest.fn().mockReturnValue("1000000"),
      },
    };

    // Call the Function
    const result = myClientScript.saveRecord(mockContext);

    expect(result).toBe(true);
    expect(dialogMock.alert).not.toHaveBeenCalled();
  });
  it("HARUS MENANGKAP ERROR dan return false jika terjadi masalah sistem", () => {
    const mockContext = {
      currentRecord: {
        // Simulasikan error: getValue melempar error
        getValue: jest.fn().mockImplementation(() => {
          throw new Error("Field tidak ditemukan");
        }),
      },
    };

    const result = myClientScript.saveRecord(mockContext);

    expect(result).toBe(false);
    expect(logMock.error).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Error CS Validation",
      }),
    ); // Memastikan error tercatat di log
  });
});
