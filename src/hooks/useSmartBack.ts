import { useCallback, useEffect, useRef } from 'react';
import { useNavigate, useNavigationType, useLocation } from 'react-router-dom';

export function useSmartBack(fallbackPath: string = '/') {
  const navigate = useNavigate();
  const navigationType = useNavigationType();
  const location = useLocation();
  const hasAppHistory = useRef(false);

  useEffect(() => {
    if (navigationType === 'PUSH' || navigationType === 'POP') {
      hasAppHistory.current = true;
    }
  }, [location.key, navigationType]);

  // On initial load via direct link, navigationType is 'POP' and history.state.idx is 0
  const isColdEntry = navigationType === 'POP' && (window.history.state?.idx ?? 0) === 0;

  const goBack = useCallback(() => {
    if (isColdEntry && !hasAppHistory.current) {
      navigate(fallbackPath, { replace: true });
    } else {
      navigate(-1);
    }
  }, [isColdEntry, fallbackPath, navigate]);

  return { goBack };
}
