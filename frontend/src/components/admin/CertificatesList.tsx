'use client';

import type { Student } from '@/types/auth';
import type { Certificate } from '@/types/certificate';

export default function CertificatesList({ certificates, students, canRevoke, onRevoke }: {
  certificates: Certificate[];
  students: Student[];
  canRevoke: boolean;
  onRevoke: (certificate: Certificate) => void;
}) {
  const studentName = (id: number) => students.find((s) => s.id === id)?.name ?? `Aluno #${id}`;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
        <h2 className="font-semibold text-gray-900 dark:text-white">Certificados emitidos</h2>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {certificates.map((cert) => (
          <div key={cert.id} className="px-5 py-4 flex items-center justify-between gap-3">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{studentName(cert.student_id)}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{cert.validation_code}</p>
              {cert.revoked_reason && <p className="text-xs text-red-600 dark:text-red-400">{cert.revoked_reason}</p>}
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${cert.revoked_at ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
                {cert.revoked_at ? 'Revogado' : 'Válido'}
              </span>
              {canRevoke && !cert.revoked_at && (
                <button onClick={() => onRevoke(cert)} className="px-3 py-1.5 text-xs font-medium rounded-lg border border-red-200 text-red-700 hover:bg-red-50 dark:border-red-900/40 dark:text-red-400 dark:hover:bg-red-900/20">
                  Revogar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
