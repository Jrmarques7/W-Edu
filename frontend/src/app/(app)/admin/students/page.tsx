'use client';

import { useEffect, useState } from 'react';
import { PlusIcon, TrashIcon, UsersIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '@/lib/api/client';
import type { Student } from '@/types/auth';

function NewStudentModal({ onClose, onSave }: {
  onClose: () => void;
  onSave: (data: { name: string; email: string; password: string }) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave({ name, email, password });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Novo Aluno</h2>
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
          <div className="flex justify-end space-x-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50">
              {saving ? 'Criando...' : 'Criar Aluno'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadStudents = () =>
    api.get<Student[]>('/admin/students').then((r) => setStudents(r.data)).finally(() => setLoading(false));

  useEffect(() => { loadStudents(); }, []);

  const createStudent = async (data: { name: string; email: string; password: string }) => {
    try {
      await api.post('/admin/students', data);
      toast.success('Aluno criado!');
      setShowModal(false);
      loadStudents();
    } catch (e: any) {
      toast.error(e.response?.data?.detail ?? 'Erro ao criar aluno.');
    }
  };

  const deleteStudent = async (id: number) => {
    if (!confirm('Excluir este aluno?')) return;
    try {
      await api.delete(`/admin/students/${id}`);
      toast.success('Aluno excluído.');
      loadStudents();
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Alunos</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{students.length} aluno{students.length !== 1 ? 's' : ''} cadastrado{students.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
          <PlusIcon className="w-4 h-4" />
          <span>Novo Aluno</span>
        </button>
      </div>

      {students.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-10 text-center">
          <UsersIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">Nenhum aluno cadastrado.</p>
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
                  <p className="text-xs text-gray-500 dark:text-gray-400">{student.email}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  student.role === 'admin'
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                }`}>
                  {student.role === 'admin' ? 'Admin' : 'Aluno'}
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
                  <button onClick={() => deleteStudent(student.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                    <TrashIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && <NewStudentModal onClose={() => setShowModal(false)} onSave={createStudent} />}
    </div>
  );
}
