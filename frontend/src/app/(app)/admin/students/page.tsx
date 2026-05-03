'use client';

import { useEffect, useState } from 'react';
import { BuildingOfficeIcon, PlusIcon, UserGroupIcon, XMarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '@/lib/api/client';
import { useAuthStore } from '@/store/authStore';
import type { Organization, User, UserRole } from '@/types/auth';
import EditOrganizationModal from '@/components/admin/EditOrganizationModal';
import EditUserModal from '@/components/admin/EditUserModal';
import NewUserModal from '@/components/admin/NewUserModal';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import OrganizationsSection from '@/components/admin/OrganizationsSection';
import ProfileModal from '@/components/admin/ProfileModal';
import UsersList from '@/components/admin/UsersList';

const roleLabel: Record<UserRole, string> = {
  student: 'Aluno', instructor: 'Instrutor', coordinator: 'Coordenador', company_manager: 'Gestor empresa', admin: 'Admin',
};
const roleOptions = Object.entries(roleLabel) as Array<[UserRole, string]>;
const manageableRoleOptions = roleOptions.filter(([role]) => role === 'student' || role === 'instructor');
type PeopleTab = 'users' | 'organizations';

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
  const [organizationModalOpen, setOrganizationModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [editingOrganization, setEditingOrganization] = useState<Organization | null>(null);
  const [activeTab, setActiveTab] = useState<PeopleTab>('users');
  const [orgForm, setOrgForm] = useState({ name: '', legalName: '', document: '', contactEmail: '' });

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

  const createOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/organizations', {
        name: orgForm.name,
        legal_name: orgForm.legalName || null,
        document: orgForm.document || null,
        contact_email: orgForm.contactEmail || null,
      });
      toast.success('Empresa criada!');
      setOrgForm({ name: '', legalName: '', document: '', contactEmail: '' });
      setOrganizationModalOpen(false);
      loadData();
    } catch (error: any) { toast.error(error.response?.data?.detail ?? 'Erro ao criar empresa.'); }
  };

  const deleteUser = async () => {
    if (!userToDelete) return;
    try {
      await api.delete(`/admin/users/${userToDelete.id}`);
      toast.success('Usuário excluído.');
      setUserToDelete(null);
      loadData();
    } catch { toast.error('Erro ao excluir usuário.'); }
  };

  const tabs = [
    { id: 'users' as PeopleTab, label: 'Usuários', icon: UserGroupIcon, badge: users.length },
    { id: 'organizations' as PeopleTab, label: 'Empresas', icon: BuildingOfficeIcon, badge: organizations.length },
  ];
  const inputCls = 'block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white';

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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Usuários</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{users.length} usuário{users.length !== 1 ? 's' : ''} cadastrado{users.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {activeTab === 'users' && (
            <button onClick={() => setShowModal(true)} className="flex items-center justify-center space-x-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700">
              <PlusIcon className="w-4 h-4" /><span>Novo usuário</span>
            </button>
          )}
          {activeTab === 'organizations' && isAdmin && (
            <button onClick={() => setOrganizationModalOpen(true)} className="flex items-center justify-center space-x-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700">
              <PlusIcon className="w-4 h-4" /><span>Nova empresa</span>
            </button>
          )}
        </div>
      </div>

      <div className="space-y-5">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex gap-6 overflow-x-auto" role="tablist" aria-label="Usuários e empresas">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button key={tab.id} type="button" role="tab" aria-selected={active} aria-controls={`people-${tab.id}`} onClick={() => setActiveTab(tab.id)}
                  className={`flex shrink-0 items-center gap-2 border-b-2 px-1 py-4 text-sm font-medium transition-colors ${active ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}>
                  <Icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                  <span className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-medium ${active ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>{tab.badge}</span>
                </button>
              );
            })}
          </nav>
        </div>
        <div id={`people-${activeTab}`} role="tabpanel">
          {activeTab === 'users' && <UsersList users={users} organizations={organizations} canDelete={canDelete ?? false} canManageUser={canManageUser} onEdit={setEditingUser} onProfile={setProfileUser} onDelete={(id) => setUserToDelete(users.find((user) => user.id === id) ?? null)} />}
          {activeTab === 'organizations' && <OrganizationsSection organizations={organizations} isAdmin={isAdmin ?? false} showCreateForm={false} onCreated={loadData} onEdit={setEditingOrganization} />}
        </div>
      </div>

      {showModal && <NewUserModal organizations={organizations} availableRoles={availableRoles} onClose={() => setShowModal(false)} onSave={createUser} />}
      {editingUser && <EditUserModal user={editingUser} organizations={organizations} availableRoles={availableRoles} onClose={() => setEditingUser(null)} onSave={updateUser} />}
      {profileUser && <ProfileModal user={profileUser} onClose={() => setProfileUser(null)} onSaved={loadData} />}
      {editingOrganization && <EditOrganizationModal organization={editingOrganization} onClose={() => setEditingOrganization(null)} onSave={updateOrganization} />}
      {userToDelete && (
        <ConfirmDialog
          title="Excluir usuário"
          message={`Deseja excluir "${userToDelete.name}"?`}
          confirmLabel="Excluir"
          danger
          onCancel={() => setUserToDelete(null)}
          onConfirm={deleteUser}
        />
      )}
      {organizationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Nova empresa</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Cadastre uma organização B2B.</p>
              </div>
              <button type="button" onClick={() => setOrganizationModalOpen(false)} aria-label="Fechar modal" className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-white">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={createOrganization} className="space-y-4">
              <input value={orgForm.name} onChange={(e) => setOrgForm((p) => ({ ...p, name: e.target.value }))} required placeholder="Nome da empresa" className={inputCls} />
              <input value={orgForm.legalName} onChange={(e) => setOrgForm((p) => ({ ...p, legalName: e.target.value }))} placeholder="Razão social" className={inputCls} />
              <input value={orgForm.document} onChange={(e) => setOrgForm((p) => ({ ...p, document: e.target.value }))} placeholder="Documento" className={inputCls} />
              <input type="email" value={orgForm.contactEmail} onChange={(e) => setOrgForm((p) => ({ ...p, contactEmail: e.target.value }))} placeholder="E-mail de contato" className={inputCls} />
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setOrganizationModalOpen(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">Cancelar</button>
                <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">Criar empresa</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
