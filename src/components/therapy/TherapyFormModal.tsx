import React, { useState, useEffect } from 'react';
import { TherapySession } from '../../types';
import { useClinic } from '../../context/ClinicContext';
import { Activity, Calendar, Clock, DollarSign, User, X, CheckCircle2, ShieldAlert } from 'lucide-react';
import { formatRupiah } from '../../lib/exportUtils';

interface TherapyFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPatientId?: string;
  sessionToEdit?: TherapySession | null;
}

export const TherapyFormModal: React.FC<TherapyFormModalProps> = ({
  isOpen,
  onClose,
  initialPatientId,
  sessionToEdit,
}) => {
  const { patients, services, therapySessions, addTherapySession, updateTherapySession } = useClinic();

  const [patientId, setPatientId] = useState('');
  const [therapyDate, setTherapyDate] = useState(new Date().toISOString().slice(0, 10));
  const [therapyType, setTherapyType] = useState('Akupunktur Saraf Kejepit (HNP)');
  const [sessionNumber, setSessionNumber] = useState(1);
  const [conditionBefore, setConditionBefore] = useState('');
  const [treatmentArea, setTreatmentArea] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [conditionAfter, setConditionAfter] = useState('');
  const [practitionerNotes, setPractitionerNotes] = useState('');
  const [patientResponse, setPatientResponse] = useState<'Membaik Signifikan' | 'Membaik' | 'Tetap' | 'Perlu Evaluasi'>('Membaik');
  const [nextPlan, setNextPlan] = useState('');
  const [cost, setCost] = useState(150000);
  const [paymentStatus, setPaymentStatus] = useState<'Lunas' | 'Belum Lunas' | 'DP'>('Lunas');

  // Auto calculate next session number when patient changes
  useEffect(() => {
    if (sessionToEdit) {
      setPatientId(sessionToEdit.patient_id);
      setTherapyDate(sessionToEdit.therapy_date);
      setTherapyType(sessionToEdit.therapy_type);
      setSessionNumber(sessionToEdit.session_number);
      setConditionBefore(sessionToEdit.condition_before);
      setTreatmentArea(sessionToEdit.treatment_area);
      setDurationMinutes(sessionToEdit.duration_minutes);
      setConditionAfter(sessionToEdit.condition_after);
      setPractitionerNotes(sessionToEdit.practitioner_notes);
      setPatientResponse(sessionToEdit.patient_response as any);
      setNextPlan(sessionToEdit.next_plan || '');
      setCost(sessionToEdit.cost);
      setPaymentStatus(sessionToEdit.payment_status);
    } else {
      const selectedId = initialPatientId || (patients[0]?.id ?? '');
      setPatientId(selectedId);
      setTherapyDate(new Date().toISOString().slice(0, 10));
      setTherapyType('Akupunktur Saraf Kejepit (HNP)');
      setDurationMinutes(45);
      setPatientResponse('Membaik');
      setCost(150000);
      setPaymentStatus('Lunas');

      if (selectedId) {
        const pastSessions = therapySessions.filter((s) => s.patient_id === selectedId);
        setSessionNumber(pastSessions.length + 1);
        const p = patients.find((pat) => pat.id === selectedId);
        if (p) {
          setConditionBefore(`Keluhan: ${p.main_complaint}`);
        }
      }
    }
  }, [isOpen, sessionToEdit, initialPatientId, patients]);

  const handlePatientSelectChange = (newPid: string) => {
    setPatientId(newPid);
    if (!sessionToEdit) {
      const pastSessions = therapySessions.filter((s) => s.patient_id === newPid);
      setSessionNumber(pastSessions.length + 1);
      const p = patients.find((pat) => pat.id === newPid);
      if (p) {
        setConditionBefore(`Keluhan: ${p.main_complaint}`);
      }
    }
  };

  const handleServiceSelect = (svcName: string) => {
    setTherapyType(svcName);
    const svc = services.find((s) => s.name === svcName);
    if (svc) {
      setCost(svc.price);
      setDurationMinutes(svc.duration_minutes);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || !therapyDate || !conditionBefore || !treatmentArea || !conditionAfter) {
      alert('Mohon lengkapi semua field yang wajib (*)');
      return;
    }

    if (sessionToEdit) {
      updateTherapySession(sessionToEdit.id, {
        patient_id: patientId,
        therapy_date: therapyDate,
        therapy_type: therapyType,
        session_number: Number(sessionNumber),
        condition_before: conditionBefore,
        treatment_area: treatmentArea,
        duration_minutes: Number(durationMinutes),
        condition_after: conditionAfter,
        practitioner_notes: practitionerNotes,
        patient_response: patientResponse,
        next_plan: nextPlan || undefined,
        cost: Number(cost),
        payment_status: paymentStatus,
      });
    } else {
      addTherapySession({
        patient_id: patientId,
        therapy_date: therapyDate,
        therapy_type: therapyType,
        session_number: Number(sessionNumber),
        condition_before: conditionBefore,
        treatment_area: treatmentArea,
        duration_minutes: Number(durationMinutes),
        condition_after: conditionAfter,
        practitioner_notes: practitionerNotes,
        patient_response: patientResponse,
        next_plan: nextPlan || undefined,
        cost: Number(cost),
        payment_status: paymentStatus,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div
        id="therapy-form-modal"
        className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base">
                {sessionToEdit ? 'Edit Catatan Sesi Terapi' : 'Pencatatan Sesi Terapi Baru'}
              </h2>
              <p className="text-xs text-slate-400">
                Klinik Akupunktur Ahli Saraf Kejepit & Stroke • Yogi Pangestu
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 flex-1 custom-scrollbar">
          {/* Patient and Service Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Pilih Pasien <span className="text-rose-500">*</span>
              </label>
              <select
                id="therapy-patient-select"
                required
                value={patientId}
                onChange={(e) => handlePatientSelectChange(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.patient_code} - {p.full_name} ({p.status})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Sesi Kunjungan Ke- <span className="text-rose-500">*</span>
              </label>
              <input
                id="therapy-session-number-input"
                type="number"
                min={1}
                required
                value={sessionNumber}
                onChange={(e) => setSessionNumber(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tanggal Tindakan <span className="text-rose-500">*</span>
              </label>
              <input
                id="therapy-date-input"
                type="date"
                required
                value={therapyDate}
                onChange={(e) => setTherapyDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Jenis Layanan Terapi <span className="text-rose-500">*</span>
              </label>
              <select
                id="therapy-type-select"
                required
                value={therapyType}
                onChange={(e) => handleServiceSelect(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {services.map((svc) => (
                  <option key={svc.id} value={svc.name}>
                    {svc.name} - {formatRupiah(svc.price)} ({svc.duration_minutes} mnt)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Clinical Record Details */}
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kondisi / Keluhan Saat Datang <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="therapy-condition-before-input"
                required
                rows={2}
                value={conditionBefore}
                onChange={(e) => setConditionBefore(e.target.value)}
                placeholder="Contoh: Skala nyeri VAS 7/10 pada pinggang kanan, menjalar sampai betis..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-teal-800 mb-1">
                Area & Titik Penjaruman (Acupoints & Meridian) <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="therapy-treatment-area-input"
                required
                rows={2}
                value={treatmentArea}
                onChange={(e) => setTreatmentArea(e.target.value)}
                placeholder="Contoh: Titik BL25, BL26, GB30, BL40, BL60 + Elektrostimulator Frekuensi 2/100Hz 20 mnt"
                className="w-full px-3.5 py-2.5 bg-teal-50/40 border border-teal-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono text-slate-800"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Respon & Kondisi Pasca Tindakan <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="therapy-condition-after-input"
                  required
                  rows={2}
                  value={conditionAfter}
                  onChange={(e) => setConditionAfter(e.target.value)}
                  placeholder="Contoh: Skala nyeri turun ke 3/10, rentang gerak pinggang meningkat..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Catatan & Edukasi Praktisi</label>
                <textarea
                  id="therapy-practitioner-notes-input"
                  rows={2}
                  value={practitionerNotes}
                  onChange={(e) => setPractitionerNotes(e.target.value)}
                  placeholder="Instruksi pantangan, kompres hangat, hindari angkat beban..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Evaluasi Hasil Respon Pasien</label>
                <select
                  id="therapy-response-select"
                  value={patientResponse}
                  onChange={(e) => setPatientResponse(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="Membaik Signifikan">Membaik Signifikan</option>
                  <option value="Membaik">Membaik</option>
                  <option value="Tetap">Tetap (Perlu Lanjutan)</option>
                  <option value="Perlu Evaluasi">Perlu Evaluasi Khusus</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Durasi Tindakan (Menit)</label>
                <input
                  id="therapy-duration-input"
                  type="number"
                  min={10}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Biaya Tindakan (Rp)</label>
                <input
                  id="therapy-cost-input"
                  type="number"
                  min={0}
                  value={cost}
                  onChange={(e) => setCost(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Rencana Sesi Berikutnya</label>
              <input
                id="therapy-next-plan-input"
                type="text"
                value={nextPlan}
                onChange={(e) => setNextPlan(e.target.value)}
                placeholder="Contoh: Sesi ke-2 pada 3 hari ke depan, fokus moksibusi lumbal..."
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Disclaimer Notification */}
          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>
              Dokumentasi tindakan ini tersimpan aman pada basis data rekam operasional klinik untuk memantau progress
              pemulihan pasien.
            </p>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
            <button
              id="therapy-cancel-btn"
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              id="therapy-submit-btn"
              type="submit"
              className="px-6 py-2.5 text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-lg shadow-teal-900/20 transition-all"
            >
              {sessionToEdit ? 'Simpan Perubahan Sesi' : 'Simpan Catatan Terapi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
