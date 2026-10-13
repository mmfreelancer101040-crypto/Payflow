import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { getTranslation } from '../utils/translations';
import { formatDateTime } from '../utils/formatters';
import { 
  History, 
  Search, 
  ShieldCheck, 
  Filter, 
  User as UserIcon, 
  FileText 
} from 'lucide-react';

export const AuditLogView: React.FC = () => {
  const { auditLogs, language } = useApp();
  const t = getTranslation(language);

  const [searchTerm, setSearchTerm] = useState('');
  const [entityFilter, setEntityFilter] = useState('ALL');

  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchUser = log.userName.toLowerCase().includes(query);
        const matchAction = log.action.toLowerCase().includes(query);
        const matchDetails = log.details.toLowerCase().includes(query);
        const matchEntity = log.entityId?.toLowerCase().includes(query) ?? false;
        if (!matchUser && !matchAction && !matchDetails && !matchEntity) return false;
      }

      if (entityFilter !== 'ALL' && log.entityType !== entityFilter) {
        return false;
      }

      return true;
    });
  }, [auditLogs, searchTerm, entityFilter]);

  return (
    <div className="space-y-5">
      {/* Title */}
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          {t.auditLog}
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          {language === 'mm'
            ? 'စနစ်အတွင်း ဝန်ထမ်းများ လုပ်ဆောင်ခဲ့သော အရေးကြီးမှတ်တမ်းများ (Audit Trail)'
            : 'Immutable system trace of transactions created, status changes, refunds, and adjustments'}
        </p>
      </div>

      {/* Filter Strip */}
      <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3 text-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by staff, action, or voucher #..."
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-slate-600">Entity:</span>
          <select
            value={entityFilter}
            onChange={e => setEntityFilter(e.target.value)}
            className="px-2.5 py-2 border border-slate-300 rounded-lg bg-white text-xs"
          >
            <option value="ALL">All Categories</option>
            <option value="transaction">Transactions</option>
            <option value="expense">Expenses</option>
            <option value="cash_movement">Cash Movements</option>
            <option value="reconciliation">Reconciliations</option>
            <option value="user">User & Auth</option>
            <option value="settings">Settings</option>
            <option value="system">System</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Staff Member</th>
                <th className="py-2.5 px-3">Action Type</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No activity logs match criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 font-mono-numbers text-slate-600 whitespace-nowrap">
                      {formatDateTime(log.timestamp)}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 whitespace-nowrap">
                      {log.userName}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.action.includes('REFUND')
                          ? 'bg-purple-100 text-purple-800'
                          : log.action.includes('CREATE')
                          ? 'bg-blue-100 text-blue-800'
                          : log.action.includes('DELETE')
                          ? 'bg-red-100 text-red-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 capitalize text-slate-500 whitespace-nowrap">
                      {log.entityType.replace('_', ' ')}
                    </td>
                    <td className="py-2.5 px-3 text-slate-800 font-medium">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
