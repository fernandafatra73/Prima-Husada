import { useCallback, useEffect, useState } from 'react';
import { pathnameForView, viewIdFromPathname, type AppViewId } from '../config/navigation.ts';

function readViewFromLocation(): AppViewId {
  return viewIdFromPathname(window.location.pathname);
}

export function useAppNavigation() {
  const [activeView, setActiveView] = useState<AppViewId>(readViewFromLocation);

  useEffect(() => {
    const onPopState = () => {
      setActiveView(readViewFromLocation());
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = useCallback((view: AppViewId) => {
    const path = pathnameForView(view);
    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path);
    }
    setActiveView(view);
  }, []);

  return { activeView, navigate };
}
