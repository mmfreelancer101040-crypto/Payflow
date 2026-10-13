import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { getTranslation } from '../utils/translations';
import { 
  formatCurrency, 
  formatDate, 
  getTodayDateString, 
  generateMovementId,
  downloadCSV 
} from '../utils/formatters';
import { roundMoney } from '../utils/calculations';
import { CashMovement } from '../types';
import { 
  Landmark, 
  ArrowDownLeft, 
  ArrowUpRight, 
  TrendingUp, 
  Receipt, 
  Coins, 
  Scale, 
  Plus, 
  Download, 
  CheckCircle2, 
  ShieldCheck,
  AlertTriangle,
  Wallet,
  X
} from 'lucide-react';

export const FinancialLedgerView: React.FC = () => {
  const { 
    transactions, 
    expenses, 
    cashMovements, 
    addCashMovement, 
    reconciliations, 
    settings, 
    language, 
    currentUser 
  } = useApp();

  const t = getTranslation(language);
  const [movementModalOpen, setMovementModalOpen] = useState(false);

  // New Cash Movement form state
  const [movType, setMovType] = useState<CashMovement['type']>('Deposit to Bank');
  const [movAmount, setMovAmount] = useState<number>(500000);
  const [fromAccount, setFromAccount] = useState<CashMovement['fromAccount']>('Cash Drawer');
  const [toAccount, setToAccount] = useState<CashMovement['toAccount']>('Bank Account');
  const [movNotes, setMovNotes] = useState('');
  const [movDate, setMovDate] = useState(getTodayDateString());

  // Aggregate overall financial integrity metrics
  const financialTotals = useMemo(() => {
    let totalTransferVolume = 0;
    let totalCollectedFromSenders = 0;
    let totalDisbursedToReceivers = 0;
    let totalServiceFeesGrossRevenue = 0;
    let pendingReceivablesLiabilities = 0;
    let refundedAmountsReturned = 0;
    let cancelledVolume = 0;

    let cashCollectedFromTransfers = 0;
    let cashPaidOutForTransfers = 0;

    for (const tx of transactions) {
      if (tx.status === 'Cancelled') {
        cancelledVolume += tx.sendAmount;
        continue;
      }
      if (tx.status === 'Refunded') {
        refundedAmountsReturned += (tx.refundAmount || tx.totalCollectedFromSender);
        if (tx.refundFeeRetained) {
          totalServiceFeesGrossRevenue += tx.refundFeeRetained;
        }
        continue;
      }

      totalTransferVolume += tx.sendAmount;
      totalCollectedFromSenders += tx.totalCollectedFromSender;

      if (tx.paymentMethod === 'Cash') {
        cashCollectedFromTransfers += tx.totalCollectedFromSender;
      }

      if (tx.status === 'Completed') {
        totalDisbursedToReceivers += tx.payoutToReceiver;
        totalServiceFeesGrossRevenue += tx.serviceFee;

        if (tx.payoutMethod === 'Cash') {
          cashPaidOutForTransfers += tx.payoutToReceiver;
        }
      } else if (tx.status === 'Pending' || tx.status === 'Processing') {
        pendingReceivablesLiabilities += tx.payoutToReceiver;
      }
    }

    // Expenses total
    let totalOperatingExpenses = 0;
    let cashExpenses = 0;
    for (const exp of expenses) {
      totalOperatingExpenses += exp.amount;
      if (exp.paymentMethod === 'Cash') {
        cashExpenses += exp.amount;
      }
    }

    // Bank & cash movements
    let totalDepositedToBank = 0;
    let totalWithdrawnFromBank = 0;
    let capitalInjected = 0;
    let ownerDrawings = 0;

    for (const mov of cashMovements) {
      if (mov.type === 'Deposit to Bank') totalDepositedToBank += mov.amount;
      if (mov.type === 'Withdrawal from Bank') totalWithdrawnFromBank += mov.amount;
      if (mov.type === 'Capital In') capitalInjected += mov.amount;
      if (mov.type === 'Owner Drawing') ownerDrawings += mov.amount;
    }

    const netOperatingProfit = roundMoney(totalServiceFeesGrossRevenue - totalOperatingExpenses);

    // Initial drawer seed base
    const initialCashBase = 2500000;
    const currentCashInDrawer = roundMoney(
      initialCashBase +
        cashCollectedFromTransfers -
        cashPaidOutForTransfers -
        cashExpenses -
        totalDepositedToBank +
        totalWithdrawnFromBank +
        capitalInjected -
        ownerDrawings
    );

    return {
      totalTransferVolume: roundMoney(totalTransferVolume),
      totalCollectedFromSenders: roundMoney(totalCollectedFromSenders),
      totalDisbursedToReceivers: roundMoney(totalDisbursedToReceivers),
      totalServiceFeesGrossRevenue: roundMoney(totalServiceFeesGrossRevenue),
      totalOperatingExpenses: roundMoney(totalOperatingExpenses),
      netOperatingProfit,
      pendingReceivablesLiabilities: roundMoney(pendingReceivablesLiabilities),
      refundedAmountsReturned: roundMoney(refundedAmountsReturned),
      cancelledVolume: roundMoney(cancelledVolume),
      currentCashInDrawer,
      totalDepositedToBank: roundMoney(totalDepositedToBank),
      totalWithdrawnFromBank: roundMoney(totalWithdrawnFromBank),
    };
  }, [transactions, expenses, cashMovements]);

  const handleCreateMovement = (e: React.FormEvent) => {
    e.preventDefault();
    if (movAmount <= 0) return;

    addCashMovement({
      id: generateMovementId(movDate),
      date: movDate,
      type: movType,
      amount: movAmount,
      fromAccount,
      toAccount,
      notes: movNotes.trim() || `${movType} recorded`,
      recordedBy: currentUser.fullName,
    });

    setMovementModalOpen(false);
    setMovNotes('');
    setMovAmount(500000);
  };

  const handleExportLedgerCSV = () => {
    const headers = ['Record Type', 'Metric / Item', 'Amount (MMK)', 'Classification'];
    const rows = [
      ['Transfer Volume', 'Total Principal Moved', financialTotals.totalTransferVolume, 'Trust Funds (Not Revenue)'],
      ['Inflow', 'Money Received from Senders', financialTotals.totalCollectedFromSenders, 'Customer Inflow'],
      ['Outflow', 'Money Disbursed to Receivers', financialTotals.totalDisbursedToReceivers, 'Customer Outflow'],
      ['Revenue', 'Service Fees & Commissions Earned', financialTotals.totalServiceFeesGrossRevenue, 'True Business Gross Revenue'],
      ['Expenses', 'Operating Expenses Incurred', financialTotals.totalOperatingExpenses, 'Business Costs'],
      ['Profit', 'Net Operating Profit (Fees - Expenses)', financialTotals.netOperatingProfit, 'Net Business Profit'],
      ['Liabilities', 'Pending Transfer Payouts', financialTotals.pendingReceivablesLiabilities, 'Outstanding Obligations'],
      ['Refunds', 'Total Returned to Customers', financialTotals.refundedAmountsReturned, 'Reversals'],
      ['Cash Drawer', 'Calculated Cash in Hand', financialTotals.currentCashInDrawer, 'Physical Liquid Asset'],
      ['Bank Deposits', 'Total Cash Deposited to Bank', financialTotals.totalDepositedToBank, 'Bank Movements'],
      ['Bank Withdrawals', 'Total Cash Withdrawn from Bank', financialTotals.totalWithdrawnFromBank, 'Bank Movements'],
    ];

    downloadCSV(`financial_ledger_${getTodayDateString()}.csv`, [headers, ...rows]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            {t.financialLedger}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === 'mm'
              ? 'ငွေလွှဲပမာဏနှင့် အမှန်တကယ်ရရှိသော လုပ်ငန်းဝင်ငွေ/အမြတ်အစွန်းများ သီးခြားခွဲထုတ်ထားသော စာရင်းချုပ်'
              : 'Strict segregation of customer transfer volume, agency commissions, operating expenses, and cash balances'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportLedgerCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>{t.exportCSV}</span>
          </button>
          <button
            onClick={() => setMovementModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Record Cash / Bank Movement</span>
          </button>
        </div>
      </div>

      {/* Accounting Integrity Disclaimer Box */}
      <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 text-blue-950 text-xs">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-bold text-blue-900">
              Fundamental Accounting Rule: Transfer Volume ≠ Business Revenue
            </h3>
            <p className="text-blue-800 leading-relaxed font-sans">
              Money given to this agency by senders is held in custodial trust to be delivered to receivers.
              <strong> Only the service fee / commission</strong> belongs to the business as gross revenue.
              This system strictly computes Net Operating Profit as <span className="font-mono-numbers font-semibold">Service Fee Income - Operating Expenses</span>, ensuring zero double-counting.
            </p>
          </div>
        </div>
      </div>

      {/* Big 3-Column Ledger Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Customer Trust Volumes */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Section 1</div>
              <h2 className="text-sm font-bold text-slate-900 mt-0.5">Customer Funds in Transit</h2>
            </div>
            <Coins className="w-5 h-5 text-slate-400" />
          </div>

          <div className="space-y-3 font-mono-numbers text-xs">
            <div>
              <div className="text-slate-500 text-[11px] font-sans">Total Transfer Volume</div>
              <div className="text-lg font-bold text-slate-900">
                {formatCurrency(financialTotals.totalTransferVolume, settings.defaultCurrency)}
              </div>
              <div className="text-[10px] text-slate-400 font-sans">Principal remittance flow</div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <div className="text-slate-500 text-[11px] font-sans">Money Collected from Customers</div>
              <div className="text-sm font-semibold text-emerald-700">
                {formatCurrency(financialTotals.totalCollectedFromSenders, settings.defaultCurrency)}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <div className="text-slate-500 text-[11px] font-sans">Money Disbursed to Receivers</div>
              <div className="text-sm font-semibold text-slate-800">
                {formatCurrency(financialTotals.totalDisbursedToReceivers, settings.defaultCurrency)}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <div className="text-slate-500 text-[11px] font-sans">Pending Payout Obligations</div>
              <div className="text-sm font-semibold text-amber-700">
                {formatCurrency(financialTotals.pendingReceivablesLiabilities, settings.defaultCurrency)}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <div className="text-slate-500 text-[11px] font-sans">Refunded / Reversed Sums</div>
              <div className="text-sm font-medium text-purple-700">
                {formatCurrency(financialTotals.refundedAmountsReturned, settings.defaultCurrency)}
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Actual Business Income & Profit */}
        <div className="bg-white rounded-xl border border-blue-200 shadow-xs p-5 space-y-4 bg-gradient-to-b from-blue-50/20 to-white">
          <div className="flex items-center justify-between pb-3 border-b border-blue-100">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-blue-600">Section 2</div>
              <h2 className="text-sm font-bold text-slate-900 mt-0.5">True Business Income (P&L)</h2>
            </div>
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>

          <div className="space-y-3 font-mono-numbers text-xs">
            <div>
              <div className="text-slate-500 text-[11px] font-sans">Gross Service Fee Revenue</div>
              <div className="text-lg font-bold text-blue-700">
                {formatCurrency(financialTotals.totalServiceFeesGrossRevenue, settings.defaultCurrency)}
              </div>
              <div className="text-[10px] text-slate-400 font-sans">Commissions collected</div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <div className="text-slate-500 text-[11px] font-sans">Operating Business Expenses</div>
              <div className="text-sm font-semibold text-red-600">
                -{formatCurrency(financialTotals.totalOperatingExpenses, settings.defaultCurrency)}
              </div>
              <div className="text-[10px] text-slate-400 font-sans">Rent, salaries, power, supplies</div>
            </div>

            <div className="pt-3 border-t-2 border-slate-200">
              <div className="text-slate-800 text-[11px] font-bold uppercase font-sans">
                Net Operating Profit
              </div>
              <div className={`text-xl font-extrabold ${
                financialTotals.netOperatingProfit >= 0 ? 'text-emerald-700' : 'text-red-600'
              }`}>
                {formatCurrency(financialTotals.netOperatingProfit, settings.defaultCurrency)}
              </div>
              <div className="text-[10px] text-slate-500 font-sans mt-0.5">
                Exact net earnings retainable by business
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Liquidity & Account Balances */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Section 3</div>
              <h2 className="text-sm font-bold text-slate-900 mt-0.5">Cash Drawer & Bank Movements</h2>
            </div>
            <Landmark className="w-5 h-5 text-slate-500" />
          </div>

          <div className="space-y-3 font-mono-numbers text-xs">
            <div>
              <div className="text-slate-500 text-[11px] font-sans">Current Cash Drawer in Hand</div>
              <div className="text-lg font-bold text-slate-900">
                {formatCurrency(financialTotals.currentCashInDrawer, settings.defaultCurrency)}
              </div>
              <div className="text-[10px] text-slate-400 font-sans">Calculated continuous balance</div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <div className="text-slate-500 text-[11px] font-sans">Cash Deposited to Bank</div>
              <div className="text-sm font-semibold text-slate-700">
                {formatCurrency(financialTotals.totalDepositedToBank, settings.defaultCurrency)}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <div className="text-slate-500 text-[11px] font-sans">Cash Withdrawn from Bank</div>
              <div className="text-sm font-semibold text-slate-700">
                {formatCurrency(financialTotals.totalWithdrawnFromBank, settings.defaultCurrency)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cash Movements Log Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Cash Drawer & Bank Movements History
            </h2>
            <p className="text-xs text-slate-500">
              Audit log of deposits to bank, branch replenishments, and capital adjustments
            </p>
          </div>
          <button
            onClick={() => setMovementModalOpen(true)}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800"
          >
            + Add Movement
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Movement Type</th>
                <th className="py-2.5 px-3">From Account</th>
                <th className="py-2.5 px-3">To Account</th>
                <th className="py-2.5 px-3 text-right">Amount</th>
                <th className="py-2.5 px-3">Recorded By</th>
                <th className="py-2.5 px-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono-numbers">
              {cashMovements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-sans">
                    No cash movements recorded yet.
                  </td>
                </tr>
              ) : (
                cashMovements.map(m => (
                  <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 text-slate-700">{formatDate(m.date)}</td>
                    <td className="py-2.5 px-3 font-sans font-semibold text-slate-900">{m.type}</td>
                    <td className="py-2.5 px-3 font-sans text-slate-600">{m.fromAccount}</td>
                    <td className="py-2.5 px-3 font-sans text-slate-600">{m.toAccount}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-blue-700">
                      {formatCurrency(m.amount, settings.defaultCurrency)}
                    </td>
                    <td className="py-2.5 px-3 font-sans text-slate-600">{m.recordedBy}</td>
                    <td className="py-2.5 px-3 font-sans text-slate-500 text-[11px]">{m.notes}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Movement Modal */}
      {movementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">
                Record Cash or Bank Movement
              </h3>
              <button
                onClick={() => setMovementModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateMovement} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Date</label>
                <input
                  type="date"
                  value={movDate}
                  onChange={e => setMovDate(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono-numbers text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Movement Type</label>
                <select
                  value={movType}
                  onChange={e => {
                    const val = e.target.value as CashMovement['type'];
                    setMovType(val);
                    if (val === 'Deposit to Bank') {
                      setFromAccount('Cash Drawer');
                      setToAccount('Bank Account');
                    } else if (val === 'Withdrawal from Bank') {
                      setFromAccount('Bank Account');
                      setToAccount('Cash Drawer');
                    } else if (val === 'Capital In') {
                      setFromAccount('Capital');
                      setToAccount('Cash Drawer');
                    } else if (val === 'Owner Drawing') {
                      setFromAccount('Cash Drawer');
                      setToAccount('Capital');
                    }
                  }}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                >
                  <option value="Deposit to Bank">Deposit Surplus Cash to Bank</option>
                  <option value="Withdrawal from Bank">Withdraw Cash from Bank for Drawer</option>
                  <option value="Capital In">Owner Capital Injection</option>
                  <option value="Owner Drawing">Owner Drawing / Profit Withdrawal</option>
                  <option value="Drawer Adjustment">General Drawer Adjustment</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">From Account</label>
                  <select
                    value={fromAccount}
                    onChange={e => setFromAccount(e.target.value as any)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                  >
                    <option value="Cash Drawer">Cash Drawer</option>
                    <option value="Bank Account">Bank Account</option>
                    <option value="KBZPay">KBZPay</option>
                    <option value="WavePay">WavePay</option>
                    <option value="Capital">Capital</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">To Account</label>
                  <select
                    value={toAccount}
                    onChange={e => setToAccount(e.target.value as any)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                  >
                    <option value="Bank Account">Bank Account</option>
                    <option value="Cash Drawer">Cash Drawer</option>
                    <option value="KBZPay">KBZPay</option>
                    <option value="WavePay">WavePay</option>
                    <option value="Capital">Capital</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Amount ({settings.defaultCurrency})
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={movAmount}
                  onChange={e => setMovAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold font-mono-numbers text-sm text-blue-700"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Notes / Description</label>
                <input
                  type="text"
                  value={movNotes}
                  onChange={e => setMovNotes(e.target.value)}
                  placeholder="e.g. Deposited cash to KBZ account #123456"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setMovementModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-xs transition-colors"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
