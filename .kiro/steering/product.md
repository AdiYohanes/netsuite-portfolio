# Product Overview

This is a **NetSuite Developer Portfolio** — a collection of SuiteScript 2.1 projects demonstrating real-world NetSuite ERP customizations.

## Current Project: Expense Approval System

Automates and validates the Expense Report record in NetSuite across multiple script types:

- **Client Script** — Real-time form validation before save (complete)
- **User Event Script** — Status automation via `beforeSubmit`/`afterSubmit` (coming soon)
- **Suitelet** — Custom approval dashboard for managers (coming soon)
- **Map/Reduce Script** — Bulk processing of Expense Reports (coming soon)

## Business Rules (Expense Validation)

- Expense amount must not be negative
- Expense amount must not exceed Rp 5,000,000
- Invalid input triggers a dialog alert and cancels the save
- System errors are caught, logged via `N/log`, and cancel the save

## Audience

This codebase is a personal portfolio project for learning and demonstrating SuiteScript best practices. It is not affiliated with Oracle NetSuite.
