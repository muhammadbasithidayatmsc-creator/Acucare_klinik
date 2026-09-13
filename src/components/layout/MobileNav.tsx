import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Activity,
  CreditCard,
  MoreHorizontal,
  Plus,
  UserPlus,
  CalendarPlus,
  ShoppingCart,
  FilePlus,
  X,
} from 'lucide-react';

interface MobileNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenQuickAction: (actionType: string) => void;
  onOpenSidebar: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenQuickAction,
  onOpenSidebar,
}) => {
  const [isFabOpen, setIsFabOpen] = useState(false);

  const handleFabAction = (action: string) => {
    setIsFabOpen(false);
    onOpenQuickAction(action);
  };

  return (
    <>
      {/* FAB Quick Action Popup Menu */}
      {isFabOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex flex-col justify-end p-4 pb-24 lg:hidden animate-in fade-in"
          onClick={() => setIsFabOpen(false)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl space-y-2 max-w-sm w-full mx-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-bold text-slate-300 uppercase tracking-wider">
              <span>Aksi Cepat Klinik</span>
              <button onClick={() => setIsFabOpen(false)} className="text-slate-400 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => handleFabAction('new-patient')}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-800 hover:bg-teal-900/40 text-slate-200 hover:text-white transition-all text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center">
                <UserPlus className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold">Tambah Pasien Baru</p>
                <p className="text-[10px] text-slate-400">Pendaftaran data & keluhan pasien</p>
              </div>
            </button>

            <button
              onClick={() => handleFabAction('new-therapy')}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-800 hover:bg-teal-900/40 text-slate-200 hover:text-white transition-all text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
                <CalendarPlus className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold">Catat Sesi Terapi</p>
                <p className="text-[10px] text-slate-400">Dokumentasi titik & respon terapi</p>
              </div>
            </button>

            <button
              onClick={() => handleFabAction('new-sale')}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-800 hover:bg-teal-900/40 text-slate-200 hover:text-white transition-all text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-300 flex items-center justify-center">
                <ShoppingCart className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold">Transaksi Penjualan & Kasir</p>
                <p className="text-[10px] text-slate-400">Layanan + Produk Herbal + Invoice</p>
              </div>
            </button>

            <button
              onClick={() => handleFabAction('new-expense')}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-slate-200 hover:text-white transition-all text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-300 flex items-center justify-center">
                <FilePlus className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold">Catat Pengeluaran</p>
                <p className="text-[10px] text-slate-400">Biaya operasional & alkes</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Floating Center Plus Button */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 lg:hidden">
        <button
          id="mobile-fab-quick-btn"
          onClick={() => setIsFabOpen((prev) => !prev)}
          className={`w-13 h-13 rounded-full bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex items-center justify-center shadow-xl shadow-teal-900/50 border-2 border-slate-900 transition-transform active:scale-95 ${
            isFabOpen ? 'rotate-45' : ''
          }`}
          aria-label="Quick Action"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Bottom Navigation Bar */}
      <nav
        id="mobile-bottom-navigation"
        className="fixed bottom-0 left-0 right-0 z-30 h-16 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 flex items-center justify-around px-2 lg:hidden text-slate-400 select-none"
      >
        <button
          id="mobile-nav-dashboard"
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center w-14 py-1 transition-colors ${
            activeTab === 'dashboard' ? 'text-teal-400 font-semibold' : 'hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] mt-1">Dashboard</span>
        </button>

        <button
          id="mobile-nav-patients"
          onClick={() => setActiveTab('patients')}
          className={`flex flex-col items-center justify-center w-14 py-1 transition-colors ${
            activeTab === 'patients' ? 'text-teal-400 font-semibold' : 'hover:text-slate-200'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px] mt-1">Pasien</span>
        </button>

        {/* Space for Center FAB */}
        <div className="w-12"></div>

        <button
          id="mobile-nav-therapy"
          onClick={() => setActiveTab('therapy')}
          className={`flex flex-col items-center justify-center w-14 py-1 transition-colors ${
            activeTab === 'therapy' ? 'text-teal-400 font-semibold' : 'hover:text-slate-200'
          }`}
        >
          <Activity className="w-5 h-5" />
          <span className="text-[10px] mt-1">Terapi</span>
        </button>

        <button
          id="mobile-nav-more"
          onClick={onOpenSidebar}
          className="flex flex-col items-center justify-center w-14 py-1 hover:text-slate-200"
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[10px] mt-1">Menu</span>
        </button>
      </nav>
    </>
  );
};
