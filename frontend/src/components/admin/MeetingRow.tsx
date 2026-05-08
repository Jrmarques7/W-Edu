'use client';

import MeetingAttendanceReport from './MeetingAttendanceReport';
import type { AttendanceRecord, AttendanceStatus, MeetingAttendanceReportRow, MeetingAttendanceSummary, ScheduledMeeting } from '@/types/schedule';

export default function MeetingRow({ meeting, attendanceRecords, attendanceReport, summary, onGenerateCheckin, onLoadAttendance, onLoadAttendanceReport, onMarkAttendance, onSavePracticalAssessment, onLoadSummary, onClose }: {
  meeting: ScheduledMeeting;
  attendanceRecords: AttendanceRecord[] | undefined;
  attendanceReport: MeetingAttendanceReportRow[] | undefined;
  summary: MeetingAttendanceSummary | undefined;
  onGenerateCheckin: (meeting: ScheduledMeeting) => void;
  onLoadAttendance: (meetingId: number) => void;
  onLoadAttendanceReport: (meetingId: number) => void;
  onMarkAttendance: (meeting: ScheduledMeeting, studentId: number, status: AttendanceStatus) => void;
  onSavePracticalAssessment: (meeting: ScheduledMeeting, studentId: number, score: number, feedback: string | null) => void;
  onLoadSummary: (meetingId: number) => void;
  onClose: (meeting: ScheduledMeeting) => void;
}) {
  return (
    <div className="p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">{meeting.title}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(meeting.starts_at).toLocaleString('pt-BR')} · {meeting.type}</p>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={() => onGenerateCheckin(meeting)} className="text-xs px-2 py-1 rounded border border-indigo-300 text-indigo-700 dark:text-indigo-300 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20">
            Gerar QR
          </button>
          <button onClick={() => onLoadAttendance(meeting.id)} className="text-xs px-2 py-1 rounded border border-gray-300 text-gray-700 dark:text-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700">
            Presenças
          </button>
          <button onClick={() => onLoadAttendanceReport(meeting.id)} className="text-xs px-2 py-1 rounded border border-sky-300 text-sky-700 dark:text-sky-300 dark:border-sky-800 hover:bg-sky-50 dark:hover:bg-sky-900/20">
            Relatório
          </button>
          <button onClick={() => onLoadSummary(meeting.id)} className="text-xs px-2 py-1 rounded border border-emerald-300 text-emerald-700 dark:text-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
            Resumo
          </button>
          <button onClick={() => onClose(meeting)} disabled={meeting.is_closed} className="text-xs px-2 py-1 rounded border border-gray-300 text-gray-700 dark:text-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50">
            {meeting.is_closed ? 'Encerrado' : 'Encerrar'}
          </button>
        </div>
      </div>
      {summary && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {summary.present} presentes, {summary.late} atrasados, {summary.absent} ausentes de {summary.total_enrolled} inscritos
        </p>
      )}
      {attendanceRecords && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {attendanceRecords.length} presença{attendanceRecords.length !== 1 ? 's' : ''} registrada{attendanceRecords.length !== 1 ? 's' : ''}
        </p>
      )}
      {attendanceReport && (
        <MeetingAttendanceReport
          rows={attendanceReport}
          onMarkAttendance={(studentId, status) => onMarkAttendance(meeting, studentId, status)}
          onSavePractical={(studentId, score, feedback) => onSavePracticalAssessment(meeting, studentId, score, feedback)}
        />
      )}
    </div>
  );
}
