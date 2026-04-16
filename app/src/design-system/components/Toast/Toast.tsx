import { useCallback, useEffect, useRef, useState, createContext, useContext, type ReactNode } from 'react';
import { playSound } from '../../../services/sound';
import { PixelIcon } from '../PixelIcon/PixelIcon';
import './Toast.css';

interface ToastItem {
  id: number;
  message: string;
  action?: { label: string; onClick: () => void };
  duration?: number;
}

interface ToastContextValue {
  showToast: (opts: Omit<ToastItem, 'id'>) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((opts: Omit<ToastItem, 'id'>) => {
    const id = ++nextId;
    setToasts(prev => [...prev, { ...opts, id }]);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="pxd-toast-container">
        {toasts.map(t => (
          <ToastEntry key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastEntry({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: number) => void }) {
  const [entered, setEntered] = useState(false);
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startExit = useCallback(() => {
    setExiting(true);
    setTimeout(() => onDismiss(toast.id), 220);
  }, [toast.id, onDismiss]);

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => setEntered(true));
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const duration = toast.duration ?? 6000;
    timerRef.current = setTimeout(startExit, duration);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [toast.duration, startExit]);

  const cls = `pxd-toast${entered ? ' pxd-toast--entered' : ''}${exiting ? ' pxd-toast--exiting' : ''}`;

  return (
    <div className={cls} role="status">
      <span className="pxd-toast__message">{toast.message}</span>
      {toast.action && (
        <button
          type="button"
          className="pxd-toast__action"
          onClick={() => {
            playSound('buttonClick');
            toast.action!.onClick();
            startExit();
          }}
        >
          {toast.action.label}
        </button>
      )}
      <button
        type="button"
        className="pxd-toast__close"
        aria-label="Close"
        onClick={() => { playSound('taskCancel'); startExit(); }}
      >
        <PixelIcon name="close" size="18px" />
      </button>
    </div>
  );
}
