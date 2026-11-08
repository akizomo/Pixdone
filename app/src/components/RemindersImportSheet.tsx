import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from '../hooks/useNavigate';
import { BottomSheet, Button, Checkbox, Chip, TextLink, useToast } from '../design-system';
import { useListsActions, useListsData } from '../features/ListsContext';
import { useThemeEntitlements } from '../hooks/useThemeEntitlements';
import { Reminders, ensureRemindersAccess, type ReminderList } from '../services/reminders';
import {
  buildImportGroups,
  remainingListSlots,
  type ImportTarget,
} from '../lib/remindersImport';
import {
  pricingPath,
  trackRemindersImport,
  trackRemindersPermissionDenied,
  type RemindersImportSource,
} from '../services/analytics';
import { t } from '../lib/i18n';
import './RemindersImportSheet.css';

export interface RemindersImportSheetProps {
  open: boolean;
  /** `() => setOpen(false)` only (BottomSheet rule). */
  onClose: () => void;
  source: RemindersImportSource;
  lang: 'en' | 'ja';
}

type Phase = 'loading' | 'denied' | 'empty' | 'select' | 'error';
/** 'new' or an existing PixDone list id */
type Dest = 'new' | string;

const copy = {
  ja: {
    title: 'リマインダーから取り込む',
    loading: '読み込み中…',
    denied: 'リマインダーへのアクセスが許可されていません。iPhone の「設定」→「PixDone」→「リマインダー」で許可できます。',
    empty: '取り込める未完了のリマインダーがありません。',
    error: 'リマインダーを読み込めませんでした。',
    lead: '取り込むリストを選んでください。未完了の項目だけをコピーします。リマインダーは変更しません。',
    items: (n: number) => `${n}件`,
    to: '取り込み先',
    newList: '新しいリスト',
    limit: '無料プランでは、リストは3つまでです。',
    upgrade: 'PixDone+ を見る',
    submit: (n: number) => `${n}件を取り込む`,
    done: (n: number) => `${n}件のタスクを取り込みました。`,
  },
  en: {
    title: 'Import from Reminders',
    loading: 'Loading…',
    denied: 'PixDone can’t access your reminders. Allow it in Settings → PixDone → Reminders.',
    empty: 'No incomplete reminders to import.',
    error: 'Couldn’t load your reminders.',
    lead: 'Choose lists to import. Only incomplete items are copied. Your reminders aren’t changed.',
    items: (n: number) => `${n} ${n === 1 ? 'item' : 'items'}`,
    to: 'Import to',
    newList: 'New list',
    limit: 'The free plan includes up to 3 lists.',
    upgrade: 'See PixDone+',
    submit: (n: number) => `Import ${n} ${n === 1 ? 'task' : 'tasks'}`,
    done: (n: number) => `Imported ${n} ${n === 1 ? 'task' : 'tasks'}.`,
  },
};

