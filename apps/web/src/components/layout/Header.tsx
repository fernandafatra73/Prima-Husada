import { getNavLabel, type AppViewId } from '../../config/navigation.ts';
import type { AuthUser } from '../../lib/auth.ts';
import { IconBell, IconLogout } from '../icons/NavIcons.tsx';
import './layout.css';

interface HeaderProps {
  readonly activeView: AppViewId;
  readonly authUser: AuthUser;
  readonly onLogout: () => void;
}

function getRoleLabel(role: AuthUser['role']): string {
  return role === 'ADMIN' ? 'Manajemen' : 'Pekerja';
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function Header({ activeView, authUser, onLogout }: HeaderProps) {
  const pageTitle = getNavLabel(activeView);
  const initials = getInitials(authUser.nama) || 'LP';

  return (
    <header className="app-header">
      <div className="app-header__left">
        <span className="app-header__brand">Klinik Prima Husada</span>
        <span className="app-header__brand" aria-hidden>
          /
        </span>
        <p className="app-header__breadcrumb">{pageTitle}</p>
      </div>

      <div className="app-header__actions">
        <button type="button" className="app-header__icon-btn" aria-label="Notifikasi">
          <IconBell />
        </button>

        <div className="app-header__user">
          <div className="app-header__user-text">
            <p className="app-header__user-name">{authUser.nama}</p>
            <p className="app-header__user-role">{getRoleLabel(authUser.role)}</p>
          </div>
          <div className="app-header__avatar" aria-hidden>
            {initials}
          </div>
        </div>

        <button type="button" className="app-header__icon-btn" aria-label="Logout" onClick={onLogout}>
          <IconLogout />
        </button>
      </div>
    </header>
  );
}
