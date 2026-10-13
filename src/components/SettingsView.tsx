import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { getTranslation } from '../utils/translations';
import { hashPassword } from '../utils/formatters';
import { BusinessSettings, User } from '../types';
import { 
  Settings as SettingsIcon, 
  Building2, 
  Coins, 
  Users, 
  Database, 
  Save, 
  Download, 
  Upload, 
  RefreshCw, 
  CheckCircle2, 
  ShieldCheck,
  Plus
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { 
    settings, 
    updateSettings, 
    users, 
    addUser, 
    updateUser, 
    currentUser, 
    exportBackup, 
    importBackup, 
    resetToSampleData, 
    language 
  } = useApp();

  const t = getTranslation(language);

  // Form states
  const [formData, setFormData] = useState<BusinessSettings>(settings);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [backupNotice, setBackupNotice] = useState('');

  // Add User State
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'staff'>('staff');
  const [newPassword, setNewPassword] = useState('');
  const [userError, setUserError] = useState('');

  const handleSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser.role !== 'admin') {
      alert(t.permissionDenied);
      return;
    }
    updateSettings(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleCurrencyRateChange = (index: number, newRate: number) => {
    const updated = [...formData.supportedCurrencies];
    updated[index] = { ...updated[index], rateToDefault: newRate };
    setFormData({ ...formData, supportedCurrencies: updated });
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser.role !== 'admin') {
      setUserError(t.permissionDenied);
      return;
    }
    if (!newUsername.trim() || !newFullName.trim() || !newPassword.trim()) {
      setUserError('Please fill in all user fields');
      return;
    }

    if (users.some(u => u.username.toLowerCase() === newUsername.toLowerCase())) {
      setUserError('A user with this username already exists');
      return;
    }

    addUser({
      username: newUsername.trim().toLowerCase(),
      fullName: newFullName.trim(),
      role: newRole,
      passwordHash: hashPassword(newPassword),
      active: true,
    });

    setShowAddUser(false);
    setNewUsername('');
    setNewFullName('');
    setNewPassword('');
    setUserError('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      if (content) {
        const success = importBackup(content);
        if (success) {
          setBackupNotice(t.restoreSuccess);
        } else {
          setBackupNotice('Failed to restore backup. Invalid JSON file format.');
        }
        setTimeout(() => setBackupNotice(''), 4000);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          {t.settings}
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          {language === 'mm'
            ? 'လုပ်ငန်းအချက်အလက်များ၊ ဝန်ဆောင်ခနှုန်းထားများ၊ ဝန်ထမ်းအကောင့်များနှင့် ဒေတာသိမ်းဆည်းခြင်း'
            : 'Configure business profile, exchange rates, fee structure, users, and backup'}
        </p>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Business settings updated successfully!</span>
        </div>
      )}

      {backupNotice && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
          <span>{backupNotice}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Business Info & Rates */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSettingsSubmit} className="space-y-6">
            {/* Business Profile */}
            <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Building2 className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900">{t.businessInfo}</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Company Name (English)
                  </label>
                  <input
                    type="text"
                    value={formData.businessNameEn}
                    onChange={e => setFormData({ ...formData, businessNameEn: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Company Name (Myanmar / မြန်မာ)
                  </label>
                  <input
                    type="text"
                    value={formData.businessNameMm}
                    onChange={e => setFormData({ ...formData, businessNameMm: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Contact Phone Numbers
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono-numbers"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Registration / Tax Number
                  </label>
                  <input
                    type="text"
                    value={formData.regNo}
                    onChange={e => setFormData({ ...formData, regNo: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono-numbers"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1">
                    Address (English)
                  </label>
                  <input
                    type="text"
                    value={formData.addressEn}
                    onChange={e => setFormData({ ...formData, addressEn: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1">
                    Address (Myanmar / မြန်မာ)
                  </label>
                  <input
                    type="text"
                    value={formData.addressMm}
                    onChange={e => setFormData({ ...formData, addressMm: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Fee Rules & Currency Rates */}
            <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Coins className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900">
                  Default Fee Structure & Exchange Rates
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Standard Commission Fee (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.defaultServiceFeePercent}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        defaultServiceFeePercent: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono-numbers"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Applied automatically when adding transfers
                  </span>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Minimum Fee Floor ({formData.defaultCurrency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minimumServiceFee}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        minimumServiceFee: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono-numbers"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Smallest fee charged per transfer
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <label className="block text-xs font-semibold text-slate-800 mb-2">
                  Foreign Currency Exchange Rates (Relative to 1 Base {formData.defaultCurrency}):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 font-mono-numbers text-xs">
                  {formData.supportedCurrencies.map((c, idx) => (
                    <div key={c.code} className="p-2 rounded border border-slate-200 bg-slate-50 flex items-center justify-between">
                      <span className="font-bold text-slate-800">{c.code} ({c.symbol}):</span>
                      <input
                        type="number"
                        step="any"
                        value={c.rateToDefault}
                        disabled={c.code === formData.defaultCurrency}
                        onChange={e => handleCurrencyRateChange(idx, parseFloat(e.target.value) || 1)}
                        className="w-20 px-1.5 py-0.5 border border-slate-300 rounded text-right bg-white text-xs disabled:bg-slate-200"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Receipt Footer Notes */}
              <div className="pt-2 space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Receipt Disclaimer Note (English)
                  </label>
                  <textarea
                    rows={2}
                    value={formData.receiptFooterNoteEn}
                    onChange={e => setFormData({ ...formData, receiptFooterNoteEn: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Receipt Disclaimer Note (Myanmar)
                  </label>
                  <textarea
                    rows={2}
                    value={formData.receiptFooterNoteMm}
                    onChange={e => setFormData({ ...formData, receiptFooterNoteMm: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              {currentUser.role === 'admin' && (
                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Settings</span>
                  </button>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Right Column: User Management & Backup/Restore */}
        <div className="space-y-6">
          {/* User Accounts Card */}
          <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900">User Accounts</h2>
              </div>
              {currentUser.role === 'admin' && (
                <button
                  onClick={() => setShowAddUser(true)}
                  className="text-xs text-blue-600 hover:underline font-medium"
                >
                  + Add User
                </button>
              )}
            </div>

            <div className="space-y-2 text-xs">
              {users.map(u => (
                <div
                  key={u.id}
                  className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-slate-900">{u.fullName}</div>
                    <div className="text-[11px] text-slate-500 font-mono-numbers">@{u.username}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    u.role === 'admin' ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {u.role}
                  </span>
                </div>
              ))}
            </div>

            {/* Add User Modal */}
            {showAddUser && (
              <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-200 text-xs space-y-2.5">
                <div className="font-bold text-blue-950 flex justify-between">
                  <span>Create Staff Account</span>
                  <button onClick={() => setShowAddUser(false)} className="text-slate-400">✕</button>
                </div>

                {userError && <div className="text-red-600">{userError}</div>}

                <div>
                  <label className="block text-slate-600 mb-0.5">Username</label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={e => setNewUsername(e.target.value)}
                    placeholder="e.g. cashier2"
                    className="w-full px-2 py-1 border border-slate-300 rounded bg-white text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-0.5">Full Name</label>
                  <input
                    type="text"
                    value={newFullName}
                    onChange={e => setNewFullName(e.target.value)}
                    placeholder="e.g. Daw Nilar (Counter 3)"
                    className="w-full px-2 py-1 border border-slate-300 rounded bg-white text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-0.5">Role</label>
                  <select
                    value={newRole}
                    onChange={e => setNewRole(e.target.value as any)}
                    className="w-full px-2 py-1 border border-slate-300 rounded bg-white text-xs"
                  >
                    <option value="staff">Staff (Counter Operator)</option>
                    <option value="admin">Admin (Manager / Full Access)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 mb-0.5">Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full px-2 py-1 border border-slate-300 rounded bg-white text-xs"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleCreateUser}
                  className="w-full py-1.5 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 transition-colors"
                >
                  Create User
                </button>
              </div>
            )}
          </div>

          {/* Backup & Restore Card */}
          <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Database className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900">{t.backupAndRestore}</h2>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Export your complete database (transactions, expenses, settings, users, audit logs) to a secure JSON file. You can restore this anytime on any device.
            </p>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={exportBackup}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{t.downloadBackup}</span>
              </button>

              <label className="w-full flex items-center justify-center gap-1.5 py-2 px-3 border border-slate-300 hover:bg-slate-50 text-slate-800 rounded-lg text-xs font-semibold cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5 text-slate-500" />
                <span>{t.restoreBackup}</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Reset database to realistic sample data? This will replace current records.')) {
                    resetToSampleData();
                  }
                }}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-slate-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg text-xs font-medium transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{t.resetDemoData}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
