import type { ReactNode } from 'react';
import type { AppViewId } from '../../config/navigation.ts';
import type { AuthUser } from '../../lib/auth.ts';
import { Header } from './Header.tsx';
import { Sidebar } from './Sidebar.tsx';
import './layout.css';

interface AppShellProps {
  readonly activeView: AppViewId;
  readonly authUser: AuthUser;
  readonly onNavigate: (id: AppViewId) => void;
  readonly onLogout: () => void;
  readonly children: ReactNode;
}

export function AppShell({ activeView, authUser, onNavigate, onLogout, children }: AppShellProps) {
  return (
    <div className="app-shell">
      <Sidebar activeId={activeView} onNavigate={onNavigate} />
      <div className="app-main">
        <Header activeView={activeView} authUser={authUser} onLogout={onLogout} />
        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}
