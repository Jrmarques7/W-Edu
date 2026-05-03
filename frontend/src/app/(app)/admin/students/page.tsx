'use client';

import { useEffect, useState } from 'react';
import { BuildingOfficeIcon, PencilIcon, PlusIcon, TrashIcon, UserCircleIcon, UsersIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '@/lib/api/client';
import { useAuthStore } from '@/store/authStore';
import type { InstructorProfile, Organization, StudentProfile, User, UserRole } from '@/types/auth';

const roleLabel: Record<UserRole, string> = {
  student: 'Aluno',
  instructor: 'Instrutor',
  coordinator: 'Coordenador',
  company_manager: 'Gestor empresa',
  admin: 'Admin',
};
const roleOptions = Object.entries(roleLabel) as Array<[UserRole, string]>;
const manageableRoleOptions = roleOptions.filter(([role]) => role === 'student' || role === 'instructor');

function NewUserModal({ organizations, availableRoles, onClose, onSave }: {
  organizations: Organization[];
  onClose: () => void;
  availableRoles: Array<[UserRole, string]>;
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
                {availableRoles.map(([value, label]) => (
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

function EditUserModal({ user, organizations, availableRoles, onClose, onSave }: {
  user: User;
  organizations: Organization[];
  onClose: () => void;
  availableRoles: Array<[UserRole, string]>;
  onSave: (id: number, data: { name: string; email: string; role: UserRole; organization_id: number | null; is_active: boolean }) => Promise<void>;
}) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState<UserRole>(user.role);
  const [organizationId, setOrganizationId] = useState(user.organization_id?.toString() ?? '');
  const [isActive, setIsActive] = useState(user.is_active);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    await onSave(user.id, {
      name,
      email,
      role,
      organization_id: organizationId ? Number(organizationId) : null,
      is_active: isActive,
    });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Editar usuário</h2>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Perfil</label>
              <select value={role} onChange={(e) => setRole(e.target.value as UserRole)}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {availableRoles.map(([value, label]) => (
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
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
            Usuário ativo
          </label>
          <div className="flex justify-end space-x-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50">
              {saving ? 'Salvando...' : 'Salvar usuário'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditOrganizationModal({ organization, onClose, onSave }: {
  organization: Organization;
  onClose: () => void;
  onSave: (id: number, data: { name: string; legal_name: string | null; document: string | null; contact_email: string | null; is_active: boolean }) => Promise<void>;
}) {
  const [name, setName] = useState(organization.name);
  const [legalName, setLegalName] = useState(organization.legal_name ?? '');
  const [document, setDocument] = useState(organization.document ?? '');
  const [contactEmail, setContactEmail] = useState(organization.contact_email ?? '');
  const [isActive, setIsActive] = useState(organization.is_active);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    await onSave(organization.id, {
      name,
      legal_name: legalName || null,
      document: document || null,
      contact_email: contactEmail || null,
      is_active: isActive,
    });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Editar empresa</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Nome"
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <input value={legalName} onChange={(e) => setLegalName(e.target.value)} placeholder="Razão social"
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <input value={document} onChange={(e) => setDocument(e.target.value)} placeholder="Documento"
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="E-mail de contato"
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
            Empresa ativa
          </label>
          <div className="flex justify-end space-x-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50">
              {saving ? 'Salvando...' : 'Salvar empresa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProfileModal({ user, onClose, onSaved }: {
  user: User;
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
      api.get<StudentProfile>(`/admin/users/${user.id}/student-profile`).then((response) => setStudentProfile(response.data)),
    ];
    if (user.role === 'instructor') {
      requests.push(
        api.get<InstructorProfile>(`/admin/users/${user.id}/instructor-profile`).then((response) => setInstructorProfile(response.data)),
        api.get(`/admin/users/${user.id}/availability`).then((response) => setAvailability(response.data)),
        api.get(`/admin/users/${user.id}/ratings`).then((response) => setRatings(response.data))
      );
    }
    Promise.all(requests).finally(() => setLoading(false));
  }, [user.id, user.role]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.patch(`/admin/users/${user.id}/student-profile`, {
        phone: studentProfile.phone || null,
        document: studentProfile.document || null,
        position: studentProfile.position || null,
        department: studentProfile.department || null,
        bio: studentProfile.bio || null,
      });
      if (user.role === 'instructor') {
        await api.patch(`/admin/users/${user.id}/instructor-profile`, {
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
      await api.post(`/admin/users/${user.id}/availability`, newAvailability);
      const { data } = await api.get(`/admin/users/${user.id}/availability`);
      setAvailability(data);
      toast.success('Disponibilidade adicionada.');
    } catch (e: any) {
      toast.error(e.response?.data?.detail ?? 'Erro ao adicionar disponibilidade.');
    }
  };

  const addRating = async () => {
    try {
      await api.post(`/admin/users/${user.id}/ratings`, newRating);
      const { data } = await api.get(`/admin/users/${user.id}/ratings`);
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
          <p className="text-sm text-gray-500 dark:text-gray-400">{user.name} · {roleLabel[user.role]}</p>
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

            {user.role === 'instructor' && (
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
  const { student } = useAuthStore();
  const isAdmin = student?.role === 'admin';
  const canDelete = student?.role === 'admin';
  const availableRoles = isAdmin ? roleOptions : manageableRoleOptions;
  const canManageUser = (user: User) => user.role !== 'admin' && (isAdmin || user.role === 'student' || user.role === 'instructor');
  const [users, setUsers] = useState<User[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [editingOrganization, setEditingOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [organizationName, setOrganizationName] = useState('');
  const [organizationLegalName, setOrganizationLegalName] = useState('');
  const [organizationDocument, setOrganizationDocument] = useState('');
  const [organizationContactEmail, setOrganizationContactEmail] = useState('');

  const loadData = () =>
    Promise.all([
      api.get<User[]>('/admin/users'),
      api.get<Organization[]>('/admin/organizations'),
    ]).then(([userRes, organizationRes]) => {
      setUsers(userRes.data);
      setOrganizations(organizationRes.data);
    }).finally(() => setLoading(false));

  useEffect(() => { loadData(); }, []);

  const createUser = async (data: { name: string; email: string; password: string; role: UserRole; organization_id: number | null }) => {
    try {
      await api.post('/admin/users', data);
      toast.success('Usuário criado!');
      setShowModal(false);
      loadData();
    } catch (e: any) {
      toast.error(e.response?.data?.detail ?? 'Erro ao criar usuário.');
    }
  };

  const updateUser = async (id: number, data: { name: string; email: string; role: UserRole; organization_id: number | null; is_active: boolean }) => {
    try {
      await api.patch(`/admin/users/${id}`, data);
      toast.success('Usuário atualizado.');
      setEditingUser(null);
      loadData();
    } catch (e: any) {
      toast.error(e.response?.data?.detail ?? 'Erro ao atualizar usuário.');
    }
  };

  const createOrganization = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await api.post('/admin/organizations', {
        name: organizationName,
        legal_name: organizationLegalName || null,
        document: organizationDocument || null,
        contact_email: organizationContactEmail || null,
      });
      setOrganizationName('');
      setOrganizationLegalName('');
      setOrganizationDocument('');
      setOrganizationContactEmail('');
      toast.success('Empresa criada!');
      loadData();
    } catch (e: any) {
      toast.error(e.response?.data?.detail ?? 'Erro ao criar empresa.');
    }
  };

  const updateOrganization = async (id: number, data: { name: string; legal_name: string | null; document: string | null; contact_email: string | null; is_active: boolean }) => {
    try {
      await api.patch(`/admin/organizations/${id}`, data);
      toast.success('Empresa atualizada.');
      setEditingOrganization(null);
      loadData();
    } catch (e: any) {
      toast.error(e.response?.data?.detail ?? 'Erro ao atualizar empresa.');
    }
  };

  const deleteUser = async (id: number) => {
    if (!confirm('Excluir este usuário?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      toast.success('Usuário excluído.');
      loadData();
    } catch { toast.error('Erro ao excluir usuário.'); }
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
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{users.length} usuário{users.length !== 1 ? 's' : ''} cadastrado{users.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
          <PlusIcon className="w-4 h-4" />
          <span>Novo usuário</span>
        </button>
      </div>

      {isAdmin && (
        <form onSubmit={createOrganization} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nova empresa B2B</label>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
            <input value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} required placeholder="Nome da empresa"
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <input value={organizationLegalName} onChange={(e) => setOrganizationLegalName(e.target.value)} placeholder="Razão social"
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <input value={organizationDocument} onChange={(e) => setOrganizationDocument(e.target.value)} placeholder="Documento"
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <input type="email" value={organizationContactEmail} onChange={(e) => setOrganizationContactEmail(e.target.value)} placeholder="E-mail de contato"
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <button className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors">
            <PlusIcon className="w-4 h-4" />
            <span>Criar empresa</span>
          </button>
        </form>
      )}

      {organizations.length > 0 && (
        <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
          {organizations.map((organization) => (
            <div key={organization.id} className="flex items-center justify-between px-5 py-4 gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 bg-gray-900 dark:bg-gray-700 rounded-lg flex items-center justify-center shrink-0">
                  <BuildingOfficeIcon className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{organization.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {[organization.legal_name, organization.document, organization.contact_email].filter(Boolean).join(' · ') || 'Sem dados adicionais'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  organization.is_active
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {organization.is_active ? 'Ativa' : 'Inativa'}
                </span>
                {isAdmin && (
                  <button type="button" onClick={() => setEditingOrganization(organization)}
                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors">
                    <PencilIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </section>
      )}

      {users.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-10 text-center">
          <UsersIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">Nenhum usuário cadastrado.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
          {users.map((user) => (
            <div key={user.id} className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center space-x-4">
                <div className="w-9 h-9 bg-indigo-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">{user.name.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {user.email}
                    {user.organization_id ? ` · ${organizations.find((organization) => organization.id === user.organization_id)?.name ?? 'Empresa'}` : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  user.role === 'admin'
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                    : user.role === 'instructor'
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                }`}>
                  {roleLabel[user.role]}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  user.is_active
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {user.is_active ? 'Ativo' : 'Inativo'}
                </span>
                <p className="text-xs text-gray-400 hidden sm:block">
                  {new Date(user.created_at).toLocaleDateString('pt-BR')}
                </p>
                {canManageUser(user) && (
                  <>
                  <button onClick={() => setEditingUser(user)}
                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors">
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button onClick={() => setProfileUser(user)}
                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors">
                    <UserCircleIcon className="w-4 h-4" />
                  </button>
                  {canDelete && (
                    <button onClick={() => deleteUser(user.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && <NewUserModal organizations={organizations} availableRoles={availableRoles} onClose={() => setShowModal(false)} onSave={createUser} />}
      {editingUser && <EditUserModal user={editingUser} organizations={organizations} availableRoles={availableRoles} onClose={() => setEditingUser(null)} onSave={updateUser} />}
      {profileUser && <ProfileModal user={profileUser} onClose={() => setProfileUser(null)} onSaved={loadData} />}
      {editingOrganization && <EditOrganizationModal organization={editingOrganization} onClose={() => setEditingOrganization(null)} onSave={updateOrganization} />}
    </div>
  );
}
