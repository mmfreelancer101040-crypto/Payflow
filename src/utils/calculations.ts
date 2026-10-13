import { Transaction, Expense, CashMovement, DailySummaryData, MonthlySummaryData } from '../types';

/**
 * Standard monetary rounding to avoid floating-point inaccuracies
 */
export function roundMoney(amount: number, decimals: number = 2): number {
  if (isNaN(amount)) return 0;
  const factor = Math.pow(10, decimals);
  return Math.round((amount + Number.EPSILON) * factor) / factor;
}

/**
 * Calculates transfer values accurately
 */
export function calculateTransferValues(
  sendAmount: number,
  exchangeRate: number = 1.0,
  serviceFee: number = 0,
  feePaidBy: 'sender' | 'deduct_from_receiver' = 'sender'
): {
  totalCollectedFromSender: number;
  payoutToReceiver: number;
} {
  const safeSend = roundMoney(Math.max(0, sendAmount));
  const safeRate = exchangeRate > 0 ? exchangeRate : 1.0;
  const safeFee = roundMoney(Math.max(0, serviceFee));

  if (feePaidBy === 'sender') {
    return {
      totalCollectedFromSender: roundMoney(safeSend + safeFee),
      payoutToReceiver: roundMoney(safeSend * safeRate),
    };
  } else {
    // Deducted from receiver payout
    const principalToReceiver = Math.max(0, safeSend - safeFee);
    return {
      totalCollectedFromSender: safeSend,
      payoutToReceiver: roundMoney(principalToReceiver * safeRate),
    };
  }
}

/**
 * Compute daily summary metrics for a given date
 */
export function computeDailyMetrics(
  transactions: Transaction[],
  expenses: Expense[],
  cashMovements: CashMovement[],
  targetDate: string,
  openingCash: number = 0
): DailySummaryData {
  const dayTransactions = transactions.filter(t => t.date === targetDate);
  const dayExpenses = expenses.filter(e => e.date === targetDate);
  const dayMovements = cashMovements.filter(m => m.date === targetDate);

  let totalTransferVolume = 0;
  let totalMoneyReceived = 0;
  let totalMoneyPaidOut = 0;
  let totalServiceFeesEarned = 0;

  let completedTransfers = 0;
  let pendingTransfers = 0;
  let cancelledTransfers = 0;
  let refundedTransfers = 0;

  let cashCollected = 0;
  let cashPaidOut = 0;
  let pendingLiabilities = 0;

  for (const t of dayTransactions) {
    if (t.status === 'Cancelled') {
      cancelledTransfers++;
      continue;
    }

    if (t.status === 'Refunded') {
      refundedTransfers++;
      // A refund means sender money was returned, but any retained fee counts as fee revenue
      if (t.refundFeeRetained && t.refundFeeRetained > 0) {
        totalServiceFeesEarned += t.refundFeeRetained;
      }
      continue;
    }

    // Active transfers (Pending, Processing, Completed)
    totalTransferVolume += t.sendAmount;
    totalMoneyReceived += t.totalCollectedFromSender;

    if (t.paymentMethod === 'Cash') {
      cashCollected += t.totalCollectedFromSender;
    }

    if (t.status === 'Completed') {
      completedTransfers++;
      totalMoneyPaidOut += t.payoutToReceiver;
      totalServiceFeesEarned += t.serviceFee;

      if (t.payoutMethod === 'Cash') {
        cashPaidOut += t.payoutToReceiver;
      }
    } else if (t.status === 'Pending' || t.status === 'Processing') {
      pendingTransfers++;
      pendingLiabilities += t.payoutToReceiver;
    }
  }

  // Calculate daily business expenses
  let totalBusinessExpenses = 0;
  let cashExpenses = 0;
  for (const e of dayExpenses) {
    totalBusinessExpenses += e.amount;
    if (e.paymentMethod === 'Cash') {
      cashExpenses += e.amount;
    }
  }

  // Net operating profit = Gross Service Fee Revenue - Operating Expenses
  const netProfit = roundMoney(totalServiceFeesEarned - totalBusinessExpenses);

  // Bank deposits and withdrawals from cash movements
  let cashDepositedToBank = 0;
  let cashWithdrawnFromBank = 0;
  for (const m of dayMovements) {
    if (m.type === 'Deposit to Bank' && m.fromAccount === 'Cash Drawer') {
      cashDepositedToBank += m.amount;
    } else if (m.type === 'Withdrawal from Bank' && m.toAccount === 'Cash Drawer') {
      cashWithdrawnFromBank += m.amount;
    } else if (m.type === 'Capital In' && m.toAccount === 'Cash Drawer') {
      cashWithdrawnFromBank += m.amount;
    } else if (m.type === 'Owner Drawing' && m.fromAccount === 'Cash Drawer') {
      cashDepositedToBank += m.amount;
    }
  }

  // Expected Closing Cash = Opening + Cash Collected - Cash Paid - Cash Expenses - Cash Deposited + Cash Withdrawn
  const expectedClosingCash = roundMoney(
    openingCash + cashCollected - cashPaidOut - cashExpenses - cashDepositedToBank + cashWithdrawnFromBank
  );

  return {
    date: targetDate,
    totalTransfers: dayTransactions.length,
    completedTransfers,
    pendingTransfers,
    cancelledTransfers,
    refundedTransfers,
    totalTransferVolume: roundMoney(totalTransferVolume),
    totalMoneyReceived: roundMoney(totalMoneyReceived),
    totalMoneyPaidOut: roundMoney(totalMoneyPaidOut),
    totalServiceFeesEarned: roundMoney(totalServiceFeesEarned),
    totalBusinessExpenses: roundMoney(totalBusinessExpenses),
    netProfit,
    cashInHandDrawer: expectedClosingCash,
    openingCashBalance: openingCash,
    expectedClosingCash,
    pendingLiabilities: roundMoney(pendingLiabilities),
  };
}

