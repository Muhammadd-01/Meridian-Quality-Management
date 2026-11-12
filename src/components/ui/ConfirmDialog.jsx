import React from 'react';
import { AlertTriangle, HelpCircle } from 'lucide-react';
import Modal from './Modal';

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title = 'Confirm Action', message = 'Are you sure?', confirmLabel = 'Delete', variant = 'danger' }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className={variant === 'danger' ? 'btn-danger' : 'btn-primary'} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </>
      }
    >
      <div className="flex items-start gap-3">
        <div className={`grid place-items-center w-10 h-10 rounded-full shrink-0 ${variant === 'danger' ? 'bg-danger-50' : 'bg-primary-100'}`}>
          {variant === 'danger' ? <AlertTriangle size={20} className="text-danger" /> : <HelpCircle size={20} className="text-brand" />}
        </div>
        <p className="text-sm text-gray-600 pt-2">{message}</p>
      </div>
    </Modal>
  );
}
