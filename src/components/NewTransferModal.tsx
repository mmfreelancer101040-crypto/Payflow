import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getTranslation } from '../utils/translations';
import { 
  generateTransactionId, 
  getTodayDateString, 
  getCurrentTimeString,
  formatCurrency 
} from '../utils/formatters';
import { calculateTransferValues, roundMoney } from '../utils/calculations';
import { PaymentMethod, TransferStatus } from '../types';
import { X, ArrowRight, Calculator, CheckCircle2 } from 'lucide-react';

export const NewTransferModal: React.FC = () => {
  const { 
    newTransferModalOpen, 
    setNewTransferModalOpen, 
    addTransaction, 
    openReceipt, 
    settings, 
    currentUser, 
    language 
  } = useApp();

  const t = getTranslation(language);

  // Form states
  const [txId, setTxId] = useState('');
  const [date, setDate] = useState(getTodayDateString());
  const [time, setTime] = useState(getCurrentTimeString());
  
  // Sender info
  const [senderName, setSenderName] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [senderLocation, setSenderLocation] = useState('Mandalay');

  // Receiver info
  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [receiverLocation, setReceiverLocation] = useState('Yangon');

  // Financial fields
  const [sendAmount, setSendAmount] = useState<number>(100000);
  const [sendCurrency, setSendCurrency] = useState(settings.defaultCurrency);
  const [exchangeRate, setExchangeRate] = useState<number>(1.0);
  const [receiveCurrency, setReceiveCurrency] = useState(settings.defaultCurrency);
  const [serviceFee, setServiceFee] = useState<number>(1500);
  const [feePaidBy, setFeePaidBy] = useState<'sender' | 'deduct_from_receiver'>('sender');

  // Methods & Status
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [payoutMethod, setPayoutMethod] = useState<PaymentMethod>('Cash');
  const [status, setStatus] = useState<TransferStatus>('Completed');
  const [handledBy, setHandledBy] = useState(currentUser.fullName);
  const [notes, setNotes] = useState('');
  const [printAfterSave, setPrintAfterSave] = useState(true);

  // Error handling
  const [error, setError] = useState('');

  // Re-initialize when modal opens
  useEffect(() => {
    if (newTransferModalOpen) {
      const today = getTodayDateString();
      setTxId(generateTransactionId(today));
      setDate(today);
      setTime(getCurrentTimeString());
      setHandledBy(currentUser.fullName);
      setError('');
    }
  }, [newTransferModalOpen, currentUser]);

  // Auto-calculate fee when sendAmount or settings change
  useEffect(() => {
    if (sendAmount > 0) {
      const calculated = roundMoney(
        Math.max(
          settings.minimumServiceFee,
          (sendAmount * settings.defaultServiceFeePercent) / 100
        )
      );
      setServiceFee(calculated);
    }
  }, [sendAmount, settings]);

  // Adjust currency exchange rate when currency changes
  const handleSendCurrencyChange = (curr: string) => {
    setSendCurrency(curr);
    const target = settings.supportedCurrencies.find(c => c.code === curr);
    if (target && curr !== settings.defaultCurrency) {
      setExchangeRate(target.rateToDefault);
      setReceiveCurrency(settings.defaultCurrency);
    } else {
      setExchangeRate(1.0);
      setReceiveCurrency(curr);
    }
  };

  if (!newTransferModalOpen) return null;

  // Real-time calculation
  const { totalCollectedFromSender, payoutToReceiver } = calculateTransferValues(
    sendAmount,
    exchangeRate,
    serviceFee,
    feePaidBy
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderName.trim()) {
      setError(language === 'mm' ? 'ငွေလွှဲသူအမည် ထည့်သွင်းပါ' : "Please enter sender's name");
      return;
    }
    if (!receiverName.trim()) {
      setError(language === 'mm' ? 'ငွေလက်ခံသူအမည် ထည့်သွင်းပါ' : "Please enter receiver's name");
      return;
    }
    if (sendAmount <= 0) {
      setError(language === 'mm' ? 'ငွေပမာဏ မှန်ကန်စွာ ထည့်သွင်းပါ' : 'Transfer amount must be greater than zero');
      return;
    }

    const newTx = addTransaction({
      id: txId || generateTransactionId(date),
      date,
      time,
      senderName: senderName.trim(),
      senderPhone: senderPhone.trim() || 'N/A',
      senderLocation: senderLocation.trim() || 'Local Counter',
      receiverName: receiverName.trim(),
      receiverPhone: receiverPhone.trim() || 'N/A',
      receiverLocation: receiverLocation.trim() || 'Local Branch',
      sendAmount,
      sendCurrency,
      exchangeRate,
      receiveAmount: payoutToReceiver,
      receiveCurrency,
      serviceFee,
      feePaidBy,
      totalCollectedFromSender,
      payoutToReceiver,
      paymentMethod,
      payoutMethod,
      status,
      handledBy,
      notes: notes.trim() || undefined,
    });

    setNewTransferModalOpen(false);

    // Reset fields
    setSenderName('');
    setSenderPhone('');
    setReceiverName('');
    setReceiverPhone('');
    setNotes('');

    if (printAfterSave) {
      openReceipt(newTx);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>{t.addTransfer}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-mono font-medium">
                {txId}
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {language === 'mm' ? 'ငွေလွှဲပေးပို့မှုအသစ် စာရင်းသွင်းခြင်း' : 'Record new money remittance and generate receipt'}
            </p>
          </div>
          <button
            onClick={() => setNewTransferModalOpen(false)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 max-h-[80vh] overflow-y-auto space-y-5">
          {error && (
            <div className="p-3 text-xs bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {/* Date, Time & Staff Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-slate-600 font-medium mb-1">{t.date}</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-mono-numbers text-xs"
                required
              />
            </div>
            <div>
              <label className="block text-slate-600 font-medium mb-1">{t.time}</label>
              <input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-mono-numbers text-xs"
                required
              />
            </div>
            <div>
              <label className="block text-slate-600 font-medium mb-1">{t.handledBy}</label>
              <input
                type="text"
                value={handledBy}
                onChange={e => setHandledBy(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs"
                required
              />
            </div>
          </div>

          {/* Sender & Receiver Dual Column */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sender Box */}
            <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-xs font-bold uppercase text-slate-700 tracking-wider">
                  {t.sender} ({language === 'mm' ? 'ငွေလွှဲသူ' : 'Origin'})
                </span>
                <span className="text-[11px] text-slate-400">Step 1</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {t.senderName} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={senderName}
                  onChange={e => setSenderName(e.target.value)}
                  placeholder="e.g. U Kyaw Win"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {t.senderPhone}
                </label>
                <input
                  type="text"
                  value={senderPhone}
                  onChange={e => setSenderPhone(e.target.value)}
                  placeholder="e.g. 09791234567"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs font-mono-numbers focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {t.senderLocation}
                </label>
                <input
                  type="text"
                  value={senderLocation}
                  onChange={e => setSenderLocation(e.target.value)}
                  placeholder="e.g. Mandalay, Bangkok"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {t.paymentMethod}
                </label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs focus:ring-1 focus:ring-blue-500 bg-white"
                >
                  <option value="Cash">{t.cash} (Cash in Counter)</option>
                  <option value="Bank Transfer">{t.bankTransfer}</option>
                  <option value="KBZPay">{t.kbzPay}</option>
                  <option value="WavePay">{t.wavePay}</option>
                  <option value="CBPay">{t.cbPay}</option>
                  <option value="AYA Pay">{t.ayaPay}</option>
                  <option value="Other">{t.other}</option>
                </select>
              </div>
            </div>

            {/* Receiver Box */}
            <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-xs font-bold uppercase text-slate-700 tracking-wider">
                  {t.receiver} ({language === 'mm' ? 'ငွေလက်ခံသူ' : 'Destination'})
                </span>
                <span className="text-[11px] text-slate-400">Step 2</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {t.receiverName} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={receiverName}
                  onChange={e => setReceiverName(e.target.value)}
                  placeholder="e.g. Daw Mya Mya"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {t.receiverPhone}
                </label>
                <input
                  type="text"
                  value={receiverPhone}
                  onChange={e => setReceiverPhone(e.target.value)}
                  placeholder="e.g. 09451122334"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs font-mono-numbers focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {t.receiverLocation}
                </label>
                <input
                  type="text"
                  value={receiverLocation}
                  onChange={e => setReceiverLocation(e.target.value)}
                  placeholder="e.g. Yangon, Taunggyi"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {t.payoutMethod}
                </label>
                <select
                  value={payoutMethod}
                  onChange={e => setPayoutMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs focus:ring-1 focus:ring-blue-500 bg-white"
                >
                  <option value="Cash">{t.cash} (Cash Out at Branch)</option>
                  <option value="Bank Transfer">{t.bankTransfer}</option>
                  <option value="KBZPay">{t.kbzPay}</option>
                  <option value="WavePay">{t.wavePay}</option>
                  <option value="CBPay">{t.cbPay}</option>
                  <option value="AYA Pay">{t.ayaPay}</option>
                  <option value="Other">{t.other}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Financial Calculation Box */}
          <div className="p-4 rounded-lg border border-blue-200 bg-blue-50/30 space-y-3">
            <div className="flex items-center justify-between border-b border-blue-100 pb-2">
              <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-blue-600" />
                <span>Financial Values & Exchange</span>
              </span>
              <span className="text-[11px] text-blue-600 font-medium">Automatic Balance Integrity</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              {/* Transfer Amount */}
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-800 mb-1">
                  {t.sendAmount} <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={sendAmount || ''}
                    onChange={e => setSendAmount(parseFloat(e.target.value) || 0)}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm font-bold font-mono-numbers focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <select
                    value={sendCurrency}
                    onChange={e => handleSendCurrencyChange(e.target.value)}
                    className="w-24 px-2 py-2 border border-slate-300 rounded-md font-semibold bg-white text-xs"
                  >
                    {settings.supportedCurrencies.map(c => (
                      <option key={c.code} value={c.code}>
                        {c.code} ({c.symbol})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Exchange Rate */}
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  {t.exchangeRate}
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.0001"
                  value={exchangeRate}
                  onChange={e => setExchangeRate(parseFloat(e.target.value) || 1.0)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono-numbers text-xs focus:ring-1 focus:ring-blue-500"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  1 {sendCurrency} = {exchangeRate} {receiveCurrency}
                </span>
              </div>

              {/* Service Fee */}
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  {t.serviceFee} ({sendCurrency})
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={serviceFee}
                  onChange={e => setServiceFee(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md font-bold font-mono-numbers text-xs focus:ring-1 focus:ring-blue-500 text-blue-800"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Our agency commission
                </span>
              </div>
            </div>

            {/* Fee Payment Mode */}
            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs">
              <span className="font-semibold text-slate-700">{t.feePaidBy}:</span>
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="feePaidBy"
                  checked={feePaidBy === 'sender'}
                  onChange={() => setFeePaidBy('sender')}
                  className="text-blue-600"
                />
                <span className="text-slate-800">{t.feePaidBySender}</span>
              </label>
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="feePaidBy"
                  checked={feePaidBy === 'deduct_from_receiver'}
                  onChange={() => setFeePaidBy('deduct_from_receiver')}
                  className="text-blue-600"
                />
                <span className="text-slate-800">{t.feeDeductReceiver}</span>
              </label>
            </div>

            {/* Live Calculation Preview Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-white rounded-lg border border-blue-200 mt-2 font-mono-numbers">
              <div className="text-left">
                <div className="text-[11px] font-sans font-semibold text-slate-500 uppercase">
                  {t.totalCollected}
                </div>
                <div className="text-lg font-extrabold text-blue-700">
                  {formatCurrency(totalCollectedFromSender, sendCurrency)}
                </div>
                <div className="text-[10px] text-slate-400 font-sans">
                  {feePaidBy === 'sender'
                    ? `Amount (${formatCurrency(sendAmount, sendCurrency)}) + Fee (${formatCurrency(serviceFee, sendCurrency)})`
                    : `Flat Amount (${formatCurrency(sendAmount, sendCurrency)})`}
                </div>
              </div>

              <div className="text-left sm:text-right">
                <div className="text-[11px] font-sans font-semibold text-slate-500 uppercase">
                  {t.payoutToReceiver}
                </div>
                <div className="text-lg font-extrabold text-emerald-700">
                  {formatCurrency(payoutToReceiver, receiveCurrency)}
                </div>
                <div className="text-[10px] text-slate-400 font-sans">
                  Disbursed via {payoutMethod}
                </div>
              </div>
            </div>
          </div>

          {/* Status & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">{t.status}</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as TransferStatus)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-xs font-medium"
              >
                <option value="Completed">{t.completed} (Cash Handed / Dispatched)</option>
                <option value="Processing">{t.processing} (In Transit / En Route)</option>
                <option value="Pending">{t.pending} (Awaiting Verification)</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-semibold mb-1">{t.notes}</label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="NRC #, reference code, relationship or counter note..."
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs"
              />
            </div>
          </div>

          {/* Print Checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="printCheck"
              checked={printAfterSave}
              onChange={e => setPrintAfterSave(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
            />
            <label htmlFor="printCheck" className="text-xs font-medium text-slate-700 cursor-pointer">
              {language === 'mm' ? 'မှတ်တမ်းတင်ပြီးသည်နှင့် ပြေစာချက်ချင်းဖွင့်ထုတ်မည်' : 'Open printable receipt immediately after saving'}
            </label>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setNewTransferModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-300 rounded-md transition-colors"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-md shadow-sm transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{t.confirm} & {t.save}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
