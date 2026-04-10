import { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import type { Task, RepeatConfig, RepeatPreset, CustomRepeat } from '../types/task';
import { Button, RichTextField, RichTextArea, TextField, PopoverMenu, IconButton, Chip, Checkbox } from '../design-system';
import { t } from '../lib/i18n';
import { getRepeatLabel } from '../lib/repeat';
import { getTodayYMD, getTomorrowYMD } from '../lib/date';
import { playSound } from '../services/sound';
import type { Subtask } from '../types/task';
import './TaskForm.css';

export interface TaskFormProps {
  lang: 'en' | 'ja';
  listId: string;
  task?: Task;
  onSave: (fields: Partial<Task> & { title: string }) => void;
  onCancel: () => void;
  onClose?: () => void;
  onDelete?: () => void;
  availableLists?: Array<{ id: string; name: string }>;
  onMoveToList?: (taskId: string, targetListId: string) => void;
  mobile?: boolean;
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
  return 'none';
}

export interface TaskFormHandle {
  close: () => void;
  saveIfDirty: () => void;
  dismissSubmenus: () => boolean;
}

export const TaskForm = forwardRef<TaskFormHandle, TaskFormProps>(function TaskForm({ lang, task, onSave, onCancel, onClose, onDelete, availableLists, onMoveToList, mobile = false }, ref) {
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

  useEffect(() => { titleRef.current?.focus(); }, []);

  const handleSave = useCallback(() => {
    const trimmed = title.trim();
    if (!trimmed) { onCancel(); return; }
    onSave({ title: trimmed, details: details.trim() || undefined, dueDate, repeat, subtasks });
  }, [title, details, dueDate, repeat, subtasks, onSave, onCancel]);

  const isDirty = useCallback(() => {
    if (!task) return false;
    return (
      title.trim() !== (task.title ?? '') ||
      (details.trim() || '') !== (task.details ?? '') ||
      dueDate !== (task.dueDate ?? null) ||
      JSON.stringify(repeat) !== JSON.stringify(task.repeat ?? 'none') ||
      JSON.stringify(subtasks) !== JSON.stringify(task.subtasks ?? [])
    );
  }, [title, details, dueDate, repeat, subtasks, task]);

  const handleClose = useCallback(() => {
    if (task && isDirty() && title.trim()) {
      playSound('taskAdd');
      onSave({ title: title.trim(), details: details.trim() || undefined, dueDate, repeat, subtasks });
    } else if (task) {
      (onClose ?? onCancel)();
    } else {
      onCancel();
    }
  }, [task, isDirty, title, details, dueDate, repeat, subtasks, onSave, onClose, onCancel]);

  const dismissSubmenus = useCallback(() => {
    let dismissed = false;
    if (showRepeat) { setShowRepeat(false); setShowCustom(false); dismissed = true; }
    if (showListMenu) { setShowListMenu(false); dismissed = true; }
    return dismissed;
  }, [showRepeat, showListMenu]);

  const saveIfDirty = useCallback(() => {
    if (task && isDirty() && title.trim()) {
      playSound('taskAdd');
      onSave({ title: title.trim(), details: details.trim() || undefined, dueDate, repeat, subtasks });
    }
  }, [task, isDirty, title, details, dueDate, repeat, subtasks, onSave]);

  useImperativeHandle(ref, () => ({ close: handleClose, saveIfDirty, dismissSubmenus }), [handleClose, saveIfDirty, dismissSubmenus]);

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') { e.preventDefault(); e.nativeEvent.stopPropagation(); handleClose(); }
    if (e.key === 'Enter' && !e.nativeEvent.isComposing && !mobile) { e.preventDefault(); handleSave(); }
  };

  const handleDetailsKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing && !mobile) { e.preventDefault(); handleSave(); }
  };

  const toggleDate = (ymd: string) => setDueDate((prev) => (prev === ymd ? null : ymd));

  const addSubtask = useCallback(() => {
    const text = newSubtask.trim();
    if (!text) return;
    playSound('taskAdd');
    setSubtasks((prev) => [...prev, { id: `sub-${Date.now()}`, text, done: false }]);
    setNewSubtask('');
    setTimeout(() => subtaskInputRef.current?.focus(), 0);
  }, [newSubtask]);

  const removeSubtask = (id: string) => {
    playSound('taskCancel');
    setSubtasks((prev) => prev.filter((s) => s.id !== id));
  };

  const toggleSubtask = (id: string) => {
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
    if (text) setSubtasks((prev) => prev.map((s) => s.id === id ? { ...s, text } : s));
    setEditingSubtaskId(null);
    setEditingSubtaskText('');
  };

  return (
    <div className="pd-task-form">
      {/* Toolbar: list selector + delete */}
      {(onDelete || (task && availableLists && availableLists.length > 1)) && (
        <div className="pd-task-form__toolbar">
          {task && availableLists && availableLists.length > 1 ? (
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                role="combobox"
                aria-expanded={showListMenu}
                aria-haspopup="menu"
                className="pd-task-form__list-trigger"
                onClick={() => { playSound('buttonClick'); setShowListMenu((v) => !v); }}
              >
                {availableLists.find((l) => l.id === task.listId)?.name ?? ''}
                <span className="material-icons">arrow_drop_down</span>
              </button>
              {showListMenu && (
                <PopoverMenu
                  align="left"
                  items={availableLists.filter((l) => l.id !== task.listId).map((l) => ({ id: l.id, label: l.name }))}
                  onSelect={(listId) => { playSound('buttonClick'); onMoveToList?.(task.id, listId); setShowListMenu(false); }}
                  onClose={() => { playSound('taskCancel'); setShowListMenu(false); }}
                />
              )}
            </div>
          ) : <div />}
          {onDelete && (
            <IconButton
              variant="ghostDanger"
              size="sm"
              aria-label={lang === 'ja' ? '削除' : 'Delete'}
              icon={<span className="material-icons" style={{ fontSize: '18px' }}>delete</span>}
              soundKey="taskDelete"
              onClick={onDelete}
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
        wrap={mobile}
      />

      {/* Details */}
      <RichTextArea
        value={details}
        onChange={(v) => setDetails(v)}
        placeholder={t('details', lang)}
        rows={3}
        onKeyDown={handleDetailsKeyDown}
      />

      {/* Date / Repeat chips */}
      <div className="pd-task-form__chip-row">
        <Chip font="body" selected={dueDate === today} onClick={() => toggleDate(today)}>
          {t('today', lang)}
        </Chip>
        <Chip font="body" selected={dueDate === tomorrow} onClick={() => toggleDate(tomorrow)}>
          {t('tomorrow', lang)}
        </Chip>
        <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Chip
            font="body"
            selected={!!(dueDate && dueDate !== today && dueDate !== tomorrow)}
            onClick={() => {
              const input = document.getElementById('task-form-date-input') as HTMLInputElement | null;
              input?.showPicker?.();
            }}
          >
            <span className="material-icons pd-task-form__chip-icon">calendar_today</span>
            {dueDate && dueDate !== today && dueDate !== tomorrow
              ? (() => { const [, m, d] = dueDate.split('-'); return `${Number(m)}/${Number(d)}`; })()
              : (lang === 'ja' ? '日付' : 'Date')}
          </Chip>
          <input
            id="task-form-date-input"
            type="date"
            className="pd-task-form__date-input-hidden"
            value={dueDate && dueDate !== today && dueDate !== tomorrow ? dueDate : ''}
            onChange={(e) => setDueDate(e.target.value || null)}
          />
        </label>
        {/* Repeat */}
        <div className="pd-task-form__repeat-wrapper">
          <Chip
            font="body"
            selected={repeat !== 'none'}
            onClick={() => setShowRepeat((v) => !v)}
          >
            <span className="material-icons pd-task-form__chip-icon">repeat</span>
            {getRepeatLabel(repeat, lang) || t('repeat', lang)}
          </Chip>
          {showRepeat && (
            <>
              <div className="pd-task-form__repeat-backdrop" onClick={() => { playSound('taskCancel'); setShowRepeat(false); setShowCustom(false); }} />
              <div className="pd-task-form__repeat-dropdown">
                {showCustom ? (
                  <div className="pd-task-form__repeat-custom">
                    <div className="pd-task-form__repeat-custom-header">
                      <button type="button" className="pd-task-form__repeat-custom-back" onClick={() => { playSound('buttonClick'); setShowCustom(false); }}>
                        <span className="material-icons" style={{ fontSize: '18px', lineHeight: 1 }}>arrow_back</span>
                      </button>
                      <span className="pd-task-form__repeat-custom-title">{t('repeatCustom', lang)}</span>
                    </div>
                    <div className="pd-task-form__repeat-custom-row">
                      <input
                        type="number"
                        min={1}
                        max={99}
                        value={customInterval}
                        onChange={(e) => setCustomInterval(Math.max(1, parseInt(e.target.value) || 1))}
                        className="pd-task-form__repeat-custom-input"
                      />
                      <select
                        value={customUnit}
                        onChange={(e) => { const unit = e.target.value as CustomRepeat['unit']; setCustomUnit(unit); if (unit !== 'week') setCustomWeekDays([]); }}
                        className="pd-task-form__repeat-custom-select"
                      >
                        {CUSTOM_UNITS.map((u) => (
                          <option key={u.value} value={u.value}>{t(u.labelKey, lang)}</option>
                        ))}
                      </select>
                    </div>
                    {customUnit === 'week' && (
                      <div className="pd-task-form__weekday-row">
                        {WEEKDAY_LABELS[lang].map((label, idx) => {
                          const active = customWeekDays.includes(idx);
                          return (
                            <button
                              key={idx}
                              type="button"
                              className={`pd-task-form__weekday-btn${active ? ' pd-task-form__weekday-btn--active' : ''}`}
                              onClick={() => { playSound('buttonClick'); setCustomWeekDays((prev) => active ? prev.filter((d) => d !== idx) : [...prev, idx]); }}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                    <button
                      type="button"
                      className="pd-task-form__repeat-apply"
                      onClick={() => {
                        playSound('taskComplete');
                        const config: CustomRepeat = {
                          type: 'custom', interval: customInterval, unit: customUnit,
                          ...(customUnit === 'week' && customWeekDays.length > 0 ? { weekDays: [...customWeekDays].sort((a, b) => a - b) } : {}),
                        };
                        setRepeat(config); setShowCustom(false); setShowRepeat(false);
                      }}
                    >
                      {t('save', lang)}
                    </button>
                  </div>
                ) : (
                  <>
                    {REPEAT_PRESETS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        className={`pd-task-form__repeat-preset${getPresetValue(repeat) === opt.value && !isCustomRepeat(repeat) ? ' pd-task-form__repeat-preset--active' : ''}`}
                        onClick={() => { playSound('buttonClick'); setRepeat(opt.value); setShowRepeat(false); }}
                      >
                        {t(opt.labelKey, lang)}
                      </button>
                    ))}
                    <button
                      type="button"
                      className={`pd-task-form__repeat-preset${isCustomRepeat(repeat) ? ' pd-task-form__repeat-preset--active' : ''}`}
                      style={{ borderBottom: 'none' }}
                      onClick={() => { playSound('buttonClick'); setShowCustom(true); }}
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
      <div className="pd-task-form__subtask-list">
        {subtasks.map((s) => (
          <div key={s.id} className="pd-task-form__subtask-row">
            <Checkbox
              checked={s.done}
              onChange={() => toggleSubtask(s.id)}
              size="sm"
              soundKey="subtaskComplete"
            />
            {editingSubtaskId === s.id ? (
              <TextField
                ref={editingSubtaskRef}
                value={editingSubtaskText}
                onChange={(e) => setEditingSubtaskText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.nativeEvent.isComposing) { e.preventDefault(); commitEditSubtask(s.id); }
                  if (e.key === 'Escape') { setEditingSubtaskId(null); setEditingSubtaskText(''); }
                }}
                onBlur={() => commitEditSubtask(s.id)}
                size="sm"
                style={{ flex: 1 }}
              />
            ) : (
              <span
                role="button"
                tabIndex={0}
                className={`pd-task-form__subtask-text${s.done ? ' pd-task-form__subtask-text--done' : ''}`}
                onClick={() => startEditSubtask(s)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') startEditSubtask(s); }}
              >{s.text}</span>
            )}
            <button type="button" className="pd-task-form__subtask-remove" onClick={() => removeSubtask(s.id)}>
              <span className="material-icons" style={{ fontSize: '16px', lineHeight: 1 }}>close</span>
            </button>
          </div>
        ))}
        <TextField
          ref={subtaskInputRef}
          value={newSubtask}
          onChange={(e) => setNewSubtask(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) { e.preventDefault(); addSubtask(); } }}
          placeholder={t('addSubtask', lang)}
          size="sm"
        />
      </div>

      {/* Actions */}
      <div className="pd-task-form__actions">
        <div>
          <Button variant="secondary" size="sm" onClick={onCancel}>{t('cancel', lang)}</Button>
        </div>
        <div>
          <Button variant="primary" size="sm" onClick={handleSave}>{t('save', lang)}</Button>
        </div>
      </div>
    </div>
  );
});
