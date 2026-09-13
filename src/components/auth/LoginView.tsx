import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Shield, UserCheck, Lock, Mail, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('yogi.acucare@gmail.com');
  const [password, setPassword] = useState('••••••••••••');
  const [roleSelection, setRoleSelection] = useState<'OWNER' | 'ADMIN'>('OWNER');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      login(email, roleSelection);
      setIsLoading(false);
    }, 400);
  };

  const handleSelectRolePreset = (role: 'OWNER' | 'ADMIN') => {
    setRoleSelection(role);
    if (role === 'OWNER') {
      setEmail('yogi.acucare@gmail.com');
    } else {
      setEmail('admin@acucare.clinic');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 select-none relative overflow-hidden">
      {/* Subtle Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 text-slate-950 font-black font-mono text-2xl shadow-xl shadow-teal-500/20 mb-3">
            AC
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">ACUCARE</h1>
          <p className="text-xs uppercase tracking-widest text-teal-400 font-semibold mt-1">
            Premium Acupuncture Clinic Management
          </p>
          <div className="flex items-center justify-center gap-1.5 mt-2 text-xs text-slate-400">
            <span>Ahli Saraf Kejepit & Stroke</span>
            <span>•</span>
            <span className="text-slate-300 font-medium">Yogi Pangestu</span>
          </div>
        </div>

        {/* Role Quick Selector */}
        <div className="grid grid-cols-2 gap-2.5 p-1.5 bg-slate-950/80 rounded-2xl border border-slate-800 mb-6">
          <button
            type="button"
            id="login-role-owner-btn"
            onClick={() => handleSelectRolePreset('OWNER')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all ${
              roleSelection === 'OWNER'
                ? 'bg-teal-600 text-white shadow-lg shadow-teal-900/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Owner (Yogi P.)</span>
          </button>

          <button
            type="button"
            id="login-role-admin-btn"
            onClick={() => handleSelectRolePreset('ADMIN')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all ${
              roleSelection === 'ADMIN'
                ? 'bg-sky-600 text-white shadow-lg shadow-sky-900/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Staf Admin</span>
          </button>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Akun</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="login-email-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-all font-mono"
                placeholder="nama@acucare.clinic"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-300">Kata Sandi</label>
              <span className="text-[10px] text-teal-400">Tersinkronisasi & Terenkripsi</span>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="login-password-input"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-all"
                placeholder="••••••••••••"
              />
            </div>
          </div>

          <button
            id="login-submit-btn"
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold text-sm rounded-xl shadow-xl shadow-teal-500/20 hover:shadow-teal-500/30 transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
          >
            {isLoading ? (
              <span className="inline-block animate-spin">⏳</span>
            ) : (
              <>
                <span>Masuk ke Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Feature Highlights */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 grid grid-cols-2 gap-3 text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <span>Database Persistent</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <span>Manajemen Saraf & Stroke</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <span>Invoice & PDF Ready</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <span>Inventori Herbal Otomatis</span>
          </div>
        </div>
      </div>

      {/* Footer info */}
      <footer className="mt-6 text-center text-xs text-slate-400">
        <p>Ruko Arcadia Residence A-16, Karangsatria, Tambun Utara, Bekasi</p>
        <p className="mt-1 text-[11px] text-slate-400">WhatsApp Resmi: 081399670676</p>
      </footer>
    </div>
  );
};
