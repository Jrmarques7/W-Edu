'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import api from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import type { AttendanceRecord } from '@/types/schedule';

type CheckinState = 'loading' | 'success' | 'error';

export default function CheckInPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [state, setState] = useState<CheckinState>('loading');
  const [record, setRecord] = useState<AttendanceRecord | null>(null);
  const [message, setMessage] = useState('Registrando presença...');

  useEffect(() => {
    if (!token) return;
    api.post<AttendanceRecord>(endpoints.schedule.checkIn(token))
      .then((response) => {
        setRecord(response.data);
        setState('success');
        setMessage(response.data.status === 'late' ? 'Presença registrada como atraso.' : 'Presença registrada.');
      })
      .catch((error) => {
        setState('error');
        const detail = error.response?.data?.detail;
        setMessage(typeof detail === 'string' ? detail : 'Não foi possível registrar o check-in.');
      });
  }, [token]);

  const success = state === 'success';

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 dark:bg-gray-950">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center">
        <div className="w-full rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${
            success ? 'bg-emerald-50 dark:bg-emerald-900/20' : state === 'error' ? 'bg-red-50 dark:bg-red-900/20' : 'bg-indigo-50 dark:bg-indigo-900/20'
          }`}>
            {success ? (
              <CheckCircleIcon className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            ) : state === 'error' ? (
              <ExclamationTriangleIcon className="h-8 w-8 text-red-600 dark:text-red-400" />
            ) : (
              <svg className="h-8 w-8 animate-spin text-indigo-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
          </div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Check-in</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{message}</p>
          {record && (
            <div className="mt-4 rounded-lg bg-gray-50 p-3 text-left text-xs text-gray-600 dark:bg-gray-950 dark:text-gray-300">
              <p>Encontro #{record.scheduled_meeting_id}</p>
              <p>Registrado em {new Date(record.recorded_at).toLocaleString('pt-BR')}</p>
            </div>
          )}
          <Link href="/dashboard" className="mt-5 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            Ir para o dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
