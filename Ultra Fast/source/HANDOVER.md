# Ultra Fast – Factory Management System · Frontend Handover

Frontend-only prototype (HTML5, CSS3, Bootstrap 5, vanilla JS, Bootstrap Icons, Chart.js). No build step, no backend. All data is mock and lives in memory; a page reload resets it.

## 1. Run
- Development: open `index.html` (loads Bootstrap, Bootstrap Icons, Chart.js and Google Fonts from CDN – internet needed).
- Offline demo: `Ultra-Fast-FULL.html` (everything inlined except Google Fonts).

## 2. File structure
| File | Purpose |
|---|---|
| `index.html` | Shell: sidebar, header, `#view` (page container), shared modal `#modal`, toast container, progress bar |
| `assets/css/app.css` | Design system (tokens, components, themes, motion, invoice/print styles). Later blocks intentionally override earlier ones (brand palette, motion) |
| `assets/js/brand.js` | Client brand (name, tagline, address, phone, email, logo/wordmark as data URIs) → `window.BRAND` |
| `assets/js/i18n*.js` | Translations. `i18n.js` is the base; `p2…p8` extend it with `Object.assign` per module |
| `assets/js/data.js` | **Mock data layer** (`MOCK`) – replace with API responses |
| `assets/js/app.js` | Shell logic: state `S` (lang, theme, role, range), router (`#/route`), dashboards, charts, skeleton loader, toasts, a11y helper |
| `assets/js/modules.js` | Products & Stock, New Invoice, Customers & Dues; exports shared helpers as `window.UI` |
| `assets/js/modules2.js` | Purchase (local purchases, bills, returns), Import & LC (shipments, landed cost), Suppliers |
| `assets/js/modules3.js` | Accounts & Ledger, Income (factory revenue, scrap sales), Expenses (operating, utilities, payroll), HRM |
| `assets/js/modules4.js` | Reports, Data Import/Export, Settings |
| `assets/js/modules5.js` | Invoice list, A4/thermal print previews, add product/customer/supplier |
| `assets/js/modules6.js` | Edit/delete, add employee, shipment documents |
| `assets/js/modules7.js` | Employee edit, purchase returns |

Pattern: each page registers `window.PAGES.<route> = f => {…}` and renders into `#view`. Click/input handling uses delegation on `data-act` (click) and `data-in` (input) attributes mapped to `UI.ACT` / `UI.IN` handlers.

## 3. Routes and roles
Hash routes: `#/dashboard, products, purchase, import, suppliers, sales, customers, bill-ledger, accounts, income, expenses, loans, hrm, reports, data, logs, settings`.

| Area | Admin | Manager |
|---|---|---|
| Dashboard | Full incl. profit, valuation, cash/bank, payables | Operations only |
| Products & Stock | Full incl. cost, valuation | Quantities only |
| Purchase | Full incl. costs, supplier dues, returns | Received quantity only |
| Import & LC | Full incl. overseas shipments, landed cost | Received quantity only |
| Suppliers, Accounts, Income, Expenses, Loans, Data Import/Export, Logs, Settings | Full | No access (menu hidden, page shows lock) |
| Sales & Invoices, Customers & Dues | Full (profit visible) | Create/print invoices, collect payments (no profit) |
| HRM | Employees, attendance, salary | Attendance only |
| Reports | All categories | Stock, sales, customer dues |

> **Important:** role hiding in this prototype is UI-only. Laravel must enforce it in policies/middleware and never return cost or profit fields to the Manager role.

## 4. Design tokens (CSS variables in `app.css`)
`--primary --on-primary --gold(=brand purple) --gold-soft --accent --navy-chart --bg --surface --surface-2 --border --text --muted --ok --warn --danger --r --r-lg --sh --f-body --f-head`. Theme "Deep Indigo & Aqua" (final block of `app.css`, WCAG-AA checked): light `--primary #4C5BD4`, `--accent #0E9F96`; dark `--primary #8C9BFF`, `--accent #3DDBD0`, `--bg #0E1020`, `--text #EDEFFA`. Client brand colours (teal `#195568`, purple `#8851A2`) are kept on printed invoices. Dark tokens use `:root[data-theme=dark]` so they always win; add any new token to BOTH sets.

