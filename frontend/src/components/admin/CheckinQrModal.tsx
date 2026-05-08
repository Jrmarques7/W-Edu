'use client';

import { QRCodeSVG } from 'qrcode.react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import type { CheckinToken, ScheduledMeeting } from '@/types/schedule';

export default function CheckinQrModal({ token, meeting, checkinUrl, onCopy, onClose }: {
  token: CheckinToken;
  meeting: ScheduledMeeting | null;
  checkinUrl: string;
  onCopy: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">QR Code de check-in</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {meeting?.title ?? `Encontro #${token.scheduled_meeting_id}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar modal"
            className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-white"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700">
            <QRCodeSVG value={checkinUrl} size={220} level="M" includeMargin />
          </div>
          <div className="w-full rounded-lg bg-gray-50 p-3 dark:bg-gray-900">
            <p className="break-all text-xs text-gray-600 dark:text-gray-300">{checkinUrl}</p>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Expira em {new Date(token.expires_at).toLocaleString('pt-BR')}.
            </p>
          </div>
          <div className="flex w-full justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Fechar
            </button>
            <button
              type="button"
              onClick={onCopy}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Copiar link
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
