# PayFlow - Professional Money Transfer Management System
### ပရော်ဖက်ရှင်နယ် ငွေလွှဲနှင့် ဘဏ္ဍာရေးစာရင်းကိုင်စနစ်

PayFlow is a production-grade Money Transfer and Remittance Management System designed for money transfer service businesses and currency exchange agencies. It provides complete day-to-day transaction records, strict segregation of customer transfer volume from actual business income, daily drawer cash reconciliation, monthly financial summaries, receipt printing (80mm POS & A4), bilingual English and Myanmar support, and audit trails.

---

## 🌟 Key Features

### 1. Dashboard & Real-Time Performance
- **Transfers Today**: Total count and real-time processing statuses.
- **Transfer Volume (Custodial Funds)**: Real-time calculation of total money moved across branches.
- **Service Fee Income (Actual Revenue)**: Strict segregation of agency commissions as true business earnings.
- **Net Operating Profit**: Automatically computed as `Service Fee Revenue - Operating Expenses`.
- **Cash in Drawer & Bank Balances**: Accurate liquid cash and mobile wallet (KBZPay, WavePay, etc.) accounts.
- **Pending Liabilities**: Outstanding payouts yet to be disbursed to recipients.

### 2. Customer & Money Transfer Records
- **Unique Transaction ID**: Auto-generated format `TRX-YYYYMMDD-XXXX`.
- **Comprehensive Fields**: Sender and Receiver names, phones, origin and destination cities, principal amounts, currency, exchange rates, fee distribution, payment and payout methods, handling staff, and notes.
- **Fee Handling Modes**:
  - *Sender pays fee*: Transfer Amount + Service Fee = Total Collected from Sender.
  - *Deduct from receiver*: Service Fee deducted from recipient payout.
- **Status Lifecycle**: `Pending` ➔ `Processing` ➔ `Completed`, with audit-protected `Refunded` (with mandatory reason) or `Cancelled`.
- **Instant Receipt Generation**: Print 80mm thermal receipt or A4 voucher upon saving.

### 3. Clear Financial Accounting & Integrity
- **Zero Double-Counting**: Money transferred is recorded strictly as custodial transit volume, **never** treated as business profit.
- **Bank & Cash Movements**: Record cash deposits to banks, drawer cash replenishments, and capital adjustments.
- **Daily Cash Drawer Balancing**:
  $$\text{Expected Closing Cash} = \text{Opening} + \text{Cash Received} - \text{Cash Paid Out} - \text{Cash Expenses} - \text{Bank Deposits} + \text{Bank Withdrawals}$$
- **Discrepancy / Variance Audit**: Real-time comparison between calculated expected cash and physically counted cash in the drawer (with banknote denomination counter).

### 4. Daily & Monthly Statements
- **Daily Summary**: Select any date to view transfer breakdowns, fee income, business expenses, net profit, and drawer audit.
- **Monthly Summary**: Month-over-month comparisons (% volume and profit growth), day-by-day table across the month, and status breakdown.
- **Print & Export**: Printable formatted reports and instant CSV/Excel downloads.

### 5. Operating Expenses
- Categorize overhead costs: Rent, Salaries, Electricity & Utilities, Transportation, Internet & Phone, Office Supplies, Maintenance, and Bank Charges.
- Daily and monthly expense aggregation.

### 6. User Roles & Security (RBAC)
- **Administrator (Manager)**: Full access, view net profits, authorize refunds and reversals with reason, manage users, adjust settings, delete records.
- **Staff (Cashier / Counter)**: Add transactions, search records, update transit status, print receipts, perform daily drawer counts.
- **Audit Trail**: Immutable system log recording every critical action with user, timestamp, and details.
- **Hashed Passwords**: Client-side hash representation for all accounts.

### 7. Bilingual Interface
- One-click toggle between **English** and **Myanmar (မြန်မာဘာသာ)** with localized financial labels and receipts.

---

## 👥 Default Accounts

| Role | Username | Password | Full Name |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | `admin123` | U Myo Min (Manager) |
| **Counter Staff 1** | `staff` | `staff123` | Daw Hla Hla (Counter 1) |
| **Counter Staff 2** | `cashier1` | `cashier123` | Ko Aung Kyaw (Counter 2) |

---

## 🚀 How to Run the Application

### Prerequisites
- Node.js (version 18 or higher)
- npm or yarn

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Development Server
```bash
npm run dev
```
The application will start on `http://localhost:3000`.

### 3. Build for Production
```bash
npm run build
```
This generates production-ready optimized static files in the `dist` directory.

### 4. Run Automated Financial Tests
Open the app and navigate to **"Automated Tests"** in the sidebar, then click **"Run All Test Suites"**.
All 10 mathematical and architectural assertions will execute in real-time verifying:
1. Transfer fee calculation accuracy.
2. Receiver fee deduction arithmetic.
3. Foreign exchange conversion rates.
4. Transfer volume vs revenue segregation.
5. Net operating profit formulas.
6. Cash drawer balancing formulas with 0-variance integrity.
7. Refund and reversal consistency.
8. Cancelled transaction isolation.
9. Floating-point precision safety.
10. Role-based authorization rules.

---

## 💾 Data Backup & Restore

All transaction data, cash movements, reconciliation records, user accounts, and business settings are stored locally in the browser with automatic persistence (`localStorage`).

- **To Export Backup**: Go to **Settings** ➔ Click **"Download Backup JSON"**. A timestamped `.json` file containing the complete database is saved to your computer.
- **To Restore Backup**: Go to **Settings** ➔ Click **"Restore from Backup File"** ➔ Select your previously downloaded `.json` file.
- **To Reset Demo Data**: Go to **Settings** ➔ Click **"Reset to Realistic Demo Data"**.

---

## 📄 Legal Notice
This application is designed as an internal management ledger and recordkeeping system. Operations involving cross-border remittances, foreign exchange, and money transmission are subject to local financial regulatory licensing, AML/CFT compliance, and legal frameworks in the operating country.
