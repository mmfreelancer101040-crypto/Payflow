import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { getTranslation } from '../utils/translations';
import { 
  formatCurrency, 
  formatDate, 
  downloadCSV, 
  getTodayDateString 
} from '../utils/formatters';
import { Transaction, TransferStatus, PaymentMethod } from '../types';
import { 
  Search, 
  Filter, 
  Download, 
  Plus, 
  Receipt, 
  RotateCcw, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Eye,
  X,
  FileSpreadsheet
} from 'lucide-react';

export const TransactionsView: React.FC = () => {
  const { 
    transactions, 
    currentUser, 
    updateTransactionStatus, 
    refundTransaction, 
    openReceipt, 
    setNewTransferModalOpen, 
    settings, 
    language 
  } = useApp();

  const t = getTranslation(language);

  // Filter and search states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('');

  // Refund Modal state
  const [refundTarget, setRefundTarget] = useState<Transaction | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [refundRetainFee, setRefundRetainFee] = useState(false);
  const [refundError, setRefundError] = useState('');

  // Detail Modal state
  const [viewDetailTarget, setViewDetailTarget] = useState<Transaction | null>(null);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      // Search term: ID, sender name, receiver name, phones, locations
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchId = tx.id.toLowerCase().includes(query);
        const matchSender = tx.senderName.toLowerCase().includes(query) || tx.senderPhone.includes(query) || tx.senderLocation.toLowerCase().includes(query);
        const matchReceiver = tx.receiverName.toLowerCase().includes(query) || tx.receiverPhone.includes(query) || tx.receiverLocation.toLowerCase().includes(query);
        const matchStaff = tx.handledBy.toLowerCase().includes(query);
        if (!matchId && !matchSender && !matchReceiver && !matchStaff) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== 'ALL' && tx.status !== statusFilter) {
        return false;
      }

      // Method filter
      if (methodFilter !== 'ALL' && tx.paymentMethod !== methodFilter) {
        return false;
      }

      // Date filter
      if (dateFilter && tx.date !== dateFilter) {
        return false;
      }

      return true;
    });
  }, [transactions, searchTerm, statusFilter, methodFilter, dateFilter]);

  // Export to CSV
  const handleExportCSV = () => {
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
      'Staff',
      'Notes',
      'Refund Reason',
    ];

    const rows = filteredTransactions.map(t => [
      t.id,
      t.date,
      t.time,
      t.senderName,
      t.senderPhone,
      t.senderLocation,
      t.receiverName,
      t.receiverPhone,
      t.receiverLocation,
      t.sendAmount,
      t.sendCurrency,
      t.exchangeRate,
      t.receiveAmount,
      t.receiveCurrency,
      t.serviceFee,
      t.totalCollectedFromSender,
      t.payoutToReceiver,
      t.paymentMethod,
      t.payoutMethod,
      t.status,
      t.handledBy,
      t.notes || '',
      t.refundReason || '',
    ]);

    downloadCSV(`transactions_export_${getTodayDateString()}.csv`, [headers, ...rows]);
  };

  const handleRefundSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundTarget) return;

    if (!refundReason.trim()) {
      setRefundError(language === 'mm' ? 'ပြန်အမ်းရသည့် အကြောင်းရင်း ထည့်သွင်းပါ' : 'Please provide a valid reason for refund/reversal');
      return;
    }

    const feeRetained = refundRetainFee ? refundTarget.serviceFee : 0;
    const amountToReturn = refundTarget.totalCollectedFromSender - feeRetained;

    const success = refundTransaction(refundTarget.id, refundReason.trim(), amountToReturn, feeRetained);
    if (success) {
      setRefundTarget(null);
      setRefundReason('');
      setRefundError('');
    } else {
      setRefundError(t.permissionDenied);
    }
  };

  return (
    <div className="space-y-4">
      {/* Title & Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            {t.transactions}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === 'mm'
              ? 'ငွေလွှဲပေးပို့မှုမှတ်တမ်းများနှင့် ပြေစာများ စီမံခန့်ခွဲရန်'
              : 'Search, filter, update statuses, print receipts, and manage transactions'}
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
            onClick={() => setNewTransferModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addTransfer}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
          {/* Keyword Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 text-xs"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-blue-500 text-xs"
            >
              <option value="ALL">{t.statusAll}</option>
              <option value="Completed">{t.completed}</option>
              <option value="Processing">{t.processing}</option>
              <option value="Pending">{t.pending}</option>
              <option value="Refunded">{t.refunded}</option>
              <option value="Cancelled">{t.cancelled}</option>
            </select>
          </div>

          {/* Payment Method Filter */}
          <div>
            <select
              value={methodFilter}
              onChange={e => setMethodFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-blue-500 text-xs"
            >
              <option value="ALL">All Payment Methods</option>
              <option value="Cash">{t.cash}</option>
              <option value="Bank Transfer">{t.bankTransfer}</option>
              <option value="KBZPay">{t.kbzPay}</option>
              <option value="WavePay">{t.wavePay}</option>
              <option value="CBPay">{t.cbPay}</option>
              <option value="AYA Pay">{t.ayaPay}</option>
            </select>
          </div>

          {/* Date Filter */}
          <div className="flex gap-2">
            <input
              type="date"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg font-mono-numbers text-xs"
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                className="px-2 py-1 text-slate-500 hover:text-slate-800 text-xs border border-slate-200 rounded-lg"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Filter Summary Count */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <div>
            Showing <strong className="text-slate-900 font-mono-numbers">{filteredTransactions.length}</strong> of{' '}
            <span className="font-mono-numbers">{transactions.length}</span> records
          </div>
          {(searchTerm || statusFilter !== 'ALL' || methodFilter !== 'ALL' || dateFilter) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('ALL');
                setMethodFilter('ALL');
                setDateFilter('');
              }}
              className="text-blue-600 hover:underline font-medium"
            >
              {t.resetFilters}
            </button>
          )}
        </div>
      </div>

      {/* Main Transactions Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">Transaction ID</th>
                <th className="py-3 px-3">Date/Time</th>
                <th className="py-3 px-3">Sender (From)</th>
                <th className="py-3 px-3">Receiver (To)</th>
                <th className="py-3 px-3 text-right">Transfer Amount</th>
                <th className="py-3 px-3 text-right">Service Fee</th>
                <th className="py-3 px-3 text-right">Total Paid</th>
                <th className="py-3 px-3 text-center">Payment</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    No transactions match your current search and filter criteria.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* ID */}
                    <td className="py-3 px-3 font-mono-numbers font-semibold text-slate-800">
                      {tx.id}
                    </td>

                    {/* Date/Time */}
                    <td className="py-3 px-3 font-mono-numbers text-slate-600">
                      <div>{formatDate(tx.date)}</div>
                      <div className="text-[10px] text-slate-400">{tx.time}</div>
                    </td>

                    {/* Sender */}
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900">{tx.senderName}</div>
                      <div className="text-[10px] text-slate-500 font-mono-numbers">{tx.senderPhone}</div>
                      <div className="text-[10px] text-slate-400">{tx.senderLocation}</div>
                    </td>

                    {/* Receiver */}
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900">{tx.receiverName}</div>
                      <div className="text-[10px] text-slate-500 font-mono-numbers">{tx.receiverPhone}</div>
                      <div className="text-[10px] text-slate-400">{tx.receiverLocation}</div>
                    </td>

                    {/* Transfer Amount */}
                    <td className="py-3 px-3 text-right font-mono-numbers font-medium text-slate-900">
                      <div>{formatCurrency(tx.sendAmount, tx.sendCurrency)}</div>
                      {tx.exchangeRate !== 1 && (
                        <div className="text-[10px] text-slate-500">
                          Rate: {tx.exchangeRate}
                        </div>
                      )}
                    </td>

                    {/* Service Fee */}
                    <td className="py-3 px-3 text-right font-mono-numbers font-semibold text-blue-700">
                      {formatCurrency(tx.serviceFee, tx.sendCurrency)}
                    </td>

                    {/* Total Collected */}
                    <td className="py-3 px-3 text-right font-mono-numbers font-bold text-slate-900">
                      <div>{formatCurrency(tx.totalCollectedFromSender, tx.sendCurrency)}</div>
                      <div className="text-[10px] text-emerald-700 font-normal">
                        Payout: {formatCurrency(tx.payoutToReceiver, tx.receiveCurrency)}
                      </div>
                    </td>

                    {/* Payment Method */}
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium">
                        {tx.paymentMethod}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          tx.status === 'Completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : tx.status === 'Refunded'
                            ? 'bg-purple-100 text-purple-800'
                            : tx.status === 'Cancelled'
                            ? 'bg-slate-100 text-slate-600'
                            : tx.status === 'Processing'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        {/* Print Receipt */}
                        <button
                          onClick={() => openReceipt(tx)}
                          className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                          title="Print Receipt / Voucher"
                        >
                          <Receipt className="w-4 h-4" />
                        </button>

                        {/* View Details */}
                        <button
                          onClick={() => setViewDetailTarget(tx)}
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Mark completed if Pending/Processing */}
                        {tx.status !== 'Completed' && tx.status !== 'Refunded' && tx.status !== 'Cancelled' && (
                          <button
                            onClick={() => updateTransactionStatus(tx.id, 'Completed')}
                            className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded transition-colors"
                            title="Mark as Completed"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}

                        {/* Refund / Reversal button (Only for completed/processing and manager role) */}
                        {tx.status !== 'Refunded' && tx.status !== 'Cancelled' && currentUser.role === 'admin' && (
                          <button
                            onClick={() => {
                              setRefundTarget(tx);
                              setRefundReason('');
                              setRefundError('');
                            }}
                            className="p-1.5 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded transition-colors"
                            title="Refund / Reverse Transaction"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Refund / Reversal Modal */}
      {refundTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-purple-50">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-purple-700" />
                <h3 className="font-bold text-slate-900 text-sm">
                  {t.refundTransaction} ({refundTarget.id})
                </h3>
              </div>
              <button
                onClick={() => setRefundTarget(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRefundSubmit} className="p-5 space-y-4 text-xs">
              {refundError && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                  {refundError}
                </div>
              )}

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1 font-mono-numbers">
                <div className="flex justify-between text-slate-600">
                  <span>Customer:</span>
                  <span className="font-sans font-semibold text-slate-900">{refundTarget.senderName}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Originally Collected:</span>
                  <span className="font-semibold text-slate-900">
                    {formatCurrency(refundTarget.totalCollectedFromSender, refundTarget.sendCurrency)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Service Fee:</span>
                  <span>{formatCurrency(refundTarget.serviceFee, refundTarget.sendCurrency)}</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  {t.refundReasonPrompt}
                </label>
                <textarea
                  value={refundReason}
                  onChange={e => setRefundReason(e.target.value)}
                  rows={3}
                  placeholder="e.g. Sender mistyped receiver NRC, sender requested cancellation before counter disbursement..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-purple-500 text-xs"
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="retainFeeCheck"
                  checked={refundRetainFee}
                  onChange={e => setRefundRetainFee(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="retainFeeCheck" className="text-slate-700 cursor-pointer">
                  Retain service fee ({formatCurrency(refundTarget.serviceFee, refundTarget.sendCurrency)}) as handling charge
                </label>
              </div>

              <div className="p-2.5 rounded bg-purple-50 text-purple-900 font-mono-numbers font-semibold flex justify-between">
                <span>Net Amount to Return:</span>
                <span>
                  {formatCurrency(
                    refundTarget.totalCollectedFromSender - (refundRetainFee ? refundTarget.serviceFee : 0),
                    refundTarget.sendCurrency
                  )}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRefundTarget(null)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg font-bold shadow-xs transition-colors"
                >
                  {t.confirmRefund}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Inspection Modal */}
      {viewDetailTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span>Transaction Detail</span>
                  <span className="font-mono-numbers text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                    {viewDetailTarget.id}
                  </span>
                </h3>
              </div>
              <button
                onClick={() => setViewDetailTarget(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-lg">
                <div>
                  <div className="font-semibold text-slate-400 uppercase text-[10px]">Sender</div>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">{viewDetailTarget.senderName}</div>
                  <div className="text-slate-600 font-mono-numbers">{viewDetailTarget.senderPhone}</div>
                  <div className="text-slate-500">{viewDetailTarget.senderLocation}</div>
                </div>
                <div>
                  <div className="font-semibold text-slate-400 uppercase text-[10px]">Receiver</div>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">{viewDetailTarget.receiverName}</div>
                  <div className="text-slate-600 font-mono-numbers">{viewDetailTarget.receiverPhone}</div>
                  <div className="text-slate-500">{viewDetailTarget.receiverLocation}</div>
                </div>
              </div>

              <div className="space-y-1.5 font-mono-numbers border-y border-slate-200 py-3">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Send Amount:</span>
                  <span className="font-semibold">{formatCurrency(viewDetailTarget.sendAmount, viewDetailTarget.sendCurrency)}</span>
                </div>
                {viewDetailTarget.exchangeRate !== 1 && (
                  <div className="flex justify-between text-slate-500">
                    <span className="font-sans">Exchange Rate:</span>
                    <span>1 {viewDetailTarget.sendCurrency} = {viewDetailTarget.exchangeRate} {viewDetailTarget.receiveCurrency}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Service Fee:</span>
                  <span className="font-semibold text-blue-700">{formatCurrency(viewDetailTarget.serviceFee, viewDetailTarget.sendCurrency)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold pt-1 border-t border-slate-100">
                  <span className="text-slate-900 font-sans">Total Collected:</span>
                  <span className="text-blue-700">{formatCurrency(viewDetailTarget.totalCollectedFromSender, viewDetailTarget.sendCurrency)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-slate-900 font-sans">Payout to Receiver:</span>
                  <span className="text-emerald-700">{formatCurrency(viewDetailTarget.payoutToReceiver, viewDetailTarget.receiveCurrency)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                <div>Payment Method: <strong>{viewDetailTarget.paymentMethod}</strong></div>
                <div>Payout Method: <strong>{viewDetailTarget.payoutMethod}</strong></div>
                <div>Status: <strong className="uppercase">{viewDetailTarget.status}</strong></div>
                <div>Cashier: <strong>{viewDetailTarget.handledBy}</strong></div>
                <div className="col-span-2">Date/Time: <strong>{formatDate(viewDetailTarget.date)} {viewDetailTarget.time}</strong></div>
              </div>

              {viewDetailTarget.notes && (
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-slate-700">
                  <strong className="block text-[10px] text-slate-500 uppercase">Remarks:</strong>
                  {viewDetailTarget.notes}
                </div>
              )}

              {viewDetailTarget.refundReason && (
                <div className="p-2.5 bg-purple-50 border border-purple-200 rounded text-purple-900">
                  <strong className="block text-[10px] text-purple-600 uppercase">Refund Information:</strong>
                  <div>Reason: {viewDetailTarget.refundReason}</div>
                  <div>Refunded on: {viewDetailTarget.refundDate}</div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => {
                    openReceipt(viewDetailTarget);
                    setViewDetailTarget(null);
                  }}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-1.5"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>{t.printReceipt}</span>
                </button>
                <button
                  onClick={() => setViewDetailTarget(null)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
                >
                  {t.close}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
