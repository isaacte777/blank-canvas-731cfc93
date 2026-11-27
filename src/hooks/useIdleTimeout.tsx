import { useEffect, useCallback, useRef } from 'react';

interface UseIdleTimeoutProps {
  timeout: number; // en milisegundos
  onIdle: () => void;
  enabled?: boolean;
}

export const useIdleTimeout = ({ timeout, onIdle, enabled = true }: UseIdleTimeoutProps) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = useCallback(() => {
    if (!enabled) return;
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      onIdle();
    }, timeout);
  }, [timeout, onIdle, enabled]);

  useEffect(() => {
    if (!enabled) return;

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    
    // Iniciar el timer
    resetTimer();

    // Agregar listeners para resetear el timer
    events.forEach(event => {
      document.addEventListener(event, resetTimer, { passive: true });
    });

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      events.forEach(event => {
        document.removeEventListener(event, resetTimer);
      });
    };
  }, [resetTimer, enabled]);

  return { resetTimer };
};
