'use client';

import { useEffect, useState } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import type {
  AnalyticsOverview,
  AttendanceReportRow,
  ClassPerformanceReportRow,
  CompletionReportRow,
  CourseAnalytics,
  EngagementReportRow,
  RoiReportRow,
} from '@/types/analytics';
import AnalyticsOverviewSection from '@/components/admin/AnalyticsOverviewSection';
import { AttendanceTable, CompletionTable, EngagementTable, PerformanceTable, RoiTable } from '@/components/admin/AnalyticsReportsTables';

export default function AdminAnalyticsPage() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [courses, setCourses] = useState<CourseAnalytics[]>([]);
  const [completionRows, setCompletionRows] = useState<CompletionReportRow[]>([]);
  const [attendanceRows, setAttendanceRows] = useState<AttendanceReportRow[]>([]);
  const [engagementRows, setEngagementRows] = useState<EngagementReportRow[]>([]);
  const [performanceRows, setPerformanceRows] = useState<ClassPerformanceReportRow[]>([]);
  const [roiRows, setRoiRows] = useState<RoiReportRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const [overviewRes, courseRes, completionRes, attendanceRes, engagementRes, performanceRes, roiRes] = await Promise.all([
        api.get<AnalyticsOverview>(endpoints.analytics.overview),
        api.get<CourseAnalytics[]>(endpoints.analytics.courses),
        api.get<CompletionReportRow[]>(endpoints.analytics.reports.completion),
        api.get<AttendanceReportRow[]>(endpoints.analytics.reports.attendance),
        api.get<EngagementReportRow[]>(endpoints.analytics.reports.engagement),
        api.get<ClassPerformanceReportRow[]>(endpoints.analytics.reports.performance),
        api.get<RoiReportRow[]>(endpoints.analytics.reports.roi),
      ]);
      setOverview(overviewRes.data); setCourses(courseRes.data);
      setCompletionRows(completionRes.data); setAttendanceRows(attendanceRes.data);
      setEngagementRows(engagementRes.data); setPerformanceRows(performanceRes.data);
      setRoiRows(roiRes.data);
    } catch { toast.error('Erro ao carregar relatórios.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  if (loading || !overview) return (
    <div className="flex items-center justify-center py-20">
      <svg className="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Relatórios</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Visão executiva de operação, conclusão, presença e receita.</p>
        </div>
        <button onClick={load} className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200">
          <ArrowPathIcon className="w-4 h-4" /><span>Atualizar</span>
        </button>
      </div>

      <AnalyticsOverviewSection overview={overview} courses={courses} />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <CompletionTable rows={completionRows} />
        <AttendanceTable rows={attendanceRows} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <EngagementTable rows={engagementRows} />
        <PerformanceTable rows={performanceRows} />
      </div>

      <RoiTable rows={roiRows} />
    </div>
  );
}
