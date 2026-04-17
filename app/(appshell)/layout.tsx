import type { ReactNode } from 'react';
import { SidebarShell } from './sidebar-shell';
import './app-shell.css';

export default function AppShellLayout({ children }: { children: ReactNode }) {
  return <SidebarShell>{children}</SidebarShell>;
}