Responsive: <768 px bottom nav (`#bnav`) + tables turn into cards (`cardify()` in `app.js` adds `data-label`s) + bottom-sheet modals; 768–991 drawer; 992–1199 icon rail; ≥1600 wider canvas. Touch targets are ≥44 px under 992 px. First visit follows the system dark/light setting.
Fonts: Plus Jakarta Sans (English body), Playfair Display (English headings), Hind Siliguri (Bangla body), Noto Serif Bengali (Bangla headings).

## 5. Language and theme
- `t(key)` reads `I18N[lang][key]`. Add keys to a new/existing `i18n.pN.js` for both `bn` and `en`; never hardcode UI text.
- Persisted in `localStorage`: `fms-lang` (default `bn`), `fms-theme` (default `light`). Theme is applied by an inline script in `<head>` before paint; both `data-theme` and `data-bs-theme` are set on `<html>`.
- Numbers: `bn-BD` / `en-IN` locale formatting, ৳ prefix, lakh/crore short form.

## 6. Mock data (`MOCK`, referenced as `D`)
Relationships are **index-based** (replace with IDs in the real API).
- `products[]`: `{n:{bn,en}, cat, kg, min, cost, price, sold, sku}`
- `customers[]`: `{bn,en,v,due,days,phone,limit}` – `days` = age of oldest due
- `suppliers[]`: `{bn,en,type,cur,payable,phone,tx:[[type 'p'|'m'|'r', amount, [bn,en date]]]}`
- `shipments[]`: `[ref, supplierIdx, productIdx, kg, status, [eta bn,en]]` (+ `.docs` for attachments)
- `invoices[]`: `[no, customerIdx, amount, paid, status, profit, lines[{p,q,pr}]]`
- `daily{sales,coll,purch}` (30 days), `monthly{…}` (12 months), `cashBank{cash,bank,payable}`, `expenses` (total), `cogsRate`
- `exp[]` income/expense entries, `emp[]/empDes[]/att[]` (parallel arrays), `returns[]`, `act[]`, `notifs[]`, `users`

## 7. Backend integration points (suggested Laravel endpoints)
| UI action | Suggested endpoint / rule |
|---|---|
| Login, role | Laravel auth + roles `admin`, `manager`; policies per module |
| Products CRUD, categories | `apiResource products`; opening stock creates a stock-ledger row |
| Stock adjustment | `POST /stock-adjustments` (type, qty, reason) → stock ledger |
| Shipment + purchase entry | `POST /purchases` (foreign currency, rate, LC ref); `POST /shipments/{id}/documents` (file upload) |
| Receive stock | `POST /shipments/{id}/receive` → stock in, **landed cost per KG calculated server-side** |
| Landed cost | `(goods + freight) × duty% + goods + freight + port + clearing + transport + other`, divided by KG. UI formula in `modules2.js` `calc()` |
| Purchase return | `POST /purchase-returns` → stock out, supplier ledger credit |
| Supplier payment | `POST /supplier-payments` (method, foreign-currency support) → ledger + cash/bank |
| Invoice create | `POST /invoices` (lines, discount %, carrying charge, VAT %, payment) → stock out, customer due, ledger, profit from landed cost. UI math in `modules.js` `tot()` |
| Credit-limit warning | Server must re-check limit and old overdue on save |
| Collections | `POST /collections` (cash/bank/cheque/mobile banking), partial allowed (cannot exceed due) |
| Print / PDF | Blade print views (A4 + 80 mm thermal) mirroring `.inv-paper`; PDF via DomPDF/Snappy |
| WhatsApp | Secure invoice link/PDF + `wa.me` deep link (WhatsApp Business API is out of scope per proposal) |
| Vouchers, ledgers, trial balance, P&L, balance sheet | Auto-posting from sales/purchases/collections/payments/expenses; the demo trial balance uses a balancing capital figure and **must not** be treated as accounting logic |
| Income/expense, employees, attendance, salary, payslip | Standard CRUD + monthly salary generation (advance auto-deduction) |
| Reports | `GET /reports/{type}?from&to` + PDF/Excel export (Laravel Excel) |
| Import | Two-step: `POST /imports/validate` (returns row errors) then `POST /imports/commit`; templates per dataset |
| Settings, users | Company profile, logo upload, invoice settings, VAT/currency/exchange rates, user CRUD, password change |
| Delete rules | Block deleting records with transactions (UI already simulates this) |
| Backup, activity log | Required by proposal; no UI built yet |

