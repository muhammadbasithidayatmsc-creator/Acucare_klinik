import React, { useState, useEffect } from 'react';
import { Patient, PatientStatus } from '../../types';
import { useClinic } from '../../context/ClinicContext';
import { User, Phone, MapPin, HeartPulse, AlertCircle, X, ShieldAlert } from 'lucide-react';

interface PatientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientToEdit?: Patient | null;
}

export const PatientFormModal: React.FC<PatientFormModalProps> = ({
  isOpen,
  onClose,
  patientToEdit,
}) => {
  const { addPatient, updatePatient } = useClinic();

  const [fullName, setFullName] = useState('');
  const [nik, setNik] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<'Laki-laki' | 'Perempuan'>('Laki-laki');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [occupation, setOccupation] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [mainComplaint, setMainComplaint] = useState('');
  const [additionalComplaint, setAdditionalComplaint] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [allergyNotes, setAllergyNotes] = useState('');
  const [importantNotes, setImportantNotes] = useState('');
  const [status, setStatus] = useState<PatientStatus>('Aktif');

  useEffect(() => {
    if (patientToEdit) {
      setFullName(patientToEdit.full_name || '');
      setNik(patientToEdit.nik || '');
      setBirthDate(patientToEdit.birth_date || '');
      setGender(patientToEdit.gender || 'Laki-laki');
      setPhone(patientToEdit.phone || '');
      setWhatsapp(patientToEdit.whatsapp || '');
      setEmail(patientToEdit.email || '');
      setAddress(patientToEdit.address || '');
      setOccupation(patientToEdit.occupation || '');
      setEmergencyContact(patientToEdit.emergency_contact || '');
      setMainComplaint(patientToEdit.main_complaint || '');
      setAdditionalComplaint(patientToEdit.additional_complaint || '');
      setMedicalHistory(patientToEdit.medical_history || '');
      setAllergyNotes(patientToEdit.allergy_notes || '');
      setImportantNotes(patientToEdit.important_notes || '');
      setStatus(patientToEdit.status || 'Aktif');
    } else {
      setFullName('');
      setNik('');
      setBirthDate('');
      setGender('Laki-laki');
      setPhone('');
      setWhatsapp('');
      setEmail('');
      setAddress('');
      setOccupation('');
      setEmergencyContact('');
      setMainComplaint('');
      setAdditionalComplaint('');
      setMedicalHistory('');
      setAllergyNotes('');
      setImportantNotes('');
      setStatus('Aktif');
    }
  }, [patientToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !whatsapp.trim() || !mainComplaint.trim()) {
      alert('Mohon lengkapi Nama Lengkap, No WhatsApp, dan Keluhan Utama.');
      return;
    }

    if (patientToEdit) {
      updatePatient(patientToEdit.id, {
        full_name: fullName.trim(),
        nik: nik.trim() || undefined,
        birth_date: birthDate || undefined,
        gender,
        phone: phone.trim() || undefined,
        whatsapp: whatsapp.trim(),
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        occupation: occupation.trim() || undefined,
        emergency_contact: emergencyContact.trim() || undefined,
        main_complaint: mainComplaint.trim(),
        additional_complaint: additionalComplaint.trim() || undefined,
        medical_history: medicalHistory.trim() || undefined,
        allergy_notes: allergyNotes.trim() || undefined,
        important_notes: importantNotes.trim() || undefined,
        status,
      });
    } else {
      addPatient({
        full_name: fullName.trim(),
        nik: nik.trim() || undefined,
        birth_date: birthDate || undefined,
        gender,
        phone: phone.trim() || undefined,
        whatsapp: whatsapp.trim(),
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        occupation: occupation.trim() || undefined,
        emergency_contact: emergencyContact.trim() || undefined,
        main_complaint: mainComplaint.trim(),
        additional_complaint: additionalComplaint.trim() || undefined,
        medical_history: medicalHistory.trim() || undefined,
        allergy_notes: allergyNotes.trim() || undefined,
        important_notes: importantNotes.trim() || undefined,
        status,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div
        id="patient-form-modal"
        className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base">
                {patientToEdit ? 'Edit Data Pasien' : 'Pendaftaran Pasien Baru'}
              </h2>
              <p className="text-xs text-slate-400">
                {patientToEdit ? `Kode: ${patientToEdit.patient_code}` : 'ID Otomatis (Format: ACU-XXXXXX)'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 flex-1 custom-scrollbar">
          {/* Section 1: Identitas Pribadi */}
          <div>
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-xs font-bold text-teal-800 uppercase tracking-wider mb-4">
              <User className="w-4 h-4" />
              <span>1. Identitas Pribadi Pasien</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Lengkap Pasien <span className="text-rose-500">*</span>
                </label>
                <input
                  id="patient-fullname-input"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Contoh: Bambang Supriyanto"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nomor WhatsApp <span className="text-rose-500">*</span>
                </label>
                <input
                  id="patient-whatsapp-input"
                  type="tel"
                  required
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="Contoh: 081288992211"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">NIK (Nomor Induk Kependudukan)</label>
                <input
                  id="patient-nik-input"
                  type="text"
                  value={nik}
                  onChange={(e) => setNik(e.target.value)}
                  placeholder="16 Digit NIK"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Jenis Kelamin</label>
                <select
                  id="patient-gender-select"
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                >
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Lahir</label>
                <input
                  id="patient-birthdate-input"
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pekerjaan</label>
                <input
                  id="patient-occupation-input"
                  type="text"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  placeholder="Contoh: Wiraswasta / Karyawan"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kontak Darurat (Keluarga)</label>
                <input
                  id="patient-emergency-contact-input"
                  type="text"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  placeholder="Nama & No HP (misal: Ny. Endang - 081288...)"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Domisili</label>
                <textarea
                  id="patient-address-input"
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Alamat lengkap tempat tinggal"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Keluhan Medis & Riwayat Terapi */}
          <div>
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-xs font-bold text-teal-800 uppercase tracking-wider mb-4">
              <HeartPulse className="w-4 h-4" />
              <span>2. Informasi Keluhan & Riwayat Medis</span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Keluhan Utama <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="patient-main-complaint-input"
                  required
                  rows={2}
                  value={mainComplaint}
                  onChange={(e) => setMainComplaint(e.target.value)}
                  placeholder="Contoh: Saraf kejepit lumbal L4-L5, nyeri menjalar ke kaki kanan..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Keluhan Tambahan</label>
                <textarea
                  id="patient-additional-complaint-input"
                  rows={2}
                  value={additionalComplaint}
                  onChange={(e) => setAdditionalComplaint(e.target.value)}
                  placeholder="Contoh: Kebas pada jari kaki, sulit tidur karena pegal di pinggang..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Riwayat Penyakit / Rontgen / Medis
                  </label>
                  <textarea
                    id="patient-medical-history-input"
                    rows={2}
                    value={medicalHistory}
                    onChange={(e) => setMedicalHistory(e.target.value)}
                    placeholder="Hasil MRI/Rontgen, riwayat hipertensi, dll."
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Alergi</label>
                  <textarea
                    id="patient-allergy-input"
                    rows={2}
                    value={allergyNotes}
                    onChange={(e) => setAllergyNotes(e.target.value)}
                    placeholder="Alergi jarum/plester/alkohol/suhu dingin..."
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan Penting Praktisi (Instruksi Khusus)
                </label>
                <input
                  id="patient-important-notes-input"
                  type="text"
                  value={importantNotes}
                  onChange={(e) => setImportantNotes(e.target.value)}
                  placeholder="Contoh: Cek tensi sebelum terapi. Gunakan jarum 0.20mm."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Status Pasien</label>
                <select
                  id="patient-status-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                >
                  <option value="Aktif">Aktif (Sedang Program Terapi)</option>
                  <option value="Follow Up">Follow Up (Observasi / Berkala)</option>
                  <option value="Selesai">Selesai (Pemulihan Tuntas)</option>
                  <option value="Nonaktif">Nonaktif</option>
                </select>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
            <button
              id="patient-form-cancel-btn"
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              id="patient-form-submit-btn"
              type="submit"
              className="px-6 py-2.5 text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-lg shadow-teal-900/20 transition-all"
            >
              {patientToEdit ? 'Simpan Perubahan' : 'Daftarkan Pasien'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
