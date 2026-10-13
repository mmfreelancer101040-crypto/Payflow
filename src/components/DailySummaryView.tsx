import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { getTranslation } from '../utils/translations';
import { 
  formatCurrency, 
  formatDate, 
  getTodayDateString, 
  downloadCSV 
} from '../utils/formatters';
import { computeDailyMetrics } from '../utils/calculations';
import { 
  CalendarDays, 
  Printer, 
  Download, 
  CheckCircle, 
  AlertCircle, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Coins, 
  TrendingUp, 
  Scale, 
  FileText 
} from 'lucide-react';

export const DailySummaryView: React.FC = () => {
  const { 
    transactions, 
    expenses, 
    cashMovements, 
    reconciliations, 
    settings, 
    language, 
    openReceipt 
  } = useApp();

  const t = getTranslation(language);
  const today = getTodayDateString();
  const [selectedDate, setSelectedDate] = useState<string>(today);

  // Quick dates
  const yesterdayDateStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  }, []);

  // Check if a reconciliation exists for selected date
  const dayReconciliation = useMemo(() => {
    return reconciliations.find(r => r.date === selectedDate);
  }, [reconciliations, selectedDate]);

  // Compute daily metrics for selectedDate
  const metrics = useMemo(() => {
    const opening = dayReconciliation ? dayReconciliation.openingCash : 2500000;
    return computeDailyMetrics(transactions, expenses, cashMovements, selectedDate, opening);
  }, [transactions, expenses, cashMovements, selectedDate, dayReconciliation]);

  // Day transactions
  const dayTransactions = useMemo(() => {
    return transactions.filter(t => t.date === selectedDate);
  }, [transactions, selectedDate]);

  // Day expenses
  const dayExpenses = useMemo(() => {
    return expenses.filter(e => e.date === selectedDate);
  }, [expenses, selectedDate]);

  const handlePrintDailyReport = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const summaryRows = [
      ['Metric', 'Value', 'Currency'],
      ['Report Date', selectedDate, ''],
      ['Total Transfers', metrics.totalTransfers, 'count'],
      ['Completed Transfers', metrics.completedTransfers, 'count'],
      ['Pending Transfers', metrics.pendingTransfers, 'count'],
      ['Total Transfer Volume', metrics.totalTransferVolume, settings.defaultCurrency],
      ['Total Money Received', metrics.totalMoneyReceived, settings.defaultCurrency],
      ['Total Money Paid Out', metrics.totalMoneyPaidOut, settings.defaultCurrency],
      ['Total Service Fees Earned', metrics.totalServiceFeesEarned, settings.defaultCurrency],
      ['Total Operating Expenses', metrics.totalBusinessExpenses, settings.defaultCurrency],
      ['Net Operating Profit', metrics.netProfit, settings.defaultCurrency],
      ['Opening Cash Balance', metrics.openingCashBalance, settings.defaultCurrency],
      ['Expected Closing Cash', metrics.expectedClosingCash, settings.defaultCurrency],
      ['Actual Counted Cash', dayReconciliation?.actualCountedCash ?? 'Not Reconciled', settings.defaultCurrency],
      ['Variance / Difference', dayReconciliation?.difference ?? 0, settings.defaultCurrency],
    ];

    downloadCSV(`daily_summary_${selectedDate}.csv`, summaryRows);
  };

  return (
    <div className="space-y-6">
      {/* Title & Date Picker Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 no-print">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            {t.dailySummary}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === 'mm'
              ? 'ရက်စွဲအလိုက် ငွေကြေးအကျဉ်းချုပ်နှင့် စာရင်းကိုင်အစီရင်ခံစာ'
              : 'End-of-day financial close, transfer breakdown, and cash verification report'}
          </p>
        </div>

        {/* Date Selector & Print Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Date Pills */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
            <button
              onClick={() => setSelectedDate(today)}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                selectedDate === today ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setSelectedDate(yesterdayDateStr)}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                selectedDate === yesterdayDateStr ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Yesterday
            </button>
          </div>

          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono-numbers bg-white"
          />

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>{t.exportCSV}</span>
          </button>

          <button
            onClick={handlePrintDailyReport}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{t.printReport}</span>
          </button>
        </div>
      </div>

      {/* PRINT-FRIENDLY CONTAINER */}
      <div className="print-area space-y-6">
        {/* Printable Letterhead (Shown in print mode or standard) */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {language === 'mm' ? settings.businessNameMm : settings.businessNameEn}
              </h2>
              <div className="text-xs text-slate-500 mt-0.5">
                Daily Financial Summary Report · နေ့စဉ်ဘဏ္ဍာရေးအစီရင်ခံစာ
              </div>
              <div className="text-[11px] text-slate-400 font-mono-numbers mt-0.5">
                Address: {settings.addressEn} · Tel: {settings.phone}
              </div>
            </div>
            <div className="text-left sm:text-right mt-2 sm:mt-0 font-mono-numbers">
              <div className="text-xs font-bold text-slate-800">
                DATE: {formatDate(selectedDate)}
              </div>
              <div className="text-[11px] text-slate-500">
                Currency: {settings.defaultCurrency}
              </div>
              <div className="text-[10px] text-slate-400">
                Reg No: {settings.regNo}
              </div>
            </div>
          </div>

          {/* Key Metrics Strip for the Day */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-b border-slate-200 font-mono-numbers text-xs">
            <div>
              <div className="text-slate-500 text-[11px] font-sans">Total Transfers</div>
              <div className="text-lg font-bold text-slate-900 mt-0.5">{metrics.totalTransfers}</div>
              <div className="text-[10px] text-slate-400 font-sans">
                {metrics.completedTransfers} completed · {metrics.pendingTransfers} pending
              </div>
            </div>

            <div>
              <div className="text-slate-500 text-[11px] font-sans">Transfer Volume</div>
              <div className="text-lg font-bold text-slate-900 mt-0.5">
                {formatCurrency(metrics.totalTransferVolume, settings.defaultCurrency)}
              </div>
              <div className="text-[10px] text-slate-400 font-sans">Trust funds processed</div>
            </div>

            <div>
              <div className="text-slate-500 text-[11px] font-sans">Service Fees (Gross)</div>
              <div className="text-lg font-bold text-blue-700 mt-0.5">
                {formatCurrency(metrics.totalServiceFeesEarned, settings.defaultCurrency)}
              </div>
              <div className="text-[10px] text-slate-400 font-sans">Commissions earned</div>
            </div>

            <div>
              <div className="text-slate-500 text-[11px] font-sans">Net Operating Profit</div>
              <div className={`text-lg font-extrabold mt-0.5 ${
                metrics.netProfit >= 0 ? 'text-emerald-700' : 'text-red-600'
              }`}>
                {formatCurrency(metrics.netProfit, settings.defaultCurrency)}
              </div>
              <div className="text-[10px] text-slate-400 font-sans">
                Expenses: {formatCurrency(metrics.totalBusinessExpenses, settings.defaultCurrency)}
              </div>
            </div>
          </div>

          {/* Cash Drawer Balancing for Selected Date */}
          <div className="py-4 border-b border-slate-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3 flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-blue-600" />
              <span>Cash Drawer Audit & Reconciliation (ငွေစာရင်းကိုက်ညှိမှု)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono-numbers text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[11px] font-sans text-slate-500 block">Opening Cash:</span>
                <span className="text-sm font-bold text-slate-900">
                  {formatCurrency(metrics.openingCashBalance, settings.defaultCurrency)}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[11px] font-sans text-slate-500 block">Expected Closing Cash:</span>
                <span className="text-sm font-bold text-blue-700">
                  {formatCurrency(metrics.expectedClosingCash, settings.defaultCurrency)}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[11px] font-sans text-slate-500 block">Actual Counted Cash:</span>
                <span className="text-sm font-bold text-slate-900">
                  {dayReconciliation
                    ? formatCurrency(dayReconciliation.actualCountedCash, settings.defaultCurrency)
                    : 'Pending Audit'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[11px] font-sans text-slate-500 block">Reconciliation Variance:</span>
                {dayReconciliation ? (
                  <span className={`text-sm font-bold ${
                    dayReconciliation.difference === 0 ? 'text-emerald-700' : 'text-red-600'
                  }`}>
                    {dayReconciliation.difference === 0
                      ? 'Balanced (0 Ks)'
                      : `${formatCurrency(dayReconciliation.difference, settings.defaultCurrency)}`}
                  </span>
                ) : (
                  <span className="text-xs text-amber-600 font-sans">Not closed yet</span>
                )}
              </div>
            </div>
          </div>

          {/* Transactions on Selected Date Table */}
          <div className="pt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2">
              Transactions on {formatDate(selectedDate)} ({dayTransactions.length})
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border border-slate-200">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-2">Voucher #</th>
                    <th className="p-2">Time</th>
                    <th className="p-2">Sender</th>
                    <th className="p-2">Receiver</th>
                    <th className="p-2 text-right">Transfer Amount</th>
                    <th className="p-2 text-right">Fee</th>
                    <th className="p-2 text-right">Total Paid</th>
                    <th className="p-2 text-center">Status</th>
                    <th className="p-2 text-center no-print">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono-numbers">
                  {dayTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-6 text-center text-slate-400 font-sans">
                        No transactions recorded on this date.
                      </td>
                    </tr>
                  ) : (
                    dayTransactions.map(tx => (
                      <tr key={tx.id} className="hover:bg-slate-50/50">
                        <td className="p-2 font-semibold text-slate-900">{tx.id}</td>
                        <td className="p-2 text-slate-500">{tx.time}</td>
                        <td className="p-2 font-sans font-medium text-slate-900">{tx.senderName}</td>
                        <td className="p-2 font-sans font-medium text-slate-900">{tx.receiverName}</td>
                        <td className="p-2 text-right font-medium">
                          {formatCurrency(tx.sendAmount, tx.sendCurrency)}
                        </td>
                        <td className="p-2 text-right text-blue-700 font-semibold">
                          {formatCurrency(tx.serviceFee, tx.sendCurrency)}
                        </td>
                        <td className="p-2 text-right font-bold text-slate-900">
                          {formatCurrency(tx.totalCollectedFromSender, tx.sendCurrency)}
                        </td>
                        <td className="p-2 text-center font-sans">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            tx.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {tx.status}
                          </span>
                        </td>
                        <td className="p-2 text-center no-print font-sans">
                          <button
                            onClick={() => openReceipt(tx)}
                            className="text-blue-600 hover:underline font-medium text-[11px]"
                          >
                            Print
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Operating Expenses on Selected Date */}
          {dayExpenses.length > 0 && (
            <div className="pt-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2">
                Business Expenses on {formatDate(selectedDate)} ({dayExpenses.length})
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border border-slate-200">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-2">Expense ID</th>
                      <th className="p-2">Category</th>
                      <th className="p-2">Description</th>
                      <th className="p-2">Method</th>
                      <th className="p-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono-numbers">
                    {dayExpenses.map(e => (
                      <tr key={e.id}>
                        <td className="p-2 text-slate-600">{e.id}</td>
                        <td className="p-2 font-sans font-medium text-slate-900">{e.category}</td>
                        <td className="p-2 font-sans text-slate-600">{e.description}</td>
                        <td className="p-2 font-sans text-slate-600">{e.paymentMethod}</td>
                        <td className="p-2 text-right font-bold text-red-600">
                          {formatCurrency(e.amount, settings.defaultCurrency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Verification Signatures at bottom of daily report */}
          <div className="grid grid-cols-2 gap-8 pt-8 mt-6 border-t border-slate-200 text-xs text-center">
            <div>
              <div className="border-b border-slate-400 pb-8 mb-1"></div>
              <div className="font-semibold text-slate-800">Cashier / Staff In Charge</div>
              <div className="text-[10px] text-slate-400">Date: {formatDate(selectedDate)}</div>
            </div>
            <div>
              <div className="border-b border-slate-400 pb-8 mb-1"></div>
              <div className="font-semibold text-slate-800">Manager / Auditor Verification</div>
              <div className="text-[10px] text-slate-400">Signed & Stamped</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