## 8. Screens implemented
Dashboards (Admin, Manager) · Products & Stock (list, search, filter, sort, pagination, adjust, add/edit/delete) · Purchase & Import (shipments, receive, documents, returns, landed-cost calculator) · Suppliers (directory, statement, payment, add/edit/delete) · Sales & Invoices (list, new invoice, A4/thermal preview, WhatsApp preview) · Customers & Dues (list, collect, reminder, add/edit/delete) · Accounts (trial balance, P&L, customer ledger) · Income & Expenses · HRM (employees add/edit/delete, attendance, salary sheet, payslip) · Reports · Data Import/Export · Settings (company, invoice, preferences, users, account).

## 9. Known limitations
- Mock, in-memory data only; no persistence beyond language/theme.
- PDF export and WhatsApp sending are simulated; Excel export is a real CSV download.
- Accounting screens are UI demonstrations pending backend validation.
- Not built: balance sheet, vouchers (receipt/payment forms), chart of accounts, delivery challan/gate pass, sales returns, stock ledger/movement history, supplier/customer detail pages, backup/restore and activity log, edit for expenses.
- Sidebar group expansion and a global search backend are not implemented (search box is a placeholder with a notice).
- Fonts require internet; no automated test suite; tested manually and with scripted headless-Chrome runs.

## 10. Login, roles, payments, loans and daily reports (latest round)
- **Login** (`auth.js`): mock sign-in (demo password `123456`). Roles and users are stored in `localStorage` key `fms-auth-v1` *only so the demo keeps custom roles between visits* – Laravel auth/roles replace this entirely. Session: `sessionStorage`/`localStorage` key `fms-session`.
- **Roles & permissions** (Settings → Roles & permissions): module access per role, `seeCost` (cost/profit/finance figures) and `cashOnly` flags. System role Admin is locked; custom roles can be added, edited and deleted (not while users are assigned). Users tab: add, activate/deactivate, delete.
- **Payments:** new method `m_adminrecv` (Admin Received (Cash)) tracked in `cashBank.adminCash`. Roles with `cashOnly` (Manager) can only choose cash on invoices and collections – enforce the same rule in the API.
- **Loan Management** (`modules9.js`, route `#/loans`): parties (incl. Admin – personal business), give loan / receive repayment, balance check against cash/bank, per-party and combined Loan Ledger with running balance. Suggested tables: `loan_parties`, `loan_transactions`.
- **Daily reports** (Reports → Daily closing / Daily stock / Daily financial): the numbers are generated deterministically from the mock daily series in `modules9.js`; replace with queries on posted ledger/stock-ledger rows by date. Financial report: Total income = sales + other income; Total expenses = cost of goods + operating expenses; Profit/Loss = difference.
- **Sidebar:** grouped, collapsible groups with an animated active indicator; black in both themes.

## 11. Search, Accounts, HRM, Activity Logs, invoice printing (latest round)
- **Global search** (`search.js`): Ctrl/⌘+K command palette over pages, products, customers, suppliers, employees and invoices, filtered by the signed-in role's permissions. Backend: one `GET /search?q=` endpoint returning grouped results.
- **Accounts** (`modules10.js`): chart of accounts with codes (1001 Cash … 5101–5105 expense heads), live ledger per account, trial balance, P&L, balance sheet, customer ledger. Entries are *derived* from the other modules' mock data; the "balance brought forward" line and the owner's-capital figure are demo balancing items. Production: post double-entry journal rows automatically from sales, collections, expenses, salaries, loans and supplier payments.
- **Expenses → Accounts:** every Income & Expenses entry (and every paid salary) maps to an expense account and appears in that account's ledger.
- **HRM** (`modules11.js`): overview, employees (profile, allowances, status), attendance (daily marking + monthly grid, Friday holiday), leave (balances, apply/approve/reject), payroll (gross, absence/late/advance/other deductions, pay single/all → posts "Salary" expense and reduces cash/bank), advances with instalment auto-deduction, payslip print. Manager sees attendance only. Suggested tables: `employees`, `attendance`, `leave_requests`, `leave_balances`, `salary_structures`, `payroll_runs`, `payroll_items`, `employee_advances`.
- **Activity Logs** (`log.js`, `modules12.js`): every successful save/delete/export toast and every sign-in/out is recorded with user, role, module, time. Prototype stores it in `localStorage` (`fms-logs-v1`); production must write it server-side (e.g. spatie/laravel-activitylog) with before/after values and IP.
- **Printing:** invoices and payslips print through a hidden iframe using the shared `.inv2` styles (`INV_CSS` in `modules5.js`), A4 and 80 mm thermal.
