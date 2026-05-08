'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import api from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import type { Certificate } from '@/types/certificate';
import type { Course } from '@/types/course';

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<Certificate[]>(endpoints.certificates.my),
      api.get<Course[]>(endpoints.courses.list),
    ]).then(([certificateRes, courseRes]) => {
      setCertificates(certificateRes.data);
      setCourses(courseRes.data);
    }).catch(() => toast.error('Erro ao carregar certificados.'))
      .finally(() => setLoading(false));
  }, []);

  const courseName = (courseId: number) => courses.find((course) => course.id === courseId)?.name ?? `Curso #${courseId}`;
  const validationUrl = (code: string) => typeof window === 'undefined' ? '' : `${window.location.origin}/validate-certificate?code=${encodeURIComponent(code)}`;

  const downloadCertificate = async (certificate: Certificate) => {
    try {
      const { data } = await api.get(endpoints.certificates.download(certificate.id), { responseType: 'blob' });
      const url = URL.createObjectURL(data);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `certificado-${certificate.validation_code}.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Erro ao baixar certificado.');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <svg className="h-8 w-8 animate-spin text-indigo-600" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Meus certificados</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Certificados emitidos e seus códigos de validação.</p>
        <Link href="/validate-certificate" className="mt-2 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
          Validar um certificado
        </Link>
      </div>

      {certificates.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center dark:border-gray-600 dark:bg-gray-800">
          <ShieldCheckIcon className="mx-auto mb-3 h-12 w-12 text-gray-400" />
          <p className="text-gray-500 dark:text-gray-400">Nenhum certificado emitido ainda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {certificates.map((certificate) => (
            <div key={certificate.id} className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-semibold text-gray-900 dark:text-white">{courseName(certificate.course_id)}</h2>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Emitido em {new Date(certificate.issued_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${
                  certificate.revoked_at
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                }`}>
                  {certificate.revoked_at ? 'Revogado' : 'Válido'}
                </span>
              </div>
              <div className="mt-4 rounded-lg bg-gray-50 p-3 dark:bg-gray-900">
                <p className="text-xs font-medium uppercase text-gray-400">Código de validação</p>
                <p className="mt-1 break-all font-mono text-sm text-gray-900 dark:text-white">{certificate.validation_code}</p>
                {certificate.signed_at && (
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Assinado digitalmente em {new Date(certificate.signed_at).toLocaleDateString('pt-BR')}
                  </p>
                )}
              </div>
              {!certificate.revoked_at && (
                <div className="mt-4 flex flex-col gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700 sm:flex-row sm:items-center">
                  <div className="w-fit rounded bg-white p-2">
                    <QRCodeSVG value={validationUrl(certificate.validation_code)} size={96} level="M" includeMargin />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase text-gray-400">Validação por QR Code</p>
                    <p className="mt-1 break-all text-xs text-gray-500 dark:text-gray-400">{validationUrl(certificate.validation_code)}</p>
                  </div>
                </div>
              )}
              {certificate.revoked_reason && (
                <p className="mt-3 text-sm text-red-600 dark:text-red-400">{certificate.revoked_reason}</p>
              )}
              {!certificate.revoked_at && (
                <button
                  type="button"
                  onClick={() => downloadCertificate(certificate)}
                  className="mt-4 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Baixar PDF
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
