import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { getTranslation } from '../utils/translations';
import { 
  Plus, 
  Globe, 
  User as UserIcon, 
  Shield, 
  ChevronDown, 
  Check, 
  LogOut,
  Building2
} from 'lucide-react';

export const Header: React.FC = () => {
  const { 
    currentUser, 
    users, 
    switchUser, 
    logout, 
    language, 
    setLanguage, 
    setNewTransferModalOpen,
    settings,
    activeTab
  } = useApp();

  const t = getTranslation(language);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Get tab title
  const getTabTitle = () => {
    switch (activeTab) {
      case 'dashboard': return t.dashboard;
      case 'transactions': return t.transactions;
      case 'financial_ledger': return t.financialLedger;
      case 'daily_summary': return t.dailySummary;
      case 'monthly_summary': return t.monthlySummary;
      case 'expenses': return t.expenses;
      case 'cash_reconciliation': return t.cashReconciliation;
      case 'reports_export': return t.reportsExport;
      case 'audit_log': return t.auditLog;
      case 'settings': return t.settings;
      case 'automated_tests': return t.automatedTests;
      default: return t.dashboard;
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 lg:px-8 py-3 no-print">
      <div className="flex items-center justify-between gap-4">
        {/* Zone 1: Brand title & Location */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            PF
          </div>
          <div>
            <div className="font-bold text-slate-900 text-base leading-tight whitespace-nowrap">
              {language === 'mm' ? settings.businessNameMm : settings.businessNameEn}
            </div>
            <div className="text-xs text-slate-500 flex items-center gap-1.5 whitespace-nowrap">
              <span>{t.appSubTitle}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono-numbers font-medium text-slate-700">{getTabTitle()}</span>
            </div>
          </div>
        </div>

        {/* Zone 2: Navigation & Status indicator */}
        <div className="hidden md:flex items-center gap-2 text-xs text-slate-500">
          <span className="px-2.5 py-1 rounded bg-slate-100 font-medium text-slate-700">
            {settings.regNo}
          </span>
          <span aria-hidden="true">·</span>
          <span>Base: {settings.defaultCurrency}</span>
        </div>

        {/* Zone 3: Actions, Language & User Profile */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Language Toggle */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'mm' : 'en')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap"
            title="Switch Language / ဘာသာစကားပြောင်းရန်"
          >
            <Globe className="w-3.5 h-3.5 text-blue-600" />
            <span>{language === 'en' ? 'မြန်မာ' : 'English'}</span>
          </button>

          {/* Quick Action: New Transfer */}
          <button
            onClick={() => setNewTransferModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-md shadow-sm transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>{t.newTransfer}</span>
          </button>

          {/* User Profile & Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-md border border-slate-200 hover:bg-slate-50 transition-colors text-xs text-left"
            >
              <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                {currentUser.username[0].toUpperCase()}
              </div>
              <div className="hidden sm:block text-left">
                <div className="font-semibold text-slate-900 leading-none truncate max-w-[110px]">
                  {currentUser.fullName}
                </div>
                <div className="text-[10px] text-slate-500 font-medium capitalize mt-0.5 flex items-center gap-1">
                  {currentUser.role === 'admin' ? (
                    <span className="text-blue-700 font-semibold">{t.roleAdmin}</span>
                  ) : (
                    <span>{t.roleStaff}</span>
                  )}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {userDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setUserDropdownOpen(false)} 
                />
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-slate-200 py-1.5 z-50 text-xs">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <div className="font-semibold text-slate-900">{currentUser.fullName}</div>
                    <div className="text-slate-500 text-[11px]">@{currentUser.username} ({currentUser.role})</div>
                  </div>

                  <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Switch User (Demo / Multi-Staff)
                  </div>
                  {users.map(u => (
                    <button
                      key={u.id}
                      onClick={() => {
                        switchUser(u.id);
                        setUserDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center justify-between text-slate-700 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {u.role === 'admin' ? (
                          <Shield className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        ) : (
                          <UserIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        )}
                        <div>
                          <div className="font-medium text-slate-900">{u.fullName}</div>
                          <div className="text-[10px] text-slate-500 capitalize">{u.role}</div>
                        </div>
                      </div>
                      {u.id === currentUser.id && (
                        <Check className="w-4 h-4 text-blue-600" />
                      )}
                    </button>
                  ))}

                  <div className="border-t border-slate-100 mt-1 pt-1">
                    <button
                      onClick={() => {
                        logout();
                        setUserDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{t.logout}</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
