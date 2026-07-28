import { useState, type JSX } from 'react';
import logoLabprima from '@src/image/logo-labprima.png';
import {
  DASHBOARD_NAV_ID,
  MAIN_NAV_CATEGORIES,
  type AppViewId,
  type NavCategory,
  type NavItem,
} from '../../config/navigation.ts';
import {
  IconClipboard,
  IconCurrency,
  IconDashboard,
  IconDocument,
  IconLogout,
  IconSettings,
  IconShield,
  IconStethoscope,
  IconTag,
} from '../icons/NavIcons.tsx';
import './layout.css';

interface SidebarProps {
  readonly activeId: AppViewId;
  readonly onNavigate: (id: AppViewId) => void;
}

const CATEGORY_ICONS: Record<string, (props: { className?: string }) => JSX.Element> = {
  pendaftaran: IconClipboard,
  radiologi: IconStethoscope,
  keuangan: IconCurrency,
  'master-sistem': IconShield,
  laboratorium: IconTag,
  'klinik-umum': IconStethoscope,
  farmasi: IconDocument,
};

function ChevronIcon({ className }: { readonly className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Sidebar({ activeId, onNavigate }: SidebarProps) {
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(() => ({
    pendaftaran: true,
    radiologi: true,
    keuangan: true,
    'master-sistem': true,
    laboratorium: true,
    'klinik-umum': true,
    farmasi: true,
  }));

  function toggleCategory(catId: string) {
    setOpenCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  }

  return (
    <aside className="app-sidebar" aria-label="Navigasi utama">
      <div className="app-sidebar__brand">
        <div className="app-sidebar__logo">
          <img src={logoLabprima} alt="Radiologi Prima" className="app-sidebar__logo-img" />
        </div>
        <h1 className="app-sidebar__title">Radiologi Prima</h1>
      </div>

      <nav className="app-sidebar__nav">
        <ul className="app-sidebar__list">
          <li>
            <button
              type="button"
              className={`app-sidebar__link${activeId === DASHBOARD_NAV_ID ? ' app-sidebar__link--active' : ''}`}
              onClick={() => onNavigate(DASHBOARD_NAV_ID)}
            >
              <IconDashboard className="app-sidebar__icon" />
              <span className="app-sidebar__label">Dashboard</span>
            </button>
          </li>

          {MAIN_NAV_CATEGORIES.map((cat: NavCategory) => {
            const CatIcon = CATEGORY_ICONS[cat.id] ?? IconClipboard;
            const hasActiveChild = cat.items.some((item) => item.id === activeId);
            const isExpanded = openCategories[cat.id] ?? hasActiveChild;

            return (
              <li key={cat.id} className="app-sidebar__group">
                <button
                  type="button"
                  className={`app-sidebar__group-header ${hasActiveChild ? 'app-sidebar__group-header--active' : ''}`}
                  onClick={() => toggleCategory(cat.id)}
                >
                  <div className="app-sidebar__group-title">
                    <CatIcon className="app-sidebar__icon" />
                    <span>{cat.label}</span>
                  </div>
                  <ChevronIcon
                    className={`app-sidebar__chevron ${isExpanded ? 'app-sidebar__chevron--expanded' : ''}`}
                  />
                </button>

                {isExpanded && (
                  <ul className="app-sidebar__child-list">
                    {cat.items.map((item: NavItem) => {
                      const isActive = activeId === item.id;
                      if (item.isPlaceholder) {
                        return (
                          <li key={item.id}>
                            <div className="app-sidebar__child-link app-sidebar__child-link--placeholder">
                              <span>• {item.label}</span>
                            </div>
                          </li>
                        );
                      }
                      return (
                        <li key={item.id}>
                          <button
                            type="button"
                            className={`app-sidebar__child-link ${isActive ? 'app-sidebar__child-link--active' : ''}`}
                            onClick={() => onNavigate(item.id as AppViewId)}
                            title={item.label}
                          >
                            <span>• {item.shortLabel ?? item.label}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="app-sidebar__footer">
        <ul className="app-sidebar__list">
          <li>
            <button type="button" className="app-sidebar__link">
              <IconSettings className="app-sidebar__icon" />
              <span className="app-sidebar__label">Pengaturan</span>
            </button>
          </li>
          <li>
            <button type="button" className="app-sidebar__link">
              <IconLogout className="app-sidebar__icon" />
              <span className="app-sidebar__label">Log out</span>
            </button>
          </li>
        </ul>
      </div>
    </aside>
  );
}
