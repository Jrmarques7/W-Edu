'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { AcademicCapIcon, BuildingOffice2Icon, MapPinIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import api from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import type { Course } from '@/types/course';
import type { AttendanceRecord, ClassOffering, Location, MeetingAttendanceSummary, MeetingType, Room, ScheduledMeeting } from '@/types/schedule';
import ClassOfferingForm from '@/components/admin/ClassOfferingForm';
import ClassOfferingsList from '@/components/admin/ClassOfferingsList';
import LocationForm from '@/components/admin/LocationForm';
import RoomForm from '@/components/admin/RoomForm';

type SetupTab = 'classes' | 'rooms' | 'locations';
const toDateTimeLocal = (value: string) => value.slice(0, 16);

export default function AdminSchedulePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [classes, setClasses] = useState<ClassOffering[]>([]);
  const [meetings, setMeetings] = useState<Record<number, ScheduledMeeting[]>>({});
  const [attendance, setAttendance] = useState<Record<number, AttendanceRecord[]>>({});
  const [summaries, setSummaries] = useState<Record<number, MeetingAttendanceSummary>>({});
  const [loading, setLoading] = useState(true);
  const [activeSetupTab, setActiveSetupTab] = useState<SetupTab>('classes');
  const [classModalOpen, setClassModalOpen] = useState(false);
  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [meetingClass, setMeetingClass] = useState<ClassOffering | null>(null);
  const [meetingForm, setMeetingForm] = useState({
    title: '',
    room_id: '',
    starts_at: '',
    ends_at: '',
    type: 'live' as MeetingType,
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

  const openMeetingModal = (cls: ClassOffering) => {
    setMeetingClass(cls);
    setMeetingForm({
      title: '',
      room_id: cls.room_id ? String(cls.room_id) : '',
      starts_at: toDateTimeLocal(cls.starts_at),
      ends_at: toDateTimeLocal(cls.ends_at),
      type: cls.room_id ? 'in_person' : 'live',
    });
  };

  const createMeeting = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!meetingClass) return;
    try {
      const { data } = await api.post<ScheduledMeeting>(endpoints.schedule.meetings, {
        class_offering_id: meetingClass.id,
        room_id: meetingForm.room_id ? Number(meetingForm.room_id) : null,
        title: meetingForm.title,
        starts_at: new Date(meetingForm.starts_at).toISOString(),
        ends_at: new Date(meetingForm.ends_at).toISOString(),
        type: meetingForm.type,
      });
      toast.success('Encontro criado.');
      setMeetings((prev) => ({ ...prev, [meetingClass.id]: [...(prev[meetingClass.id] ?? []), data] }));
      setMeetingClass(null);
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

  const closeMeeting = async (meeting: ScheduledMeeting) => {
    try {
      const { data } = await api.post<ScheduledMeeting>(endpoints.schedule.closeMeeting(meeting.id));
      setMeetings((prev) => ({
        ...prev,
        [meeting.class_offering_id]: (prev[meeting.class_offering_id] ?? []).map((m) => (m.id === meeting.id ? data : m)),
      }));
      toast.success('Encontro encerrado.');
    } catch { toast.error('Erro ao encerrar encontro.'); }
  };

  const loadSummary = async (meetingId: number) => {
    try {
      const { data } = await api.get<MeetingAttendanceSummary>(endpoints.schedule.meetingSummary(meetingId));
      setSummaries((prev) => ({ ...prev, [meetingId]: data }));
    } catch { toast.error('Erro ao carregar resumo.'); }
  };

  const setupTabs = [
    { id: 'classes' as SetupTab, label: 'Turmas', icon: AcademicCapIcon, badge: classes.length },
    { id: 'rooms' as SetupTab, label: 'Salas', icon: BuildingOffice2Icon, badge: rooms.length },
    { id: 'locations' as SetupTab, label: 'Unidades', icon: MapPinIcon, badge: locations.length },
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Agenda e Turmas</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Unidades, salas, ofertas de turma e encontros presenciais ou lives.</p>
      </div>
      <div className="space-y-5">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex gap-6 overflow-x-auto" role="tablist" aria-label="Configurações da agenda">
            {setupTabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeSetupTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-controls={`schedule-setup-${tab.id}`}
                  onClick={() => setActiveSetupTab(tab.id)}
                  className={`flex shrink-0 items-center gap-2 border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
                    active
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                  <span
                    className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-medium ${
                      active
                        ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                    }`}
                  >
                    {tab.badge}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        <div id={`schedule-setup-${activeSetupTab}`} role="tabpanel">
          {activeSetupTab === 'classes' && (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Turmas cadastradas</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Gerencie ofertas, encontros e presenças em um só lugar.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setClassModalOpen(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
                >
                  <PlusIcon className="h-4 w-4" />
                  <span>Adicionar turma</span>
                </button>
              </div>
              <ClassOfferingsList classes={classes} courses={courses} rooms={rooms} meetings={meetings} attendance={attendance} summaries={summaries}
                showHeader={false}
                onCreateMeeting={openMeetingModal} onLoadMeetings={loadMeetings} onGenerateCheckin={generateCheckinToken}
                onLoadAttendance={loadAttendance} onLoadSummary={loadSummary} onCloseMeeting={closeMeeting} />
            </div>
          )}
          {activeSetupTab === 'rooms' && (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Salas cadastradas</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Organize espaços físicos, capacidade e vínculo com unidades.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setRoomModalOpen(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
                >
                  <PlusIcon className="h-4 w-4" />
                  <span>Adicionar sala</span>
                </button>
              </div>

              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                {rooms.length === 0 ? (
                  <p className="p-5 text-sm text-gray-500 dark:text-gray-400">Nenhuma sala cadastrada.</p>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {rooms.map((room) => {
                      const location = locations.find((item) => item.id === room.location_id);
                      return (
                        <div key={room.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-900/20">
                              <BuildingOffice2Icon className="h-5 w-5 text-indigo-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{room.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {location?.name ?? `Unidade #${room.location_id}`} · {room.capacity} lugares
                              </p>
                            </div>
                          </div>
                          <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-medium ${
                            room.is_active
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {room.is_active ? 'Ativa' : 'Inativa'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
          {activeSetupTab === 'locations' && (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Unidades cadastradas</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Mantenha os polos e unidades disponíveis para aulas presenciais.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setLocationModalOpen(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
                >
                  <PlusIcon className="h-4 w-4" />
                  <span>Adicionar unidade</span>
                </button>
              </div>

              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                {locations.length === 0 ? (
                  <p className="p-5 text-sm text-gray-500 dark:text-gray-400">Nenhuma unidade cadastrada.</p>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {locations.map((location) => {
                      const roomCount = rooms.filter((room) => room.location_id === location.id).length;
                      return (
                        <div key={location.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-900/20">
                              <MapPinIcon className="h-5 w-5 text-indigo-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{location.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {location.address || 'Endereço não informado'} · {roomCount} {roomCount === 1 ? 'sala' : 'salas'}
                              </p>
                            </div>
                          </div>
                          <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-medium ${
                            location.is_active
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {location.is_active ? 'Ativa' : 'Inativa'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      {classModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
          <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Adicionar turma</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Defina curso, período, capacidade e sala.</p>
              </div>
              <button
                type="button"
                onClick={() => setClassModalOpen(false)}
                aria-label="Fechar modal"
                className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-white"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <ClassOfferingForm
              courses={courses}
              rooms={rooms}
              variant="plain"
              onCancel={() => setClassModalOpen(false)}
              onCreated={() => {
                setClassModalOpen(false);
                load();
              }}
            />
          </div>
        </div>
      )}
      {roomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Adicionar sala</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Vincule a sala a uma unidade e defina sua capacidade.</p>
              </div>
              <button
                type="button"
                onClick={() => setRoomModalOpen(false)}
                aria-label="Fechar modal"
                className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-white"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <RoomForm
              locations={locations}
              variant="plain"
              onCancel={() => setRoomModalOpen(false)}
              onCreated={() => {
                setRoomModalOpen(false);
                load();
              }}
            />
          </div>
        </div>
      )}
      {locationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Adicionar unidade</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Crie uma unidade para organizar salas e encontros presenciais.</p>
              </div>
              <button
                type="button"
                onClick={() => setLocationModalOpen(false)}
                aria-label="Fechar modal"
                className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-white"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <LocationForm
              variant="plain"
              onCancel={() => setLocationModalOpen(false)}
              onCreated={() => {
                setLocationModalOpen(false);
                load();
              }}
            />
          </div>
        </div>
      )}
      {meetingClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Criar encontro</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{meetingClass.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setMeetingClass(null)}
                aria-label="Fechar modal"
                className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-white"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={createMeeting} className="space-y-4">
              <input
                value={meetingForm.title}
                onChange={(e) => setMeetingForm((prev) => ({ ...prev, title: e.target.value }))}
                required
                placeholder="Título do encontro"
                className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input
                  type="datetime-local"
                  value={meetingForm.starts_at}
                  onChange={(e) => setMeetingForm((prev) => ({ ...prev, starts_at: e.target.value }))}
                  required
                  className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                />
                <input
                  type="datetime-local"
                  value={meetingForm.ends_at}
                  onChange={(e) => setMeetingForm((prev) => ({ ...prev, ends_at: e.target.value }))}
                  required
                  className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <select
                  value={meetingForm.type}
                  onChange={(e) => setMeetingForm((prev) => ({ ...prev, type: e.target.value as MeetingType }))}
                  className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                >
                  <option value="live">Live</option>
                  <option value="in_person">Presencial</option>
                  <option value="hybrid">Híbrido</option>
                </select>
                <select
                  value={meetingForm.room_id}
                  onChange={(e) => setMeetingForm((prev) => ({ ...prev, room_id: e.target.value }))}
                  className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                >
                  <option value="">Sem sala</option>
                  {rooms.map((room) => <option key={room.id} value={room.id}>{room.name}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setMeetingClass(null)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                  Cancelar
                </button>
                <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                  Criar encontro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
