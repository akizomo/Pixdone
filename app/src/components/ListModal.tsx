import { useState, useEffect, useRef } from 'react';
import { ModalDialog, Button, TextField } from '../design-system';
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
        <TextField
          id="list-name-input"
          label={t('listName', lang)}
          value={name}
          ref={inputRef as React.RefObject<HTMLInputElement>}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleConfirm();
            if (e.key === 'Escape') onClose();
          }}
          autoFocus
        />
      )}
    </ModalDialog>
  );
}
