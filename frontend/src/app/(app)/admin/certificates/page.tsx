'use client';

import { useEffect, useState } from 'react';
import { AcademicCapIcon, ArrowLeftIcon, CheckBadgeIcon, ListBulletIcon, QrCodeIcon, ShieldCheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
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

type CertificateTab = 'rules' | 'issue' | 'validation' | 'issued';

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
  const [courseLoading, setCourseLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<CertificateTab>('rules');
  const [certificateToRevoke, setCertificateToRevoke] = useState<Certificate | null>(null);
  const [revokeReason, setRevokeReason] = useState('');

  const enrolledStudents = enrollments.map((e) => students.find((s) => s.id === e.student_id)).filter((s): s is Student => Boolean(s));
  const selectedCourse = courses.find((course) => String(course.id) === selectedCourseId);
  const modalityLabel: Record<Course['modality'], string> = {
    online: 'Online',
    in_person: 'Presencial',
    hybrid: 'Híbrido',
  };

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
    setActiveTab('rules');
  };

  const selectCourse = async (courseId: number) => {
    setSelectedCourseId(String(courseId));
    setRule(null);
    setCertificates([]);
    setEnrollments([]);
    setCourseLoading(true);
    try {
      await loadCourseData(courseId);
    } catch {
      toast.error('Erro ao carregar certificação do curso.');
      setSelectedCourseId('');
    } finally {
      setCourseLoading(false);
    }
  };

  const backToCourses = () => {
    setSelectedCourseId('');
    setRule(null);
    setCertificates([]);
    setEnrollments([]);
    setStudentId('');
    setEligibility(null);
    setActiveTab('rules');
  };

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

  const revokeCertificate = async () => {
    if (!certificateToRevoke) return;
    try {
      await api.post<Certificate>(endpoints.certificates.revoke(certificateToRevoke.id), { reason: revokeReason.trim() || null });
      toast.success('Certificado revogado.');
      setCertificateToRevoke(null);
      setRevokeReason('');
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

  const tabs = [
    { id: 'rules' as CertificateTab, label: 'Regras', icon: ShieldCheckIcon },
    { id: 'issue' as CertificateTab, label: 'Emitir', icon: CheckBadgeIcon, badge: enrolledStudents.length },
    { id: 'validation' as CertificateTab, label: 'Validação', icon: QrCodeIcon },
    { id: 'issued' as CertificateTab, label: 'Emitidos', icon: ListBulletIcon, badge: certificates.length },
  ];

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

      {!selectedCourseId && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <AcademicCapIcon className="w-5 h-5 text-indigo-600" />
            <h2 className="font-semibold text-gray-900 dark:text-white">Selecione um curso</h2>
          </div>
          {courses.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-5 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
              Nenhum curso cadastrado.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {courses.map((course) => (
                <button
                  key={course.id}
                  type="button"
                  onClick={() => selectCourse(course.id)}
                  className="group rounded-xl border border-gray-200 bg-white p-5 text-left transition-colors hover:border-indigo-300 hover:bg-indigo-50/40 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-indigo-700 dark:hover:bg-indigo-900/10"
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-900/20">
                      <AcademicCapIcon className="h-5 w-5 text-indigo-600" />
                    </div>
                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                      {modalityLabel[course.modality]}
                    </span>
                  </div>
                  <h3 className="line-clamp-2 font-semibold text-gray-900 group-hover:text-indigo-700 dark:text-white dark:group-hover:text-indigo-300">
                    {course.name}
                  </h3>
                  <p className="mt-2 line-clamp-2 min-h-10 text-sm text-gray-500 dark:text-gray-400">
                    {course.description || 'Gerencie regras, emissão e validação dos certificados deste curso.'}
                  </p>
                  <span className="mt-4 inline-flex text-sm font-medium text-indigo-600 dark:text-indigo-400">
                    Gerenciar certificados
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedCourseId && (
        <div className="space-y-5">
          <button
            type="button"
            onClick={backToCourses}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            <span>Voltar para cursos</span>
          </button>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{selectedCourse?.name ?? 'Curso selecionado'}</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Configure e acompanhe certificados deste curso.
            </p>
          </div>
        </div>
      )}

      {courseLoading && (
        <div className="flex items-center justify-center rounded-xl border border-gray-200 bg-white py-16 dark:border-gray-700 dark:bg-gray-800">
          <svg className="h-7 w-7 animate-spin text-indigo-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      )}

      {selectedCourseId && rule && !courseLoading && (
        <div className="space-y-5">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex gap-6 overflow-x-auto" role="tablist" aria-label="Gestão de certificados">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    aria-controls={`certificates-${tab.id}`}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex shrink-0 items-center gap-2 border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
                      active
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{tab.label}</span>
                    {tab.badge !== undefined && (
                      <span
                        className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-medium ${
                          active
                            ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                        }`}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          <div id={`certificates-${activeTab}`} role="tabpanel" className="max-w-3xl">
            {activeTab === 'rules' && <CertificateRuleForm rule={rule} onChange={setRule} onSave={saveRule} />}
            {activeTab === 'issue' && (
              <CertificateIssuancePanel enrolledStudents={enrolledStudents} studentId={studentId} eligibility={eligibility}
                onStudentChange={setStudentId} onCheckEligibility={checkEligibility} onIssue={issueCertificate} />
            )}
            {activeTab === 'validation' && <CertificateValidationPanel />}
            {activeTab === 'issued' && (
              <CertificatesList certificates={certificates} students={students} canRevoke={canRevoke ?? false} onRevoke={setCertificateToRevoke} />
            )}
          </div>
        </div>
      )}
      {certificateToRevoke && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Revogar certificado</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Informe o motivo da revogação, se houver.</p>
              </div>
              <button type="button" onClick={() => setCertificateToRevoke(null)} aria-label="Fechar modal" className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-white">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <textarea
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
              rows={4}
              placeholder="Motivo opcional"
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
            />
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={() => setCertificateToRevoke(null)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                Cancelar
              </button>
              <button type="button" onClick={revokeCertificate} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
                Revogar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
