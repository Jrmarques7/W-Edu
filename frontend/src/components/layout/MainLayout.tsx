'use client';

import { useState, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { canAccessPath } from '@/lib/auth/permissions';
import { useAuthStore } from '@/store/authStore';

export function MainLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { student } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const hasAccess = canAccessPath(student?.role, pathname);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar
        open={sidebarOpen}
        collapsed={sidebarCollapsed}
        onClose={() => setSidebarOpen(false)}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
        <TopBar onMenuClick={() => setSidebarOpen(true)} />
        <main className="px-4 sm:px-6 lg:px-8 py-6">
          {hasAccess ? children : (
            <div className="max-w-xl rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Acesso restrito</h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Seu perfil não tem permissão para acessar esta área.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
