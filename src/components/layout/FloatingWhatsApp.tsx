import React from 'react';
import { MessageCircle } from 'lucide-react';

export const FloatingWhatsApp: React.FC = () => {
  const phoneNumber = '6281399670676';
  const defaultMessage = encodeURIComponent(
    'Halo ACUCARE, saya ingin melakukan booking/konsultasi. Mohon informasi jadwal yang tersedia. Terima kasih.'
  );
  const waUrl = `https://wa.me/${phoneNumber}?text=${defaultMessage}`;

  return (
    <aside aria-label="WhatsApp Booking CTA" className="fixed bottom-20 lg:bottom-6 right-4 lg:right-6 z-40">
      <a
        id="floating-whatsapp-booking-btn"
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="relative flex items-center gap-2.5 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full shadow-xl shadow-emerald-950/30 hover:shadow-emerald-600/40 transition-all hover:scale-105 active:scale-95 group font-medium text-xs md:text-sm border border-emerald-400/30"
        title="Hubungi Praktisi via WhatsApp (081399670676) - Praktisi Online"
      >
        {/* Practitioner Online / Available Dot Indicator */}
        <span
          id="whatsapp-online-indicator"
          className="absolute -top-1 -right-1 flex h-3.5 w-3.5"
          title="Praktisi Online / Tersedia"
        >
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-400 border-2 border-slate-900 shadow-xs" />
        </span>

        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
          <MessageCircle className="w-4 h-4 text-white fill-white/20" />
        </div>
        <span className="hidden sm:inline font-bold">Booking via WhatsApp</span>
        <span className="sm:hidden font-bold">WhatsApp</span>
      </a>
    </aside>
  );
};
