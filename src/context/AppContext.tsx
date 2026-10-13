import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  Transaction,
  Expense,
  CashMovement,
  CashReconciliation,
  User,
  BusinessSettings,
  AuditLog,
  Language,
  NavTab,
  TransferStatus,
} from '../types';
import {
  initialSettings,
  initialUsers,
  getSampleTransactions,
  getSampleExpenses,
  getSampleCashMovements,
  getSampleReconciliations,
  getSampleAuditLogs,
} from '../utils/sampleData';
import { hashPassword, getTodayDateString } from '../utils/formatters';

interface AppContextType {
  // State
  transactions: Transaction[];
  expenses: Expense[];
  cashMovements: CashMovement[];
  reconciliations: CashReconciliation[];
  users: User[];
  currentUser: User;
  settings: BusinessSettings;
  auditLogs: AuditLog[];
  language: Language;
  activeTab: NavTab;
  selectedTransactionForReceipt: Transaction | null;
  receiptModalOpen: boolean;
  newTransferModalOpen: boolean;

  // Actions
  setLanguage: (lang: Language) => void;
  setActiveTab: (tab: NavTab) => void;
  setReceiptModalOpen: (open: boolean) => void;
  setNewTransferModalOpen: (open: boolean) => void;
  openReceipt: (transaction: Transaction) => void;

  // Auth
  login: (username: string, password: string) => boolean;
  logout: () => void;
  switchUser: (userId: string) => void;

  // Transactions
  addTransaction: (tx: Omit<Transaction, 'createdAt' | 'updatedAt'>) => Transaction;
  updateTransaction: (tx: Transaction) => void;
  updateTransactionStatus: (id: string, newStatus: TransferStatus) => void;
  refundTransaction: (id: string, reason: string, refundAmount: number, feeRetained: number) => boolean;

  // Expenses & Cash
  addExpense: (expense: Omit<Expense, 'createdAt'>) => void;
  deleteExpense: (id: string) => boolean;
  addCashMovement: (movement: Omit<CashMovement, 'createdAt'>) => void;
  saveReconciliation: (rec: Omit<CashReconciliation, 'createdAt'>) => void;

  // Settings & Users
  updateSettings: (newSettings: BusinessSettings) => void;
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (user: User) => void;

