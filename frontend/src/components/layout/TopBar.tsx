'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { Bars3Icon, SunIcon, MoonIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { useTheme } from '@/components/providers/ThemeProvider';
import { adminMenu, companyManagerMenu, coordinatorMenu, studentMenu } from '@/lib/config/sidebarMenus';
import { useAuthStore } from '@/store/authStore';

interface TopBarProps {
  onMenuClick: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const { student, logout } = useAuthStore();
  const roleLabel = student?.role
    ? {
        admin: 'Admin',
        coordinator: 'Coordenação',
        company_manager: 'Gestão empresa',
        instructor: 'Instrutor',
        student: 'Aluno',
      }[student.role] || 'Conta'
    : 'Conta';
  const currentPage = useMemo(() => {
    const menuItems = [...adminMenu, ...coordinatorMenu, ...companyManagerMenu, ...studentMenu];
    const matches = menuItems
      .filter((item) => pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href)))
      .sort((a, b) => b.href.length - a.href.length);

    if (matches[0]) return matches[0].name;
    if (pathname.startsWith('/lessons/')) return 'Aula';
    if (pathname.startsWith('/courses/')) return 'Curso';
    return 'W-Edu';
  }, [pathname]);

  return (
    <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 sm:px-6 lg:px-8">
      <button
        onClick={onMenuClick}
        aria-label="Abrir menu"
        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors lg:hidden"
      >
        <Bars3Icon className="w-6 h-6" />
      </button>

      <div className="min-w-0 flex-1 lg:flex-none">
        <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{currentPage}</p>
        <p className="hidden text-xs text-gray-500 dark:text-gray-400 sm:block">{roleLabel}</p>
      </div>

      <div className="flex items-center space-x-3">
        <button
          onClick={toggle}
          aria-label={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          {theme === 'dark' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
        </button>

        {student && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {student.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:block">
              {student.name}
            </span>
          </div>
        )}

        <button
          onClick={logout}
          className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Sair"
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
