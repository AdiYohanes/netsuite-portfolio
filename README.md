# 💼 NetSuite Developer Portfolio

> A collection of SuiteScript 2.1 projects demonstrating real-world NetSuite customizations, built with clean code principles and unit testing.

---

## 👋 About Me

Halo! Saya **Adi Yohanes**, seorang NetSuite Developer / Technical Consultant yang berfokus pada pengembangan otomatisasi bisnis dan kustomisasi ERP menggunakan SuiteScript 2.1.

Repository ini merupakan portofolio saya yang terus berkembang — setiap proyek dirancang untuk menyelesaikan kebutuhan bisnis nyata dengan kode yang bersih, terstruktur, dan telah diuji.

---

## 🗂️ Project Structure

```
NetSuite-Portfolio-ExpenseSystem/
├── src/
│   ├── 01_ClientScript/        # Client-side validations & UI logic
│   ├── 02_UserEvent/           # Server-side record event automation
│   ├── 03_Suitelet/            # Custom UI pages & external integrations
│   └── 04_MapReduce/           # Bulk data processing scripts
├── tests/                      # Jest unit tests (mirrors src/ structure)
├── mocks/N/                    # NetSuite API mocks for testing
├── jest.config.js
├── jest.setup.js
└── package.json
```

---

## 📋 Projects

### 1. ✅ Expense Approval System — Client Script

**Status:** Complete

Validasi real-time pada form Expense Report untuk mencegah input yang tidak valid sebelum record disimpan.

| Feature        | Detail                                   |
| -------------- | ---------------------------------------- |
| Script Type    | Client Script (`saveRecord`)             |
| Validation     | Amount tidak boleh negatif               |
| Validation     | Amount tidak boleh melebihi Rp 5.000.000 |
| Error Handling | Try/catch dengan `N/log` logging         |
| UI Feedback    | Dialog alert via `N/ui/dialog`           |
| Test Coverage  | Jest unit tests (passing ✅)             |

📁 Source: [`src/01_ClientScript/validate_expenses_cs.js`](./src/01_ClientScript/validate_expenses_cs.js)
🧪 Test: [`tests/validate_expenses_cs.test.js`](./tests/validate_expenses_cs.test.js)

---

### 2. 🔜 Expense Approval — User Event Script

**Status:** Coming Soon

Otomatisasi perubahan status Expense Report berdasarkan approval workflow menggunakan `beforeSubmit` dan `afterSubmit` events.

📁 Location: `src/02_UserEvent/`

---

### 3. 🔜 Expense Dashboard — Suitelet

**Status:** Coming Soon

Custom approval dashboard menggunakan `N/ui/serverWidget` untuk Approver Manager, lengkap dengan filter dan list view.

📁 Location: `src/03_Suitelet/`

---

### 4. 🔜 Bulk Expense Processor — Map/Reduce

**Status:** Coming Soon

Script pemrosesan massal untuk menangani ratusan Expense Report sekaligus menggunakan arsitektur Map/Reduce NetSuite.

📁 Location: `src/04_MapReduce/`

---

## 🛠️ Tech Stack

| Technology   | Version | Purpose                |
| ------------ | ------- | ---------------------- |
| SuiteScript  | 2.1     | NetSuite scripting API |
| Node.js      | ≥ 18.x  | Runtime untuk testing  |
| Jest         | ^30.x   | Unit testing framework |
| NetSuite SDF | —       | Deployment toolchain   |

---

## 🧪 Testing with Jest

Setiap script dikembangkan menggunakan pendekatan **Test-Driven Development (TDD)**. Unit test ditulis sebelum atau bersamaan dengan implementasi untuk memastikan behavior yang benar sebelum deploy ke NetSuite.

### How It Works

Karena SuiteScript berjalan di runtime NetSuite, pengujian lokal membutuhkan **mock** untuk modul NetSuite (`N/log`, `N/ui/dialog`, dll). Mock ini tersimpan di folder `mocks/N/`.

```
mocks/
└── N/
    ├── log.js        # Mock untuk N/log
    └── ui.js         # Mock untuk N/ui/dialog
```

### Run Tests

```bash
# 1. Clone repository
git clone https://github.com/YOUR_USERNAME/NetSuite-Portfolio-ExpenseSystem.git
cd NetSuite-Portfolio-ExpenseSystem

# 2. Install dependencies
npm install

# 3. Jalankan semua test
npm test

# 4. Jalankan dengan coverage report
npm test -- --coverage
```

### Test Results (Current)

```
PASS  tests/validate_expenses_cs.test.js
  saveRecord Validation
    ✓ should return false and show alert for negative amount
    ✓ should return false and show alert for amount exceeding limit
    ✓ should return true for valid amount
    ✓ should handle non-numeric input gracefully
    ✓ should return false on error and log it

Test Suites: 1 passed, 1 total
Tests:       5 passed, 5 total
```

---

## ✅ Best Practices Applied

- **SuiteScript 2.1** — menggunakan `define()` dan arrow functions (ES6+)
- **JSDoc** — setiap file dan fungsi didokumentasikan dengan JSDoc lengkap
- **Error Handling** — semua fungsi dibungkus try/catch dengan logging via `N/log`
- **Unit Testing** — Jest test untuk setiap logic path sebelum deploy
- **Naming Convention** — file suffix `_cs`, `_ue`, `_sl`, `_mr` sesuai standar komunitas SuiteScript
- **Separation of Concerns** — setiap script fokus pada satu tanggung jawab

---

## 🚀 Deploy to NetSuite

### Manual Upload (Quick Deploy)

1. Login ke NetSuite → **Customization > Scripting > Scripts > New**
2. Upload file `.js` ke **File Cabinet** (`SuiteScripts/` folder)
3. Buat Script Record, pilih Script Type yang sesuai
4. Deploy ke form yang ditargetkan

### Via SuiteCloud Development Framework (SDF)

```bash
# Install SuiteCloud CLI
npm install -g @oracle/suitecloud-cli

# Initialize project
suitecloud project:create

# Deploy ke account
suitecloud project:deploy
```

---

## 📸 Screenshots & Documentation

_Coming soon — screenshots akan ditambahkan setelah UI testing di NetSuite sandbox._

| Script                               | Screenshot      |
| ------------------------------------ | --------------- |
| Expense Validation (negative amount) | _(placeholder)_ |
| Expense Validation (over limit)      | _(placeholder)_ |
| Expense Dashboard Suitelet           | _(placeholder)_ |

---

## 📬 Contact

| Platform    | Link                                                                   |
| ----------- | ---------------------------------------------------------------------- |
| 💼 LinkedIn | [linkedin.com/in/YOUR_LINKEDIN](https://linkedin.com/in/YOUR_LINKEDIN) |
| 📧 Email    | your.email@example.com                                                 |
| 🐙 GitHub   | [github.com/YOUR_USERNAME](https://github.com/YOUR_USERNAME)           |

---

## ⚠️ Disclaimer

> Repository ini dibuat untuk tujuan **edukasi dan portofolio** pribadi. Script-script di sini merupakan implementasi yang dikembangkan berdasarkan kebutuhan bisnis umum dan best practices SuiteScript.
>
> Kode ini **tidak berafiliasi** dengan Oracle NetSuite. Gunakan dengan bijak dan selalu lakukan testing di **Sandbox** sebelum deploy ke Production.

---

<p align="center">Made with ☕ by Adi Yohanes | NetSuite Developer</p>
