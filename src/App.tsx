import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { TransactionsView } from './components/TransactionsView';
import { FinancialLedgerView } from './components/FinancialLedgerView';
import { DailySummaryView } from './components/DailySummaryView';
import { MonthlySummaryView } from './components/MonthlySummaryView';
import { ExpensesView } from './components/ExpensesView';
import { CashReconciliationView } from './components/CashReconciliationView';
import { ReportsExportView } from './components/ReportsExportView';
import { AuditLogView } from './components/AuditLogView';
import { SettingsView } from './components/SettingsView';
import { AutomatedTestsView } from './components/AutomatedTestsView';
import { NewTransferModal } from './components/NewTransferModal';
import { ReceiptModal } from './components/ReceiptModal';
import { 
  Menu, 
  LayoutDashboard, 
  ArrowLeftRight, 
  CalendarDays, 
  Scale, 
  Plus 
} from 'lucide-react';

const AppContent: React.FC = () => {
  const { activeTab, setActiveTab, setNewTransferModalOpen, language } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Render active view
  const renderView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'transactions':
        return <TransactionsView />;
      case 'financial_ledger':
        return <FinancialLedgerView />;
      case 'daily_summary':
        return <DailySummaryView />;
      case 'monthly_summary':
        return <MonthlySummaryView />;
      case 'expenses':
        return <ExpensesView />;
      case 'cash_reconciliation':
        return <CashReconciliationView />;
      case 'reports_export':
        return <ReportsExportView />;
      case 'audit_log':
        return <AuditLogView />;
      case 'automated_tests':
        return <AutomatedTestsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans">
      {/* Top Header */}
      <Header />

      {/* Main Container */}
      <div className="flex-1 flex max-w-[1720px] w-full mx-auto">
        {/* Sidebar */}
        <Sidebar mobileOpen={mobileMenuOpen} setMobileOpen={setMobileMenuOpen} />

        {/* Content Viewport */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 pb-20 lg:pb-12">
          {renderView()}

          {/* Compliance & Regulatory Disclaimer Footer */}
          <footer className="mt-12 pt-6 border-t border-slate-200 text-center text-[11px] text-slate-400 no-print space-y-1">
            <p>
              PayFlow Recordkeeping System · Certified Financial Separation & Drawer Balancing
            </p>
            <p className="max-w-2xl mx-auto text-[10px] text-slate-400 leading-normal">
              Notice: This application is a private financial recordkeeping and ledger management tool.
              Remittance and foreign exchange operations must comply with the relevant financial regulations,
              licensing, and AML/CFT laws of the operating jurisdiction.
            </p>
          </footer>
        </main>
      </div>

      {/* Mobile Floating Bottom Bar for Rapid Navigation (hidden on desktop & print) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 px-3 py-2 flex items-center justify-around no-print shadow-lg">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center text-[10px] font-medium ${
            activeTab === 'dashboard' ? 'text-blue-600 font-bold' : 'text-slate-500'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span className="mt-0.5">Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('transactions')}
          className={`flex flex-col items-center text-[10px] font-medium ${
            activeTab === 'transactions' ? 'text-blue-600 font-bold' : 'text-slate-500'
          }`}
        >
          <ArrowLeftRight className="w-4 h-4" />
          <span className="mt-0.5">Transfers</span>
        </button>

        {/* Floating Quick Action in Center */}
        <button
          onClick={() => setNewTransferModalOpen(true)}
          className="-mt-5 w-11 h-11 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors"
          title="New Transfer"
        >
          <Plus className="w-5 h-5" />
        </button>

        <button
          onClick={() => setActiveTab('cash_reconciliation')}
          className={`flex flex-col items-center text-[10px] font-medium ${
            activeTab === 'cash_reconciliation' ? 'text-blue-600 font-bold' : 'text-slate-500'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span className="mt-0.5">Balance</span>
        </button>

        <button
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center text-[10px] font-medium text-slate-500"
        >
          <Menu className="w-4 h-4" />
          <span className="mt-0.5">Menu</span>
        </button>
      </div>

      {/* Global Modals */}
      <NewTransferModal />
      <ReceiptModal />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
