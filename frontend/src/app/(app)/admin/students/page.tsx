'use client';

import { useEffect, useState } from 'react';
import { PencilIcon, PlusIcon, TrashIcon, UsersIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '@/lib/api/client';
import type { InstructorProfile, Organization, Student, StudentProfile, UserRole } from '@/types/auth';

const roleLabel: Record<UserRole, string> = {
  student: 'Aluno',
  instructor: 'Instrutor',
  coordinator: 'Coordenador',
  company_manager: 'Gestor empresa',
  admin: 'Admin',
};

function NewStudentModal({ organizations, onClose, onSave }: {
  organizations: Organization[];
  onClose: () => void;
  onSave: (data: { name: string; email: string; password: string; role: UserRole; organization_id: number | null }) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [organizationId, setOrganizationId] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave({ name, email, password, role, organization_id: organizationId ? Number(organizationId) : null });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Novo usuário</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">E-mail *</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Senha *</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Perfil</label>
              <select value={role} onChange={(e) => setRole(e.target.value as UserRole)}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {Object.entries(roleLabel).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Empresa</label>
              <select value={organizationId} onChange={(e) => setOrganizationId(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Sem empresa</option>
                {organizations.map((organization) => (
                  <option key={organization.id} value={organization.id}>{organization.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50">
              {saving ? 'Criando...' : 'Criar usuário'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProfileModal({ student, onClose, onSaved }: {
  student: Student;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [studentProfile, setStudentProfile] = useState<Partial<StudentProfile>>({});
  const [instructorProfile, setInstructorProfile] = useState<Partial<InstructorProfile>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [availability, setAvailability] = useState<Array<{ id: number; day_of_week: number; start_time: string; end_time: string; is_active: boolean }>>([]);
  const [ratings, setRatings] = useState<Array<{ id: number; score: number; comment: string | null; created_at: string }>>([]);
  const [newAvailability, setNewAvailability] = useState({ day_of_week: 1, start_time: '09:00', end_time: '18:00' });
  const [newRating, setNewRating] = useState({ score: 5, comment: '' });

  useEffect(() => {
    const requests: Promise<any>[] = [
      api.get<StudentProfile>(`/admin/students/${student.id}/student-profile`).then((response) => setStudentProfile(response.data)),
    ];
    if (student.role === 'instructor') {
      requests.push(
        api.get<InstructorProfile>(`/admin/students/${student.id}/instructor-profile`).then((response) => setInstructorProfile(response.data)),
        api.get(`/admin/students/${student.id}/availability`).then((response) => setAvailability(response.data)),
        api.get(`/admin/students/${student.id}/ratings`).then((response) => setRatings(response.data))
      );
    }
    Promise.all(requests).finally(() => setLoading(false));
  }, [student.id, student.role]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.patch(`/admin/students/${student.id}/student-profile`, {
        phone: studentProfile.phone || null,
        document: studentProfile.document || null,
        position: studentProfile.position || null,
        department: studentProfile.department || null,
        bio: studentProfile.bio || null,
      });
      if (student.role === 'instructor') {
        await api.patch(`/admin/students/${student.id}/instructor-profile`, {
          specialties: instructorProfile.specialties || null,
          bio: instructorProfile.bio || null,
          rating: instructorProfile.rating || null,
        });
      }
      toast.success('Perfil atualizado.');
      onSaved();
      onClose();
    } catch (e: any) {
      toast.error(e.response?.data?.detail ?? 'Erro ao salvar perfil.');
    } finally {
      setSaving(false);
    }
  };

  const addAvailability = async () => {
    try {
      await api.post(`/admin/students/${student.id}/availability`, newAvailability);
      const { data } = await api.get(`/admin/students/${student.id}/availability`);
      setAvailability(data);
      toast.success('Disponibilidade adicionada.');
    } catch (e: any) {
      toast.error(e.response?.data?.detail ?? 'Erro ao adicionar disponibilidade.');
    }
  };

  const addRating = async () => {
    try {
      await api.post(`/admin/students/${student.id}/ratings`, newRating);
      const { data } = await api.get(`/admin/students/${student.id}/ratings`);
      setRatings(data);
      toast.success('Avaliação registrada.');
    } catch (e: any) {
      toast.error(e.response?.data?.detail ?? 'Erro ao registrar avaliação.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Editar perfil</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{student.name} · {roleLabel[student.role]}</p>
        </div>
        {loading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Carregando...</p>
        ) : (
          <form onSubmit={save} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input value={studentProfile.phone ?? ''} onChange={(e) => setStudentProfile((prev) => ({ ...prev, phone: e.target.value }))} placeholder="Telefone"
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <input value={studentProfile.document ?? ''} onChange={(e) => setStudentProfile((prev) => ({ ...prev, document: e.target.value }))} placeholder="Documento"
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <input value={studentProfile.position ?? ''} onChange={(e) => setStudentProfile((prev) => ({ ...prev, position: e.target.value }))} placeholder="Cargo"
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <input value={studentProfile.department ?? ''} onChange={(e) => setStudentProfile((prev) => ({ ...prev, department: e.target.value }))} placeholder="Departamento"
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <textarea value={studentProfile.bio ?? ''} onChange={(e) => setStudentProfile((prev) => ({ ...prev, bio: e.target.value }))} rows={3} placeholder="Bio do aluno/usuário"
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />

            {student.role === 'instructor' && (
              <div className="border-t border-gray-100 dark:border-gray-700 pt-4 space-y-3">
                <input value={instructorProfile.specialties ?? ''} onChange={(e) => setInstructorProfile((prev) => ({ ...prev, specialties: e.target.value }))} placeholder="Especialidades"
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <input value={instructorProfile.rating ?? ''} onChange={(e) => setInstructorProfile((prev) => ({ ...prev, rating: e.target.value }))} placeholder="Avaliação média"
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <textarea value={instructorProfile.bio ?? ''} onChange={(e) => setInstructorProfile((prev) => ({ ...prev, bio: e.target.value }))} rows={3} placeholder="Bio do instrutor"
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <select value={newAvailability.day_of_week} onChange={(e) => setNewAvailability((prev) => ({ ...prev, day_of_week: Number(e.target.value) }))}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm">
                    <option value={1}>Segunda</option>
                    <option value={2}>Terça</option>
                    <option value={3}>Quarta</option>
                    <option value={4}>Quinta</option>
                    <option value={5}>Sexta</option>
                    <option value={6}>Sábado</option>
                    <option value={0}>Domingo</option>
                  </select>
                  <input value={newAvailability.start_time} onChange={(e) => setNewAvailability((prev) => ({ ...prev, start_time: e.target.value }))} placeholder="Início 09:00"
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm" />
                  <input value={newAvailability.end_time} onChange={(e) => setNewAvailability((prev) => ({ ...prev, end_time: e.target.value }))} placeholder="Fim 18:00"
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm" />
                </div>
                <button type="button" onClick={addAvailability}
                  className="px-3 py-2 bg-gray-900 text-white rounded-lg text-sm">Adicionar disponibilidade</button>
                {availability.length > 0 && (
                  <div className="space-y-2">
                    {availability.map((slot) => (
                      <div key={slot.id} className="text-xs text-gray-500 dark:text-gray-400">
                        Dia {slot.day_of_week} · {slot.start_time} - {slot.end_time}
                      </div>
                    ))}
                  </div>
                )}
                <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input type="number" min={1} max={5} value={newRating.score} onChange={(e) => setNewRating((prev) => ({ ...prev, score: Number(e.target.value) }))}
                      className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm" />
                    <input value={newRating.comment} onChange={(e) => setNewRating((prev) => ({ ...prev, comment: e.target.value }))} placeholder="Comentário"
                      className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm" />
                  </div>
                  <button type="button" onClick={addRating}
                    className="mt-2 px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm">Registrar avaliação</button>
                  {ratings.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {ratings.map((rating) => (
                        <div key={rating.id} className="text-xs text-gray-500 dark:text-gray-400">
                          {rating.score}/5 {rating.comment ? `· ${rating.comment}` : ''}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-2">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                Cancelar
              </button>
              <button type="submit" disabled={saving}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50">
                {saving ? 'Salvando...' : 'Salvar perfil'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [profileStudent, setProfileStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [organizationName, setOrganizationName] = useState('');

  const loadData = () =>
    Promise.all([
      api.get<Student[]>('/admin/students'),
      api.get<Organization[]>('/admin/organizations'),
    ]).then(([studentRes, organizationRes]) => {
      setStudents(studentRes.data);
      setOrganizations(organizationRes.data);
    }).finally(() => setLoading(false));

  useEffect(() => { loadData(); }, []);

  const createStudent = async (data: { name: string; email: string; password: string; role: UserRole; organization_id: number | null }) => {
    try {
      await api.post('/admin/students', data);
      toast.success('Usuário criado!');
      setShowModal(false);
      loadData();
    } catch (e: any) {
      toast.error(e.response?.data?.detail ?? 'Erro ao criar usuário.');
    }
  };

  const createOrganization = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await api.post('/admin/organizations', { name: organizationName });
      setOrganizationName('');
      toast.success('Empresa criada!');
      loadData();
    } catch (e: any) {
      toast.error(e.response?.data?.detail ?? 'Erro ao criar empresa.');
    }
  };

  const deleteStudent = async (id: number) => {
    if (!confirm('Excluir este aluno?')) return;
    try {
      await api.delete(`/admin/students/${id}`);
      toast.success('Aluno excluído.');
      loadData();
    } catch { toast.error('Erro ao excluir aluno.'); }
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Usuários</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{students.length} usuário{students.length !== 1 ? 's' : ''} cadastrado{students.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
          <PlusIcon className="w-4 h-4" />
          <span>Novo usuário</span>
        </button>
      </div>

      <form onSubmit={createOrganization} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nova empresa B2B</label>
          <input value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} required placeholder="Nome da empresa"
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <button className="self-end flex items-center space-x-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors">
          <PlusIcon className="w-4 h-4" />
          <span>Criar empresa</span>
        </button>
      </form>

      {students.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-10 text-center">
          <UsersIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">Nenhum usuário cadastrado.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
          {students.map((student) => (
            <div key={student.id} className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center space-x-4">
                <div className="w-9 h-9 bg-indigo-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">{student.name.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{student.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {student.email}
                    {student.organization_id ? ` · ${organizations.find((organization) => organization.id === student.organization_id)?.name ?? 'Empresa'}` : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  student.role === 'admin'
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                    : student.role === 'instructor'
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                }`}>
                  {roleLabel[student.role]}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  student.is_active
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {student.is_active ? 'Ativo' : 'Inativo'}
                </span>
                <p className="text-xs text-gray-400 hidden sm:block">
                  {new Date(student.created_at).toLocaleDateString('pt-BR')}
                </p>
                {student.role !== 'admin' && (
                  <>
                  <button onClick={() => setProfileStudent(student)}
                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors">
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteStudent(student.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                    <TrashIcon className="w-4 h-4" />
                  </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && <NewStudentModal organizations={organizations} onClose={() => setShowModal(false)} onSave={createStudent} />}
      {profileStudent && <ProfileModal student={profileStudent} onClose={() => setProfileStudent(null)} onSaved={loadData} />}
    </div>
  );
}
