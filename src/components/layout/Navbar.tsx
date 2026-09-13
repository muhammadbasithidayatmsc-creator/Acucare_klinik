import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useClinic } from '../../context/ClinicContext';
import { Search, Bell, Shield, UserCheck, LogOut, Menu, User, RefreshCw, Database } from 'lucide-react';

interface NavbarProps {
  onToggleSidebar?: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, activeTab, setActiveTab }) => {
  const { currentUser, role, isOwner, switchRole, logout } = useAuth();
  const { settings, setIsGlobalSearchOpen, invoices, herbalProducts } = useClinic();

  // Simple Notification Alerts
  const unpaidCount = invoices.filter((i) => i.payment_status === 'Belum Lunas' || i.payment_status === 'DP').length;
  const lowStockCount = herbalProducts.filter((p) => p.stock <= p.minimum_stock).length;
  const totalNotifications = unpaidCount + lowStockCount;

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-slate-900 border-b border-slate-800 text-white select-none">
      {/* Left brand / mobile menu toggle */}
      <div className="flex items-center gap-3">
        <button
          id="mobile-sidebar-toggle-btn"
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Toggle navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-teal-500/20 group-hover:scale-105 transition-transform">
            <span className="text-slate-950 font-black text-lg tracking-wider font-mono">AC</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-tight text-base text-white">ACUCARE</span>
              <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                Premium
              </span>
            </div>
            <p className="hidden md:block text-[11px] text-slate-400 font-medium line-clamp-1">
              Ahli Saraf Kejepit & Stroke
            </p>
          </div>
        </div>
      </div>

      {/* Center: Global Search Trigger */}
      <div className="flex-1 max-w-md mx-4 hidden sm:block">
        <button
          id="navbar-search-trigger"
          onClick={() => setIsGlobalSearchOpen(true)}
          className="w-full flex items-center justify-between px-3.5 py-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-teal-500/50 rounded-xl text-sm text-slate-300 transition-all group"
        >
          <div className="flex items-center gap-2.5">
            <Search className="w-4 h-4 text-teal-400 group-hover:text-teal-300 transition-colors" />
            <span className="text-slate-400 text-xs">Cari pasien, invoice, layanan...</span>
          </div>
          <kbd className="text-[10px] font-mono px-2 py-0.5 bg-slate-900 border border-slate-700 text-slate-400 rounded group-hover:border-teal-500/40">
            Ctrl + K
          </kbd>
        </button>
      </div>

      {/* Right controls: Notifications, Role switcher, User menu */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Mobile Search Button */}
        <button
          id="mobile-search-btn"
          onClick={() => setIsGlobalSearchOpen(true)}
          className="sm:hidden p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl"
        >
          <Search className="w-5 h-5 text-teal-400" />
        </button>

        {/* Notification indicator */}
        <div className="relative group">
          <button
            id="navbar-notifications-btn"
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors relative"
            title="Notifikasi Klinik"
          >
            <Bell className="w-5 h-5" />
            {totalNotifications > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-slate-900 animate-pulse" />
            )}
          </button>
          {/* Dropdown summary */}
          <div className="absolute right-0 mt-2 w-64 p-3 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl hidden group-hover:block z-40">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Notifikasi Klinik</h4>
            {totalNotifications === 0 ? (
              <p className="text-xs text-slate-400">Tidak ada notifikasi penting.</p>
            ) : (
              <div className="space-y-2 text-xs">
                {unpaidCount > 0 && (
                  <div
                    onClick={() => setActiveTab('invoices')}
                    className="p-2 bg-amber-950/40 border border-amber-800/40 rounded-lg text-amber-200 cursor-pointer hover:bg-amber-950/70"
                  >
                    ⚠️ <b>{unpaidCount} invoice</b> belum lunas / DP
                  </div>
                )}
                {lowStockCount > 0 && (
                  <div
                    onClick={() => setActiveTab('herbal')}
                    className="p-2 bg-rose-950/40 border border-rose-800/40 rounded-lg text-rose-200 cursor-pointer hover:bg-rose-950/70"
                  >
                    📦 <b>{lowStockCount} herbal</b> stok menipis / habis
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Role Switcher Pill */}
        <div className="hidden md:flex items-center gap-1 bg-slate-800/90 p-1 rounded-xl border border-slate-700">
          <button
            id="role-owner-toggle-btn"
            onClick={() => switchRole('OWNER')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              role === 'OWNER'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Owner</span>
          </button>
          <button
            id="role-admin-toggle-btn"
            onClick={() => switchRole('ADMIN')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              role === 'ADMIN'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Admin</span>
          </button>
        </div>

        {/* User profile dropdown trigger */}
        <div className="flex items-center gap-2 pl-1 border-l border-slate-800">
          <button
            id="profile-view-trigger"
            onClick={() => setActiveTab('profile')}
            className="flex items-center gap-2 p-1.5 hover:bg-slate-800 rounded-xl transition-colors text-left"
            title="Lihat Profil Praktisi (Yogi Pangestu)"
          >
            <div className="w-8 h-8 rounded-lg bg-teal-900/60 border border-teal-600/40 flex items-center justify-center text-teal-300 font-bold text-xs">
              YP
            </div>
            <div className="hidden lg:block">
              <p className="text-xs font-semibold leading-tight text-slate-200">{currentUser?.name || 'Yogi Pangestu'}</p>
              <p className="text-[10px] text-teal-400 font-mono">{role}</p>
            </div>
          </button>

          <button
            id="navbar-logout-btn"
            onClick={logout}
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-colors"
            title="Keluar / Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
