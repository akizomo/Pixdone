import { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import type { Task, RepeatConfig, RepeatPreset, CustomRepeat } from '../types/task';
import { Button, RichTextField, RichTextArea, TextField, PopoverMenu, IconButton } from '../design-system';
import { t } from '../lib/i18n';
import { getRepeatLabel } from '../lib/repeat';
import { getTodayYMD, getTomorrowYMD } from '../lib/date';
import { playSound } from '../services/sound';
import type { Subtask } from '../types/task';

export interface TaskFormProps {
  lang: 'en' | 'ja';
  listId: string;
  /** Provide to open in edit mode */
  task?: Task;
  onSave: (fields: Partial<Task> & { title: string }) => void;
  onCancel: () => void;
  /** Close without explicit cancel — auto-saves when editing a dirty task */
  onClose?: () => void;
  onDelete?: () => void;
  /** Available lists for the move-to-list dropdown (edit mode only). */
  availableLists?: Array<{ id: string; name: string }>;
  /** Called when user selects a different list in the dropdown. */
  onMoveToList?: (taskId: string, targetListId: string) => void;
}

const REPEAT_PRESETS: Array<{ value: RepeatPreset; labelKey: string }> = [
  { value: 'none', labelKey: 'repeatNone' },
  { value: 'daily', labelKey: 'repeatDaily' },
  { value: 'weekdays', labelKey: 'repeatWeekdays' },
  { value: 'weekly', labelKey: 'repeatWeekly' },
  { value: 'monthly', labelKey: 'repeatMonthly' },
  { value: 'yearly', labelKey: 'repeatYearly' },
];

const CUSTOM_UNITS: Array<{ value: CustomRepeat['unit']; labelKey: string }> = [
  { value: 'day', labelKey: 'customUnitDay' },
  { value: 'week', labelKey: 'customUnitWeek' },
  { value: 'month', labelKey: 'customUnitMonth' },
  { value: 'year', labelKey: 'customUnitYear' },
];

const WEEKDAY_LABELS = {
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  ja: ['日', '月', '火', '水', '木', '金', '土'],
};

function isCustomRepeat(r: RepeatConfig | undefined): r is CustomRepeat {
  return typeof r === 'object' && r !== null && r.type === 'custom';
}

function getPresetValue(r: RepeatConfig | undefined): RepeatPreset {
  if (!r || typeof r === 'string') return r ?? 'none';
  return 'none'; // custom shows separately
}

export interface TaskFormHandle {
  /** Trigger close-to-save: auto-saves dirty edits, or just closes */
  close: () => void;
  /** Save dirty data without triggering close/cancel callbacks. */
  saveIfDirty: () => void;
  /** Close any open sub-menus (repeat, list selector). Returns true if something was dismissed. */
  dismissSubmenus: () => boolean;
}

export const TaskForm = forwardRef<TaskFormHandle, TaskFormProps>(function TaskForm({ lang, task, onSave, onCancel, onClose, onDelete, availableLists, onMoveToList }, ref) {
  const [title, setTitle] = useState(task?.title ?? '');
  const [details, setDetails] = useState(task?.details ?? '');
  const [dueDate, setDueDate] = useState<string | null>(task?.dueDate ?? null);
  const [repeat, setRepeat] = useState<RepeatConfig>(task?.repeat ?? 'none');
  const [showRepeat, setShowRepeat] = useState(false);
  const [showCustom, setShowCustom] = useState(isCustomRepeat(task?.repeat));
  const [customInterval, setCustomInterval] = useState<number>(isCustomRepeat(task?.repeat) ? task.repeat.interval : 1);
  const [customUnit, setCustomUnit] = useState<CustomRepeat['unit']>(isCustomRepeat(task?.repeat) ? task.repeat.unit : 'week');
  const [customWeekDays, setCustomWeekDays] = useState<number[]>(isCustomRepeat(task?.repeat) ? (task.repeat.weekDays ?? []) : []);
  const [subtasks, setSubtasks] = useState(task?.subtasks ?? []);
  const [newSubtask, setNewSubtask] = useState('');

  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [editingSubtaskText, setEditingSubtaskText] = useState('');
  const [showListMenu, setShowListMenu] = useState(false);

  const titleRef = useRef<HTMLDivElement>(null);
  const subtaskInputRef = useRef<HTMLInputElement>(null);
  const editingSubtaskRef = useRef<HTMLInputElement>(null);
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

  // Dirty check: has the user changed any field from the original task values?
  const isDirty = useCallback(() => {
    if (!task) return false; // new task — no dirty check
    return (
      title.trim() !== (task.title ?? '') ||
      (details.trim() || '') !== (task.details ?? '') ||
      dueDate !== (task.dueDate ?? null) ||
      JSON.stringify(repeat) !== JSON.stringify(task.repeat ?? 'none') ||
      JSON.stringify(subtasks) !== JSON.stringify(task.subtasks ?? [])
    );
  }, [title, details, dueDate, repeat, subtasks, task]);

  // Close-to-save: auto-save when closing an edited task with dirty changes.
  // onSave already handles closing the sheet — do NOT call onClose/onCancel after onSave.
  const handleClose = useCallback(() => {
    if (task && isDirty() && title.trim()) {
      // Editing + dirty + title non-empty → save (which also closes)
      playSound('taskAdd');
      onSave({
        title: title.trim(),
        details: details.trim() || undefined,
        dueDate,
        repeat,
        subtasks,
      });
    } else if (task) {
      // Edit mode, nothing changed or title empty → silent close
      (onClose ?? onCancel)();
    } else {
      // New task abandoned → cancel with sound
      onCancel();
    }
  }, [task, isDirty, title, details, dueDate, repeat, subtasks, onSave, onClose, onCancel]);

  const dismissSubmenus = useCallback(() => {
    let dismissed = false;
    if (showRepeat) { setShowRepeat(false); setShowCustom(false); dismissed = true; }
    if (showListMenu) { setShowListMenu(false); dismissed = true; }
    return dismissed;
  }, [showRepeat, showListMenu]);

  // Save dirty data without triggering close/cancel callbacks
  const saveIfDirty = useCallback(() => {
    if (task && isDirty() && title.trim()) {
      playSound('taskAdd');
      onSave({
        title: title.trim(),
        details: details.trim() || undefined,
        dueDate,
        repeat,
        subtasks,
      });
    }
  }, [task, isDirty, title, details, dueDate, repeat, subtasks, onSave]);

  // Expose handleClose to parent via ref (for BottomSheet backdrop/close-button/outside-click)
  useImperativeHandle(ref, () => ({ close: handleClose, saveIfDirty, dismissSubmenus }), [handleClose, saveIfDirty, dismissSubmenus]);

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.nativeEvent.stopPropagation(); // Prevent BottomSheet's document listener from double-firing
      handleClose();
    }
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSave();
    }
  };

  const handleDetailsKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSave();
    }
  };

  const toggleDate = (ymd: string) => {
    playSound('buttonClick');
    setDueDate((prev) => (prev === ymd ? null : ymd));
  };

  const addSubtask = useCallback(() => {
    const text = newSubtask.trim();
    if (!text) return;
    playSound('taskAdd');
    setSubtasks((prev) => [...prev, { id: `sub-${Date.now()}`, text, done: false }]);
    setNewSubtask('');
    // Auto-focus back so the user can keep typing
    setTimeout(() => subtaskInputRef.current?.focus(), 0);
  }, [newSubtask]);

  const removeSubtask = (id: string) => {
    playSound('taskCancel');
    setSubtasks((prev) => prev.filter((s) => s.id !== id));
  };

  const toggleSubtask = (id: string) => {
    playSound('subtaskComplete');
    setSubtasks((prev) => prev.map((s) => s.id === id ? { ...s, done: !s.done } : s));
  };

  const startEditSubtask = (s: Subtask) => {
    playSound('taskEdit');
    setEditingSubtaskId(s.id);
    setEditingSubtaskText(s.text);
    setTimeout(() => editingSubtaskRef.current?.focus(), 0);
  };

  const commitEditSubtask = (id: string) => {
    const text = editingSubtaskText.trim();
    if (text) {
      setSubtasks((prev) => prev.map((s) => s.id === id ? { ...s, text } : s));
    }
    setEditingSubtaskId(null);
    setEditingSubtaskText('');
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
        position: 'relative',
      }}
    >
      {/* Delete icon — top-right, edit mode only */}
      {onDelete && (
        <IconButton
          variant="ghostDanger"
          size="sm"
          aria-label={lang === 'ja' ? '削除' : 'Delete'}
          icon={<span className="material-icons" style={{ fontSize: '18px' }}>delete</span>}
          soundKey="taskDelete"
          onClick={onDelete}
          style={{ position: 'absolute', top: 0, right: 0, zIndex: 1 }}
        />
      )}
      {/* List selector — edit mode only, multiple lists */}
      {task && availableLists && availableLists.length > 1 && (
        <div style={{ position: 'relative', alignSelf: 'flex-start' }}>
          <button
            type="button"
            role="combobox"
            aria-expanded={showListMenu}
            aria-haspopup="menu"
            onClick={() => { playSound('buttonClick'); setShowListMenu((v) => !v); }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              background: 'none',
              border: 'none',
              padding: '0',
              fontFamily: 'var(--pd-font-body)',
              fontSize: '0.75rem',
              color: 'var(--pd-color-text-secondary)',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {availableLists.find((l) => l.id === task.listId)?.name ?? ''}
            <span className="material-icons" style={{ fontSize: '14px', lineHeight: 1 }}>arrow_drop_down</span>
          </button>
          {showListMenu && (
            <PopoverMenu
              align="left"
              items={availableLists
                .filter((l) => l.id !== task.listId)
                .map((l) => ({ id: l.id, label: l.name }))}
              onSelect={(listId) => {
                playSound('buttonClick');
                onMoveToList?.(task.id, listId);
                setShowListMenu(false);
              }}
              onClose={() => { playSound('taskCancel'); setShowListMenu(false); }}
            />
          )}
        </div>
      )}

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
        onKeyDown={handleDetailsKeyDown}
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
            <span className="material-icons" style={{ fontSize: '16px', lineHeight: 1, verticalAlign: 'middle', marginRight: '4px' }}>repeat</span>
            {getRepeatLabel(repeat, lang) || t('repeat', lang)}
          </button>
          {showRepeat && (
            <>
            {/* Invisible backdrop to catch outside taps (mobile) */}
            <div
              style={{ position: 'fixed', inset: 0, zIndex: 99 }}
              onClick={() => { playSound('taskCancel'); setShowRepeat(false); setShowCustom(false); }}
            />
            <div
              style={{
                position: 'absolute',
                top: '110%',
                left: 0,
                zIndex: 100,
                background: 'var(--pd-color-background-elevated)',
                border: '2px solid var(--pd-color-border-default)',
                boxShadow: '3px 3px 0 var(--pd-color-shadow-default)',
                minWidth: '180px',
              }}
            >
              {showCustom ? (
                /* ── Custom settings view ── */
                <div style={{ padding: '10px 12px' }}>
                  {/* Header with back button */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '10px' }}>
                    <button
                      type="button"
                      onClick={() => { playSound('buttonClick'); setShowCustom(false); }}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer', padding: '2px',
                        color: 'var(--pd-color-text-secondary)', display: 'flex', alignItems: 'center',
                      }}
                    >
                      <span className="material-icons" style={{ fontSize: '18px', lineHeight: 1 }}>arrow_back</span>
                    </button>
                    <span style={{ fontFamily: 'var(--pd-font-body)', fontSize: '0.875rem', fontWeight: 'bold', color: 'var(--pd-color-text-primary)' }}>
                      {t('repeatCustom', lang)}
                    </span>
                  </div>
                  {/* Interval + Unit row */}
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '8px' }}>
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={customInterval}
                      onChange={(e) => setCustomInterval(Math.max(1, parseInt(e.target.value) || 1))}
                      style={{
                        width: '48px', padding: '4px 6px',
                        border: '2px solid var(--pd-color-border-default)', borderRadius: 0,
                        fontFamily: 'var(--pd-font-body)', fontSize: '0.8125rem', textAlign: 'center',
                        background: 'var(--pd-color-background-default)', color: 'var(--pd-color-text-primary)',
                      }}
                    />
                    <select
                      value={customUnit}
                      onChange={(e) => {
                        const unit = e.target.value as CustomRepeat['unit'];
                        setCustomUnit(unit);
                        if (unit !== 'week') setCustomWeekDays([]);
                      }}
                      style={{
                        padding: '4px 6px',
                        border: '2px solid var(--pd-color-border-default)', borderRadius: 0,
                        fontFamily: 'var(--pd-font-body)', fontSize: '0.8125rem',
                        background: 'var(--pd-color-background-default)', color: 'var(--pd-color-text-primary)',
                        cursor: 'pointer',
                      }}
                    >
                      {CUSTOM_UNITS.map((u) => (
                        <option key={u.value} value={u.value}>{t(u.labelKey, lang)}</option>
                      ))}
                    </select>
                  </div>
                  {/* WeekDays toggles — only when unit is 'week' */}
                  {customUnit === 'week' && (
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '8px' }}>
                      {WEEKDAY_LABELS[lang].map((label, idx) => {
                        const active = customWeekDays.includes(idx);
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              playSound('buttonClick');
                              setCustomWeekDays((prev) =>
                                active ? prev.filter((d) => d !== idx) : [...prev, idx],
                              );
                            }}
                            style={{
                              width: '32px', height: '32px',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              border: '2px solid',
                              borderColor: active ? 'var(--pd-color-accent-default)' : 'var(--pd-color-border-default)',
                              background: active ? 'var(--pd-color-accent-subtle)' : 'transparent',
                              color: active ? 'var(--pd-color-accent-default)' : 'var(--pd-color-text-secondary)',
                              fontFamily: 'var(--pd-font-body)', fontSize: '0.75rem',
                              cursor: 'pointer', borderRadius: 0,
                            }}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {/* Apply button */}
                  <button
                    type="button"
                    onClick={() => {
                      playSound('taskComplete');
                      const config: CustomRepeat = {
                        type: 'custom',
                        interval: customInterval,
                        unit: customUnit,
                        ...(customUnit === 'week' && customWeekDays.length > 0 ? { weekDays: [...customWeekDays].sort((a, b) => a - b) } : {}),
                      };
                      setRepeat(config);
                      setShowCustom(false);
                      setShowRepeat(false);
                    }}
                    style={{
                      width: '100%', padding: '6px',
                      border: '2px solid var(--pd-color-accent-default)',
                      background: 'var(--pd-color-accent-default)', color: 'white',
                      fontFamily: 'var(--pd-font-body)', fontSize: '0.8125rem',
                      cursor: 'pointer', borderRadius: 0,
                    }}
                  >
                    {t('save', lang)}
                  </button>
                </div>
              ) : (
                /* ── Preset list view ── */
                <>
                  {REPEAT_PRESETS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        playSound('buttonClick');
                        setRepeat(opt.value);
                        setShowRepeat(false);
                      }}
                      style={{
                        display: 'block', width: '100%', textAlign: 'left',
                        padding: '8px 12px',
                        background: getPresetValue(repeat) === opt.value && !isCustomRepeat(repeat) ? 'var(--pd-color-accent-subtle)' : 'transparent',
                        border: 'none', borderBottom: '1px solid var(--pd-color-border-default)',
                        color: getPresetValue(repeat) === opt.value && !isCustomRepeat(repeat) ? 'var(--pd-color-accent-default)' : 'var(--pd-color-text-primary)',
                        fontFamily: 'var(--pd-font-body)', fontSize: '0.875rem', cursor: 'pointer',
                      }}
                    >
                      {t(opt.labelKey, lang)}
                    </button>
                  ))}
                  {/* Custom — navigates to custom view */}
                  <button
                    type="button"
                    onClick={() => { playSound('buttonClick'); setShowCustom(true); }}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      padding: '8px 12px',
                      background: isCustomRepeat(repeat) ? 'var(--pd-color-accent-subtle)' : 'transparent',
                      border: 'none',
                      color: isCustomRepeat(repeat) ? 'var(--pd-color-accent-default)' : 'var(--pd-color-text-primary)',
                      fontFamily: 'var(--pd-font-body)', fontSize: '0.875rem', cursor: 'pointer',
                    }}
                  >
                    <span className="material-icons" style={{ fontSize: '14px', lineHeight: 1, verticalAlign: 'middle', marginRight: '4px' }}>settings</span>
                    {t('repeatCustom', lang)}
                  </button>
                </>
              )}
            </div>
            </>
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

            {editingSubtaskId === s.id ? (
              <TextField
                ref={editingSubtaskRef}
                value={editingSubtaskText}
                onChange={(e) => setEditingSubtaskText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    commitEditSubtask(s.id);
                  }
                  if (e.key === 'Escape') {
                    setEditingSubtaskId(null);
                    setEditingSubtaskText('');
                  }
                }}
                onBlur={() => commitEditSubtask(s.id)}
                size="sm"
                style={{ flex: 1 }}
              />
            ) : (
              <span
                role="button"
                tabIndex={0}
                onClick={() => startEditSubtask(s)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') startEditSubtask(s); }}
                style={{
                  flex: 1, fontSize: '0.8125rem', fontFamily: 'var(--pd-font-body)',
                  color: 'var(--pd-color-text-primary)',
                  textDecoration: s.done ? 'line-through' : 'none',
                  cursor: 'text',
                  padding: '6px 0',
                  minHeight: '44px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >{s.text}</span>
            )}

            <button type="button" onClick={() => removeSubtask(s.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--pd-color-text-muted)', display: 'flex', alignItems: 'center' }}>
              <span className="material-icons" style={{ fontSize: '16px', lineHeight: 1 }}>close</span>
            </button>
          </div>
        ))}
        <TextField
          ref={subtaskInputRef}
          value={newSubtask}
          onChange={(e) => setNewSubtask(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
              e.preventDefault();
              addSubtask();
            }
          }}
          placeholder={t('addSubtask', lang)}
          size="sm"
        />
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
          <Button variant="primary" size="sm" onClick={handleSave}>{t('save', lang)}</Button>
        </div>
      </div>
    </div>
  );
});
