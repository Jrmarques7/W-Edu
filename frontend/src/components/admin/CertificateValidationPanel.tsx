'use client';

import { useState } from 'react';
import { QrCodeIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import type { CertificateValidation } from '@/types/certificate';

export default function CertificateValidationPanel() {
  const [code, setCode] = useState('');
  const [validation, setValidation] = useState<CertificateValidation | null>(null);

  const validate = async () => {
    if (!code) return;
    try {
      const { data } = await api.get<CertificateValidation>(endpoints.certificates.validate(code));
      setValidation(data);
    } catch { toast.error('Erro ao validar certificado.'); }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-3">
      <div className="flex items-center gap-2">
        <QrCodeIcon className="w-5 h-5 text-indigo-600" />
        <h2 className="font-semibold text-gray-900 dark:text-white">Validação pública</h2>
      </div>
      <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Código do certificado"
        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      <button onClick={validate} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
        Validar código
      </button>
      {validation && (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-sm text-gray-700 dark:text-gray-300">
          <p className="font-medium mb-1">{validation.valid ? 'Certificado válido' : 'Certificado inválido'}</p>
          <p>{validation.message}</p>
          {validation.certificate && (
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Curso #{validation.certificate.course_id} • Aluno #{validation.certificate.student_id}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
