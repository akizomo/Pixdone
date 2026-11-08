import { useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useNavigate } from './useNavigate';

/**
 * Back navigation for sub-pages: return to the previous in-app screen, or to
 * home when the page was opened directly (deep link, reload, external redirect)
 * and there is no in-app history entry to go back to.
 */
export function useGoBack(fallback = '/'): () => void {
  const navigate = useNavigate();
  const location = useLocation();
  return useCallback(() => {
    // React Router gives the first entry of the session the key "default".
    if (location.key === 'default') navigate(fallback, { replace: true });
    else navigate(-1);
  }, [navigate, location.key, fallback]);
}
