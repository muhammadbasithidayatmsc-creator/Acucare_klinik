import React, { useState } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  requiredConfirmationText?: string; // If provided, user must type this exact string to activate confirm button
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Konfirmasi',
  cancelText = 'Batal',
  isDestructive = false,
  requiredConfirmationText,
}) => {
  const [typedText, setTypedText] = useState('');

  if (!isOpen) return null;

  const isRequirementMet = !requiredConfirmationText || typedText.trim() === requiredConfirmationText.trim();

  const handleConfirm = () => {
    if (isRequirementMet) {
      onConfirm();
      setTypedText('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        id="confirmation-modal"
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                isDestructive ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
              }`}
            >
              {isDestructive ? <Trash2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">{title}</h3>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">{message}</p>
            </div>
          </div>

          {requiredConfirmationText && (
            <div className="mt-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl">
              <label className="block text-xs font-semibold text-rose-900 mb-1.5">
                Ketik <span className="font-mono font-bold select-all text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">{requiredConfirmationText}</span> untuk mengonfirmasi:
              </label>
              <input
                id="confirmation-type-input"
                type="text"
                value={typedText}
                onChange={(e) => setTypedText(e.target.value)}
                placeholder={`Ketik "${requiredConfirmationText}"`}
                className="w-full px-3 py-2 text-sm border border-rose-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white font-mono"
                autoFocus
              />
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            id="confirmation-cancel-btn"
            type="button"
            onClick={() => {
              setTypedText('');
              onClose();
            }}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200/80 rounded-xl transition-colors"
          >
            {cancelText}
          </button>
          <button
            id="confirmation-confirm-btn"
            type="button"
            disabled={!isRequirementMet}
            onClick={handleConfirm}
            className={`px-5 py-2 text-sm font-semibold rounded-xl transition-all shadow-sm ${
              isDestructive
                ? isRequirementMet
                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'
                  : 'bg-rose-300 text-white cursor-not-allowed opacity-60'
                : 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/20'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
