'use client';

import { CalendarDaysIcon } from '@heroicons/react/24/outline';
import MeetingRow from './MeetingRow';
import type { Course } from '@/types/course';
import type { AttendanceRecord, ClassOffering, MeetingAttendanceSummary, Room, ScheduledMeeting } from '@/types/schedule';

export default function ClassOfferingsList({ classes, courses, rooms, meetings, attendance, summaries, onCreateMeeting, onLoadMeetings, onGenerateCheckin, onLoadAttendance, onLoadSummary, onCloseMeeting }: {
  classes: ClassOffering[];
  courses: Course[];
  rooms: Room[];
  meetings: Record<number, ScheduledMeeting[]>;
  attendance: Record<number, AttendanceRecord[]>;
  summaries: Record<number, MeetingAttendanceSummary>;
  onCreateMeeting: (cls: ClassOffering) => void;
  onLoadMeetings: (classId: number) => void;
  onGenerateCheckin: (meeting: ScheduledMeeting) => void;
  onLoadAttendance: (meetingId: number) => void;
  onLoadSummary: (meetingId: number) => void;
  onCloseMeeting: (meeting: ScheduledMeeting) => void;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
        <h2 className="font-semibold text-gray-900 dark:text-white">Turmas cadastradas</h2>
      </div>
      {classes.length === 0 ? (
        <p className="p-5 text-sm text-gray-500 dark:text-gray-400">Nenhuma turma cadastrada.</p>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {classes.map((cls) => {
            const course = courses.find((c) => c.id === cls.course_id);
            const room = rooms.find((r) => r.id === cls.room_id);
            return (
              <div key={cls.id}>
                <div className="px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center">
                      <CalendarDaysIcon className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{cls.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {course?.name ?? `Curso #${cls.course_id}`} · {new Date(cls.starts_at).toLocaleDateString('pt-BR')} · {cls.capacity} vagas{room ? ` · ${room.name}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button onClick={() => onCreateMeeting(cls)} className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      Criar encontro
                    </button>
                    <button onClick={() => onLoadMeetings(cls.id)} className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      Ver encontros
                    </button>
                  </div>
                </div>
                {(meetings[cls.id] ?? []).length > 0 && (
                  <div className="px-5 pb-4">
                    <div className="rounded-lg border border-gray-100 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
                      {(meetings[cls.id] ?? []).map((meeting) => (
                        <MeetingRow key={meeting.id} meeting={meeting} attendanceRecords={attendance[meeting.id]} summary={summaries[meeting.id]}
                          onGenerateCheckin={onGenerateCheckin} onLoadAttendance={onLoadAttendance} onLoadSummary={onLoadSummary} onClose={onCloseMeeting} />
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
  );
}
