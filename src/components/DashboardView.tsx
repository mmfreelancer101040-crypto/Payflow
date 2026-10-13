import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { getTranslation } from '../utils/translations';
import { getTodayDateString, formatCurrency, formatDate } from '../utils/formatters';
import { computeDailyMetrics, computeMonthlyMetrics } from '../utils/calculations';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  TrendingUp, 
  Coins, 
  Clock, 
  Scale, 
  FileText, 
  Receipt, 
  Plus, 
  CheckCircle,
  Building2,
  Wallet,
  ArrowRight
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const { 
    transactions, 
    expenses, 
    cashMovements, 
    reconciliations, 
    settings, 
    language, 
    setActiveTab, 
    setNewTransferModalOpen, 
    openReceipt 
  } = useApp();

  const t = getTranslation(language);
  const today = getTodayDateString();

  // Reconciled opening cash from yesterday or standard opening balance
  const yesterdayRec = reconciliations[0];
  const openingCash = yesterdayRec ? yesterdayRec.actualCountedCash : 2500000;

  // Daily Metrics
  const dailyMetrics = useMemo(() => {
    return computeDailyMetrics(transactions, expenses, cashMovements, today, openingCash);
  }, [transactions, expenses, cashMovements, today, openingCash]);

  // Current Month Metrics
  const currentMonthMetrics = useMemo(() => {
    const [year, month] = today.split('-').map(Number);
    return computeMonthlyMetrics(transactions, expenses, year, month);
  }, [transactions, expenses, today]);

  // Today's recent transactions (most recent 6)
  const todayTransactions = useMemo(() => {
    return transactions
      .filter(tx => tx.date === today)
      .slice(0, 6);
  }, [transactions, today]);

  // Pending transfers that need attention
  const pendingTransactions = useMemo(() => {
    return transactions.filter(tx => tx.status === 'Pending' || tx.status === 'Processing');
  }, [transactions]);

  // Bank & wallet estimated balances from initial + movements
  const bankAndWalletBalance = useMemo(() => {
    let bal = 8500000; // Base bank reserve
    for (const tx of transactions) {
      if (tx.status === 'Completed') {
        if (tx.paymentMethod === 'Bank Transfer' || tx.paymentMethod === 'KBZPay' || tx.paymentMethod === 'WavePay') {
          bal += tx.totalCollectedFromSender;
        }
        if (tx.payoutMethod === 'Bank Transfer' || tx.payoutMethod === 'KBZPay' || tx.payoutMethod === 'WavePay') {
          bal -= tx.payoutToReceiver;
        }
      }
    }
    for (const exp of expenses) {
      if (exp.paymentMethod !== 'Cash') {
        bal -= exp.amount;
      }
    }
    for (const mov of cashMovements) {
      if (mov.toAccount === 'Bank Account') bal += mov.amount;
      if (mov.fromAccount === 'Bank Account') bal -= mov.amount;
    }
    return bal;
  }, [transactions, expenses, cashMovements]);

  return (
    <div className="space-y-6">
      {/* Top Welcome & Quick Actions Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            {language === 'mm' ? 'ယနေ့လုပ်ငန်းအခြေအနေ' : "Today's Business Overview"}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            <span>{formatDate(today)}</span>
            <span className="mx-1.5" aria-hidden="true">·</span>
            <span>{settings.defaultCurrency} Base Ledger</span>
            <span className="mx-1.5" aria-hidden="true">·</span>
            <span className="text-slate-600 font-medium">
              {dailyMetrics.completedTransfers} {language === 'mm' ? 'ပြီးစီး' : 'completed'} / {dailyMetrics.totalTransfers} {language === 'mm' ? 'စုစုပေါင်း' : 'total'}
            </span>
          </p>
        </div>

        {/* Quick Access Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setNewTransferModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addTransfer}</span>
          </button>
          <button
            onClick={() => setActiveTab('daily_summary')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span>{t.dailySummary}</span>
          </button>
          <button
            onClick={() => setActiveTab('cash_reconciliation')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors"
          >
            <Scale className="w-3.5 h-3.5 text-slate-500" />
            <span>{t.cashReconciliation}</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Transfer Volume (Transit funds, NOT profit) */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>{t.transferVolume}</span>
            <Coins className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-bold font-mono-numbers text-slate-900 tracking-tight">
            {formatCurrency(dailyMetrics.totalTransferVolume, settings.defaultCurrency)}
          </div>
          <div className="text-[11px] text-slate-500 mt-2 flex items-center justify-between border-t border-slate-100 pt-1.5">
            <span>{t.transfersToday}:</span>
            <span className="font-mono-numbers font-semibold text-slate-800">{dailyMetrics.totalTransfers}</span>
          </div>
        </div>

        {/* Metric 2: Service Fee Income (Our True Gross Revenue) */}
        <div className="p-4 bg-white rounded-xl border border-blue-200 shadow-xs bg-gradient-to-br from-blue-50/40 to-white">
          <div className="flex items-center justify-between text-blue-900 text-xs font-semibold mb-1">
            <span>{t.serviceFeesEarned} (Gross)</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-bold font-mono-numbers text-blue-700 tracking-tight">
            {formatCurrency(dailyMetrics.totalServiceFeesEarned, settings.defaultCurrency)}
          </div>
          <div className="text-[11px] text-slate-600 mt-2 flex items-center justify-between border-t border-blue-100 pt-1.5">
            <span>{t.businessExpenses}:</span>
            <span className="font-mono-numbers text-red-600 font-semibold">
              -{formatCurrency(dailyMetrics.totalBusinessExpenses, settings.defaultCurrency)}
            </span>
          </div>
        </div>

        {/* Metric 3: Net Operating Profit */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>{t.netProfit} (Today)</span>
            <span className="text-[10px] font-mono-numbers text-slate-400">Fees - Expenses</span>
          </div>
          <div className={`text-xl font-bold font-mono-numbers tracking-tight ${
            dailyMetrics.netProfit >= 0 ? 'text-emerald-700' : 'text-red-600'
          }`}>
            {formatCurrency(dailyMetrics.netProfit, settings.defaultCurrency)}
          </div>
          <div className="text-[11px] text-slate-500 mt-2 flex items-center justify-between border-t border-slate-100 pt-1.5">
            <span>Monthly Net Profit:</span>
            <span className="font-mono-numbers font-semibold text-emerald-700">
              {formatCurrency(currentMonthMetrics.netProfit, settings.defaultCurrency)}
            </span>
          </div>
        </div>

        {/* Metric 4: Cash Drawer Balance (In Hand) */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>{t.cashInHand}</span>
            <Wallet className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold font-mono-numbers text-slate-900 tracking-tight">
            {formatCurrency(dailyMetrics.cashInHandDrawer, settings.defaultCurrency)}
          </div>
          <div className="text-[11px] text-slate-500 mt-2 flex items-center justify-between border-t border-slate-100 pt-1.5">
            <span>{t.bankAndWalletBalances}:</span>
            <span className="font-mono-numbers font-medium text-slate-700">
              {formatCurrency(bankAndWalletBalance, settings.defaultCurrency)}
            </span>
          </div>
        </div>
      </div>

      {/* Secondary Flow & Distinction Banner */}
      <div className="p-4 rounded-xl bg-slate-900 text-slate-100 border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-wider font-semibold text-blue-400">
              Daily Money Flow Summary (ငွေကြေးစီးဆင်းမှု)
            </div>
            <div className="text-sm text-slate-300 mt-1 font-sans">
              Clear segregation: Total collected from customers vs Disbursements made to recipients.
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 font-mono-numbers text-xs">
            <div>
              <div className="text-slate-400 text-[11px] font-sans flex items-center gap-1">
                <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t.totalMoneyReceived}</span>
              </div>
              <div className="text-base font-bold text-emerald-400 mt-0.5">
                {formatCurrency(dailyMetrics.totalMoneyReceived, settings.defaultCurrency)}
              </div>
            </div>

            <div>
              <div className="text-slate-400 text-[11px] font-sans flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
                <span>{t.totalMoneyPaidOut}</span>
              </div>
              <div className="text-base font-bold text-amber-300 mt-0.5">
                {formatCurrency(dailyMetrics.totalMoneyPaidOut, settings.defaultCurrency)}
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <div className="text-slate-400 text-[11px] font-sans flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span>{t.pendingLiabilities}</span>
              </div>
              <div className="text-base font-bold text-blue-300 mt-0.5">
                {formatCurrency(dailyMetrics.pendingLiabilities, settings.defaultCurrency)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Section: Recent Transactions & Pending Action Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Today's Recent Transactions */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {language === 'mm' ? 'ယနေ့ ငွေလွှဲမှတ်တမ်းများ' : "Today's Transfers"}
              </h2>
              <p className="text-xs text-slate-500">
                Showing latest transfers processed at counter
              </p>
            </div>
            <button
              onClick={() => setActiveTab('transactions')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <span>{t.viewDetails}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Voucher #</th>
                  <th className="py-2.5 px-3">Sender / Receiver</th>
                  <th className="py-2.5 px-3 text-right">Transfer Amount</th>
                  <th className="py-2.5 px-3 text-right">Fee</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {todayTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No transfers recorded for today yet.
                    </td>
                  </tr>
                ) : (
                  todayTransactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 font-mono-numbers text-slate-700 font-medium">
                        {tx.id}
                        <div className="text-[10px] text-slate-400 font-sans">{tx.time}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900">{tx.senderName}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <span>To: {tx.receiverName}</span>
                          <span aria-hidden="true">·</span>
                          <span>{tx.receiverLocation}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono-numbers font-medium text-slate-900">
                        {formatCurrency(tx.sendAmount, tx.sendCurrency)}
                        {tx.exchangeRate !== 1 && (
                          <div className="text-[10px] text-slate-500">
                            → {formatCurrency(tx.payoutToReceiver, tx.receiveCurrency)}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono-numbers text-blue-700 font-semibold">
                        {formatCurrency(tx.serviceFee, tx.sendCurrency)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                            tx.status === 'Completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : tx.status === 'Refunded'
                              ? 'bg-purple-100 text-purple-800'
                              : tx.status === 'Cancelled'
                              ? 'bg-slate-100 text-slate-600'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => openReceipt(tx)}
                          className="px-2 py-1 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded text-xs transition-colors"
                          title="Print Receipt"
                        >
                          <Receipt className="w-3.5 h-3.5 inline mr-1" />
                          <span>Receipt</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column (1 span): Action Queue & Monthly Performance */}
        <div className="space-y-4">
          {/* Pending Transfers Queue */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  {t.pendingTransfersCount} ({pendingTransactions.length})
                </h3>
              </div>
              <button
                onClick={() => setActiveTab('transactions')}
                className="text-[11px] text-blue-600 hover:underline font-medium"
              >
                View all
              </button>
            </div>

            <div className="mt-3 space-y-2.5">
              {pendingTransactions.length === 0 ? (
                <div className="py-4 text-center text-xs text-slate-400">
                  All transfers are cleared and paid!
                </div>
              ) : (
                pendingTransactions.slice(0, 3).map(ptx => (
                  <div
                    key={ptx.id}
                    className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white transition-colors text-xs"
                  >
                    <div className="flex justify-between items-start font-mono-numbers">
                      <span className="font-semibold text-slate-900">{ptx.id}</span>
                      <span className="font-bold text-amber-700">
                        {formatCurrency(ptx.payoutToReceiver, ptx.receiveCurrency)}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 mt-1">
                      {ptx.senderName} → {ptx.receiverName} ({ptx.receiverLocation})
                    </div>
                    <div className="flex justify-between items-center mt-2 pt-1.5 border-t border-slate-200 text-[10px]">
                      <span className="text-slate-500">{ptx.payoutMethod}</span>
                      <span className="font-semibold text-amber-600">{ptx.status}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Monthly Snapshot Card */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs text-xs">
            <h3 className="font-bold text-slate-900 mb-2 flex items-center justify-between">
              <span>{currentMonthMetrics.monthName} Summary</span>
              <span className="font-mono-numbers text-slate-500 text-[11px]">{currentMonthMetrics.year}</span>
            </h3>
            <div className="space-y-2 font-mono-numbers">
              <div className="flex justify-between text-slate-600">
                <span>Month Total Transfers:</span>
                <span className="font-semibold text-slate-900">{currentMonthMetrics.totalTransfers}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Month Volume:</span>
                <span className="font-semibold text-slate-900">
                  {formatCurrency(currentMonthMetrics.totalTransferVolume, settings.defaultCurrency)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Month Fee Income:</span>
                <span className="font-semibold text-blue-700">
                  {formatCurrency(currentMonthMetrics.totalServiceFeesEarned, settings.defaultCurrency)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Month Operating Expenses:</span>
                <span className="font-semibold text-red-600">
                  -{formatCurrency(currentMonthMetrics.totalBusinessExpenses, settings.defaultCurrency)}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-100 flex justify-between font-bold text-slate-900">
                <span>Net Month Profit:</span>
                <span className="text-emerald-700">
                  {formatCurrency(currentMonthMetrics.netProfit, settings.defaultCurrency)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
