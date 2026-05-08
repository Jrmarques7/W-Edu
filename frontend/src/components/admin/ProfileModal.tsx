'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/api/client';
import type { InstructorAvailability, InstructorProfile, InstructorRating, StudentProfile, User } from '@/types/auth';

const roleLabel: Record<string, string> = {
  student: 'Aluno', instructor: 'Instrutor', coordinator: 'Coordenador', company_manager: 'Gestor empresa', admin: 'Admin',
};

const inputCls = 'block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';
const dayLabels = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export default function ProfileModal({ user, onClose, onSaved }: {
  user: User;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [studentProfile, setStudentProfile] = useState<Partial<StudentProfile>>({});
  const [instructorProfile, setInstructorProfile] = useState<Partial<InstructorProfile>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [availability, setAvailability] = useState<InstructorAvailability[]>([]);
  const [ratings, setRatings] = useState<InstructorRating[]>([]);
  const [newAvailability, setNewAvailability] = useState({ day_of_week: 1, start_time: '09:00', end_time: '18:00' });
  const [newRating, setNewRating] = useState({ score: 5, comment: '' });

  useEffect(() => {
    const requests: Promise<any>[] = [
      api.get<StudentProfile>(`/admin/users/${user.id}/student-profile`).then((r) => setStudentProfile(r.data)),
    ];
    if (user.role === 'instructor') {
      requests.push(
        api.get<InstructorProfile>(`/admin/users/${user.id}/instructor-profile`).then((r) => setInstructorProfile(r.data)),
        api.get(`/admin/users/${user.id}/availability`).then((r) => setAvailability(r.data)),
        api.get(`/admin/users/${user.id}/ratings`).then((r) => setRatings(r.data)),
      );
    }
    Promise.all(requests).finally(() => setLoading(false));
  }, [user.id, user.role]);

  const reloadAvailability = async () => {
    const { data } = await api.get<InstructorAvailability[]>(`/admin/users/${user.id}/availability`);
    setAvailability(data);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch(`/admin/users/${user.id}/student-profile`, {
        phone: studentProfile.phone || null, document: studentProfile.document || null,
        position: studentProfile.position || null, department: studentProfile.department || null, bio: studentProfile.bio || null,
      });
      if (user.role === 'instructor') {
        await api.patch(`/admin/users/${user.id}/instructor-profile`, {
          specialties: instructorProfile.specialties || null, bio: instructorProfile.bio || null, rating: instructorProfile.rating || null,
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
      await reloadAvailability();
      toast.success('Disponibilidade adicionada.');
    } catch (e: any) { toast.error(e.response?.data?.detail ?? 'Erro ao adicionar disponibilidade.'); }
  };

  const updateAvailability = async (slot: InstructorAvailability, payload: Partial<InstructorAvailability>) => {
    try {
      await api.patch(`/admin/users/availability/${slot.id}`, payload);
      await reloadAvailability();
      toast.success('Disponibilidade atualizada.');
    } catch (e: any) { toast.error(e.response?.data?.detail ?? 'Erro ao atualizar disponibilidade.'); }
  };

  const deleteAvailability = async (slot: InstructorAvailability) => {
    try {
      await api.delete(`/admin/users/availability/${slot.id}`);
      await reloadAvailability();
      toast.success('Disponibilidade removida.');
    } catch (e: any) { toast.error(e.response?.data?.detail ?? 'Erro ao remover disponibilidade.'); }
  };

  const addRating = async () => {
    try {
      await api.post(`/admin/users/${user.id}/ratings`, newRating);
      const { data } = await api.get(`/admin/users/${user.id}/ratings`);
      setRatings(data);
      toast.success('Avaliação registrada.');
    } catch (e: any) { toast.error(e.response?.data?.detail ?? 'Erro ao registrar avaliação.'); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Editar perfil</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{user.name} · {roleLabel[user.role]}</p>
        </div>
        {loading ? <p className="text-sm text-gray-500 dark:text-gray-400">Carregando...</p> : (
          <form onSubmit={save} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input value={studentProfile.phone ?? ''} onChange={(e) => setStudentProfile((p) => ({ ...p, phone: e.target.value }))} placeholder="Telefone" className={inputCls} />
              <input value={studentProfile.document ?? ''} onChange={(e) => setStudentProfile((p) => ({ ...p, document: e.target.value }))} placeholder="Documento" className={inputCls} />
              <input value={studentProfile.position ?? ''} onChange={(e) => setStudentProfile((p) => ({ ...p, position: e.target.value }))} placeholder="Cargo" className={inputCls} />
              <input value={studentProfile.department ?? ''} onChange={(e) => setStudentProfile((p) => ({ ...p, department: e.target.value }))} placeholder="Departamento" className={inputCls} />
            </div>
            <textarea value={studentProfile.bio ?? ''} onChange={(e) => setStudentProfile((p) => ({ ...p, bio: e.target.value }))} rows={3} placeholder="Bio do aluno/usuário" className={inputCls} />

            {user.role === 'instructor' && (
              <div className="border-t border-gray-100 dark:border-gray-700 pt-4 space-y-3">
                <input value={instructorProfile.specialties ?? ''} onChange={(e) => setInstructorProfile((p) => ({ ...p, specialties: e.target.value }))} placeholder="Especialidades" className={inputCls} />
                <input value={instructorProfile.rating ?? ''} onChange={(e) => setInstructorProfile((p) => ({ ...p, rating: e.target.value }))} placeholder="Avaliação média" className={inputCls} />
                <textarea value={instructorProfile.bio ?? ''} onChange={(e) => setInstructorProfile((p) => ({ ...p, bio: e.target.value }))} rows={3} placeholder="Bio do instrutor" className={inputCls} />
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <select value={newAvailability.day_of_week} onChange={(e) => setNewAvailability((p) => ({ ...p, day_of_week: Number(e.target.value) }))} className={inputCls}>
                    {dayLabels.map((label, index) => <option key={index} value={index}>{label}</option>)}
                  </select>
                  <input type="time" value={newAvailability.start_time} onChange={(e) => setNewAvailability((p) => ({ ...p, start_time: e.target.value }))} className={inputCls} />
                  <input type="time" value={newAvailability.end_time} onChange={(e) => setNewAvailability((p) => ({ ...p, end_time: e.target.value }))} className={inputCls} />
                  <button type="button" onClick={addAvailability} className="rounded-lg bg-gray-900 px-3 py-2 text-sm text-white">Adicionar</button>
                </div>
                {availability.map((s) => (
                  <div key={s.id} className="grid grid-cols-1 gap-2 rounded-lg border border-gray-200 p-2 dark:border-gray-700 sm:grid-cols-[1.2fr_1fr_1fr_auto_auto]">
                    <select value={s.day_of_week} onChange={(e) => updateAvailability(s, { day_of_week: Number(e.target.value) })} className={inputCls}>
                      {dayLabels.map((label, index) => <option key={index} value={index}>{label}</option>)}
                    </select>
                    <input type="time" value={s.start_time} onChange={(e) => updateAvailability(s, { start_time: e.target.value })} className={inputCls} />
                    <input type="time" value={s.end_time} onChange={(e) => updateAvailability(s, { end_time: e.target.value })} className={inputCls} />
                    <button type="button" onClick={() => updateAvailability(s, { is_active: !s.is_active })} className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 dark:border-gray-600 dark:text-gray-300">
                      {s.is_active ? 'Ativa' : 'Inativa'}
                    </button>
                    <button type="button" onClick={() => deleteAvailability(s)} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 dark:border-red-900/60 dark:text-red-400">
                      Remover
                    </button>
                  </div>
                ))}
                <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input type="number" min={1} max={5} value={newRating.score} onChange={(e) => setNewRating((p) => ({ ...p, score: Number(e.target.value) }))} className={inputCls} />
                    <input value={newRating.comment} onChange={(e) => setNewRating((p) => ({ ...p, comment: e.target.value }))} placeholder="Comentário" className={inputCls} />
                  </div>
                  <button type="button" onClick={addRating} className="mt-2 px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm">Registrar avaliação</button>
                  {ratings.map((r) => (
                    <div key={r.id} className="mt-1 text-xs text-gray-500 dark:text-gray-400">{r.score}/5{r.comment ? ` · ${r.comment}` : ''}</div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-2">
              <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white">Cancelar</button>
              <button type="submit" disabled={saving} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50">
                {saving ? 'Salvando...' : 'Salvar perfil'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
