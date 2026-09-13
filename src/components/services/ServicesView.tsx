import React, { useState } from 'react';
import { Service } from '../../types';
import { useClinic } from '../../context/ClinicContext';
import { Sparkles, Plus, Edit, Trash2, Clock, DollarSign, X, CheckCircle2 } from 'lucide-react';
import { formatRupiah } from '../../lib/exportUtils';
import { ConfirmationModal } from '../common/ConfirmationModal';

export const ServicesView: React.FC = () => {
  const { services, addService, updateService, deleteService, addToast } = useClinic();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [serviceToEdit, setServiceToEdit] = useState<Service | null>(null);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [price, setPrice] = useState(150000);
  const [category, setCategory] = useState('Akupunktur Spesialis');

  const openAddModal = () => {
    setServiceToEdit(null);
    setName('');
    setDescription('');
    setDurationMinutes(45);
    setPrice(150000);
    setCategory('Akupunktur Spesialis');
    setIsModalOpen(true);
  };

  const openEditModal = (svc: Service) => {
    setServiceToEdit(svc);
    setName(svc.name);
    setDescription(svc.description || '');
    setDurationMinutes(svc.duration_minutes);
    setPrice(svc.price);
    setCategory(svc.category);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (serviceToEdit) {
      updateService(serviceToEdit.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        duration_minutes: Number(durationMinutes),
        price: Number(price),
        category,
        is_active: true,
      });
      addToast('success', 'Layanan Berhasil Diperbarui');
    } else {
      addService({
        name: name.trim(),
        description: description.trim() || undefined,
        duration_minutes: Number(durationMinutes),
        price: Number(price),
        category,
        is_active: true,
      });
      addToast('success', 'Layanan Baru Berhasil Ditambahkan');
    }
    setIsModalOpen(false);
  };

  const confirmDelete = () => {
    if (serviceToDelete) {
      deleteService(serviceToDelete.id);
      setServiceToDelete(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Katalog Layanan Terapi</h1>
          <p className="text-xs text-slate-500 mt-1">
            Daftar tindakan medis/terapi akupunktur spesialis saraf kejepit, stroke, durasi, dan tarif.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-teal-900/20 transition-all hover:scale-105 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>+ Tambah Layanan</span>
        </button>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((svc) => (
          <div
            key={svc.id}
            className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200/60">
                  {svc.category}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(svc)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setServiceToDelete(svc)}
                    className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h3 className="font-bold text-base text-slate-900 mt-3">{svc.name}</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{svc.description}</p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Clock className="w-3.5 h-3.5 text-teal-600" />
                <span>{svc.duration_minutes} Menit</span>
              </div>
              <span className="font-bold text-base text-slate-900 font-mono">{formatRupiah(svc.price)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-teal-400" />
                <h3 className="font-bold text-base">{serviceToEdit ? 'Edit Layanan Terapi' : 'Tambah Layanan Baru'}</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Layanan *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Akupunktur Saraf Kejepit (HNP Lumbal)"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kategori</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="Akupunktur Spesialis">Akupunktur Spesialis</option>
                  <option value="Terapi Fisik">Terapi Fisik & Stimulasi</option>
                  <option value="Paket Pemulihan">Paket Pemulihan</option>
                  <option value="Umum">Layanan Umum</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Durasi (Menit)</label>
                  <input
                    type="number"
                    min={10}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tarif / Harga (Rp) *</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-teal-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi Tindakan</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Penjelasan teknik, meridian, dan indikasinya..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-md"
                >
                  Simpan Layanan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      <ConfirmationModal
        isOpen={!!serviceToDelete}
        onClose={() => setServiceToDelete(null)}
        onConfirm={confirmDelete}
        title="Hapus Layanan Terapi?"
        message={`Layanan ${serviceToDelete?.name} akan dihapus dari katalog.`}
        confirmText="Hapus"
        isDestructive
      />
    </div>
  );
};
