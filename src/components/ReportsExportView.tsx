import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { getTranslation } from '../utils/translations';
import { 
  formatCurrency, 
  getTodayDateString, 
  downloadCSV, 
  formatDate 
} from '../utils/formatters';
import { 
  FileSpreadsheet, 
  Download, 
  Printer, 
  Calendar, 
  FileText, 
  Receipt, 
  Scale, 
  CheckCircle2 
} from 'lucide-react';

export const ReportsExportView: React.FC = () => {
  const { 
    transactions, 
    expenses, 
    cashMovements, 
    reconciliations, 
    settings, 
    language, 
    setActiveTab 
  } = useApp();

  const t = getTranslation(language);
  const today = getTodayDateString();

  // Custom date range for export
  const [startDate, setStartDate] = useState(
    new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(today);

  // 1. Export Transactions in Date Range
  const handleExportTransactions = () => {
    const inRange = transactions.filter(t => t.date >= startDate && t.date <= endDate);
    const headers = [
      'Transaction ID',
      'Date',
      'Time',
      'Sender Name',
      'Sender Phone',
      'Sender Location',
      'Receiver Name',
      'Receiver Phone',
      'Receiver Location',
      'Send Amount',
      'Send Currency',
      'FX Rate',
      'Receive Amount',
      'Receive Currency',
      'Service Fee',
      'Total Collected',
      'Payout Amount',
      'Payment Method',
      'Payout Method',
      'Status',
      'Handled By',
      'Notes',
    ];

    const rows = inRange.map(tx => [
      tx.id,
      tx.date,
      tx.time,
      tx.senderName,
      tx.senderPhone,
      tx.senderLocation,
      tx.receiverName,
      tx.receiverPhone,
      tx.receiverLocation,
      tx.sendAmount,
      tx.sendCurrency,
      tx.exchangeRate,
      tx.receiveAmount,
      tx.receiveCurrency,
      tx.serviceFee,
      tx.totalCollectedFromSender,
      tx.payoutToReceiver,
      tx.paymentMethod,
      tx.payoutMethod,
      tx.status,
      tx.handledBy,
      tx.notes || '',
    ]);

    downloadCSV(`transactions_${startDate}_to_${endDate}.csv`, [headers, ...rows]);
  };

  // 2. Export Expenses in Date Range
  const handleExportExpenses = () => {
    const inRange = expenses.filter(e => e.date >= startDate && e.date <= endDate);
    const headers = ['Expense ID', 'Date', 'Category', 'Amount', 'Payment Method', 'Description', 'Recorded By'];
    const rows = inRange.map(e => [
      e.id,
      e.date,
      e.category,
      e.amount,
      e.paymentMethod,
      e.description,
      e.recordedBy,
    ]);
    downloadCSV(`expenses_${startDate}_to_${endDate}.csv`, [headers, ...rows]);
  };

  // 3. Export Comprehensive Financial Reconciliation
  const handleExportReconciliation = () => {
    const headers = [
      'Reconciliation ID',
      'Date',
      'Opening Cash',
      'Cash Received (Transfers)',
      'Cash Paid Out (Transfers)',
      'Cash Expenses',
      'Bank Deposits',
      'Bank Withdrawals',
      'Expected Closing Cash',
      'Actual Counted Cash',
      'Difference / Variance',
      'Auditor',
      'Notes',
    ];
    const rows = reconciliations.map(r => [
      r.id,
      r.date,
      r.openingCash,
      r.cashCollectedFromTransfers,
      r.cashPaidOutForTransfers,
      r.cashExpenses,
      r.bankDeposits,
      r.bankWithdrawals,
      r.expectedClosingCash,
      r.actualCountedCash,
      r.difference,
      r.reconciledBy,
      r.notes || '',
    ]);
    downloadCSV(`cash_reconciliation_audit_${today}.csv`, [headers, ...rows]);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          {t.reportsExport}
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          {language === 'mm'
            ? 'ဘဏ္ဍာရေးစာရင်းများနှင့် အစီရင်ခံစာများ Excel/CSV ထုတ်ယူခြင်းနှင့် ပုံနှိပ်ခြင်း'
            : 'Download Excel/CSV spreadsheets and print certified audit statements'}
        </p>
      </div>

      {/* Date Range Selection Filter */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs">
        <div>
          <span className="font-bold text-slate-900 block text-sm">Select Export Date Range</span>
          <span className="text-slate-500 text-xs">Filter transactions and expenses for ledger download</span>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono-numbers bg-white"
          />
          <span className="text-slate-400 font-bold">to</span>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono-numbers bg-white"
          />
        </div>
      </div>

      {/* Export Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Transactions Ledger */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center mb-3">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Transaction Ledger</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Export all customer remittances, senders, receivers, exchange rates, service fees, and statuses into a CSV/Excel file.
            </p>
          </div>
          <button
            onClick={handleExportTransactions}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Transactions CSV</span>
          </button>
        </div>

        {/* Card 2: Expense Journal */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center mb-3">
              <Receipt className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Operating Expenses Ledger</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Export detailed breakdown of business operating costs (rent, payroll, electricity, transportation, supplies) with timestamps.
            </p>
          </div>
          <button
            onClick={handleExportExpenses}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Expenses CSV</span>
          </button>
        </div>

        {/* Card 3: Cash Reconciliation Audit */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
              <Scale className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Cash Drawer Reconciliation Audit</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Export official daily cash drawer balancing records, expected cash vs physical cash counted, and variance auditor log.
            </p>
          </div>
          <button
            onClick={handleExportReconciliation}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Reconciliation Audit CSV</span>
          </button>
        </div>
      </div>

      {/* Quick Links to Print Views */}
      <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
        <h3 className="font-bold text-slate-900 text-sm">Printable Formats</h3>
        <p className="text-xs text-slate-600">
          For physical printing, switch to the dedicated report tabs and use the Print button.
          Supports standard A4 paper, thermal receipt printers, and PDF saving through your browser printer dialog.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            onClick={() => setActiveTab('daily_summary')}
            className="px-3.5 py-2 text-xs font-semibold text-blue-700 bg-white border border-blue-200 hover:bg-blue-50 rounded-lg flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Daily Statement</span>
          </button>
          <button
            onClick={() => setActiveTab('monthly_summary')}
            className="px-3.5 py-2 text-xs font-semibold text-blue-700 bg-white border border-blue-200 hover:bg-blue-50 rounded-lg flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Monthly Statement</span>
          </button>
        </div>
      </div>
    </div>
  );
};
