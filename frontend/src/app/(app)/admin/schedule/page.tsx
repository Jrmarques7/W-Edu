'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import type { Course } from '@/types/course';
import type { AttendanceRecord, ClassOffering, Location, MeetingAttendanceSummary, Room, ScheduledMeeting } from '@/types/schedule';
import ClassOfferingForm from '@/components/admin/ClassOfferingForm';
import ClassOfferingsList from '@/components/admin/ClassOfferingsList';
import LocationForm from '@/components/admin/LocationForm';
import RoomForm from '@/components/admin/RoomForm';

export default function AdminSchedulePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [classes, setClasses] = useState<ClassOffering[]>([]);
  const [meetings, setMeetings] = useState<Record<number, ScheduledMeeting[]>>({});
  const [attendance, setAttendance] = useState<Record<number, AttendanceRecord[]>>({});
  const [summaries, setSummaries] = useState<Record<number, MeetingAttendanceSummary>>({});
  const [loading, setLoading] = useState(true);

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

  const createMeeting = async (cls: ClassOffering) => {
    const title = prompt('Título do encontro');
    if (!title) return;
    try {
      const { data } = await api.post<ScheduledMeeting>(endpoints.schedule.meetings, {
        class_offering_id: cls.id, room_id: cls.room_id, title,
        starts_at: cls.starts_at, ends_at: cls.ends_at,
        type: cls.room_id ? 'in_person' : 'live',
      });
      toast.success('Encontro criado.');
      setMeetings((prev) => ({ ...prev, [cls.id]: [...(prev[cls.id] ?? []), data] }));
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
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <LocationForm onCreated={load} />
        <RoomForm locations={locations} onCreated={load} />
        <ClassOfferingForm courses={courses} rooms={rooms} onCreated={load} />
      </div>
      <ClassOfferingsList classes={classes} courses={courses} rooms={rooms} meetings={meetings} attendance={attendance} summaries={summaries}
        onCreateMeeting={createMeeting} onLoadMeetings={loadMeetings} onGenerateCheckin={generateCheckinToken}
        onLoadAttendance={loadAttendance} onLoadSummary={loadSummary} onCloseMeeting={closeMeeting} />
    </div>
  );
}
