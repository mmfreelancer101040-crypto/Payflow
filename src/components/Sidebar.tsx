import React from 'react';
import { useApp } from '../context/AppContext';
import { getTranslation } from '../utils/translations';
import { NavTab } from '../types';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Landmark,
  CalendarDays,
  CalendarRange,
  Receipt,
  Scale,
  FileSpreadsheet,
  History,
  Settings,
  CheckCheck,
  ShieldAlert,
} from 'lucide-react';

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, setMobileOpen }) => {
  const { activeTab, setActiveTab, language, currentUser, transactions } = useApp();
  const t = getTranslation(language);

  // Count pending transfers for subtle counter
  const pendingCount = transactions.filter(
    t => t.status === 'Pending' || t.status === 'Processing'
  ).length;

  const navItems: { tab: NavTab; label: string; icon: React.ElementType; badge?: number; adminOnly?: boolean }[] = [
    {
      tab: 'dashboard',
      label: t.dashboard,
      icon: LayoutDashboard,
    },
    {
      tab: 'transactions',
      label: t.transactions,
      icon: ArrowLeftRight,
      badge: pendingCount > 0 ? pendingCount : undefined,
    },
    {
      tab: 'financial_ledger',
      label: t.financialLedger,
      icon: Landmark,
    },
    {
      tab: 'daily_summary',
      label: t.dailySummary,
      icon: CalendarDays,
    },
    {
      tab: 'monthly_summary',
      label: t.monthlySummary,
      icon: CalendarRange,
    },
    {
      tab: 'expenses',
      label: t.expenses,
      icon: Receipt,
    },
    {
      tab: 'cash_reconciliation',
      label: t.cashReconciliation,
      icon: Scale,
    },
    {
      tab: 'reports_export',
      label: t.reportsExport,
      icon: FileSpreadsheet,
    },
    {
      tab: 'audit_log',
      label: t.auditLog,
      icon: History,
      adminOnly: true,
    },
    {
      tab: 'automated_tests',
      label: t.automatedTests,
      icon: CheckCheck,
    },
    {
      tab: 'settings',
      label: t.settings,
      icon: Settings,
    },
  ];

  const handleSelectTab = (tab: NavTab) => {
    setActiveTab(tab);
    setMobileOpen(false);
  };

  const navContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300">
      {/* Brand header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500 text-white font-bold flex items-center justify-center text-sm shadow">
            PF
          </div>
          <div>
            <div className="font-bold text-white text-sm tracking-tight leading-tight">PayFlow</div>
            <div className="text-[11px] text-slate-400">Money Transfer & FX</div>
          </div>
        </div>
      </div>

      {/* Navigation list */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map(item => {
          if (item.adminOnly && currentUser.role !== 'admin') {
            return null;
          }

          const isActive = activeTab === item.tab;
          const Icon = item.icon;

          return (
            <button
              key={item.tab}
              onClick={() => handleSelectTab(item.tab)}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap text-left ${
                isActive
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`text-[10px] font-mono-numbers px-1.5 py-0.5 rounded ${
                    isActive ? 'bg-blue-800 text-white' : 'bg-slate-800 text-amber-400 font-semibold'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-3.5 border-t border-slate-800 text-[11px] text-slate-400">
        <div className="flex items-center justify-between mb-1">
          <span className="text-slate-400">Mode:</span>
          <span className="text-slate-300 font-semibold uppercase">{currentUser.role}</span>
        </div>
        <div className="text-[10px] text-slate-400 leading-normal">
          Offline-ready storage · ISO compliance records
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 h-[calc(100vh-61px)] sticky top-[61px] no-print">
        {navContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer Content */}
      <div
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 transform transition-transform duration-200 ease-in-out lg:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {navContent}
      </div>
    </>
  );
};
