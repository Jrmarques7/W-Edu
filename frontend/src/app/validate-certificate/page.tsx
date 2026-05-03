'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';
import api from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import type { CertificateValidation } from '@/types/certificate';

export default function ValidateCertificatePage() {
  const [code, setCode] = useState('');
  const [validation, setValidation] = useState<CertificateValidation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedCode = code.trim();
    if (!normalizedCode) return;
    setLoading(true);
    setError(null);
    setValidation(null);
    try {
      const { data } = await api.get<CertificateValidation>(endpoints.certificates.validate(normalizedCode));
      setValidation(data);
    } catch {
      setError('Não foi possível validar este código.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 dark:bg-gray-900">
      <div className="mx-auto max-w-xl">
        <Link href="/login" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
          Entrar na plataforma
        </Link>

        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
              <ShieldCheckIcon className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Validar certificado</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Informe o código de validação do certificado.</p>
            </div>
          </div>

          <form onSubmit={validate} className="mt-6 space-y-3">
            <input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="Código de validação"
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-mono text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
            />
            <button
              disabled={loading}
              className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Validando...' : 'Validar'}
            </button>
          </form>

          {error && <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>}

          {validation && (
            <div className={`mt-5 rounded-lg border p-4 ${
              validation.valid
                ? 'border-green-200 bg-green-50 text-green-800 dark:border-green-900/50 dark:bg-green-900/20 dark:text-green-300'
                : 'border-red-200 bg-red-50 text-red-800 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300'
            }`}>
              <p className="font-medium">{validation.valid ? 'Certificado válido' : 'Certificado inválido'}</p>
              {validation.message && <p className="mt-1 text-sm">{validation.message}</p>}
              {validation.certificate && (
                <div className="mt-3 text-sm">
                  <p>Curso: {validation.course_name ?? `#${validation.certificate.course_id}`}</p>
                  <p>Aluno: {validation.student_name ?? `#${validation.certificate.student_id}`}</p>
                  <p>Emitido em {new Date(validation.certificate.issued_at).toLocaleDateString('pt-BR')}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