/**
 * Compute monthly summary metrics
 */
export function computeMonthlyMetrics(
  transactions: Transaction[],
  expenses: Expense[],
  year: number,
  month: number // 1 - 12
): MonthlySummaryData {
  const monthStr = String(month).padStart(2, '0');
  const prefix = `${year}-${monthStr}`;

  const monthTrans = transactions.filter(t => t.date.startsWith(prefix));
  const monthExpenses = expenses.filter(e => e.date.startsWith(prefix));

  let totalTransferVolume = 0;
  let totalMoneyReceived = 0;
  let totalMoneyPaidOut = 0;
  let totalServiceFeesEarned = 0;

  let completedTransfers = 0;
  let pendingTransfers = 0;
  let cancelledTransfers = 0;
  let refundedTransfers = 0;

  for (const t of monthTrans) {
    if (t.status === 'Cancelled') {
      cancelledTransfers++;
      continue;
    }
    if (t.status === 'Refunded') {
      refundedTransfers++;
      if (t.refundFeeRetained && t.refundFeeRetained > 0) {
        totalServiceFeesEarned += t.refundFeeRetained;
      }
      continue;
    }

    totalTransferVolume += t.sendAmount;
    totalMoneyReceived += t.totalCollectedFromSender;

    if (t.status === 'Completed') {
      completedTransfers++;
      totalMoneyPaidOut += t.payoutToReceiver;
      totalServiceFeesEarned += t.serviceFee;
    } else if (t.status === 'Pending' || t.status === 'Processing') {
      pendingTransfers++;
    }
  }

  const totalBusinessExpenses = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = roundMoney(totalServiceFeesEarned - totalBusinessExpenses);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return {
    year,
    month,
    monthName: monthNames[month - 1] || `Month ${month}`,
    totalTransfers: monthTrans.length,
    completedTransfers,
    pendingTransfers,
    cancelledTransfers,
    refundedTransfers,
    totalTransferVolume: roundMoney(totalTransferVolume),
    totalMoneyReceived: roundMoney(totalMoneyReceived),
    totalMoneyPaidOut: roundMoney(totalMoneyPaidOut),
    totalServiceFeesEarned: roundMoney(totalServiceFeesEarned),
    totalBusinessExpenses: roundMoney(totalBusinessExpenses),
    netProfit,
  };
}
