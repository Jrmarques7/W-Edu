'use client';

import { useEffect, useState } from 'react';
import { CheckBadgeIcon, AcademicCapIcon, QrCodeIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import type { Course } from '@/types/course';
import type { Enrollment } from '@/types/course';
import type { Student } from '@/types/auth';
import type { Certificate, CertificateEligibility, CertificateIssueResult, CertificateRule, CertificateValidation } from '@/types/certificate';

const emptyRule = {
  require_lessons_complete: true,
  minimum_progress_percent: 100,
  require_quiz: true,
  minimum_quiz_score: 70,
  require_attendance: false,
  minimum_attendance_percent: 75,
  auto_issue: true,
};

export default function AdminCertificatesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [rule, setRule] = useState<CertificateRule | null>(null);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [studentId, setStudentId] = useState('');
  const [code, setCode] = useState('');
  const [eligibility, setEligibility] = useState<CertificateEligibility | null>(null);
  const [validation, setValidation] = useState<CertificateValidation | null>(null);
  const [loading, setLoading] = useState(true);

  const selectedCourse = courses.find((course) => String(course.id) === selectedCourseId);
  const enrolledStudents = enrollments
    .map((enrollment) => students.find((student) => student.id === enrollment.student_id))
    .filter((student): student is Student => Boolean(student));
  const selectedStudent = students.find((student) => String(student.id) === studentId);
  const certificateStudentName = (studentIdValue: number) => students.find((student) => student.id === studentIdValue)?.name ?? `Aluno #${studentIdValue}`;

  const loadCourses = async () => {
    const [courseRes, studentRes] = await Promise.all([
      api.get<Course[]>(endpoints.courses.list),
      api.get<Student[]>('/admin/students'),
    ]);
    setCourses(courseRes.data);
    setStudents(studentRes.data);
    setLoading(false);
  };

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
    loadCourses();
  }, []);

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
    } catch {
      toast.error('Erro ao salvar regra.');
    }
  };

  const issueCertificate = async () => {
    if (!selectedCourseId || !studentId) return;
    try {
      const { data } = await api.post<CertificateIssueResult>(
        endpoints.certificates.issue(Number(selectedCourseId), Number(studentId)),
      );
      toast.success(`Certificado emitido: ${data.validation_code}`);
      await loadCourseData(Number(selectedCourseId));
    } catch (error: any) {
      const detail = error?.response?.data?.detail;
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
    } catch (error: any) {
      toast.error(error?.response?.data?.detail ?? 'Erro ao revogar certificado.');
    }
  };

  const checkEligibility = async () => {
    if (!selectedCourseId || !studentId) return;
    try {
      const { data } = await api.get<CertificateEligibility>(
        endpoints.certificates.eligibility(Number(selectedCourseId), Number(studentId)),
      );
      setEligibility(data);
    } catch {
      toast.error('Erro ao verificar elegibilidade.');
    }
  };

  const validate = async () => {
    if (!code) return;
    try {
      const { data } = await api.get<CertificateValidation>(endpoints.certificates.validate(code));
      setValidation(data);
    } catch {
      toast.error('Erro ao validar certificado.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <svg className="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

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
        <select
          value={selectedCourseId}
          onChange={(e) => setSelectedCourseId(e.target.value)}
          className="block w-full max-w-xl px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Escolha um curso</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>{course.name}</option>
          ))}
        </select>
        {selectedCourse && <p className="text-sm text-gray-500 dark:text-gray-400">Curso selecionado: {selectedCourse.name}</p>}
      </div>

      {selectedCourseId && rule && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheckIcon className="w-5 h-5 text-indigo-600" />
              <h2 className="font-semibold text-gray-900 dark:text-white">Regra de certificação</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input type="checkbox" checked={rule.require_lessons_complete} onChange={(e) => setRule({ ...rule, require_lessons_complete: e.target.checked })} />
                Concluir aulas
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input type="checkbox" checked={rule.require_quiz} onChange={(e) => setRule({ ...rule, require_quiz: e.target.checked })} />
                Exigir quiz
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input type="checkbox" checked={rule.require_attendance} onChange={(e) => setRule({ ...rule, require_attendance: e.target.checked })} />
                Exigir frequência
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input type="checkbox" checked={rule.auto_issue} onChange={(e) => setRule({ ...rule, auto_issue: e.target.checked })} />
                Emissão automática
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Progresso mínimo (%)</label>
                <input type="number" min={0} max={100} value={rule.minimum_progress_percent}
                  onChange={(e) => setRule({ ...rule, minimum_progress_percent: Number(e.target.value) })}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Nota mínima do quiz (%)</label>
                <input type="number" min={0} max={100} value={rule.minimum_quiz_score}
                  onChange={(e) => setRule({ ...rule, minimum_quiz_score: Number(e.target.value) })}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Frequência mínima (%)</label>
                <input type="number" min={0} max={100} value={rule.minimum_attendance_percent}
                  onChange={(e) => setRule({ ...rule, minimum_attendance_percent: Number(e.target.value) })}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
            <button onClick={saveRule}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
              <span>Salvar regra</span>
            </button>
          </div>

          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-3">
              <div className="flex items-center gap-2">
                <CheckBadgeIcon className="w-5 h-5 text-indigo-600" />
                <h2 className="font-semibold text-gray-900 dark:text-white">Emissão</h2>
              </div>
              <select value={studentId} onChange={(e) => setStudentId(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Selecione um aluno matriculado</option>
                {enrolledStudents.map((student) => (
                  <option key={student.id} value={student.id}>{student.name} - {student.email}</option>
                ))}
              </select>
              {selectedStudent && (
                <p className="text-xs text-gray-500 dark:text-gray-400">Aluno selecionado: {selectedStudent.name}</p>
              )}
              {enrolledStudents.length === 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-400">Este curso ainda não possui alunos matriculados.</p>
              )}
              <div className="flex flex-wrap gap-2">
                <button onClick={checkEligibility}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                  Ver elegibilidade
                </button>
                <button onClick={issueCertificate}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
                  Emitir certificado
                </button>
              </div>
              {eligibility && (
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-sm text-gray-700 dark:text-gray-300">
                  <p className="font-medium mb-2">{eligibility.eligible ? 'Elegível' : 'Não elegível'}</p>
                  <p>Progresso: {eligibility.progress_percent}%</p>
                  <p>Quiz: {eligibility.quiz_percent}%</p>
                  <p>Frequência: {eligibility.attendance_percent}%</p>
                  {eligibility.reasons.length > 0 && (
                    <p className="mt-2 text-red-600 dark:text-red-400">{eligibility.reasons.join(' • ')}</p>
                  )}
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-3">
              <div className="flex items-center gap-2">
                <QrCodeIcon className="w-5 h-5 text-indigo-600" />
                <h2 className="font-semibold text-gray-900 dark:text-white">Validação pública</h2>
              </div>
              <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Código do certificado"
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <button onClick={validate}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
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
          </div>
        </div>
      )}

      {selectedCourseId && certificates.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-white">Certificados emitidos</h2>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {certificates.map((certificate) => (
              <div key={certificate.id} className="px-5 py-4 flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{certificateStudentName(certificate.student_id)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{certificate.validation_code}</p>
                  {certificate.revoked_reason && <p className="text-xs text-red-600 dark:text-red-400">{certificate.revoked_reason}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    certificate.revoked_at
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  }`}>
                    {certificate.revoked_at ? 'Revogado' : 'Válido'}
                  </span>
                  {!certificate.revoked_at && (
                    <button onClick={() => revokeCertificate(certificate)}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg border border-red-200 text-red-700 hover:bg-red-50 dark:border-red-900/40 dark:text-red-400 dark:hover:bg-red-900/20">
                      Revogar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
