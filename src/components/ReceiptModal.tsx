import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { getTranslation } from '../utils/translations';
import { formatCurrency, formatDateTime, formatDate } from '../utils/formatters';
import { 
  Printer, 
  X, 
  FileText, 
  Smartphone, 
  Check, 
  Copy, 
  ShieldCheck,
  QrCode
} from 'lucide-react';

export const ReceiptModal: React.FC = () => {
  const { 
    selectedTransactionForReceipt, 
    receiptModalOpen, 
    setReceiptModalOpen, 
    settings, 
    language 
  } = useApp();

  const [receiptStyle, setReceiptStyle] = useState<'thermal' | 'a4'>('thermal');
  const [copied, setCopied] = useState(false);
  const t = getTranslation(language);

  if (!receiptModalOpen || !selectedTransactionForReceipt) {
    return null;
  }

  const tx = selectedTransactionForReceipt;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    const text = `
=== ${settings.businessNameEn} ===
${settings.businessNameMm}
Phone: ${settings.phone}
----------------------------------------
Transaction ID: ${tx.id}
Date/Time: ${formatDate(tx.date)} ${tx.time}
Status: ${tx.status}

SENDER: ${tx.senderName} (${tx.senderPhone})
Location: ${tx.senderLocation}

RECEIVER: ${tx.receiverName} (${tx.receiverPhone})
Location: ${tx.receiverLocation}
----------------------------------------
Transfer Amount: ${formatCurrency(tx.sendAmount, tx.sendCurrency)}
${tx.exchangeRate !== 1 ? `Exchange Rate: 1 ${tx.sendCurrency} = ${tx.exchangeRate} ${tx.receiveCurrency}\n` : ''}Service Fee: ${formatCurrency(tx.serviceFee, tx.sendCurrency)}
TOTAL COLLECTED: ${formatCurrency(tx.totalCollectedFromSender, tx.sendCurrency)}
RECEIVER PAYOUT: ${formatCurrency(tx.payoutToReceiver, tx.receiveCurrency)}
Payment Method: ${tx.paymentMethod}
Payout Method: ${tx.payoutMethod}
Cashier: ${tx.handledBy}
----------------------------------------
Notice: Please verify cash and details before leaving the counter.
Thank you!
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      {/* Container card */}
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Top Modal Controls bar (Hidden during print) */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50 no-print">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800 text-sm">{t.receiptHeader}</span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs font-mono font-medium text-slate-600">{tx.id}</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle Thermal / A4 */}
            <div className="flex items-center p-0.5 bg-slate-200/80 rounded-md text-xs">
              <button
                onClick={() => setReceiptStyle('thermal')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded font-medium transition-colors ${
                  receiptStyle === 'thermal'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>80mm POS</span>
              </button>
              <button
                onClick={() => setReceiptStyle('a4')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded font-medium transition-colors ${
                  receiptStyle === 'a4'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>A4 Voucher</span>
              </button>
            </div>

            {/* Copy button */}
            <button
              onClick={handleCopyText}
              className="flex items-center gap-1 px-2.5 py-1 text-xs border border-slate-200 rounded-md hover:bg-white text-slate-700 transition-colors"
              title="Copy for SMS/Viber"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            {/* Print button */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{t.printReceipt}</span>
            </button>

            {/* Close button */}
            <button
              onClick={() => setReceiptModalOpen(false)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Receipt Content Area */}
        <div className="p-6 max-h-[80vh] overflow-y-auto bg-slate-100 flex justify-center">
          {/* THERMAL 80MM RECEIPT */}
          {receiptStyle === 'thermal' && (
            <div className="thermal-receipt bg-white p-5 w-full max-w-[340px] shadow-sm border border-slate-200 text-slate-900 font-sans text-xs print-area">
              {/* Business Header */}
              <div className="text-center pb-3 border-b border-dashed border-slate-300">
                <div className="text-base font-extrabold tracking-tight leading-tight text-slate-950">
                  {settings.businessNameEn}
                </div>
                <div className="text-xs font-semibold text-slate-700 mt-0.5">
                  {settings.businessNameMm}
                </div>
                <div className="text-[10px] text-slate-500 mt-1 leading-snug">
                  {settings.addressEn}
                </div>
                <div className="text-[10px] font-mono-numbers text-slate-600 mt-0.5">
                  Tel: {settings.phone}
                </div>
                <div className="text-[9px] text-slate-400 font-mono-numbers mt-0.5">
                  Reg No: {settings.regNo}
                </div>
              </div>

              {/* Transaction Metadata */}
              <div className="py-2.5 border-b border-dashed border-slate-300 font-mono-numbers text-[11px] space-y-1">
                <div className="flex justify-between font-bold text-slate-950">
                  <span>VOUCHER NO:</span>
                  <span>{tx.id}</span>
                </div>
                <div className="flex justify-between text-slate-600 text-[10px]">
                  <span>DATE & TIME:</span>
                  <span>{formatDate(tx.date)} {tx.time}</span>
                </div>
                <div className="flex justify-between text-slate-600 text-[10px]">
                  <span>CASHIER:</span>
                  <span className="truncate max-w-[150px]">{tx.handledBy}</span>
                </div>
                <div className="flex justify-between text-slate-800 text-[10px] font-semibold">
                  <span>STATUS:</span>
                  <span className={`uppercase ${tx.status === 'Completed' ? 'text-emerald-700' : tx.status === 'Refunded' ? 'text-purple-700' : 'text-amber-700'}`}>
                    {tx.status}
                  </span>
                </div>
              </div>

              {/* Customer Details */}
              <div className="py-2.5 border-b border-dashed border-slate-300 space-y-2 text-[11px]">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    SENDER (ငွေလွှဲသူ)
                  </div>
                  <div className="font-semibold text-slate-950">{tx.senderName}</div>
                  <div className="font-mono-numbers text-[10px] text-slate-600">
                    Ph: {tx.senderPhone} · {tx.senderLocation}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    RECEIVER (ငွေလက်ခံသူ)
                  </div>
                  <div className="font-semibold text-slate-950">{tx.receiverName}</div>
                  <div className="font-mono-numbers text-[10px] text-slate-600">
                    Ph: {tx.receiverPhone} · {tx.receiverLocation}
                  </div>
                </div>
              </div>

              {/* Financial Calculation Breakdown */}
              <div className="py-3 border-b border-dashed border-slate-300 space-y-1.5 font-mono-numbers">
                <div className="flex justify-between text-slate-700">
                  <span>Send Amount:</span>
                  <span className="font-semibold">{formatCurrency(tx.sendAmount, tx.sendCurrency)}</span>
                </div>

                {tx.exchangeRate !== 1 && (
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>FX Rate:</span>
                    <span>1 {tx.sendCurrency} = {tx.exchangeRate} {tx.receiveCurrency}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-700">
                  <span>Service Fee:</span>
                  <span className="font-semibold">{formatCurrency(tx.serviceFee, tx.sendCurrency)}</span>
                </div>

                <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-950 text-sm">
                  <span>TOTAL COLLECTED:</span>
                  <span className="text-blue-700">{formatCurrency(tx.totalCollectedFromSender, tx.sendCurrency)}</span>
                </div>

                <div className="flex justify-between text-[11px] text-emerald-700 font-semibold pt-1">
                  <span>RECEIVER RECEIVES:</span>
                  <span>{formatCurrency(tx.payoutToReceiver, tx.receiveCurrency)}</span>
                </div>

                <div className="pt-2 text-[10px] text-slate-500 flex justify-between">
                  <span>Payment / Payout:</span>
                  <span>{tx.paymentMethod} / {tx.payoutMethod}</span>
                </div>
              </div>

              {/* Refund Info if refunded */}
              {tx.status === 'Refunded' && (
                <div className="py-2 border-b border-dashed border-slate-300 text-[10px] text-purple-900 bg-purple-50 p-2 rounded">
                  <div className="font-bold">TRANSACTION REFUNDED</div>
                  <div>Refund Amount: {formatCurrency(tx.refundAmount || 0, tx.sendCurrency)}</div>
                  <div>Reason: {tx.refundReason}</div>
                </div>
              )}

              {/* QR / Barcode Simulation */}
              <div className="py-3 text-center border-b border-dashed border-slate-300">
                <div className="font-mono text-[9px] tracking-widest text-slate-500 mb-1">
                  ||||| | |||| ||| ||||||| | |||| || |||
                </div>
                <div className="text-[9px] font-mono text-slate-400">
                  VERIFY ID: {tx.id.replace('TRX-', '')}
                </div>
              </div>

              {/* Footer Notice */}
              <div className="pt-3 text-center text-[9px] text-slate-500 leading-tight space-y-1">
                <div>{settings.receiptFooterNoteEn}</div>
                <div className="text-[8px] text-slate-400">{settings.receiptFooterNoteMm}</div>
                <div className="pt-1 text-[8px] text-slate-400 font-mono">
                  *** THANK YOU · ကျေးဇူးတင်ပါသည် ***
                </div>
              </div>
            </div>
          )}

          {/* STANDARD A4 VOUCHER */}
          {receiptStyle === 'a4' && (
            <div className="a4-report bg-white p-8 w-full max-w-[620px] shadow-sm border border-slate-200 text-slate-900 font-sans print-area">
              {/* Official Header */}
              <div className="flex items-start justify-between pb-4 border-b-2 border-slate-900">
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-slate-950">
                    {settings.businessNameEn}
                  </h1>
                  <h2 className="text-sm font-semibold text-slate-700">
                    {settings.businessNameMm}
                  </h2>
                  <div className="text-xs text-slate-500 mt-1">
                    {settings.addressEn}
                  </div>
                  <div className="text-xs text-slate-600 font-mono-numbers mt-0.5">
                    Phone: {settings.phone} · Email: {settings.email}
                  </div>
                </div>
                <div className="text-right">
                  <div className="px-3 py-1 bg-slate-900 text-white font-bold text-xs uppercase tracking-wider rounded">
                    Money Transfer Voucher
                  </div>
                  <div className="text-xs font-mono-numbers font-bold text-slate-800 mt-2">
                    {tx.id}
                  </div>
                  <div className="text-xs text-slate-500 font-mono-numbers">
                    {formatDate(tx.date)} {tx.time}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Reg No: {settings.regNo}
                  </div>
                </div>
              </div>

              {/* Status and Handled By strip */}
              <div className="py-2.5 px-3 bg-slate-50 border border-slate-200 rounded my-4 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-600">Transaction Status:</span>
                  <span className="font-bold uppercase text-blue-700">{tx.status}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-600">Authorized Cashier:</span>
                  <span className="font-medium text-slate-900">{tx.handledBy}</span>
                </div>
              </div>

              {/* Sender & Receiver Dual Column Box */}
              <div className="grid grid-cols-2 gap-4 mb-4 text-xs">
                <div className="p-3 border border-slate-200 rounded-lg bg-slate-50/50">
                  <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-1.5 pb-1 border-b border-slate-200">
                    Sender Information (ငွေလွှဲသူ)
                  </div>
                  <div className="space-y-1">
                    <div><span className="text-slate-500">Name:</span> <strong className="text-slate-900">{tx.senderName}</strong></div>
                    <div><span className="text-slate-500">Phone:</span> <span className="font-mono-numbers">{tx.senderPhone}</span></div>
                    <div><span className="text-slate-500">Location:</span> <span>{tx.senderLocation}</span></div>
                    <div><span className="text-slate-500">Payment:</span> <span className="font-medium">{tx.paymentMethod}</span></div>
                  </div>
                </div>

                <div className="p-3 border border-slate-200 rounded-lg bg-slate-50/50">
                  <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-1.5 pb-1 border-b border-slate-200">
                    Receiver Information (ငွေလက်ခံသူ)
                  </div>
                  <div className="space-y-1">
                    <div><span className="text-slate-500">Name:</span> <strong className="text-slate-900">{tx.receiverName}</strong></div>
                    <div><span className="text-slate-500">Phone:</span> <span className="font-mono-numbers">{tx.receiverPhone}</span></div>
                    <div><span className="text-slate-500">Location:</span> <span>{tx.receiverLocation}</span></div>
                    <div><span className="text-slate-500">Payout Mode:</span> <span className="font-medium">{tx.payoutMethod}</span></div>
                  </div>
                </div>
              </div>

              {/* Financial Calculation Table */}
              <table className="w-full text-xs font-mono-numbers border border-slate-200 mb-4">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-2 text-left">Description</th>
                    <th className="p-2 text-center">Currency & Rate</th>
                    <th className="p-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="p-2 text-slate-900 font-sans">Principal Transfer Amount</td>
                    <td className="p-2 text-center text-slate-600">{tx.sendCurrency}</td>
                    <td className="p-2 text-right font-medium">{formatCurrency(tx.sendAmount, tx.sendCurrency)}</td>
                  </tr>
                  {tx.exchangeRate !== 1 && (
                    <tr className="bg-slate-50">
                      <td className="p-2 text-slate-600 font-sans">Foreign Exchange Conversion Rate</td>
                      <td className="p-2 text-center text-slate-600">1 {tx.sendCurrency} = {tx.exchangeRate} {tx.receiveCurrency}</td>
                      <td className="p-2 text-right text-slate-600">-</td>
                    </tr>
                  )}
                  <tr>
                    <td className="p-2 text-slate-900 font-sans">Service Fee & Commission</td>
                    <td className="p-2 text-center text-slate-600">{tx.feePaidBy === 'sender' ? 'Sender Paid' : 'Deducted'}</td>
                    <td className="p-2 text-right font-medium">{formatCurrency(tx.serviceFee, tx.sendCurrency)}</td>
                  </tr>
                  <tr className="bg-blue-50/60 font-bold border-t border-slate-300">
                    <td className="p-2.5 text-blue-950 font-sans">TOTAL COLLECTED FROM SENDER</td>
                    <td className="p-2.5 text-center text-blue-900">Paid in Full</td>
                    <td className="p-2.5 text-right text-blue-700 text-sm">{formatCurrency(tx.totalCollectedFromSender, tx.sendCurrency)}</td>
                  </tr>
                  <tr className="bg-emerald-50/60 font-bold">
                    <td className="p-2.5 text-emerald-950 font-sans">PAYOUT DISBURSED TO RECEIVER</td>
                    <td className="p-2.5 text-center text-emerald-900">{tx.receiveCurrency}</td>
                    <td className="p-2.5 text-right text-emerald-700 text-sm">{formatCurrency(tx.payoutToReceiver, tx.receiveCurrency)}</td>
                  </tr>
                </tbody>
              </table>

              {/* Notes */}
              {tx.notes && (
                <div className="text-xs p-2.5 bg-slate-50 border border-slate-200 rounded mb-4">
                  <span className="font-semibold text-slate-700">Remarks / Notes:</span> {tx.notes}
                </div>
              )}

              {/* Signatures */}
              <div className="grid grid-cols-3 gap-6 pt-8 mt-6 border-t border-slate-200 text-center text-xs">
                <div>
                  <div className="border-b border-slate-400 pb-8 mb-1"></div>
                  <div className="font-semibold text-slate-700">{t.senderSignature}</div>
                  <div className="text-[10px] text-slate-400">Date: {formatDate(tx.date)}</div>
                </div>
                <div>
                  <div className="border-b border-slate-400 pb-8 mb-1"></div>
                  <div className="font-semibold text-slate-700">{t.counterStaff}</div>
                  <div className="text-[10px] text-slate-400">{tx.handledBy}</div>
                </div>
                <div>
                  <div className="border-b border-slate-400 pb-8 mb-1 flex items-center justify-center">
                    <span className="text-[10px] text-slate-300 uppercase tracking-widest">[ OFFICIAL STAMP ]</span>
                  </div>
                  <div className="font-semibold text-slate-700">{t.authorizedSignature}</div>
                  <div className="text-[10px] text-slate-400">Branch Management</div>
                </div>
              </div>

              {/* Policy Footer */}
              <div className="mt-6 pt-3 border-t border-slate-100 text-[10px] text-slate-400 text-center space-y-0.5">
                <div>{settings.receiptFooterNoteEn}</div>
                <div>{settings.receiptFooterNoteMm}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
