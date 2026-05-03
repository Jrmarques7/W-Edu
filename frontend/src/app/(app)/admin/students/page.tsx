'use client';

import { useEffect, useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '@/lib/api/client';
import { useAuthStore } from '@/store/authStore';
import type { Organization, User, UserRole } from '@/types/auth';
import EditOrganizationModal from '@/components/admin/EditOrganizationModal';
import EditUserModal from '@/components/admin/EditUserModal';
import NewUserModal from '@/components/admin/NewUserModal';
import OrganizationsSection from '@/components/admin/OrganizationsSection';
import ProfileModal from '@/components/admin/ProfileModal';
import UsersList from '@/components/admin/UsersList';

const roleLabel: Record<UserRole, string> = {
  student: 'Aluno', instructor: 'Instrutor', coordinator: 'Coordenador', company_manager: 'Gestor empresa', admin: 'Admin',
};
const roleOptions = Object.entries(roleLabel) as Array<[UserRole, string]>;
const manageableRoleOptions = roleOptions.filter(([role]) => role === 'student' || role === 'instructor');

export default function AdminStudentsPage() {
  const { student } = useAuthStore();
  const isAdmin = student?.role === 'admin';
  const canDelete = isAdmin;
  const availableRoles = isAdmin ? roleOptions : manageableRoleOptions;
  const canManageUser = (user: User) => user.role !== 'admin' && (isAdmin || user.role === 'student' || user.role === 'instructor');

  const [users, setUsers] = useState<User[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [editingOrganization, setEditingOrganization] = useState<Organization | null>(null);

  const loadData = () =>
    Promise.all([api.get<User[]>('/admin/users'), api.get<Organization[]>('/admin/organizations')])
      .then(([u, o]) => { setUsers(u.data); setOrganizations(o.data); })
      .finally(() => setLoading(false));

  useEffect(() => { loadData(); }, []);

  const createUser = async (data: { name: string; email: string; password: string; role: UserRole; organization_id: number | null }) => {
    try {
      await api.post('/admin/users', data);
      toast.success('Usuário criado!');
      setShowModal(false);
      loadData();
    } catch (e: any) { toast.error(e.response?.data?.detail ?? 'Erro ao criar usuário.'); }
  };

  const updateUser = async (id: number, data: { name: string; email: string; role: UserRole; organization_id: number | null; is_active: boolean }) => {
    try {
      await api.patch(`/admin/users/${id}`, data);
      toast.success('Usuário atualizado.');
      setEditingUser(null);
      loadData();
    } catch (e: any) { toast.error(e.response?.data?.detail ?? 'Erro ao atualizar usuário.'); }
  };

  const updateOrganization = async (id: number, data: { name: string; legal_name: string | null; document: string | null; contact_email: string | null; is_active: boolean }) => {
    try {
      await api.patch(`/admin/organizations/${id}`, data);
      toast.success('Empresa atualizada.');
      setEditingOrganization(null);
      loadData();
    } catch (e: any) { toast.error(e.response?.data?.detail ?? 'Erro ao atualizar empresa.'); }
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
        <button onClick={() => setShowModal(true)} className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
          <PlusIcon className="w-4 h-4" /><span>Novo usuário</span>
        </button>
      </div>

      <OrganizationsSection organizations={organizations} isAdmin={isAdmin ?? false} onCreated={loadData} onEdit={setEditingOrganization} />
      <UsersList users={users} organizations={organizations} canDelete={canDelete ?? false} canManageUser={canManageUser} onEdit={setEditingUser} onProfile={setProfileUser} onDelete={deleteUser} />

      {showModal && <NewUserModal organizations={organizations} availableRoles={availableRoles} onClose={() => setShowModal(false)} onSave={createUser} />}
      {editingUser && <EditUserModal user={editingUser} organizations={organizations} availableRoles={availableRoles} onClose={() => setEditingUser(null)} onSave={updateUser} />}
      {profileUser && <ProfileModal user={profileUser} onClose={() => setProfileUser(null)} onSaved={loadData} />}
      {editingOrganization && <EditOrganizationModal organization={editingOrganization} onClose={() => setEditingOrganization(null)} onSave={updateOrganization} />}
    </div>
  );
}