export function RemindersImportSheet({ open, onClose, source, lang }: RemindersImportSheetProps) {
  const c = copy[lang];
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { lists } = useListsData();
  const { importTaskGroups } = useListsActions();
  const { isPremium } = useThemeEntitlements();

  const [phase, setPhase] = useState<Phase>('loading');
  const [reminderLists, setReminderLists] = useState<ReminderList[]>([]);
  /** Selected Reminders list ids, in tap order. */
  const [selected, setSelected] = useState<string[]>([]);
  const [dest, setDest] = useState<Record<string, Dest>>({});
  const [importing, setImporting] = useState(false);

  const targetLists = useMemo(() => lists.filter((l) => l.id !== 'smash-list'), [lists]);
  const inboxId = useMemo(
    () => (targetLists.find((l) => l.kind === 'inbox') ?? targetLists[0])?.id ?? '',
    [targetLists],
  );
  const slots = remainingListSlots(lists, isPremium);
  const newCount = selected.filter((id) => dest[id] === 'new').length;

  // Load (and ask for access) each time the sheet opens.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setPhase('loading');
    setSelected([]);
    setDest({});
    (async () => {
      try {
        const access = await ensureRemindersAccess();
        if (cancelled) return;
        if (access !== 'granted') {
          trackRemindersPermissionDenied({ source });
          setPhase('denied');
          return;
        }
        const res = await Reminders.getLists();
        if (cancelled) return;
        const withItems = res.lists.filter((l) => l.incompleteCount > 0);
        setReminderLists(withItems);
        setPhase(withItems.length ? 'select' : 'empty');
      } catch {
        if (!cancelled) setPhase('error');
      }
    })();
    return () => { cancelled = true; };
  }, [open, source]);

  const toggleList = (id: string, on: boolean) => {
    if (!on) {
      setSelected((prev) => prev.filter((x) => x !== id));
      return;
    }
    setSelected((prev) => [...prev, id]);
    // Default: a new list of the same name while slots remain, else the inbox.
    setDest((prev) => ({ ...prev, [id]: newCount < slots ? 'new' : inboxId }));
  };

  const totalItems = reminderLists
    .filter((l) => selected.includes(l.id))
    .reduce((n, l) => n + l.incompleteCount, 0);

  const runImport = async () => {
    if (importing || selected.length === 0) return;
    setImporting(true);
    try {
      const { items } = await Reminders.getItems({ listIds: selected });
      const targets = selected.map((id) => {
        const d = dest[id] ?? inboxId;
        const title = reminderLists.find((l) => l.id === id)?.title ?? c.newList;
        const target: ImportTarget = d === 'new' ? { kind: 'new', name: title } : { kind: 'existing', listId: d };
        return { reminderListId: id, target };
      });
      const groups = buildImportGroups(items, targets);
      const { taskCount, listCount } = importTaskGroups(groups);
      const repeatCount = groups.reduce(
        (n, g) => n + g.tasks.filter((t) => t.repeat && t.repeat !== 'none').length,
        0,
      );
      trackRemindersImport({ task_count: taskCount, list_count: listCount, repeat_count: repeatCount, source });
      showToast({ message: c.done(taskCount) });
      onClose();
    } catch {
      setPhase('error');
    } finally {
      setImporting(false);
    }
  };

  return (
    <BottomSheet open={open} onClose={onClose} title={c.title}>
      <div className="pd-reminders-import">
        {phase === 'loading' && <p className="pd-reminders-import__note">{c.loading}</p>}
        {phase === 'denied' && <p className="pd-reminders-import__note">{c.denied}</p>}
        {phase === 'empty' && <p className="pd-reminders-import__note">{c.empty}</p>}
        {phase === 'error' && <p className="pd-reminders-import__note">{c.error}</p>}

        {phase === 'select' && (
          <>
            <p className="pd-reminders-import__lead">{c.lead}</p>
            <ul className="pd-reminders-import__lists">
              {reminderLists.map((rl) => {
                const isOn = selected.includes(rl.id);
                const d = dest[rl.id];
                const canNew = d === 'new' || newCount < slots;
                return (
                  <li key={rl.id} className="pd-reminders-import__item">
                    <label className="pd-reminders-import__row">
                      <Checkbox
                        checked={isOn}
                        onChange={(v) => toggleList(rl.id, v)}
                        soundKey="buttonClick"
                        aria-label={rl.title}
                      />
                      <span className="pd-reminders-import__name">{rl.title}</span>
                      <span className="pd-reminders-import__count">{c.items(rl.incompleteCount)}</span>
                    </label>
                    {isOn && (
                      <div className="pd-reminders-import__dest" role="listbox" aria-label={c.to}>
                        <span className="pd-reminders-import__dest-label">{c.to}</span>
                        <div className="pd-reminders-import__chips">
                          {canNew && (
                            <Chip
                              size="sm"
                              font="body"
                              selected={d === 'new'}
                              onClick={() => setDest((p) => ({ ...p, [rl.id]: 'new' }))}
                            >
                              {c.newList}
                            </Chip>
                          )}
                          {targetLists.map((l) => (
                            <Chip
                              key={l.id}
                              size="sm"
                              font="body"
                              selected={d === l.id}
                              onClick={() => setDest((p) => ({ ...p, [rl.id]: l.id }))}
                            >
                              {l.kind === 'inbox' ? t('myTasks', lang) : l.name}
                            </Chip>
                          ))}
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>

            {!isPremium && selected.length > 0 && newCount >= slots && (
              <p className="pd-reminders-import__limit">
                {c.limit}{' '}
                <TextLink
                  size="sm"
                  onClick={() => { onClose(); navigate(pricingPath('list_limit')); }}
                >
                  {c.upgrade}
                </TextLink>
              </p>
            )}

            <div className="pd-reminders-import__footer">
              <Button
                variant="primary"
                fullWidth
                soundKey="taskAdd"
                disabled={selected.length === 0}
                loading={importing}
                onClick={runImport}
              >
                {c.submit(totalItems)}
              </Button>
            </div>
          </>
        )}
      </div>
    </BottomSheet>
  );
}
