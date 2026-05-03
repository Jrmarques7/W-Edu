'use client';

import { useEffect, useState } from 'react';
import { ArrowPathIcon, ChartBarIcon, ClipboardDocumentCheckIcon, CurrencyDollarIcon, PresentationChartLineIcon, UserGroupIcon } from '@heroicons/react/24/outline';
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

type ReportTab = 'completion' | 'attendance' | 'engagement' | 'performance' | 'roi';

export default function AdminAnalyticsPage() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [courses, setCourses] = useState<CourseAnalytics[]>([]);
  const [completionRows, setCompletionRows] = useState<CompletionReportRow[]>([]);
  const [attendanceRows, setAttendanceRows] = useState<AttendanceReportRow[]>([]);
  const [engagementRows, setEngagementRows] = useState<EngagementReportRow[]>([]);
  const [performanceRows, setPerformanceRows] = useState<ClassPerformanceReportRow[]>([]);
  const [roiRows, setRoiRows] = useState<RoiReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ReportTab>('completion');

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

  const tabs = [
    { id: 'completion' as ReportTab, label: 'Conclusão', icon: ClipboardDocumentCheckIcon, badge: completionRows.length },
    { id: 'attendance' as ReportTab, label: 'Presença', icon: UserGroupIcon, badge: attendanceRows.length },
    { id: 'engagement' as ReportTab, label: 'Engajamento', icon: ChartBarIcon, badge: engagementRows.length },
    { id: 'performance' as ReportTab, label: 'Performance', icon: PresentationChartLineIcon, badge: performanceRows.length },
    { id: 'roi' as ReportTab, label: 'ROI', icon: CurrencyDollarIcon, badge: roiRows.length },
  ];

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

      <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Relatórios detalhados</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Navegue pelos recortes operacionais sem sair da visão executiva.</p>
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-gray-50 p-1 dark:bg-gray-900/40">
          <nav className="flex gap-2 overflow-x-auto" role="tablist" aria-label="Relatórios">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-controls={`report-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-white text-blue-600 shadow-sm ring-1 ring-gray-200 dark:bg-gray-800 dark:text-blue-400 dark:ring-gray-700'
                      : 'text-gray-500 hover:bg-white hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                  <span
                    className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-medium ${
                      active
                        ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {tab.badge}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="mt-5" id={`report-${activeTab}`} role="tabpanel">
          {activeTab === 'completion' && <CompletionTable rows={completionRows} />}
          {activeTab === 'attendance' && <AttendanceTable rows={attendanceRows} />}
          {activeTab === 'engagement' && <EngagementTable rows={engagementRows} />}
          {activeTab === 'performance' && <PerformanceTable rows={performanceRows} />}
          {activeTab === 'roi' && <RoiTable rows={roiRows} />}
        </div>
      </div>
    </div>
  );
}
