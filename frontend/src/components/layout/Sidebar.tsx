'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  HomeIcon,
  BookOpenIcon,
  ChartBarIcon,
  MicrophoneIcon,
  Cog6ToothIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UsersIcon,
  AcademicCapIcon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  BanknotesIcon,
  Squares2X2Icon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/store/authStore';

interface SidebarProps {
  open: boolean;
  collapsed: boolean;
  onClose: () => void;
  onToggleCollapse: () => void;
}

const studentMenu = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Meus Cursos', href: '/courses', icon: BookOpenIcon },
  { name: 'Progresso', href: '/progress', icon: ChartBarIcon },
  { name: 'Sessões de Voz', href: '/sessions', icon: MicrophoneIcon },
  { name: 'Configurações', href: '/settings', icon: Cog6ToothIcon },
];

const adminMenu = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Cursos', href: '/admin/courses', icon: AcademicCapIcon },
  { name: 'Agenda', href: '/admin/schedule', icon: CalendarDaysIcon },
  { name: 'Certificados', href: '/admin/certificates', icon: ShieldCheckIcon },
  { name: 'Comunicação', href: '/admin/notifications', icon: ChatBubbleLeftRightIcon },
  { name: 'Financeiro', href: '/admin/finance', icon: BanknotesIcon },
  { name: 'Alunos', href: '/admin/students', icon: UsersIcon },
  { name: 'Catálogo', href: '/courses', icon: Squares2X2Icon },
  { name: 'Configurações', href: '/settings', icon: Cog6ToothIcon },
];

export function Sidebar({ open, collapsed, onClose, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const { student } = useAuthStore();
  const isAdmin = student?.role === 'admin';
  const menuItems = isAdmin ? adminMenu : studentMenu;

  useEffect(() => {
    if (open) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      if (scrollY) window.scrollTo(0, parseInt(scrollY || '0') * -1);
    }
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
    };
  }, [open]);

  const isActive = (href: string) =>
    pathname === href || (href !== '/dashboard' && pathname.startsWith(href));

  const navItems = (mobile = false) =>
    menuItems.map((item) => {
      const Icon = item.icon;
      const active = isActive(item.href);
      return (
        <li key={item.name}>
          <Link
            href={item.href}
            onClick={mobile ? onClose : undefined}
            title={collapsed ? item.name : undefined}
            className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              active ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            } ${collapsed ? 'justify-center' : ''}`}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="ml-3">{item.name}</span>}
          </Link>
        </li>
      );
    });

  const header = (mobile = false) => (
    <div className="h-16 flex items-center justify-between px-4 border-b border-gray-800">
      {(!collapsed || mobile) && (
        <Link href="/dashboard" className="flex items-center space-x-2" onClick={mobile ? onClose : undefined}>
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">E</span>
          </div>
          <div>
            <span className="text-xl font-bold text-white">W-Edu</span>
            {isAdmin && <span className="ml-2 text-xs text-indigo-400 font-medium">Admin</span>}
          </div>
        </Link>
      )}
      {collapsed && !mobile && (
        <Link href="/dashboard" className="flex items-center justify-center w-full">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">E</span>
          </div>
        </Link>
      )}
      {!mobile && (
        <button
          onClick={onToggleCollapse}
          className="p-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
        >
          {collapsed ? <ChevronRightIcon className="w-5 h-5" /> : <ChevronLeftIcon className="w-5 h-5" />}
        </button>
      )}
      {mobile && (
        <button onClick={onClose} className="p-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );

  return (
    <>
      <aside className={`fixed top-0 left-0 z-30 h-screen transition-all duration-300 bg-gray-900 border-r border-gray-800 hidden lg:flex lg:flex-col ${collapsed ? 'w-16' : 'w-64'}`}>
        {header()}
        <nav className="flex-1 overflow-y-auto px-2 py-4">
          <ul className="space-y-1">{navItems()}</ul>
        </nav>
        {!collapsed && isAdmin && (
          <div className="px-4 py-3 border-t border-gray-800">
            <span className="text-xs text-indigo-400 font-medium uppercase tracking-wide">Modo Administrador</span>
          </div>
        )}
      </aside>

      {open && <div className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden" onClick={onClose} />}

      <aside className={`fixed top-0 left-0 z-40 h-screen w-64 transition-transform duration-300 bg-gray-900 border-r border-gray-800 lg:hidden flex flex-col ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        {header(true)}
        <nav className="flex-1 overflow-y-auto px-2 py-4">
          <ul className="space-y-1">{navItems(true)}</ul>
        </nav>
      </aside>
    </>
  );
}
