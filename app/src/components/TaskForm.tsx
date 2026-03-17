import { useEffect, useRef, useState, useCallback } from 'react';
import type { Task } from '../types/task';
import { Button, RichTextField, RichTextArea, TextField } from '../design-system';
import { t } from '../lib/i18n';
import { getTodayYMD, getTomorrowYMD } from '../lib/date';
import { playSound } from '../services/sound';

export interface TaskFormProps {
  lang: 'en' | 'ja';
  listId: string;
  /** Provide to open in edit mode */
  task?: Task;
  onSave: (fields: Partial<Task> & { title: string }) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

const REPEAT_OPTIONS: Array<{ value: Task['repeat']; labelKey: string }> = [
  { value: 'none', labelKey: 'repeatNone' },
  { value: 'daily', labelKey: 'repeatDaily' },
  { value: 'weekly', labelKey: 'repeatWeekly' },
  { value: 'monthly', labelKey: 'repeatMonthly' },
  { value: 'yearly', labelKey: 'repeatYearly' },
];

export function TaskForm({ lang, task, onSave, onCancel, onDelete }: TaskFormProps) {
  const [title, setTitle] = useState(task?.title ?? '');
  const [details, setDetails] = useState(task?.details ?? '');
  const [dueDate, setDueDate] = useState<string | null>(task?.dueDate ?? null);
  const [repeat, setRepeat] = useState<Task['repeat']>(task?.repeat ?? 'none');
  const [showRepeat, setShowRepeat] = useState(false);
  const [subtasks, setSubtasks] = useState(task?.subtasks ?? []);
  const [newSubtask, setNewSubtask] = useState('');

  const titleRef = useRef<HTMLDivElement>(null);
  const today = getTodayYMD();
  const tomorrow = getTomorrowYMD();

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  const handleSave = useCallback(() => {
    const trimmed = title.trim();
    if (!trimmed) {
      onCancel();
      return;
    }
    onSave({ title: trimmed, details: details.trim() || undefined, dueDate, repeat, subtasks });
  }, [title, details, dueDate, repeat, subtasks, onSave, onCancel]);

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  const toggleDate = (ymd: string) => {
    playSound('buttonClick');
    setDueDate((prev) => (prev === ymd ? null : ymd));
  };

  const addSubtask = () => {
    const text = newSubtask.trim();
    if (!text) return;
    playSound('taskAdd');
    setSubtasks((prev) => [...prev, { id: `sub-${Date.now()}`, text, done: false }]);
    setNewSubtask('');
  };

  const removeSubtask = (id: string) => {
    playSound('taskCancel');
    setSubtasks((prev) => prev.filter((s) => s.id !== id));
  };

  const toggleSubtask = (id: string) => {
    playSound('subtaskComplete');
    setSubtasks((prev) => prev.map((s) => s.id === id ? { ...s, done: !s.done } : s));
  };

  const chipBtnStyle = (active: boolean): React.CSSProperties => ({
    padding: '4px 10px',
    border: '2px solid',
    borderColor: active ? 'var(--pd-color-accent-default)' : 'var(--pd-color-border-default)',
    background: active ? 'var(--pd-color-accent-subtle)' : 'var(--pd-color-background-elevated)',
    color: active ? 'var(--pd-color-accent-default)' : 'var(--pd-color-text-secondary)',
    fontFamily: 'var(--pd-font-body)',
    fontSize: '0.8125rem',
    cursor: 'pointer',
    borderRadius: 0,
    transition: 'all 0.15s',
  });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      {/* Title */}
      <RichTextField
        id="task-title"
        value={title}
        onChange={setTitle}
        placeholder={lang === 'ja' ? 'タスク名' : 'Task title'}
        onKeyDown={handleTitleKeyDown}
        ref={titleRef}
      />

      {/* Details (memo) */}
      <RichTextArea
        value={details}
        onChange={(v) => setDetails(v)}
        placeholder={t('details', lang)}
        rows={3}
      />

      {/* Date buttons */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
        <button type="button" style={chipBtnStyle(dueDate === today)} onClick={() => toggleDate(today)}>
          {t('today', lang)}
        </button>
        <button type="button" style={chipBtnStyle(dueDate === tomorrow)} onClick={() => toggleDate(tomorrow)}>
          {t('tomorrow', lang)}
        </button>
        <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            type="button"
            style={chipBtnStyle(!!(dueDate && dueDate !== today && dueDate !== tomorrow))}
            onClick={() => {
              playSound('buttonClick');
              const input = document.getElementById('task-form-date-input') as HTMLInputElement | null;
              input?.showPicker?.();
            }}
          >
            <span className="material-icons" style={{ fontSize: '16px', lineHeight: 1, verticalAlign: 'middle', marginRight: '4px' }}>calendar_today</span>
            {dueDate && dueDate !== today && dueDate !== tomorrow
              ? (() => { const [, m, d] = dueDate.split('-'); return `${Number(m)}/${Number(d)}`; })()
              : (lang === 'ja' ? '日付' : 'Date')}
          </button>
          <input
            id="task-form-date-input"
            type="date"
            value={dueDate && dueDate !== today && dueDate !== tomorrow ? dueDate : ''}
            onChange={(e) => setDueDate(e.target.value || null)}
            style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }}
          />
        </label>
        {/* Repeat */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            style={chipBtnStyle(repeat !== 'none')}
            onClick={() => { playSound('buttonClick'); setShowRepeat((v) => !v); }}
          >
            <span className="material-icons" style={{ fontSize: '16px', lineHeight: 1, verticalAlign: 'middle', marginRight: '4px' }}>repeat</span>{repeat && repeat !== 'none' ? t(`repeat${repeat.charAt(0).toUpperCase() + repeat.slice(1)}`, lang) : t('repeat', lang)}
          </button>
          {showRepeat && (
            <div
              style={{
                position: 'absolute',
                top: '110%',
                left: 0,
                zIndex: 100,
                background: 'var(--pd-color-background-elevated)',
                border: '2px solid var(--pd-color-border-default)',
                boxShadow: '3px 3px 0 var(--pd-color-shadow-default)',
                minWidth: '140px',
              }}
            >
              {REPEAT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { playSound('buttonClick'); setRepeat(opt.value); setShowRepeat(false); }}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 12px',
                    background: repeat === opt.value ? 'var(--pd-color-accent-subtle)' : 'transparent',
                    border: 'none',
                    borderBottom: '1px solid var(--pd-color-border-default)',
                    color: repeat === opt.value ? 'var(--pd-color-accent-default)' : 'var(--pd-color-text-primary)',
                    fontFamily: 'var(--pd-font-body)',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                  }}
                >
                  {t(opt.labelKey, lang)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Subtasks */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {subtasks.map((s) => (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => toggleSubtask(s.id)}
              style={{
                width: '18px', height: '18px', flexShrink: 0,
                border: '2px solid', borderRadius: 0,
                borderColor: s.done ? 'var(--pd-color-accent-default)' : 'var(--pd-color-border-default)',
                background: s.done ? 'var(--pd-color-accent-default)' : 'transparent',
                color: 'white', fontSize: '0.6rem', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {s.done && '✓'}
            </button>
            <span style={{
              flex: 1, fontSize: '0.8125rem', fontFamily: 'var(--pd-font-body)',
              color: 'var(--pd-color-text-primary)',
              textDecoration: s.done ? 'line-through' : 'none',
            }}>{s.text}</span>
            <button type="button" onClick={() => removeSubtask(s.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--pd-color-text-muted)', display: 'flex', alignItems: 'center' }}>
              <span className="material-icons" style={{ fontSize: '16px', lineHeight: 1 }}>close</span>
            </button>
          </div>
        ))}
        <div style={{ display: 'flex', gap: '6px' }}>
          <TextField
            value={newSubtask}
            onChange={(e) => setNewSubtask(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSubtask(); } }}
            placeholder={t('addSubtask', lang)}
            size="sm"
            style={{ flex: 1 }}
          />
          <button type="button" onClick={addSubtask}
            style={{ ...chipBtnStyle(false), padding: '4px 8px', display: 'flex', alignItems: 'center' }}>
            <span className="material-icons" style={{ fontSize: '18px', lineHeight: 1 }}>add</span>
          </button>
        </div>
      </div>

      {/* Actions */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          marginTop: '4px',
        }}
      >
        <div style={{ display: 'flex' }}>
          <Button variant="secondary" size="sm" onClick={onCancel}>{t('cancel', lang)}</Button>
        </div>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          {onDelete && (
            <Button variant="dangerOutline" size="sm" onClick={onDelete}>{t('delete', lang)}</Button>
          )}
          <Button variant="primary" size="sm" onClick={handleSave}>{t('save', lang)}</Button>
        </div>
      </div>
    </div>
  );
}
