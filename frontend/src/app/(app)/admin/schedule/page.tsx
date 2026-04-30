'use client';

import { useEffect, useState } from 'react';
import {
  AcademicCapIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  MapPinIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import type { Course } from '@/types/course';
import type { AttendanceRecord, ClassOffering, Location, Room, ScheduledMeeting } from '@/types/schedule';

const toDateTimeLocal = (value: string) => value.slice(0, 16);
const toApiDateTime = (value: string) => new Date(value).toISOString();

export default function AdminSchedulePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [classes, setClasses] = useState<ClassOffering[]>([]);
  const [meetings, setMeetings] = useState<Record<number, ScheduledMeeting[]>>({});
  const [attendance, setAttendance] = useState<Record<number, AttendanceRecord[]>>({});
  const [loading, setLoading] = useState(true);
  const [locationName, setLocationName] = useState('');
  const [roomForm, setRoomForm] = useState({ location_id: '', name: '', capacity: 20, resources: '' });
  const [classForm, setClassForm] = useState({
    course_id: '',
    name: '',
    starts_at: toDateTimeLocal(new Date().toISOString()),
    ends_at: toDateTimeLocal(new Date(Date.now() + 60 * 60 * 1000).toISOString()),
    capacity: 20,
    status: 'open' as ClassOffering['status'],
    location_id: '',
    room_id: '',
  });

  const load = async () => {
    const [courseRes, locationRes, roomRes, classRes] = await Promise.all([
      api.get<Course[]>(endpoints.courses.list),
      api.get<Location[]>(endpoints.schedule.locations),
      api.get<Room[]>(endpoints.schedule.rooms),
      api.get<ClassOffering[]>(endpoints.schedule.classes),
    ]);
    setCourses(courseRes.data);
    setLocations(locationRes.data);
    setRooms(roomRes.data);
    setClasses(classRes.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const createLocation = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await api.post(endpoints.schedule.locations, { name: locationName });
      setLocationName('');
      toast.success('Unidade criada.');
      await load();
    } catch { toast.error('Erro ao criar unidade.'); }
  };

  const createRoom = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await api.post(endpoints.schedule.rooms, {
        location_id: Number(roomForm.location_id),
        name: roomForm.name,
        capacity: roomForm.capacity,
        resources: roomForm.resources || null,
      });
      setRoomForm({ location_id: '', name: '', capacity: 20, resources: '' });
      toast.success('Sala criada.');
      await load();
    } catch { toast.error('Erro ao criar sala.'); }
  };

  const createClass = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await api.post(endpoints.schedule.classes, {
        course_id: Number(classForm.course_id),
        name: classForm.name,
        starts_at: toApiDateTime(classForm.starts_at),
        ends_at: toApiDateTime(classForm.ends_at),
        capacity: classForm.capacity,
        status: classForm.status,
        location_id: classForm.location_id ? Number(classForm.location_id) : null,
        room_id: classForm.room_id ? Number(classForm.room_id) : null,
      });
      setClassForm((prev) => ({ ...prev, name: '' }));
      toast.success('Turma criada.');
      await load();
    } catch { toast.error('Erro ao criar turma.'); }
  };

  const createMeeting = async (classOffering: ClassOffering) => {
    const title = prompt('Título do encontro');
    if (!title) return;
    try {
      const { data } = await api.post<ScheduledMeeting>(endpoints.schedule.meetings, {
        class_offering_id: classOffering.id,
        room_id: classOffering.room_id,
        title,
        starts_at: classOffering.starts_at,
        ends_at: classOffering.ends_at,
        type: classOffering.room_id ? 'in_person' : 'live',
      });
      toast.success('Encontro criado.');
      setMeetings((prev) => ({ ...prev, [classOffering.id]: [...(prev[classOffering.id] ?? []), data] }));
    } catch { toast.error('Erro ao criar encontro.'); }
  };

  const loadMeetings = async (classId: number) => {
    const { data } = await api.get<ScheduledMeeting[]>(endpoints.schedule.classMeetings(classId));
    setMeetings((prev) => ({ ...prev, [classId]: data }));
  };

  const generateCheckinToken = async (meeting: ScheduledMeeting) => {
    try {
      const { data } = await api.post(endpoints.schedule.checkinTokens(meeting.id), { valid_minutes: 60 });
      window.alert(`Token de check-in:\n${data.token}\n\nEndpoint:\n/schedule/check-in/${data.token}`);
    } catch { toast.error('Erro ao gerar token de check-in.'); }
  };

  const loadAttendance = async (meetingId: number) => {
    try {
      const { data } = await api.get<AttendanceRecord[]>(endpoints.schedule.attendance(meetingId));
      setAttendance((prev) => ({ ...prev, [meetingId]: data }));
    } catch { toast.error('Erro ao carregar presença.'); }
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Agenda e Turmas</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Unidades, salas, ofertas de turma e encontros presenciais ou lives.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <form onSubmit={createLocation} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-3">
          <div className="flex items-center space-x-2">
            <MapPinIcon className="w-5 h-5 text-indigo-600" />
            <h2 className="font-semibold text-gray-900 dark:text-white">Unidade</h2>
          </div>
          <input value={locationName} onChange={(e) => setLocationName(e.target.value)} required placeholder="Nome da unidade"
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <button className="flex items-center justify-center space-x-2 w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
            <PlusIcon className="w-4 h-4" />
            <span>Criar unidade</span>
          </button>
        </form>

        <form onSubmit={createRoom} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-3">
          <div className="flex items-center space-x-2">
            <BuildingOffice2Icon className="w-5 h-5 text-indigo-600" />
            <h2 className="font-semibold text-gray-900 dark:text-white">Sala</h2>
          </div>
          <select value={roomForm.location_id} onChange={(e) => setRoomForm((prev) => ({ ...prev, location_id: e.target.value }))} required
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">Selecione a unidade</option>
            {locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
          </select>
          <input value={roomForm.name} onChange={(e) => setRoomForm((prev) => ({ ...prev, name: e.target.value }))} required placeholder="Nome da sala"
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <input type="number" min={1} value={roomForm.capacity} onChange={(e) => setRoomForm((prev) => ({ ...prev, capacity: Number(e.target.value) }))} required
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <button className="flex items-center justify-center space-x-2 w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
            <PlusIcon className="w-4 h-4" />
            <span>Criar sala</span>
          </button>
        </form>

        <form onSubmit={createClass} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-3">
          <div className="flex items-center space-x-2">
            <AcademicCapIcon className="w-5 h-5 text-indigo-600" />
            <h2 className="font-semibold text-gray-900 dark:text-white">Turma</h2>
          </div>
          <select value={classForm.course_id} onChange={(e) => setClassForm((prev) => ({ ...prev, course_id: e.target.value }))} required
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">Selecione o curso</option>
            {courses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}
          </select>
          <input value={classForm.name} onChange={(e) => setClassForm((prev) => ({ ...prev, name: e.target.value }))} required placeholder="Nome da turma"
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <div className="grid grid-cols-2 gap-2">
            <input type="datetime-local" value={classForm.starts_at} onChange={(e) => setClassForm((prev) => ({ ...prev, starts_at: e.target.value }))}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <input type="datetime-local" value={classForm.ends_at} onChange={(e) => setClassForm((prev) => ({ ...prev, ends_at: e.target.value }))}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input type="number" min={1} value={classForm.capacity} onChange={(e) => setClassForm((prev) => ({ ...prev, capacity: Number(e.target.value) }))}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <select value={classForm.room_id} onChange={(e) => setClassForm((prev) => ({ ...prev, room_id: e.target.value, location_id: rooms.find((room) => String(room.id) === e.target.value)?.location_id.toString() ?? prev.location_id }))}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Sem sala</option>
              {rooms.map((room) => <option key={room.id} value={room.id}>{room.name}</option>)}
            </select>
          </div>
          <button className="flex items-center justify-center space-x-2 w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
            <PlusIcon className="w-4 h-4" />
            <span>Criar turma</span>
          </button>
        </form>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">Turmas cadastradas</h2>
        </div>
        {classes.length === 0 ? (
          <p className="p-5 text-sm text-gray-500 dark:text-gray-400">Nenhuma turma cadastrada.</p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {classes.map((classOffering) => {
              const course = courses.find((item) => item.id === classOffering.course_id);
              const room = rooms.find((item) => item.id === classOffering.room_id);
              return (
                <div key={classOffering.id}>
                  <div className="px-5 py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center">
                        <CalendarDaysIcon className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{classOffering.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {course?.name ?? `Curso #${classOffering.course_id}`} · {new Date(classOffering.starts_at).toLocaleDateString('pt-BR')} · {classOffering.capacity} vagas
                          {room ? ` · ${room.name}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button onClick={() => createMeeting(classOffering)}
                        className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        Criar encontro
                      </button>
                      <button onClick={() => loadMeetings(classOffering.id)}
                        className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        Ver encontros
                      </button>
                    </div>
                  </div>
                  {(meetings[classOffering.id] ?? []).length > 0 && (
                    <div className="px-5 pb-4">
                      <div className="rounded-lg border border-gray-100 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
                        {(meetings[classOffering.id] ?? []).map((meeting) => (
                          <div key={meeting.id} className="p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{meeting.title}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {new Date(meeting.starts_at).toLocaleString('pt-BR')} · {meeting.type}
                                </p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <button onClick={() => generateCheckinToken(meeting)}
                                  className="text-xs px-2 py-1 rounded border border-indigo-300 text-indigo-700 dark:text-indigo-300 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20">
                                  Gerar QR
                                </button>
                                <button onClick={() => loadAttendance(meeting.id)}
                                  className="text-xs px-2 py-1 rounded border border-gray-300 text-gray-700 dark:text-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700">
                                  Presenças
                                </button>
                              </div>
                            </div>
                            {attendance[meeting.id] && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {attendance[meeting.id].length} presença{attendance[meeting.id].length !== 1 ? 's' : ''} registrada{attendance[meeting.id].length !== 1 ? 's' : ''}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
