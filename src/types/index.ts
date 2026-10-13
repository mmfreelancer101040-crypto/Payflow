export type TransferStatus = 'Pending' | 'Processing' | 'Completed' | 'Cancelled' | 'Refunded';

export type PaymentMethod = 
  | 'Cash' 
  | 'Bank Transfer' 
  | 'KBZPay' 
  | 'WavePay' 
  | 'CBPay' 
  | 'AYA Pay' 
  | 'KPay' 
  | 'Mobile Wallet' 
  | 'Other';

export interface CurrencyConfig {
  code: string;
  name: string;
  symbol: string;
  rateToDefault: number; // e.g. 1 USD = 4500 MMK, 1 THB = 135 MMK
}

export interface Transaction {
  id: string; // e.g. TRX-20261013-4B91
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  senderName: string;
  senderPhone: string;
  senderLocation: string;
  receiverName: string;
  receiverPhone: string;
  receiverLocation: string;
  sendAmount: number;
  sendCurrency: string;
  exchangeRate: number; // default 1.0 if same currency
  receiveAmount: number;
  receiveCurrency: string;
  serviceFee: number;
  feePaidBy: 'sender' | 'deduct_from_receiver';
  totalCollectedFromSender: number; // sendAmount + fee (or sendAmount if deducted)
  payoutToReceiver: number; // receiveAmount
  paymentMethod: PaymentMethod;
  payoutMethod: PaymentMethod;
  status: TransferStatus;
  handledBy: string;
  notes?: string;
  refundReason?: string;
  refundDate?: string;
  refundAmount?: number;
  refundFeeRetained?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string; // EXP-20261013-102
  date: string; // YYYY-MM-DD
  category: 
    | 'Rent'
    | 'Salaries'
    | 'Electricity & Utilities'
    | 'Transportation'
    | 'Internet & Communication'
    | 'Office Supplies'
    | 'Bank & Service Charges'
    | 'Maintenance'
    | 'Other';
  amount: number;
  paymentMethod: PaymentMethod;
  description: string;
  recordedBy: string;
  createdAt: string;
}

export interface CashMovement {
  id: string;
  date: string; // YYYY-MM-DD
  type: 
    | 'Opening Balance'
    | 'Deposit to Bank'
    | 'Withdrawal from Bank'
    | 'Capital In'
    | 'Owner Drawing'
    | 'Drawer Adjustment';
  amount: number;
  fromAccount: 'Cash Drawer' | 'Bank Account' | 'KBZPay' | 'WavePay' | 'Capital';
  toAccount: 'Cash Drawer' | 'Bank Account' | 'KBZPay' | 'WavePay' | 'Capital';
  notes: string;
  recordedBy: string;
  createdAt: string;
}

export interface CashReconciliation {
  id: string;
  date: string; // YYYY-MM-DD
  openingCash: number;
  cashCollectedFromTransfers: number;
  cashPaidOutForTransfers: number;
  cashExpenses: number;
  bankDeposits: number;
  bankWithdrawals: number;
  expectedClosingCash: number;
  actualCountedCash: number;
  difference: number; // actualCountedCash - expectedClosingCash (over / short)
  notes?: string;
  reconciledBy: string;
  createdAt: string;
}

export type UserRole = 'admin' | 'staff';

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  passwordHash: string;
  phone?: string;
  active: boolean;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  entityType: 'transaction' | 'expense' | 'cash_movement' | 'reconciliation' | 'settings' | 'user' | 'system';
  entityId?: string;
}

export interface BusinessSettings {
  businessNameEn: string;
  businessNameMm: string;
  addressEn: string;
  addressMm: string;
  phone: string;
  email: string;
  regNo: string;
  defaultCurrency: string;
  supportedCurrencies: CurrencyConfig[];
  defaultServiceFeePercent: number;
  minimumServiceFee: number;
  receiptFooterNoteEn: string;
  receiptFooterNoteMm: string;
  paperSizeDefault: 'thermal' | 'a4';
}

export interface DailySummaryData {
  date: string;
  totalTransfers: number;
  completedTransfers: number;
  pendingTransfers: number;
  cancelledTransfers: number;
  refundedTransfers: number;
  totalTransferVolume: number; // pure transfer volume principal
  totalMoneyReceived: number; // all collected from senders
  totalMoneyPaidOut: number; // all paid to receivers
  totalServiceFeesEarned: number; // true gross revenue
  totalBusinessExpenses: number; // true expenses
  netProfit: number; // service fees - expenses
  cashInHandDrawer: number;
  openingCashBalance: number;
  expectedClosingCash: number;
  pendingLiabilities: number; // pending payouts
}

export interface MonthlySummaryData {
  year: number;
  month: number; // 1-12
  monthName: string;
  totalTransfers: number;
  completedTransfers: number;
  pendingTransfers: number;
  cancelledTransfers: number;
  refundedTransfers: number;
  totalTransferVolume: number;
  totalMoneyReceived: number;
  totalMoneyPaidOut: number;
  totalServiceFeesEarned: number;
  totalBusinessExpenses: number;
  netProfit: number;
  previousMonthVolume?: number;
  previousMonthProfit?: number;
}

export type Language = 'en' | 'mm';

export type NavTab = 
  | 'dashboard'
  | 'transactions'
  | 'financial_ledger'
  | 'daily_summary'
  | 'monthly_summary'
  | 'expenses'
  | 'cash_reconciliation'
  | 'reports_export'
  | 'audit_log'
  | 'settings'
  | 'automated_tests';
