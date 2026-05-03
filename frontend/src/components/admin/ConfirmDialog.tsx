'use client';

import { XMarkIcon } from '@heroicons/react/24/outline';

export default function ConfirmDialog({ title, message, confirmLabel = 'Confirmar', danger = false, onCancel, onConfirm }: {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{message}</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Fechar modal"
            className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-white"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onCancel} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
            Cancelar
          </button>
          <button type="button" onClick={onConfirm} className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
