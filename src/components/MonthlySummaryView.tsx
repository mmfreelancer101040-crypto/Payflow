import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { getTranslation } from '../utils/translations';
import { 
  formatCurrency, 
  getTodayDateString, 
  downloadCSV, 
  formatDate 
} from '../utils/formatters';
import { computeMonthlyMetrics, computeDailyMetrics, roundMoney } from '../utils/calculations';
import { 
  CalendarRange, 
  Printer, 
  Download, 
  TrendingUp, 
  TrendingDown, 
  Coins, 
  Receipt, 
  FileSpreadsheet,
  ArrowRight
} from 'lucide-react';

export const MonthlySummaryView: React.FC = () => {
  const { transactions, expenses, cashMovements, settings, language } = useApp();
  const t = getTranslation(language);

  const today = getTodayDateString();
  const [currentYear, currentMonth] = today.split('-').map(Number);

  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);

  // Month names
  const months = [
    { value: 1, name: 'January' },
    { value: 2, name: 'February' },
    { value: 3, name: 'March' },
    { value: 4, name: 'April' },
    { value: 5, name: 'May' },
    { value: 6, name: 'June' },
    { value: 7, name: 'July' },
    { value: 8, name: 'August' },
    { value: 9, name: 'September' },
    { value: 10, name: 'October' },
    { value: 11, name: 'November' },
    { value: 12, name: 'December' },
  ];

  // Current month summary
  const monthData = useMemo(() => {
    return computeMonthlyMetrics(transactions, expenses, selectedYear, selectedMonth);
  }, [transactions, expenses, selectedYear, selectedMonth]);

  // Previous month summary for MoM comparison
  const prevMonthData = useMemo(() => {
    let pYear = selectedYear;
    let pMonth = selectedMonth - 1;
    if (pMonth < 1) {
      pMonth = 12;
      pYear -= 1;
    }
    return computeMonthlyMetrics(transactions, expenses, pYear, pMonth);
  }, [transactions, expenses, selectedYear, selectedMonth]);

  // Calculate day-by-day table for the entire month
  const dailyBreakdown = useMemo(() => {
    const monthPrefix = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
    
    // Find all distinct dates in this month
    const daysSet = new Set<string>();
    transactions.forEach(t => {
      if (t.date.startsWith(monthPrefix)) daysSet.add(t.date);
    });
    expenses.forEach(e => {
      if (e.date.startsWith(monthPrefix)) daysSet.add(e.date);
    });

    const sortedDates = Array.from(daysSet).sort((a, b) => b.localeCompare(a));

    return sortedDates.map(date => {
      const dMetrics = computeDailyMetrics(transactions, expenses, cashMovements, date, 0);
      return {
        date,
        transfers: dMetrics.totalTransfers,
        volume: dMetrics.totalTransferVolume,
        fees: dMetrics.totalServiceFeesEarned,
        expenses: dMetrics.totalBusinessExpenses,
        profit: dMetrics.netProfit,
      };
    });
  }, [transactions, expenses, cashMovements, selectedYear, selectedMonth]);

  // MoM growth percentages
  const volumeGrowth = useMemo(() => {
    if (prevMonthData.totalTransferVolume === 0) return 100;
    const diff = monthData.totalTransferVolume - prevMonthData.totalTransferVolume;
    return roundMoney((diff / prevMonthData.totalTransferVolume) * 100, 1);
  }, [monthData, prevMonthData]);

  const profitGrowth = useMemo(() => {
    if (prevMonthData.netProfit === 0) return 100;
    const diff = monthData.netProfit - prevMonthData.netProfit;
    return roundMoney((diff / Math.abs(prevMonthData.netProfit)) * 100, 1);
  }, [monthData, prevMonthData]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const summaryRows = [
      ['Metric', 'Current Month', 'Previous Month'],
      ['Period', `${monthData.monthName} ${selectedYear}`, `${prevMonthData.monthName}`],
      ['Total Transfers', monthData.totalTransfers, prevMonthData.totalTransfers],
      ['Total Transfer Volume', monthData.totalTransferVolume, prevMonthData.totalTransferVolume],
      ['Total Service Fees Earned', monthData.totalServiceFeesEarned, prevMonthData.totalServiceFeesEarned],
      ['Total Operating Expenses', monthData.totalBusinessExpenses, prevMonthData.totalBusinessExpenses],
      ['Net Operating Profit', monthData.netProfit, prevMonthData.netProfit],
      [],
      ['Daily Breakdown in Month', '', ''],
      ['Date', 'Transfers', 'Volume (MMK)', 'Service Fees (MMK)', 'Expenses (MMK)', 'Net Profit (MMK)'],
      ...dailyBreakdown.map(d => [d.date, d.transfers, d.volume, d.fees, d.expenses, d.profit]),
    ];

    downloadCSV(`monthly_report_${selectedYear}_${selectedMonth}.csv`, summaryRows);
  };

  return (
    <div className="space-y-6">
      {/* Title & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 no-print">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            {t.monthlySummary}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === 'mm'
              ? 'လစဉ် ငွေကြေးစာရင်းချုပ်၊ ဝန်ဆောင်ခဝင်ငွေနှင့် နေ့စဉ်အသေးစိတ်ခွဲခြမ်းစိတ်ဖြာမှု'
              : 'Monthly financial statements, revenue growth trends, and day-by-day ledger'}
          </p>
        </div>

        {/* Month/Year selector & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(Number(e.target.value))}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold bg-white"
          >
            {months.map(m => (
              <option key={m.value} value={m.value}>
                {m.name}
              </option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value))}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold bg-white font-mono-numbers"
          >
            {[currentYear - 1, currentYear, currentYear + 1].map(yr => (
              <option key={yr} value={yr}>
                {yr}
              </option>
            ))}
          </select>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>{t.exportCSV}</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{t.printReport}</span>
          </button>
        </div>
      </div>

      {/* Printable Report Section */}
      <div className="print-area space-y-6">
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {language === 'mm' ? settings.businessNameMm : settings.businessNameEn}
              </h2>
              <div className="text-xs text-slate-500 mt-0.5">
                Monthly Financial & Performance Report · လစဉ်ဘဏ္ဍာရေးအစီရင်ခံစာ
              </div>
            </div>
            <div className="text-left sm:text-right mt-2 sm:mt-0 font-mono-numbers">
              <div className="text-sm font-bold text-blue-700">
                {monthData.monthName} {selectedYear}
              </div>
              <div className="text-[11px] text-slate-500">
                Currency: {settings.defaultCurrency}
              </div>
            </div>
          </div>

          {/* Monthly KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 py-5 border-b border-slate-200 font-mono-numbers text-xs">
            {/* Total Volume */}
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
              <div className="text-slate-500 text-[11px] font-sans">Monthly Transfer Volume</div>
              <div className="text-lg font-bold text-slate-900 mt-0.5">
                {formatCurrency(monthData.totalTransferVolume, settings.defaultCurrency)}
              </div>
              <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1 font-sans">
                {volumeGrowth >= 0 ? (
                  <span className="text-emerald-700 font-semibold flex items-center">
                    <TrendingUp className="w-3 h-3 inline mr-0.5" /> +{volumeGrowth}%
                  </span>
                ) : (
                  <span className="text-red-600 font-semibold flex items-center">
                    <TrendingDown className="w-3 h-3 inline mr-0.5" /> {volumeGrowth}%
                  </span>
                )}
                <span>vs prev month</span>
              </div>
            </div>

            {/* Service Fees */}
            <div className="p-3.5 bg-blue-50/40 rounded-lg border border-blue-200">
              <div className="text-blue-900 text-[11px] font-semibold font-sans">Gross Service Fee Revenue</div>
              <div className="text-lg font-bold text-blue-700 mt-0.5">
                {formatCurrency(monthData.totalServiceFeesEarned, settings.defaultCurrency)}
              </div>
              <div className="text-[10px] text-slate-500 mt-1 font-sans">
                {monthData.completedTransfers} transfers completed
              </div>
            </div>

            {/* Expenses */}
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
              <div className="text-slate-500 text-[11px] font-sans">Total Operating Expenses</div>
              <div className="text-lg font-bold text-red-600 mt-0.5">
                -{formatCurrency(monthData.totalBusinessExpenses, settings.defaultCurrency)}
              </div>
              <div className="text-[10px] text-slate-500 mt-1 font-sans">
                Business overhead costs
              </div>
            </div>

            {/* Net Profit */}
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
              <div className="text-slate-500 text-[11px] font-sans">Net Operating Profit</div>
              <div className={`text-lg font-extrabold mt-0.5 ${
                monthData.netProfit >= 0 ? 'text-emerald-700' : 'text-red-600'
              }`}>
                {formatCurrency(monthData.netProfit, settings.defaultCurrency)}
              </div>
              <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1 font-sans">
                {profitGrowth >= 0 ? (
                  <span className="text-emerald-700 font-semibold">+{profitGrowth}%</span>
                ) : (
                  <span className="text-red-600 font-semibold">{profitGrowth}%</span>
                )}
                <span>profit margin</span>
              </div>
            </div>
          </div>

          {/* Month Status Distribution */}
          <div className="py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-6 font-mono-numbers">
              <div>
                <span className="text-slate-500 text-[11px]">Completed: </span>
                <strong className="text-emerald-700">{monthData.completedTransfers}</strong>
              </div>
              <div>
                <span className="text-slate-500 text-[11px]">Pending/Processing: </span>
                <strong className="text-amber-700">{monthData.pendingTransfers}</strong>
              </div>
              <div>
                <span className="text-slate-500 text-[11px]">Refunded: </span>
                <strong className="text-purple-700">{monthData.refundedTransfers}</strong>
              </div>
              <div>
                <span className="text-slate-500 text-[11px]">Cancelled: </span>
                <strong className="text-slate-600">{monthData.cancelledTransfers}</strong>
              </div>
            </div>

            <div className="text-slate-500 text-xs">
              Total Recorded Transactions: <strong className="text-slate-900 font-mono-numbers">{monthData.totalTransfers}</strong>
            </div>
          </div>

          {/* Daily Breakdown for Entire Month */}
          <div className="pt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3">
              Daily Breakdown of Transactions in {monthData.monthName} {selectedYear}
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border border-slate-200">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Date</th>
                    <th className="p-2.5 text-center">Transfers Count</th>
                    <th className="p-2.5 text-right">Transfer Volume</th>
                    <th className="p-2.5 text-right">Service Fees Earned</th>
                    <th className="p-2.5 text-right">Operating Expenses</th>
                    <th className="p-2.5 text-right">Net Daily Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono-numbers">
                  {dailyBreakdown.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400 font-sans">
                        No transactions or expenses recorded in {monthData.monthName} {selectedYear}.
                      </td>
                    </tr>
                  ) : (
                    dailyBreakdown.map(day => (
                      <tr key={day.date} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-2.5 font-semibold text-slate-900">{formatDate(day.date)}</td>
                        <td className="p-2.5 text-center">{day.transfers}</td>
                        <td className="p-2.5 text-right font-medium text-slate-800">
                          {formatCurrency(day.volume, settings.defaultCurrency)}
                        </td>
                        <td className="p-2.5 text-right font-semibold text-blue-700">
                          {formatCurrency(day.fees, settings.defaultCurrency)}
                        </td>
                        <td className="p-2.5 text-right text-red-600">
                          {day.expenses > 0 ? `-${formatCurrency(day.expenses, settings.defaultCurrency)}` : '0 Ks'}
                        </td>
                        <td className={`p-2.5 text-right font-bold ${
                          day.profit >= 0 ? 'text-emerald-700' : 'text-red-600'
                        }`}>
                          {formatCurrency(day.profit, settings.defaultCurrency)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {dailyBreakdown.length > 0 && (
                  <tfoot className="bg-slate-50 font-bold border-t-2 border-slate-300 font-mono-numbers">
                    <tr>
                      <td className="p-2.5 font-sans">MONTH TOTALS</td>
                      <td className="p-2.5 text-center">{monthData.totalTransfers}</td>
                      <td className="p-2.5 text-right">
                        {formatCurrency(monthData.totalTransferVolume, settings.defaultCurrency)}
                      </td>
                      <td className="p-2.5 text-right text-blue-700">
                        {formatCurrency(monthData.totalServiceFeesEarned, settings.defaultCurrency)}
                      </td>
                      <td className="p-2.5 text-right text-red-600">
                        -{formatCurrency(monthData.totalBusinessExpenses, settings.defaultCurrency)}
                      </td>
                      <td className={`p-2.5 text-right ${
                        monthData.netProfit >= 0 ? 'text-emerald-700' : 'text-red-600'
                      }`}>
                        {formatCurrency(monthData.netProfit, settings.defaultCurrency)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {/* Audit Verification Footnote */}
          <div className="grid grid-cols-2 gap-8 pt-8 mt-6 border-t border-slate-200 text-xs text-center">
            <div>
              <div className="border-b border-slate-400 pb-8 mb-1"></div>
              <div className="font-semibold text-slate-800">Accountant / Preparer</div>
              <div className="text-[10px] text-slate-400">Monthly Statement Review</div>
            </div>
            <div>
              <div className="border-b border-slate-400 pb-8 mb-1"></div>
              <div className="font-semibold text-slate-800">Executive Director / Owner</div>
              <div className="text-[10px] text-slate-400">Approved & Reconciled</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
