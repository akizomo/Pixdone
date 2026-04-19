import { useEffect, useMemo, useRef, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import type { Task, RepeatConfig, RepeatPreset, CustomRepeat } from '../types/task';
import { Button, RichTextField, RichTextArea, TextField, PopoverMenu, IconButton, Chip, Checkbox, PixelIcon } from '../design-system';
import type { PopoverMenuItem } from '../design-system/components/PopoverMenu/PopoverMenu.types';
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
  /** Prefill the title field when creating a new task (ignored when `task` is set). */
  initialTitle?: string;
  /** Prefill the due-date field when creating a new task (ignored when `task` is set). */
  initialDueDate?: string | null;
  onSave: (fields: Partial<Task> & { title: string }) => void;
  onCancel: () => void;
  onClose?: () => void;
  onDelete?: () => void;
  availableLists?: Array<{ id: string; name: string }>;
  onMoveToList?: (taskId: string, targetListId: string) => void;
  /**
   * Mobile compact layout only: fires when the user picks a different list from
   * the bottom-left list chip (add mode). Lets the parent re-target `onSave`.
   */
  onListChange?: (listId: string) => void;
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

export const TaskForm = forwardRef<TaskFormHandle, TaskFormProps>(function TaskForm({ lang, task, listId, initialTitle, initialDueDate, onSave, onCancel, onClose, onDelete, availableLists, onMoveToList, onListChange, mobile = false }, ref) {
  const [title, setTitle] = useState(task?.title ?? initialTitle ?? '');
  const [details, setDetails] = useState(task?.details ?? '');
  const [dueDate, setDueDate] = useState<string | null>(task?.dueDate ?? initialDueDate ?? null);
  const [repeat, setRepeat] = useState<RepeatConfig>(task?.repeat ?? 'none');
  const [showRepeat, setShowRepeat] = useState(false);
  const [showPriority, setShowPriority] = useState(false);
  const [showCustom, setShowCustom] = useState(isCustomRepeat(task?.repeat));
  const [customInterval, setCustomInterval] = useState<number>(isCustomRepeat(task?.repeat) ? task.repeat.interval : 1);
  const [customUnit, setCustomUnit] = useState<CustomRepeat['unit']>(isCustomRepeat(task?.repeat) ? task.repeat.unit : 'week');
  const [customWeekDays, setCustomWeekDays] = useState<number[]>(isCustomRepeat(task?.repeat) ? (task.repeat.weekDays ?? []) : []);
  const [priority, setPriority] = useState<Task['priority']>(task?.priority);
  const [subtasks, setSubtasks] = useState(task?.subtasks ?? []);
  const [newSubtask, setNewSubtask] = useState('');
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [editingSubtaskText, setEditingSubtaskText] = useState('');
  const [showListMenu, setShowListMenu] = useState(false);
  // Mobile compact layout: chip-anchored popovers + subtask panel state
  const [showDateMenu, setShowDateMenu] = useState(false);
  const [showSubtasksPanel, setShowSubtasksPanel] = useState(false);
  /** Mobile compact: selected list shown in the bottom-left list chip. */
  const [selectedListId, setSelectedListId] = useState<string>(task?.listId ?? listId);

  useEffect(() => {
    // Keep selectedListId in sync when the sheet reopens with a different list.
    setSelectedListId(task?.listId ?? listId);
  }, [listId, task?.listId]);

  const titleRef = useRef<HTMLDivElement>(null);
  const subtaskInputRef = useRef<HTMLInputElement>(null);
  const editingSubtaskRef = useRef<HTMLInputElement>(null);
  // Mobile popover anchor refs — attached to the chip wrappers so the DS
  // PopoverMenu can portal + flip + shift relative to each trigger.
  const dateAnchorRef = useRef<HTMLDivElement>(null);
  const priorityAnchorRef = useRef<HTMLDivElement>(null);
  const repeatAnchorRef = useRef<HTMLDivElement>(null);
  const listAnchorRef = useRef<HTMLDivElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const today = getTodayYMD();
  const tomorrow = getTomorrowYMD();

  // Focus the title as soon as possible so the mobile keyboard opens with the
  // sheet. BottomSheet also auto-focuses the first focusable button via a
  // double-rAF; we re-focus across both rAFs to win that race and place the
  // caret in the title contenteditable.
  useEffect(() => {
    titleRef.current?.focus();
    let r2: number | null = null;
    const r1 = requestAnimationFrame(() => {
      titleRef.current?.focus();
      r2 = requestAnimationFrame(() => titleRef.current?.focus());
    });
    return () => {
      cancelAnimationFrame(r1);
      if (r2 != null) cancelAnimationFrame(r2);
    };
  }, []);

  const handleSave = useCallback(() => {
    const trimmed = title.trim();
    if (!trimmed) { onCancel(); return; }
    onSave({ title: trimmed, details: details.trim() || undefined, dueDate, repeat, subtasks, priority });
  }, [title, details, dueDate, repeat, subtasks, priority, onSave, onCancel]);

  const isDirty = useCallback(() => {
    if (!task) return false;
    return (
      title.trim() !== (task.title ?? '') ||
      (details.trim() || '') !== (task.details ?? '') ||
      dueDate !== (task.dueDate ?? null) ||
      JSON.stringify(repeat) !== JSON.stringify(task.repeat ?? 'none') ||
      JSON.stringify(subtasks) !== JSON.stringify(task.subtasks ?? []) ||
      (priority ?? null) !== (task.priority ?? null)
    );
  }, [title, details, dueDate, repeat, subtasks, priority, task]);

  const handleClose = useCallback(() => {
    const trimmed = title.trim();
    if (task && isDirty() && trimmed) {
      playSound('taskAdd');
      onSave({ title: trimmed, details: details.trim() || undefined, dueDate, repeat, subtasks, priority });
    } else if (task) {
      (onClose ?? onCancel)();
    } else if (trimmed) {
      // Add mode: auto-save instead of discarding
      playSound('taskAdd');
      onSave({ title: trimmed, details: details.trim() || undefined, dueDate, repeat, subtasks, priority });
    } else {
      onCancel();
    }
  }, [task, isDirty, title, details, dueDate, repeat, subtasks, priority, onSave, onClose, onCancel]);

  const dismissSubmenus = useCallback(() => {
    let dismissed = false;
    if (showRepeat) { setShowRepeat(false); setShowCustom(false); dismissed = true; }
    if (showPriority) { setShowPriority(false); dismissed = true; }
    if (showListMenu) { setShowListMenu(false); dismissed = true; }
    if (showDateMenu) { setShowDateMenu(false); dismissed = true; }
    return dismissed;
  }, [showRepeat, showPriority, showListMenu, showDateMenu]);

  const handleListChange = useCallback((id: string) => {
    playSound('buttonClick');
    setSelectedListId(id);
    onListChange?.(id);
    // Edit mode: move the task immediately (mirrors the desktop toolbar behavior).
    if (task && onMoveToList && id !== task.listId) {
      onMoveToList(task.id, id);
    }
    setShowListMenu(false);
  }, [task, onListChange, onMoveToList]);

  // ── Shared popover item builders for mobile (edit + compact) layouts ────
  const dateMenuItems = useMemo<PopoverMenuItem[]>(() => {
    const items: PopoverMenuItem[] = [
      { id: 'today', label: t('today', lang), selected: dueDate === today },
      { id: 'tomorrow', label: t('tomorrow', lang), selected: dueDate === tomorrow },
      { id: 'pick', label: lang === 'ja' ? '日付を選択' : 'Pick date', icon: 'calendar_today' },
    ];
    if (dueDate) items.push({ id: 'clear', label: lang === 'ja' ? 'クリア' : 'Clear', danger: true });
    return items;
  }, [dueDate, today, tomorrow, lang]);

  const handleDateMenuSelect = useCallback((id: string) => {
    playSound('buttonClick');
    if (id === 'today') { setDueDate(today); setShowDateMenu(false); return; }
    if (id === 'tomorrow') { setDueDate(tomorrow); setShowDateMenu(false); return; }
    if (id === 'pick') {
      // Try native picker first; fall back to focus (iOS) for the tap target.
      const el = dateInputRef.current;
      if (el && typeof (el as HTMLInputElement & { showPicker?: () => void }).showPicker === 'function') {
        (el as HTMLInputElement & { showPicker: () => void }).showPicker();
      } else {
        el?.click();
        el?.focus();
      }
      return;
    }
    if (id === 'clear') { setDueDate(null); setShowDateMenu(false); }
  }, [today, tomorrow]);

  const priorityMenuItems = useMemo<PopoverMenuItem[]>(() => [
    { id: 'none', label: t('priorityNone', lang), selected: !priority },
    { id: 'high', label: t('priorityHigh', lang), icon: 'arrow_upward', selected: priority === 'high' },
    { id: 'medium', label: t('priorityMedium', lang), icon: 'remove', selected: priority === 'medium' },
    { id: 'low', label: t('priorityLow', lang), icon: 'arrow_downward', selected: priority === 'low' },
  ], [priority, lang]);

  const handlePriorityMenuSelect = useCallback((id: string) => {
    playSound('buttonClick');
    setPriority(id === 'none' ? undefined : (id as Task['priority']));
    setShowPriority(false);
  }, []);

  const repeatMenuItems = useMemo<PopoverMenuItem[]>(() => {
    const items: PopoverMenuItem[] = REPEAT_PRESETS.map((opt) => ({
      id: opt.value,
      label: t(opt.labelKey, lang),
      selected: getPresetValue(repeat) === opt.value && !isCustomRepeat(repeat),
    }));
    items.push({ id: 'custom', label: t('repeatCustom', lang), icon: 'settings', selected: isCustomRepeat(repeat) });
    return items;
  }, [repeat, lang]);

  const handleRepeatMenuSelect = useCallback((id: string) => {
    playSound('buttonClick');
    if (id === 'custom') { setShowCustom(true); return; }
    setRepeat(id as RepeatPreset);
    setShowRepeat(false);
  }, []);

  const listMenuItems = useMemo<PopoverMenuItem[]>(
    () => (availableLists ?? []).map((l) => ({ id: l.id, label: l.name, selected: selectedListId === l.id })),
    [availableLists, selectedListId],
  );

  const closeRepeatMenu = useCallback(() => {
    playSound('taskCancel');
    setShowRepeat(false);
    setShowCustom(false);
  }, []);

  // Custom-repeat sub-view rendered inside the Repeat PopoverMenu's children.
  const repeatCustomView = showCustom ? (
    <div className="pd-task-form__repeat-custom">
      <div className="pd-task-form__repeat-custom-header">
        <button type="button" className="pd-task-form__repeat-custom-back" onClick={() => { playSound('buttonClick'); setShowCustom(false); }}>
          <PixelIcon name="arrow_back" size="18px" />
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
  ) : null;

  const saveIfDirty = useCallback(() => {
    const trimmed = title.trim();
    if (task && isDirty() && trimmed) {
      playSound('taskAdd');
      onSave({ title: trimmed, details: details.trim() || undefined, dueDate, repeat, subtasks, priority });
    } else if (!task && trimmed) {
      // Add mode: persist on dismissal so user input isn't lost
      playSound('taskAdd');
      onSave({ title: trimmed, details: details.trim() || undefined, dueDate, repeat, subtasks, priority });
    }
  }, [task, isDirty, title, details, dueDate, repeat, subtasks, priority, onSave]);

  useImperativeHandle(ref, () => ({ close: handleClose, saveIfDirty, dismissSubmenus }), [handleClose, saveIfDirty, dismissSubmenus]);

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') { e.preventDefault(); e.nativeEvent.stopPropagation(); handleClose(); }
    // Enter saves on both desktop and the mobile compact form. (Notes keeps
    // Enter for newlines — see handleDetailsKeyDown.)
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) { e.preventDefault(); handleSave(); }
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

  // ── Mobile EDIT (full modal) layout ───────────────────────────────────────
  // Edit has a list picker in the top-left, delete top-right, chips, an
  // "Add a subtask" text button (not chip), and Cancel/Save in a bottom bar.
  if (mobile && task) {
    const selectedListName = availableLists?.find((l) => l.id === selectedListId)?.name ?? '';
    const priorityItems: Array<{ value: Task['priority']; key: string; icon: string | null; iconClass: string }> = [
      { value: undefined, key: 'priorityNone', icon: null, iconClass: '' },
      { value: 'high', key: 'priorityHigh', icon: 'arrow_upward', iconClass: 'pd-task-form__priority-icon--high' },
      { value: 'medium', key: 'priorityMedium', icon: 'remove', iconClass: 'pd-task-form__priority-icon--medium' },
      { value: 'low', key: 'priorityLow', icon: 'arrow_downward', iconClass: 'pd-task-form__priority-icon--low' },
    ];
    return (
      <div className="pd-task-form pd-task-form--edit">
        {/* Hidden native date picker — triggered by the "Pick date" menu item. */}
        <input
          ref={dateInputRef}
          type="date"
          className="pd-task-form__date-input-hidden"
          tabIndex={-1}
          aria-hidden="true"
          value={dueDate && dueDate !== today && dueDate !== tomorrow ? dueDate : ''}
          onChange={(e) => { setDueDate(e.target.value || null); setShowDateMenu(false); }}
        />
        {/* Top toolbar: list chip (left) + delete (right) */}
        <div className="pd-task-form__edit-toolbar">
          {availableLists && availableLists.length > 0 ? (
            <div ref={listAnchorRef}>
              <button
                type="button"
                className="pd-task-form__list-chip"
                aria-haspopup="menu"
                aria-expanded={showListMenu}
                onClick={() => { playSound('buttonClick'); setShowListMenu((v) => !v); }}
              >
                <PixelIcon name="folder" className="pd-task-form__chip-icon" />
                <span>{selectedListName || (lang === 'ja' ? 'リスト' : 'List')}</span>
                <PixelIcon name="arrow_drop_down" />
              </button>
            </div>
          ) : <div />}
          {onDelete && (
            <IconButton
              variant="ghostDanger"
              size="sm"
              aria-label={lang === 'ja' ? '削除' : 'Delete'}
              icon={<PixelIcon name="delete" size="18px" />}
              soundKey="taskDelete"
              onClick={onDelete}
            />
          )}
        </div>
        {showListMenu && (
          <PopoverMenu
            anchorEl={listAnchorRef.current}
            placement="bottom-start"
            items={listMenuItems}
            onSelect={handleListChange}
            onClose={() => { playSound('taskCancel'); setShowListMenu(false); }}
          />
        )}

        {/* Title */}
        <RichTextField
          id="task-title"
          value={title}
          onChange={setTitle}
          placeholder={lang === 'ja' ? 'タスク名' : 'Task name'}
          onKeyDown={handleTitleKeyDown}
          ref={titleRef}
          wrap
          className="pd-task-form__title--compact"
        />

        {/* Notes */}
        <RichTextArea
          value={details}
          onChange={setDetails}
          placeholder={t('details', lang)}
          rows={3}
          onKeyDown={handleDetailsKeyDown}
          className="pd-task-form__notes--compact"
        />

        {/* Chip row */}
        <div className="pd-task-form__chip-row pd-task-form__chip-row--compact">
          {/* Date */}
          <div ref={dateAnchorRef}>
            <Chip font="body" selected={!!dueDate} onClick={() => { playSound('buttonClick'); setShowDateMenu((v) => !v); }}>
              <PixelIcon name="calendar_today" className="pd-task-form__chip-icon" />
              {dueDate
                ? dueDate === today
                  ? t('today', lang)
                  : dueDate === tomorrow
                    ? t('tomorrow', lang)
                    : (() => { const [, m, d] = dueDate.split('-'); return `${Number(m)}/${Number(d)}`; })()
                : (lang === 'ja' ? '日付' : 'Date')}
            </Chip>
          </div>

          {/* Priority */}
          <div ref={priorityAnchorRef}>
            <Chip font="body" selected={!!priority} onClick={() => { playSound('buttonClick'); setShowPriority((v) => !v); }}>
              <PixelIcon
                name={priority === 'high' ? 'arrow_upward' : priority === 'low' ? 'arrow_downward' : priority === 'medium' ? 'remove' : 'flag'}
                className={`pd-task-form__chip-icon pd-task-form__priority-icon${priority ? ` pd-task-form__priority-icon--${priority}` : ''}`}
              />
              {priority ? t(`priority${priority.charAt(0).toUpperCase()}${priority.slice(1)}`, lang) : t('priority', lang)}
            </Chip>
          </div>

          {/* Repeat */}
          <div ref={repeatAnchorRef}>
            <Chip font="body" selected={repeat !== 'none'} onClick={() => { playSound('buttonClick'); setShowRepeat((v) => !v); }}>
              <PixelIcon name="repeat" className="pd-task-form__chip-icon" />
              {getRepeatLabel(repeat, lang) || t('repeat', lang)}
            </Chip>
          </div>
        </div>

        {/* Popovers (portalled) — anchored to the chip refs above */}
        {showDateMenu && (
          <PopoverMenu
            anchorEl={dateAnchorRef.current}
            placement="bottom-start"
            items={dateMenuItems}
            onSelect={handleDateMenuSelect}
            onClose={() => { playSound('taskCancel'); setShowDateMenu(false); }}
          />
        )}
        {showPriority && (
          <PopoverMenu
            anchorEl={priorityAnchorRef.current}
            placement="bottom-start"
            items={priorityMenuItems}
            onSelect={handlePriorityMenuSelect}
            onClose={() => { playSound('taskCancel'); setShowPriority(false); }}
          />
        )}
        {showRepeat && (
          <PopoverMenu
            anchorEl={repeatAnchorRef.current}
            placement="bottom-start"
            items={showCustom ? [] : repeatMenuItems}
            onSelect={handleRepeatMenuSelect}
            onClose={closeRepeatMenu}
          >
            {repeatCustomView}
          </PopoverMenu>
        )}

        {/* Add-subtask text button + subtask list */}
        <div className="pd-task-form__subtask-list">
          <TextField
            ref={subtaskInputRef}
            value={newSubtask}
            onChange={(e) => setNewSubtask(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) { e.preventDefault(); addSubtask(); } }}
            placeholder={`+ ${t('addSubtask', lang)}`}
            size="sm"
            className="pd-task-form__add-subtask-input"
          />
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
                <PixelIcon name="close" size="16px" />
              </button>
            </div>
          ))}
        </div>

        {/* Bottom actions: Cancel (L) + Save (R) */}
        <div className="pd-task-form__actions">
          <Button variant="secondary" size="sm" onClick={onCancel}>{t('cancel', lang)}</Button>
          <Button variant="primary" size="sm" onClick={handleSave} disabled={!title.trim()}>{t('save', lang)}</Button>
        </div>
      </div>
    );
  }

  // ── Mobile compact (Todoist-style) layout ────────────────────────────────
  if (mobile) {
    const selectedListName = availableLists?.find((l) => l.id === selectedListId)?.name ?? '';
    const priorityItems: Array<{ value: Task['priority']; key: string; icon: string | null; iconClass: string }> = [
      { value: undefined, key: 'priorityNone', icon: null, iconClass: '' },
      { value: 'high', key: 'priorityHigh', icon: 'arrow_upward', iconClass: 'pd-task-form__priority-icon--high' },
      { value: 'medium', key: 'priorityMedium', icon: 'remove', iconClass: 'pd-task-form__priority-icon--medium' },
      { value: 'low', key: 'priorityLow', icon: 'arrow_downward', iconClass: 'pd-task-form__priority-icon--low' },
    ];
    return (
      <div className="pd-task-form pd-task-form--compact">
        {/* Top-right delete (edit mode only) */}
        {onDelete && (
          <div className="pd-task-form__compact-toolbar">
            <IconButton
              variant="ghostDanger"
              size="sm"
              aria-label={lang === 'ja' ? '削除' : 'Delete'}
              icon={<PixelIcon name="delete" size="18px" />}
              soundKey="taskDelete"
              onClick={onDelete}
            />
          </div>
        )}

        {/* Title */}
        <RichTextField
          id="task-title"
          value={title}
          onChange={setTitle}
          placeholder={lang === 'ja' ? 'タスク名' : 'Task name'}
          onKeyDown={handleTitleKeyDown}
          ref={titleRef}
          wrap
          className="pd-task-form__title--compact"
        />

        {/* Notes — single-line seed, grows with newlines */}
        <RichTextArea
          value={details}
          onChange={setDetails}
          placeholder={t('details', lang)}
          rows={1}
          onKeyDown={handleDetailsKeyDown}
          className="pd-task-form__notes--compact"
        />

        {/* Chip row (horizontal scroll) */}
        <div className="pd-task-form__chip-row pd-task-form__chip-row--compact">
          {/* Date */}
          <div ref={dateAnchorRef}>
            <Chip font="body" selected={!!dueDate} onClick={() => { playSound('buttonClick'); setShowDateMenu((v) => !v); }}>
              <PixelIcon name="calendar_today" className="pd-task-form__chip-icon" />
              {dueDate
                ? dueDate === today
                  ? t('today', lang)
                  : dueDate === tomorrow
                    ? t('tomorrow', lang)
                    : (() => { const [, m, d] = dueDate.split('-'); return `${Number(m)}/${Number(d)}`; })()
                : (lang === 'ja' ? '日付' : 'Date')}
            </Chip>
          </div>

          {/* Priority */}
          <div ref={priorityAnchorRef}>
            <Chip font="body" selected={!!priority} onClick={() => { playSound('buttonClick'); setShowPriority((v) => !v); }}>
              <PixelIcon
                name={priority === 'high' ? 'arrow_upward' : priority === 'low' ? 'arrow_downward' : priority === 'medium' ? 'remove' : 'flag'}
                className={`pd-task-form__chip-icon pd-task-form__priority-icon${priority ? ` pd-task-form__priority-icon--${priority}` : ''}`}
              />
              {priority ? t(`priority${priority.charAt(0).toUpperCase()}${priority.slice(1)}`, lang) : t('priority', lang)}
            </Chip>
          </div>

          {/* Repeat */}
          <div ref={repeatAnchorRef}>
            <Chip font="body" selected={repeat !== 'none'} onClick={() => { playSound('buttonClick'); setShowRepeat((v) => !v); }}>
              <PixelIcon name="repeat" className="pd-task-form__chip-icon" />
              {getRepeatLabel(repeat, lang) || t('repeat', lang)}
            </Chip>
          </div>

          {/* Subtasks — edit mode only */}
          {task && (
            <Chip
              font="body"
              selected={showSubtasksPanel || subtasks.length > 0}
              onClick={() => { playSound('buttonClick'); setShowSubtasksPanel((v) => !v); }}
            >
              <PixelIcon name="format_list_bulleted" className="pd-task-form__chip-icon" />
              {t('subtasks', lang)}{subtasks.length > 0 ? ` (${subtasks.length})` : ''}
            </Chip>
          )}
        </div>

        {/* Subtasks expansion — edit only */}
        {task && showSubtasksPanel && (
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
                  <PixelIcon name="close" size="16px" />
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
        )}

        {/* Divider */}
        <div className="pd-task-form__compact-divider" aria-hidden="true" />

        {/* Bottom bar: list selector + send */}
        <div className="pd-task-form__compact-bottom">
          {availableLists && availableLists.length > 0 ? (
            <div ref={listAnchorRef}>
              <button
                type="button"
                className="pd-task-form__list-chip"
                aria-haspopup="menu"
                aria-expanded={showListMenu}
                onClick={() => { playSound('buttonClick'); setShowListMenu((v) => !v); }}
              >
                <PixelIcon name="folder" className="pd-task-form__chip-icon" />
                <span>{selectedListName || (lang === 'ja' ? 'リスト' : 'List')}</span>
                <PixelIcon name="arrow_drop_down" />
              </button>
            </div>
          ) : <div />}

          <IconButton
            variant="primary"
            size="md"
            aria-label={t('save', lang)}
            icon={<PixelIcon name="arrow_upward" />}
            disabled={!title.trim()}
            onClick={handleSave}
          />
        </div>

        {/* Hidden native date picker — triggered by the "Pick date" menu item. */}
        <input
          ref={dateInputRef}
          type="date"
          className="pd-task-form__date-input-hidden"
          tabIndex={-1}
          aria-hidden="true"
          value={dueDate && dueDate !== today && dueDate !== tomorrow ? dueDate : ''}
          onChange={(e) => { setDueDate(e.target.value || null); setShowDateMenu(false); }}
        />

        {/* Popovers (portalled) — anchored to the chip refs above. List pops UP
            because the chip is pinned to the bottom bar. */}
        {showDateMenu && (
          <PopoverMenu
            anchorEl={dateAnchorRef.current}
            placement="bottom-start"
            items={dateMenuItems}
            onSelect={handleDateMenuSelect}
            onClose={() => { playSound('taskCancel'); setShowDateMenu(false); }}
          />
        )}
        {showPriority && (
          <PopoverMenu
            anchorEl={priorityAnchorRef.current}
            placement="bottom-start"
            items={priorityMenuItems}
            onSelect={handlePriorityMenuSelect}
            onClose={() => { playSound('taskCancel'); setShowPriority(false); }}
          />
        )}
        {showRepeat && (
          <PopoverMenu
            anchorEl={repeatAnchorRef.current}
            placement="bottom-start"
            items={showCustom ? [] : repeatMenuItems}
            onSelect={handleRepeatMenuSelect}
            onClose={closeRepeatMenu}
          >
            {repeatCustomView}
          </PopoverMenu>
        )}
        {showListMenu && (
          <PopoverMenu
            anchorEl={listAnchorRef.current}
            placement="top-start"
            items={listMenuItems}
            onSelect={handleListChange}
            onClose={() => { playSound('taskCancel'); setShowListMenu(false); }}
          />
        )}
      </div>
    );
  }

  // ── Desktop / non-mobile layout ─────────────────────────────────────────
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
                <PixelIcon name="arrow_drop_down" />
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
              icon={<PixelIcon name="delete" size="18px" />}
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
            <PixelIcon name="calendar_today" className="pd-task-form__chip-icon" />
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
            <PixelIcon name="repeat" className="pd-task-form__chip-icon" />
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
                        <PixelIcon name="arrow_back" size="18px" />
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
                      <PixelIcon name="settings" size="14px" />
                      {t('repeatCustom', lang)}
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
        {/* Priority */}
        <div className="pd-task-form__repeat-wrapper">
          <Chip
            font="body"
            selected={!!priority}
            onClick={() => setShowPriority((v) => !v)}
          >
            <PixelIcon
              name={priority === 'high' ? 'arrow_upward' : priority === 'low' ? 'arrow_downward' : priority === 'medium' ? 'remove' : 'arrow_upward'}
              className={`pd-task-form__chip-icon pd-task-form__priority-icon${priority ? ` pd-task-form__priority-icon--${priority}` : ''}`}
            />
            {priority ? t(`priority${priority.charAt(0).toUpperCase()}${priority.slice(1)}`, lang) : t('priority', lang)}
          </Chip>
          {showPriority && (
            <>
              <div className="pd-task-form__repeat-backdrop" onClick={() => { playSound('taskCancel'); setShowPriority(false); }} />
              <div className="pd-task-form__repeat-dropdown">
                {([
                  { value: undefined, key: 'priorityNone', icon: null, iconClass: '' },
                  { value: 'high' as const, key: 'priorityHigh', icon: 'arrow_upward', iconClass: 'pd-task-form__priority-icon--high' },
                  { value: 'medium' as const, key: 'priorityMedium', icon: 'remove', iconClass: 'pd-task-form__priority-icon--medium' },
                  { value: 'low' as const, key: 'priorityLow', icon: 'arrow_downward', iconClass: 'pd-task-form__priority-icon--low' },
                ]).map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    className={`pd-task-form__repeat-preset${(priority ?? undefined) === opt.value ? ' pd-task-form__repeat-preset--active' : ''}`}
                    onClick={() => { playSound('buttonClick'); setPriority(opt.value); setShowPriority(false); }}
                  >
                    {opt.icon && (
                      <PixelIcon name={opt.icon} className={`pd-task-form__chip-icon pd-task-form__priority-icon ${opt.iconClass}`} />
                    )}
                    {t(opt.key, lang)}
                  </button>
                ))}
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
              <PixelIcon name="close" size="16px" />
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
