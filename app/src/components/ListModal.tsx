import { useState, useEffect, useRef } from 'react';
import { ModalDialog, Button } from '../design-system';
import { t } from '../lib/i18n';

export type ListModalMode = 'add' | 'rename' | 'delete';

export interface ListModalProps {
  open: boolean;
  mode: ListModalMode;
  initialName?: string;
  lang: 'en' | 'ja';
  onConfirm: (name?: string) => void;
  onClose: () => void;
}

export function ListModal({ open, mode, initialName = '', lang, onConfirm, onClose }: ListModalProps) {
  const [name, setName] = useState(initialName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName(initialName);
      const id = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(id);
    }
  }, [open, initialName]);

  const handleConfirm = () => {
    if (mode === 'delete') {
      onConfirm();
    } else {
      const trimmed = name.trim();
      if (!trimmed) return;
      onConfirm(trimmed);
    }
  };

  const title =
    mode === 'add' ? t('newList', lang)
    : mode === 'rename' ? t('rename', lang)
    : t('deleteList', lang);

  const handleOverlayClick = () => {
    if (mode === 'add' || mode === 'rename') {
      handleConfirm();
    }
    onClose();
  };

  return (
    <ModalDialog
      open={open}
      onClose={onClose}
      onOverlayClick={mode === 'add' || mode === 'rename' ? handleOverlayClick : undefined}
      title={title}
      actions={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>{t('cancel', lang)}</Button>
          <Button
            variant={mode === 'delete' ? 'danger' : 'primary'}
            size="sm"
            onClick={handleConfirm}
          >
            {mode === 'delete' ? t('delete', lang) : t('save', lang)}
          </Button>
        </>
      }
    >
      {mode === 'delete' ? (
        <p style={{ fontFamily: 'var(--pd-font-body)', color: 'var(--pd-color-text-secondary)', margin: 0 }}>
          {t('deleteConfirm', lang)}
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label
            htmlFor="list-name-input"
            style={{ fontFamily: 'var(--pd-font-body)', fontSize: '0.8125rem', color: 'var(--pd-color-text-secondary)' }}
          >
            {t('listName', lang)}
          </label>
          <input
            id="list-name-input"
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleConfirm();
              if (e.key === 'Escape') onClose();
            }}
            style={{
              width: '100%',
              background: 'var(--pd-color-background-default)',
              border: '2px solid var(--pd-color-border-default)',
              borderRadius: 0,
              color: 'var(--pd-color-text-primary)',
              fontFamily: 'var(--pd-font-body)',
              fontSize: '0.875rem',
              padding: '8px 12px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
      )}
    </ModalDialog>
  );
}
