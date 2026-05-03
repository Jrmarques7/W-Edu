'use client';

import { useEffect, useState } from 'react';
import { AcademicCapIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { useAuthStore } from '@/store/authStore';
import type { Course, Enrollment } from '@/types/course';
import type { Student } from '@/types/auth';
import type { Certificate, CertificateEligibility, CertificateIssueResult, CertificateRule } from '@/types/certificate';
import CertificateIssuancePanel from '@/components/admin/CertificateIssuancePanel';
import CertificateRuleForm from '@/components/admin/CertificateRuleForm';
import CertificatesList from '@/components/admin/CertificatesList';
import CertificateValidationPanel from '@/components/admin/CertificateValidationPanel';

export default function AdminCertificatesPage() {
  const { student } = useAuthStore();
  const canRevoke = student?.role === 'admin';
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [rule, setRule] = useState<CertificateRule | null>(null);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [studentId, setStudentId] = useState('');
  const [eligibility, setEligibility] = useState<CertificateEligibility | null>(null);
  const [loading, setLoading] = useState(true);

  const enrolledStudents = enrollments.map((e) => students.find((s) => s.id === e.student_id)).filter((s): s is Student => Boolean(s));

  useEffect(() => {
    Promise.all([api.get<Course[]>(endpoints.courses.list), api.get<Student[]>('/admin/users')])
      .then(([c, s]) => { setCourses(c.data); setStudents(s.data); })
      .finally(() => setLoading(false));
  }, []);

  const loadCourseData = async (courseId: number) => {
    const [ruleRes, certRes, enrollmentRes] = await Promise.all([
      api.get<CertificateRule>(endpoints.certificates.rule(courseId)),
      api.get<Certificate[]>(endpoints.certificates.courseCertificates(courseId)),
      api.get<Enrollment[]>(`/admin/enrollments/course/${courseId}`),
    ]);
    setRule(ruleRes.data);
    setCertificates(certRes.data);
    setEnrollments(enrollmentRes.data);
    setStudentId('');
    setEligibility(null);
  };

  useEffect(() => {
    if (!selectedCourseId) return;
    loadCourseData(Number(selectedCourseId)).catch(() => toast.error('Erro ao carregar certificação do curso.'));
  }, [selectedCourseId]);

  const saveRule = async () => {
    if (!selectedCourseId || !rule) return;
    try {
      const { data } = await api.patch<CertificateRule>(endpoints.certificates.rule(Number(selectedCourseId)), rule);
      setRule(data);
      toast.success('Regra atualizada.');
    } catch { toast.error('Erro ao salvar regra.'); }
  };

  const issueCertificate = async () => {
    if (!selectedCourseId || !studentId) return;
    try {
      const { data } = await api.post<CertificateIssueResult>(endpoints.certificates.issue(Number(selectedCourseId), Number(studentId)));
      toast.success(`Certificado emitido: ${data.validation_code}`);
      await loadCourseData(Number(selectedCourseId));
    } catch (e: any) {
      const detail = e?.response?.data?.detail;
      toast.error(typeof detail === 'string' ? detail : 'Erro ao emitir certificado.');
    }
  };

  const revokeCertificate = async (certificate: Certificate) => {
    const reason = prompt('Motivo da revogação')?.trim();
    if (reason === undefined) return;
    try {
      await api.post<Certificate>(endpoints.certificates.revoke(certificate.id), { reason: reason || null });
      toast.success('Certificado revogado.');
      await loadCourseData(Number(selectedCourseId));
    } catch (e: any) { toast.error(e?.response?.data?.detail ?? 'Erro ao revogar certificado.'); }
  };

  const checkEligibility = async () => {
    if (!selectedCourseId || !studentId) return;
    try {
      const { data } = await api.get<CertificateEligibility>(endpoints.certificates.eligibility(Number(selectedCourseId), Number(studentId)));
      setEligibility(data);
    } catch { toast.error('Erro ao verificar elegibilidade.'); }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <svg className="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Certificados</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Regras de aprovação, emissão e validação pública.</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <AcademicCapIcon className="w-5 h-5 text-indigo-600" />
          <h2 className="font-semibold text-gray-900 dark:text-white">Selecionar curso</h2>
        </div>
        <select value={selectedCourseId} onChange={(e) => setSelectedCourseId(e.target.value)}
          className="block w-full max-w-xl px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">Escolha um curso</option>
          {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {selectedCourseId && rule && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <CertificateRuleForm rule={rule} onChange={setRule} onSave={saveRule} />
          <div className="space-y-4">
            <CertificateIssuancePanel enrolledStudents={enrolledStudents} studentId={studentId} eligibility={eligibility}
              onStudentChange={setStudentId} onCheckEligibility={checkEligibility} onIssue={issueCertificate} />
            <CertificateValidationPanel />
          </div>
        </div>
      )}

      {selectedCourseId && certificates.length > 0 && (
        <CertificatesList certificates={certificates} students={students} canRevoke={canRevoke ?? false} onRevoke={revokeCertificate} />
      )}
    </div>
  );
}