  // Backup & Restore
  exportBackup: () => void;
  importBackup: (jsonData: string) => boolean;
  resetToSampleData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  TRANSACTIONS: 'payflow_transactions_v1',
  EXPENSES: 'payflow_expenses_v1',
  CASH_MOVEMENTS: 'payflow_movements_v1',
  RECONCILIATIONS: 'payflow_reconciliations_v1',
  USERS: 'payflow_users_v1',
  CURRENT_USER_ID: 'payflow_current_user_id_v1',
  SETTINGS: 'payflow_settings_v1',
  AUDIT_LOGS: 'payflow_audit_logs_v1',
  LANGUAGE: 'payflow_language_v1',
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize state with LocalStorage or sample fallback
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    return saved ? JSON.parse(saved) : getSampleTransactions();
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    return saved ? JSON.parse(saved) : getSampleExpenses();
  });

  const [cashMovements, setCashMovements] = useState<CashMovement[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CASH_MOVEMENTS);
    return saved ? JSON.parse(saved) : getSampleCashMovements();
  });

  const [reconciliations, setReconciliations] = useState<CashReconciliation[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.RECONCILIATIONS);
    return saved ? JSON.parse(saved) : getSampleReconciliations();
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USERS);
    return saved ? JSON.parse(saved) : initialUsers;
  });

  const [settings, setSettings] = useState<BusinessSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return saved ? JSON.parse(saved) : initialSettings;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    return saved ? JSON.parse(saved) : getSampleAuditLogs();
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    const savedId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
    const uList = users.length ? users : initialUsers;
    return uList.find(u => u.id === savedId) || uList[0];
  });

  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LANGUAGE) as Language;
    return saved === 'mm' ? 'mm' : 'en';
  });

  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [selectedTransactionForReceipt, setSelectedTransactionForReceipt] = useState<Transaction | null>(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [newTransferModalOpen, setNewTransferModalOpen] = useState(false);

  // Sync state to LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CASH_MOVEMENTS, JSON.stringify(cashMovements));
  }, [cashMovements]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RECONCILIATIONS, JSON.stringify(reconciliations));
  }, [reconciliations]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, currentUser.id);
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const logAudit = (
    action: string,
    details: string,
    entityType: AuditLog['entityType'],
    entityId?: string
  ) => {
    const newLog: AuditLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.fullName,
      action,
      details,
      entityType,
      entityId,
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Auth
  const login = (username: string, pass: string): boolean => {
    const passHash = hashPassword(pass);
    const found = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.active);
    if (found && found.passwordHash === passHash) {
      setCurrentUser(found);
      logAudit('LOGIN', `User ${found.username} logged in`, 'user', found.id);
      return true;
    }
    return false;
  };

  const logout = () => {
    logAudit('LOGOUT', `User ${currentUser.username} logged out`, 'user', currentUser.id);
    // Switch to first staff user or default
    const defaultUser = users[0];
    if (defaultUser) setCurrentUser(defaultUser);
  };

  const switchUser = (userId: string) => {
    const target = users.find(u => u.id === userId);
    if (target) {
      setCurrentUser(target);
      logAudit('SWITCH_USER', `Switched active user to ${target.username}`, 'user', target.id);
    }
  };

  // Transaction CRUD
  const addTransaction = (txData: Omit<Transaction, 'createdAt' | 'updatedAt'>): Transaction => {
    const nowIso = new Date().toISOString();
    const newTx: Transaction = {
      ...txData,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    setTransactions(prev => [newTx, ...prev]);
    logAudit(
      'CREATE_TRANSFER',
      `Created transfer ${newTx.id} from ${newTx.senderName} (${newTx.sendAmount} ${newTx.sendCurrency}) to ${newTx.receiverName}`,
      'transaction',
      newTx.id
    );
    return newTx;
  };

  const updateTransaction = (tx: Transaction) => {
    const nowIso = new Date().toISOString();
    setTransactions(prev => prev.map(item => (item.id === tx.id ? { ...tx, updatedAt: nowIso } : item)));
    logAudit(
      'UPDATE_TRANSFER',
      `Updated transfer record ${tx.id}`,
      'transaction',
      tx.id
    );
  };

  const updateTransactionStatus = (id: string, newStatus: TransferStatus) => {
    const nowIso = new Date().toISOString();
    setTransactions(prev =>
      prev.map(item => (item.id === id ? { ...item, status: newStatus, updatedAt: nowIso } : item))
    );
    logAudit(
      'STATUS_CHANGE',
      `Changed transfer status of ${id} to ${newStatus}`,
      'transaction',
      id
    );
  };

  const refundTransaction = (
    id: string,
    reason: string,
    refundAmount: number,
    feeRetained: number
  ): boolean => {
    if (currentUser.role !== 'admin') {
      return false; // Security check: Only manager/admin can authorize refunds
    }

    const nowIso = new Date().toISOString();
    setTransactions(prev =>
      prev.map(item => {
        if (item.id === id) {
          return {
            ...item,
            status: 'Refunded',
            refundReason: reason,
            refundDate: nowIso,
            refundAmount,
            refundFeeRetained: feeRetained,
            updatedAt: nowIso,
          };
        }
        return item;
      })
    );

    logAudit(
      'REFUND_TRANSFER',
      `Refunded transfer ${id} for ${refundAmount} MMK. Reason: ${reason}`,
      'transaction',
      id
    );
    return true;
  };

  // Expenses & Cash
  const addExpense = (expenseData: Omit<Expense, 'createdAt'>) => {
    const newExp: Expense = {
      ...expenseData,
      createdAt: new Date().toISOString(),
    };
    setExpenses(prev => [newExp, ...prev]);
    logAudit(
      'ADD_EXPENSE',
      `Recorded expense ${newExp.id}: ${newExp.category} - ${newExp.amount} MMK`,
      'expense',
      newExp.id
    );
  };

  const deleteExpense = (id: string): boolean => {
    if (currentUser.role !== 'admin') return false;
    const target = expenses.find(e => e.id === id);
    setExpenses(prev => prev.filter(e => e.id !== id));
    logAudit(
      'DELETE_EXPENSE',
      `Deleted expense ${id} (${target?.amount} MMK)`,
      'expense',
      id
    );
    return true;
  };

  const addCashMovement = (movData: Omit<CashMovement, 'createdAt'>) => {
    const newMov: CashMovement = {
      ...movData,
      createdAt: new Date().toISOString(),
    };
    setCashMovements(prev => [newMov, ...prev]);
    logAudit(
      'CASH_MOVEMENT',
      `Recorded cash movement: ${newMov.type} (${newMov.amount} MMK) from ${newMov.fromAccount} to ${newMov.toAccount}`,
      'cash_movement',
      newMov.id
    );
  };

  const saveReconciliation = (recData: Omit<CashReconciliation, 'createdAt'>) => {
    const newRec: CashReconciliation = {
      ...recData,
      createdAt: new Date().toISOString(),
    };
    // Replace any existing reconciliation for the same date or prepend
    setReconciliations(prev => [newRec, ...prev.filter(r => r.date !== newRec.date)]);
    logAudit(
      'RECONCILE_DRAWER',
      `Reconciled cash drawer for ${newRec.date}. Expected: ${newRec.expectedClosingCash}, Counted: ${newRec.actualCountedCash}, Diff: ${newRec.difference}`,
      'reconciliation',
      newRec.id
    );
  };

  const updateSettings = (newSettings: BusinessSettings) => {
    setSettings(newSettings);
    logAudit('UPDATE_SETTINGS', 'Updated company profile and settings', 'settings');
  };

  const addUser = (userData: Omit<User, 'id'>) => {
    const newUser: User = {
      ...userData,
      id: `usr_${Date.now()}`,
    };
    setUsers(prev => [...prev, newUser]);
    logAudit('CREATE_USER', `Created new user ${newUser.username} (${newUser.role})`, 'user', newUser.id);
  };

  const updateUser = (user: User) => {
    setUsers(prev => prev.map(u => (u.id === user.id ? user : u)));
    logAudit('UPDATE_USER', `Updated user credentials for ${user.username}`, 'user', user.id);
  };

  const openReceipt = (transaction: Transaction) => {
    setSelectedTransactionForReceipt(transaction);
    setReceiptModalOpen(true);
  };

  // Backup & Restore
  const exportBackup = () => {
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      businessName: settings.businessNameEn,
      transactions,
      expenses,
      cashMovements,
      reconciliations,
      users,
      settings,
      auditLogs,
    };

    const json = JSON.stringify(backupData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payflow_backup_${getTodayDateString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    logAudit('EXPORT_BACKUP', 'Exported full database backup file', 'system');
  };

  const importBackup = (jsonData: string): boolean => {
    try {
      const parsed = JSON.parse(jsonData);
      if (!parsed.transactions || !Array.isArray(parsed.transactions)) {
        return false;
      }

      setTransactions(parsed.transactions);
      if (parsed.expenses) setExpenses(parsed.expenses);
      if (parsed.cashMovements) setCashMovements(parsed.cashMovements);
      if (parsed.reconciliations) setReconciliations(parsed.reconciliations);
      if (parsed.users) setUsers(parsed.users);
      if (parsed.settings) setSettings(parsed.settings);
      if (parsed.auditLogs) setAuditLogs(parsed.auditLogs);

      logAudit('IMPORT_BACKUP', 'Restored system database from uploaded backup file', 'system');
      return true;
    } catch {
      return false;
    }
  };

  const resetToSampleData = () => {
    setTransactions(getSampleTransactions());
    setExpenses(getSampleExpenses());
    setCashMovements(getSampleCashMovements());
    setReconciliations(getSampleReconciliations());
    setUsers(initialUsers);
    setSettings(initialSettings);
    setAuditLogs(getSampleAuditLogs());
    setCurrentUser(initialUsers[0]);
    logAudit('RESET_DEMO_DATA', 'Reset database to realistic demonstration data', 'system');
  };

  return (
    <AppContext.Provider
      value={{
        transactions,
        expenses,
        cashMovements,
        reconciliations,
        users,
        currentUser,
        settings,
        auditLogs,
        language,
        activeTab,
        selectedTransactionForReceipt,
        receiptModalOpen,
        newTransferModalOpen,
        setLanguage,
        setActiveTab,
        setReceiptModalOpen,
        setNewTransferModalOpen,
        openReceipt,
        login,
        logout,
        switchUser,
        addTransaction,
        updateTransaction,
        updateTransactionStatus,
        refundTransaction,
        addExpense,
        deleteExpense,
        addCashMovement,
        saveReconciliation,
        updateSettings,
        addUser,
        updateUser,
        exportBackup,
        importBackup,
        resetToSampleData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
