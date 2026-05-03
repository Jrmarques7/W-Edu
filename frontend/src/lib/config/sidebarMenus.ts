import type { ComponentType } from 'react';
import {
  HomeIcon, BookOpenIcon, ChartBarIcon, MicrophoneIcon, Cog6ToothIcon,
  UsersIcon, AcademicCapIcon, CalendarDaysIcon, ChatBubbleLeftRightIcon,
  BanknotesIcon, Squares2X2Icon, MapIcon, ShieldCheckIcon, DocumentTextIcon,
} from '@heroicons/react/24/outline';

interface MenuItem { name: string; href: string; icon: ComponentType<{ className?: string }> }

export const studentMenu: MenuItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Meus Cursos', href: '/courses', icon: BookOpenIcon },
  { name: 'Progresso', href: '/progress', icon: ChartBarIcon },
  { name: 'Certificados', href: '/certificates', icon: ShieldCheckIcon },
  { name: 'Sessões de Voz', href: '/sessions', icon: MicrophoneIcon },
  { name: 'Configurações', href: '/settings', icon: Cog6ToothIcon },
];

export const adminMenu: MenuItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Cursos', href: '/admin/courses', icon: AcademicCapIcon },
  { name: 'Trilhas', href: '/admin/learning-paths', icon: MapIcon },
  { name: 'Agenda', href: '/admin/schedule', icon: CalendarDaysIcon },
  { name: 'Certificados', href: '/admin/certificates', icon: ShieldCheckIcon },
  { name: 'Comunicação', href: '/admin/notifications', icon: ChatBubbleLeftRightIcon },
  { name: 'Financeiro', href: '/admin/finance', icon: BanknotesIcon },
  { name: 'Documentos', href: '/admin/documents', icon: DocumentTextIcon },
  { name: 'Relatórios', href: '/admin/analytics', icon: ChartBarIcon },
  { name: 'Usuários', href: '/admin/users', icon: UsersIcon },
  { name: 'Catálogo', href: '/courses', icon: Squares2X2Icon },
  { name: 'Meus certificados', href: '/certificates', icon: ShieldCheckIcon },
  { name: 'Configurações', href: '/settings', icon: Cog6ToothIcon },
];

export const coordinatorMenu: MenuItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Cursos', href: '/admin/courses', icon: AcademicCapIcon },
  { name: 'Trilhas', href: '/admin/learning-paths', icon: MapIcon },
  { name: 'Agenda', href: '/admin/schedule', icon: CalendarDaysIcon },
  { name: 'Certificados', href: '/admin/certificates', icon: ShieldCheckIcon },
  { name: 'Comunicação', href: '/admin/notifications', icon: ChatBubbleLeftRightIcon },
  { name: 'Usuários', href: '/admin/users', icon: UsersIcon },
  { name: 'Catálogo', href: '/courses', icon: Squares2X2Icon },
  { name: 'Meus certificados', href: '/certificates', icon: ShieldCheckIcon },
  { name: 'Configurações', href: '/settings', icon: Cog6ToothIcon },
];

export const companyManagerMenu: MenuItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Financeiro', href: '/admin/finance', icon: BanknotesIcon },
  { name: 'Documentos', href: '/admin/documents', icon: DocumentTextIcon },
  { name: 'Relatórios', href: '/admin/analytics', icon: ChartBarIcon },
  { name: 'Usuários', href: '/admin/users', icon: UsersIcon },
  { name: 'Catálogo', href: '/courses', icon: Squares2X2Icon },
  { name: 'Meus certificados', href: '/certificates', icon: ShieldCheckIcon },
  { name: 'Configurações', href: '/settings', icon: Cog6ToothIcon },
];
