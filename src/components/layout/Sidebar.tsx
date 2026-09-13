import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useClinic } from '../../context/ClinicContext';
import {
  LayoutDashboard,
  Users,
  Activity,
  ShoppingCart,
  FileText,
  Sparkles,
  Package,
  Wallet,
  TrendingUp,
  BarChart3,
  UploadCloud,
  Award,
  Settings,
  X,
  MessageCircle,
  Database,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isOpen, onClose }) => {
  const { role, isOwner } = useAuth();
  const { settings, patients, herbalProducts, invoices } = useClinic();

  const handleNavClick = (tabId: string) => {
    setActiveTab(tabId);
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  // Badges
  const activePatientsCount = patients.filter((p) => p.status === 'Aktif').length;
  const lowStockCount = herbalProducts.filter((p) => p.stock <= p.minimum_stock).length;
  const unpaidInvoicesCount = invoices.filter((i) => i.payment_status === 'Belum Lunas' || i.payment_status === 'DP').length;

  const navGroups = [
    {
      title: 'OPERASIONAL KLINIK',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: LayoutDashboard,
        },
        {
          id: 'patients',
          label: 'Data Pasien',
          icon: Users,
          badge: activePatientsCount > 0 ? `${activePatientsCount}` : undefined,
          badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
        },
        {
          id: 'therapy',
          label: 'Sesi Terapi',
          icon: Activity,
        },
        {
          id: 'sales',
          label: 'Penjualan & Kasir',
          icon: ShoppingCart,
        },
        {
          id: 'invoices',
          label: 'Invoice & Tagihan',
          icon: FileText,
          badge: unpaidInvoicesCount > 0 ? `${unpaidInvoicesCount}` : undefined,
          badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        },
      ],
    },
    {
      title: 'MANAJEMEN & KATALOG',
      items: [
        {
          id: 'services',
          label: 'Layanan Terapi',
          icon: Sparkles,
        },
        {
          id: 'herbal',
          label: 'Produk Herbal & Stok',
          icon: Package,
          badge: lowStockCount > 0 ? `${lowStockCount} Menipis` : undefined,
          badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
        },
        {
          id: 'finance',
          label: 'Arus Kas & Biaya',
          icon: Wallet,
        },
      ],
    },
    {
      title: 'LAPORAN & ANALISIS',
      items: [
        {
          id: 'financial-report',
          label: 'Laporan Keuangan',
          icon: TrendingUp,
        },
        {
          id: 'reports',
          label: 'Laporan Pasien & Herbal',
          icon: BarChart3,
        },
        {
          id: 'import-export',
          label: 'Import & Export Data',
          icon: UploadCloud,
        },
      ],
    },
    {
      title: 'PROFIL & SISTEM',
      items: [
        {
          id: 'profile',
          label: 'Profil Praktisi & Ijazah',
          icon: Award,
        },
        {
          id: 'settings',
          label: 'Pengaturan & Backup',
          icon: Settings,
        },
      ],
    },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm lg:hidden animate-in fade-in"
          onClick={onClose}
        />
      )}

      <aside
        id="main-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-40 w-72 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header / Brand in Sidebar */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center font-bold text-slate-950 font-mono text-sm">
              AC
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white">ACUCARE</h1>
              <p className="text-[10px] text-teal-400 font-medium">Clinic Management</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Clinic Mini Card */}
        <div className="p-4 mx-3 my-2 rounded-xl bg-slate-800/60 border border-slate-700/60">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-slate-200">{settings.practitioner_name}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-950 text-teal-300 font-mono font-medium border border-teal-800/50">
              {role}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 line-clamp-1">{settings.address}</p>
        </div>

        {/* Scrollable Nav List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-6 custom-scrollbar">
          {navGroups.map((group) => (
            <div key={group.title}>
              <h3 className="px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-1.5">
                {group.title}
              </h3>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      id={`sidebar-nav-${item.id}`}
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                        isActive
                          ? 'bg-teal-600 text-white shadow-md shadow-teal-900/30'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            isActive ? 'text-white' : 'text-slate-400 group-hover:text-teal-400'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border shrink-0 ${
                            isActive ? 'bg-white/20 text-white border-white/30' : item.badgeColor
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Quick Action */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40 text-[11px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Sistem Aktif & Terhubung</span>
          </div>
          <span className="font-mono text-[10px] text-slate-400">v1.2</span>
        </div>
      </aside>
    </>
  );
};
