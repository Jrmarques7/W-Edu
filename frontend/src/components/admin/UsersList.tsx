'use client';

import { PencilIcon, TrashIcon, UserCircleIcon, UsersIcon } from '@heroicons/react/24/outline';
import type { Organization, User } from '@/types/auth';

const roleLabel: Record<string, string> = {
  student: 'Aluno', instructor: 'Instrutor', coordinator: 'Coordenador', company_manager: 'Gestor empresa', admin: 'Admin',
};

export default function UsersList({ users, organizations, canDelete, canManageUser, onEdit, onProfile, onDelete }: {
  users: User[];
  organizations: Organization[];
  canDelete: boolean;
  canManageUser: (user: User) => boolean;
  onEdit: (user: User) => void;
  onProfile: (user: User) => void;
  onDelete: (id: number) => void;
}) {
  if (users.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-10 text-center">
        <UsersIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-500 dark:text-gray-400">Nenhum usuário cadastrado.</p>
      </div>
    );
  }

  return (
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
                {user.email}{user.organization_id ? ` · ${organizations.find((o) => o.id === user.organization_id)?.name ?? 'Empresa'}` : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${user.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : user.role === 'instructor' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
              {roleLabel[user.role]}
            </span>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${user.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
              {user.is_active ? 'Ativo' : 'Inativo'}
            </span>
            <p className="text-xs text-gray-400 hidden sm:block">{new Date(user.created_at).toLocaleDateString('pt-BR')}</p>
            {canManageUser(user) && (
              <>
                <button onClick={() => onEdit(user)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors">
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button onClick={() => onProfile(user)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors">
                  <UserCircleIcon className="w-4 h-4" />
                </button>
                {canDelete && (
                  <button onClick={() => onDelete(user.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                    <TrashIcon className="w-4 h-4" />
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
