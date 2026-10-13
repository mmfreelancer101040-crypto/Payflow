import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { getTranslation } from '../utils/translations';
import { 
  formatCurrency, 
  formatDate, 
  getTodayDateString, 
  generateExpenseId,
  downloadCSV 
} from '../utils/formatters';
import { Expense, PaymentMethod } from '../types';
import { 
  Receipt, 
  Plus, 
  Download, 
  Trash2, 
  Filter, 
  Calendar, 
  X,
  CreditCard,
  Building,
  Zap,
  TrendingUp
} from 'lucide-react';

export const ExpensesView: React.FC = () => {
  const { 
    expenses, 
    addExpense, 
    deleteExpense, 
    currentUser, 
    settings, 
    language 
  } = useApp();

  const t = getTranslation(language);
  const today = getTodayDateString();

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [newExpenseModalOpen, setNewExpenseModalOpen] = useState(false);

  // New Expense form state
  const [category, setCategory] = useState<Expense['category']>('Electricity & Utilities');
  const [amount, setAmount] = useState<number>(30000);
  const [date, setDate] = useState(today);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  // Categories list
  const categoriesList: Expense['category'][] = [
    'Rent',
    'Salaries',
    'Electricity & Utilities',
    'Transportation',
    'Internet & Communication',
    'Office Supplies',
    'Bank & Service Charges',
    'Maintenance',
    'Other',
  ];

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      if (selectedCategory !== 'ALL' && e.category !== selectedCategory) return false;
      if (selectedMonth && !e.date.startsWith(selectedMonth)) return false;
      return true;
    });
  }, [expenses, selectedCategory, selectedMonth]);

  // Aggregate totals
  const todayTotal = useMemo(() => {
    return expenses
      .filter(e => e.date === today)
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses, today]);

  const currentMonthPrefix = today.substring(0, 7);
  const monthTotal = useMemo(() => {
    return expenses
      .filter(e => e.date.startsWith(currentMonthPrefix))
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses, currentMonthPrefix]);

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      setError('Amount must be greater than zero');
      return;
    }
    if (!description.trim()) {
      setError('Please provide a short description');
      return;
    }

    addExpense({
      id: generateExpenseId(date),
      date,
      category,
      amount,
      paymentMethod,
      description: description.trim(),
      recordedBy: currentUser.fullName,
    });

    setNewExpenseModalOpen(false);
    setDescription('');
    setAmount(30000);
    setError('');
  };

  const handleDelete = (id: string) => {
    if (currentUser.role !== 'admin') {
      alert(t.permissionDenied);
      return;
    }
    if (window.confirm('Are you sure you want to delete this expense record?')) {
      deleteExpense(id);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Expense ID', 'Date', 'Category', 'Amount', 'Payment Method', 'Description', 'Recorded By'];
    const rows = filteredExpenses.map(e => [
      e.id,
      e.date,
      e.category,
      e.amount,
      e.paymentMethod,
      e.description,
      e.recordedBy,
    ]);
    downloadCSV(`expenses_${today}.csv`, [headers, ...rows]);
  };

  return (
    <div className="space-y-5">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            {t.expenses}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === 'mm'
              ? 'ဆိုင်ခန်းငှားရမ်းခ၊ လစာ၊ မီးဖိုးနှင့် အခြားလုပ်ငန်းလည်ပတ်စရိတ်များ မှတ်တမ်းတင်ခြင်း'
              : 'Record and track rent, salaries, electricity, transport, and operational costs'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>{t.exportCSV}</span>
          </button>
          <button
            onClick={() => setNewExpenseModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>{t.recordExpense}</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-medium text-slate-500">Today's Expenses</div>
          <div className="text-xl font-bold font-mono-numbers text-slate-900 mt-1">
            {formatCurrency(todayTotal, settings.defaultCurrency)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono-numbers">{formatDate(today)}</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-medium text-slate-500">Current Month Expenses</div>
          <div className="text-xl font-bold font-mono-numbers text-red-600 mt-1">
            {formatCurrency(monthTotal, settings.defaultCurrency)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Total overhead this month</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-medium text-slate-500">Total Recorded Entries</div>
          <div className="text-xl font-bold font-mono-numbers text-slate-900 mt-1">
            {expenses.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Active ledger vouchers</div>
        </div>
      </div>

      {/* Filter Strip */}
      <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-slate-600">Category:</span>
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-xs"
          >
            <option value="ALL">All Categories</option>
            {categoriesList.map(cat => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-slate-600">Month:</span>
          <input
            type="month"
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono-numbers"
          />
          {selectedMonth && (
            <button
              onClick={() => setSelectedMonth('')}
              className="px-2 py-1 text-slate-500 hover:text-slate-800 text-xs border border-slate-200 rounded"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Expense ID</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3 text-center">Payment Method</th>
                <th className="py-2.5 px-3 text-right">Amount</th>
                <th className="py-2.5 px-3">Recorded By</th>
                {currentUser.role === 'admin' && (
                  <th className="py-2.5 px-3 text-right">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    No expense records found.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map(exp => (
                  <tr key={exp.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 font-mono-numbers font-semibold text-slate-700">
                      {exp.id}
                    </td>
                    <td className="py-2.5 px-3 font-mono-numbers text-slate-600">
                      {formatDate(exp.date)}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {exp.category}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate">
                      {exp.description}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium">
                        {exp.paymentMethod}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono-numbers font-bold text-red-600">
                      -{formatCurrency(exp.amount, settings.defaultCurrency)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                      {exp.recordedBy}
                    </td>
                    {currentUser.role === 'admin' && (
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => handleDelete(exp.id)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                          title="Delete Expense"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      {newExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">
                {t.recordExpense}
              </h3>
              <button
                onClick={() => setNewExpenseModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="p-5 space-y-3.5 text-xs">
              {error && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono-numbers text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  {t.expenseCategory}
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as any)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                >
                  {categoriesList.map(c => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Amount ({settings.defaultCurrency})
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={amount}
                  onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold font-mono-numbers text-sm text-red-600"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                >
                  <option value="Cash">{t.cash} (Paid from drawer)</option>
                  <option value="Bank Transfer">{t.bankTransfer}</option>
                  <option value="KBZPay">{t.kbzPay}</option>
                  <option value="WavePay">{t.wavePay}</option>
                  <option value="CBPay">{t.cbPay}</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  {t.expenseDescription}
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={2}
                  placeholder="e.g. Office electricity bill, printing paper supplies, courier bike fuel..."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setNewExpenseModalOpen(false)}
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
