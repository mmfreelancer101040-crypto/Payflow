import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { getTranslation } from '../utils/translations';
import { 
  formatCurrency, 
  formatDate, 
  getTodayDateString 
} from '../utils/formatters';
import { roundMoney } from '../utils/calculations';
import { 
  Scale, 
  CheckCircle2, 
  AlertTriangle, 
  Calculator, 
  History, 
  Wallet, 
  Save, 
  FileCheck 
} from 'lucide-react';

export const CashReconciliationView: React.FC = () => {
  const { 
    transactions, 
    expenses, 
    cashMovements, 
    reconciliations, 
    saveReconciliation, 
    settings, 
    language, 
    currentUser 
  } = useApp();

  const t = getTranslation(language);
  const today = getTodayDateString();

  const [auditDate, setAuditDate] = useState<string>(today);
  const [openingCashInput, setOpeningCashInput] = useState<number>(2500000);
  const [notes, setNotes] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Physical Denomination breakdown state (popular in cash businesses like Myanmar Kyat)
  const [useDenominations, setUseDenominations] = useState(false);
  const [denom10000, setDenom10000] = useState<number>(0);
  const [denom5000, setDenom5000] = useState<number>(0);
  const [denom1000, setDenom1000] = useState<number>(0);
  const [denom500, setDenom500] = useState<number>(0);
  const [lumpSumCount, setLumpSumCount] = useState<number>(2500000);

  // If a reconciliation already exists for this date, load it
  const existingRec = useMemo(() => {
    return reconciliations.find(r => r.date === auditDate);
  }, [reconciliations, auditDate]);

  // Daily cash movements breakdown
  const dailyCashFlow = useMemo(() => {
    const dayTx = transactions.filter(t => t.date === auditDate);
    const dayExp = expenses.filter(e => e.date === auditDate);
    const dayMov = cashMovements.filter(m => m.date === auditDate);

    let cashCollectedFromTransfers = 0;
    let cashPaidOutForTransfers = 0;

    for (const t of dayTx) {
      if (t.status === 'Cancelled' || t.status === 'Refunded') continue;
      if (t.paymentMethod === 'Cash') {
        cashCollectedFromTransfers += t.totalCollectedFromSender;
      }
      if (t.status === 'Completed' && t.payoutMethod === 'Cash') {
        cashPaidOutForTransfers += t.payoutToReceiver;
      }
    }

    let cashExpenses = 0;
    for (const e of dayExp) {
      if (e.paymentMethod === 'Cash') {
        cashExpenses += e.amount;
      }
    }

    let bankDeposits = 0;
    let bankWithdrawals = 0;
    for (const m of dayMov) {
      if (m.type === 'Deposit to Bank' && m.fromAccount === 'Cash Drawer') {
        bankDeposits += m.amount;
      } else if (m.type === 'Withdrawal from Bank' && m.toAccount === 'Cash Drawer') {
        bankWithdrawals += m.amount;
      } else if (m.type === 'Capital In' && m.toAccount === 'Cash Drawer') {
        bankWithdrawals += m.amount;
      } else if (m.type === 'Owner Drawing' && m.fromAccount === 'Cash Drawer') {
        bankDeposits += m.amount;
      }
    }

    const opening = existingRec ? existingRec.openingCash : openingCashInput;
    const expectedClosing = roundMoney(
      opening + cashCollectedFromTransfers - cashPaidOutForTransfers - cashExpenses - bankDeposits + bankWithdrawals
    );

    return {
      opening,
      cashCollectedFromTransfers: roundMoney(cashCollectedFromTransfers),
      cashPaidOutForTransfers: roundMoney(cashPaidOutForTransfers),
      cashExpenses: roundMoney(cashExpenses),
      bankDeposits: roundMoney(bankDeposits),
      bankWithdrawals: roundMoney(bankWithdrawals),
      expectedClosing,
    };
  }, [transactions, expenses, cashMovements, auditDate, openingCashInput, existingRec]);

  // Calculate counted physical cash
  const actualCountedCash = useMemo(() => {
    if (useDenominations) {
      return (
        denom10000 * 10000 +
        denom5000 * 5000 +
        denom1000 * 1000 +
        denom500 * 500
      );
    }
    return lumpSumCount;
  }, [useDenominations, denom10000, denom5000, denom1000, denom500, lumpSumCount]);

  // Variance: actual - expected
  const variance = roundMoney(actualCountedCash - dailyCashFlow.expectedClosing);

  const handleSaveReconciliation = (e: React.FormEvent) => {
    e.preventDefault();

    saveReconciliation({
      id: `REC-${auditDate.replace(/-/g, '')}-01`,
      date: auditDate,
      openingCash: dailyCashFlow.opening,
      cashCollectedFromTransfers: dailyCashFlow.cashCollectedFromTransfers,
      cashPaidOutForTransfers: dailyCashFlow.cashPaidOutForTransfers,
      cashExpenses: dailyCashFlow.cashExpenses,
      bankDeposits: dailyCashFlow.bankDeposits,
      bankWithdrawals: dailyCashFlow.bankWithdrawals,
      expectedClosingCash: dailyCashFlow.expectedClosing,
      actualCountedCash,
      difference: variance,
      notes: notes.trim() || undefined,
      reconciledBy: currentUser.fullName,
    });

    setSuccessMsg('Reconciliation saved and drawer closed for this date successfully!');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            {t.cashReconciliation}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === 'mm'
              ? 'နေ့စဉ်ဆိုင်ပိတ်ချိန်တွင် လက်ငင်းငွေသား အဝင်/အထွက်များနှင့် အမှန်တကယ်ရေတွက်ရရှိငွေသား ကိုက်ညှိခြင်း'
              : 'End-of-day drawer balancing, physical cash counts, and discrepancy audit'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-700">Audit Date:</label>
          <input
            type="date"
            value={auditDate}
            onChange={e => setAuditDate(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono-numbers bg-white"
          />
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Form & Calculation Grid */}
      <form onSubmit={handleSaveReconciliation} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: System Expected Cash Formula */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-blue-600" />
                <span>System Cash Ledger Formula</span>
              </h2>
              <span className="text-xs font-mono-numbers text-slate-400">{formatDate(auditDate)}</span>
            </div>

            <div className="space-y-3 font-mono-numbers text-xs">
              {/* Opening Cash Input */}
              <div className="flex items-center justify-between">
                <span className="font-sans text-slate-600">Opening Cash in Drawer:</span>
                <div className="w-40">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={dailyCashFlow.opening}
                    onChange={e => setOpeningCashInput(parseFloat(e.target.value) || 0)}
                    disabled={!!existingRec}
                    className="w-full px-2.5 py-1 border border-slate-300 rounded text-right font-bold text-slate-900 text-xs disabled:bg-slate-100"
                  />
                </div>
              </div>

              {/* (+) Cash from transfers */}
              <div className="flex justify-between items-center text-emerald-700 pt-2 border-t border-slate-100">
                <span className="font-sans">(+) Cash Received (Transfers In):</span>
                <span className="font-semibold">
                  +{formatCurrency(dailyCashFlow.cashCollectedFromTransfers, settings.defaultCurrency)}
                </span>
              </div>

              {/* (-) Cash paid out */}
              <div className="flex justify-between items-center text-amber-700 pt-2 border-t border-slate-100">
                <span className="font-sans">(-) Cash Paid Out (Receivers Disbursed):</span>
                <span className="font-semibold">
                  -{formatCurrency(dailyCashFlow.cashPaidOutForTransfers, settings.defaultCurrency)}
                </span>
              </div>

              {/* (-) Cash expenses */}
              <div className="flex justify-between items-center text-red-600 pt-2 border-t border-slate-100">
                <span className="font-sans">(-) Cash Expenses Paid:</span>
                <span className="font-semibold">
                  -{formatCurrency(dailyCashFlow.cashExpenses, settings.defaultCurrency)}
                </span>
              </div>

              {/* (-) Bank deposits */}
              {dailyCashFlow.bankDeposits > 0 && (
                <div className="flex justify-between items-center text-slate-600 pt-2 border-t border-slate-100">
                  <span className="font-sans">(-) Cash Deposited to Bank:</span>
                  <span className="font-semibold">
                    -{formatCurrency(dailyCashFlow.bankDeposits, settings.defaultCurrency)}
                  </span>
                </div>
              )}

              {/* (+) Bank withdrawals */}
              {dailyCashFlow.bankWithdrawals > 0 && (
                <div className="flex justify-between items-center text-blue-700 pt-2 border-t border-slate-100">
                  <span className="font-sans">(+) Cash Withdrawn from Bank:</span>
                  <span className="font-semibold">
                    +{formatCurrency(dailyCashFlow.bankWithdrawals, settings.defaultCurrency)}
                  </span>
                </div>
              )}

              {/* Expected Total */}
              <div className="pt-4 border-t-2 border-slate-300 flex justify-between items-center text-sm font-bold text-blue-900 bg-blue-50/50 p-3 rounded-lg">
                <span className="font-sans uppercase text-xs">Expected Cash Balance in Drawer:</span>
                <span className="text-base text-blue-700">
                  {formatCurrency(dailyCashFlow.expectedClosing, settings.defaultCurrency)}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Physical Cash Count & Variance Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-600" />
                <span>Physical Cash Count (Drawer Count)</span>
              </h2>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setUseDenominations(!useDenominations)}
                  className="text-xs text-blue-600 hover:underline font-medium"
                >
                  {useDenominations ? 'Switch to Lump Sum' : 'Use Denomination Counter'}
                </button>
              </div>
            </div>

            {/* Input Form */}
            {useDenominations ? (
              <div className="space-y-2 text-xs font-mono-numbers">
                <div className="text-[11px] text-slate-500 font-sans mb-1">
                  Count banknotes in cash drawer:
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-200">
                    <span className="text-slate-600 font-sans">10,000 Ks notes:</span>
                    <input
                      type="number"
                      min="0"
                      value={denom10000 || ''}
                      onChange={e => setDenom10000(parseInt(e.target.value) || 0)}
                      className="w-20 px-2 py-1 border border-slate-300 rounded text-right"
                    />
                  </div>

                  <div className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-200">
                    <span className="text-slate-600 font-sans">5,000 Ks notes:</span>
                    <input
                      type="number"
                      min="0"
                      value={denom5000 || ''}
                      onChange={e => setDenom5000(parseInt(e.target.value) || 0)}
                      className="w-20 px-2 py-1 border border-slate-300 rounded text-right"
                    />
                  </div>

                  <div className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-200">
                    <span className="text-slate-600 font-sans">1,000 Ks notes:</span>
                    <input
                      type="number"
                      min="0"
                      value={denom1000 || ''}
                      onChange={e => setDenom1000(parseInt(e.target.value) || 0)}
                      className="w-20 px-2 py-1 border border-slate-300 rounded text-right"
                    />
                  </div>

                  <div className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-200">
                    <span className="text-slate-600 font-sans">500 Ks notes:</span>
                    <input
                      type="number"
                      min="0"
                      value={denom500 || ''}
                      onChange={e => setDenom500(parseInt(e.target.value) || 0)}
                      className="w-20 px-2 py-1 border border-slate-300 rounded text-right"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Total Physical Cash Counted ({settings.defaultCurrency})
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={lumpSumCount}
                  onChange={e => setLumpSumCount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-lg font-bold font-mono-numbers text-slate-900 focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            )}

            {/* Counted Total Display */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-mono-numbers flex justify-between items-center text-xs">
              <span className="font-sans text-slate-600 font-medium">Counted Physical Cash:</span>
              <span className="text-base font-bold text-slate-900">
                {formatCurrency(actualCountedCash, settings.defaultCurrency)}
              </span>
            </div>

            {/* Reconciliation Difference Callout */}
            <div className={`p-4 rounded-xl border ${
              variance === 0
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                : variance > 0
                ? 'bg-blue-50 border-blue-200 text-blue-950'
                : 'bg-red-50 border-red-200 text-red-950'
            }`}>
              <div className="flex items-center justify-between font-mono-numbers">
                <div className="flex items-center gap-2">
                  {variance === 0 ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                  )}
                  <div>
                    <div className="font-bold text-xs uppercase tracking-wider">
                      {variance === 0 ? t.cashBalanced : variance > 0 ? t.cashOver : t.cashShort}
                    </div>
                    <div className="text-[11px] font-sans opacity-80">
                      Actual Counted minus System Expected
                    </div>
                  </div>
                </div>

                <div className="text-lg font-extrabold">
                  {variance === 0 ? '0 Ks' : formatCurrency(variance, settings.defaultCurrency)}
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Auditor Notes / Discrepancy Reason
              </label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. Exact match, or minor change rounding of 500 Ks..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Save Daily Drawer Balancing & Close Day</span>
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Historical Reconciliations Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Cash Drawer Balancing Audit History
            </h2>
            <p className="text-xs text-slate-500">
              Permanent verified record of daily drawer closes and auditor sign-offs
            </p>
          </div>
          <History className="w-4 h-4 text-slate-400" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3 text-right">Opening Cash</th>
                <th className="py-2.5 px-3 text-right">Cash Received</th>
                <th className="py-2.5 px-3 text-right">Cash Paid Out</th>
                <th className="py-2.5 px-3 text-right">Expected Closing</th>
                <th className="py-2.5 px-3 text-right">Actual Counted</th>
                <th className="py-2.5 px-3 text-center">Variance</th>
                <th className="py-2.5 px-3">Auditor</th>
                <th className="py-2.5 px-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono-numbers">
              {reconciliations.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 font-sans">
                    No drawer reconciliations recorded yet.
                  </td>
                </tr>
              ) : (
                reconciliations.map(rec => (
                  <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{formatDate(rec.date)}</td>
                    <td className="py-2.5 px-3 text-right">{formatCurrency(rec.openingCash, settings.defaultCurrency)}</td>
                    <td className="py-2.5 px-3 text-right text-emerald-700 font-medium">
                      +{formatCurrency(rec.cashCollectedFromTransfers, settings.defaultCurrency)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-amber-700 font-medium">
                      -{formatCurrency(rec.cashPaidOutForTransfers, settings.defaultCurrency)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                      {formatCurrency(rec.expectedClosingCash, settings.defaultCurrency)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-blue-700">
                      {formatCurrency(rec.actualCountedCash, settings.defaultCurrency)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        rec.difference === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {rec.difference === 0 ? 'Balanced' : `${rec.difference > 0 ? '+' : ''}${rec.difference} Ks`}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-sans text-slate-600">{rec.reconciledBy}</td>
                    <td className="py-2.5 px-3 font-sans text-slate-500 text-[11px] truncate max-w-xs">{rec.notes || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
