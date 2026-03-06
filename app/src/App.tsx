import { useState } from 'react';
import { ThemeProvider, Button, Chip, ModalDialog } from './design-system';
import { ListHeader, ListTabs, TaskItem, SmashListPanel, TutorialPanel } from './components';
import { useLists } from './features/useLists';
import type { List } from './types/list';
import type { Task } from './types/task';

function AppContent() {
  const { lists, activeListId, setActiveList, addList, currentList } = useLists();
  const [modalOpen, setModalOpen] = useState(false);
  const [lang, setLang] = useState<'en' | 'ja'>('en');

  const isSmash = currentList?.id === 'smash-list' || currentList?.name === '💥 Smash List';
  const isTutorial = currentList?.id === 'default' && currentList?.name === 'Tutorial';

  const getTabLabel = (list: List) => {
    if (list.id === 'smash-list' || list.name === '💥 Smash List') return '💥';
    if (list.id === 'default' && list.name === 'Tutorial') return lang === 'ja' ? 'マイタスク' : 'My Tasks';
    return list.name;
  };

  const getTabCount = (list: List) =>
    list.tasks.filter((t) => !t.completed).length;

  const handleComplete = (_taskId: string) => {
    // Placeholder: would update state in full app
  };

  const handleEdit = (_taskId: string) => {
    // Placeholder: open task sheet
  };

  const handleSmash = (taskId: string) => {
    handleComplete(taskId);
    // Replenish would happen in full app
  };

  const activeTasks = (currentList?.tasks ?? []).filter((t) => !t.completed);

  return (
    <div className="pd-app-container">
      <header
        className="flex flex-col flex-shrink-0"
        style={{
          gap: 'var(--pd-layout-header-gap, 16px)',
          marginBottom: 'var(--pd-layout-header-marginBottom, 24px)',
          paddingTop: 'var(--pd-layout-header-paddingVertical, 16px)',
          paddingBottom: 'var(--pd-layout-header-paddingVertical, 16px)',
        }}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h1 className="pd-app-title">PixDone</h1>
          </div>
          <div className="flex items-center gap-2">
            <Chip selected={lang === 'en'} onClick={() => setLang('en')}>En</Chip>
            <Chip selected={lang === 'ja'} onClick={() => setLang('ja')}>Ja</Chip>
            <Button variant="signup" onClick={() => setModalOpen(true)}>Sign up</Button>
          </div>
        </div>
        <ListTabs
          lists={lists}
          activeListId={activeListId}
          onSelect={setActiveList}
          onAddList={() => addList('New list')}
          getTabLabel={getTabLabel}
          getTabCount={getTabCount}
        />
      </header>

      <main className="flex-1 flex flex-col min-h-0">
        <ListHeader
          title={isTutorial ? (lang === 'ja' ? 'マイタスク' : 'My Tasks') : (currentList?.name ?? '')}
          showMenu={!isTutorial && !isSmash && currentList?.id !== 'default'}
        />

        {!isSmash && !isTutorial && (
          <div className="px-0 pb-2">
            <button
              type="button"
              className="flex items-center gap-3 w-full bg-[var(--pd-color-background-elevated)] border-2 border-[var(--pd-color-border-default)] rounded-none text-[var(--pd-color-text-secondary)] text-[0.875rem] cursor-pointer py-3 px-4 text-left pd-shadow-sm pd-shadow-hover pd-pixel-ui transition-all hover:bg-[var(--pd-color-background-hover)] hover:text-[var(--pd-color-text-primary)] hover:border-[var(--pd-color-accent-default)]"
              style={{ fontFamily: 'var(--pd-font-body)' }}
            >
              <span className="text-[1rem]">+</span>
              {lang === 'ja' ? 'タスクを追加' : 'Add a task'}
            </button>
          </div>
        )}

        <div className="flex-1 overflow-auto">
          {isSmash ? (
            <SmashListPanel
              subtitle="This list exists only to let you tap and smash tasks for pure satisfaction."
              hint="Press Space to smash a task"
              tasks={currentList?.tasks ?? []}
              onSmash={handleSmash}
              getDisplayTitle={(t: Task) => t.title}
            />
          ) : isTutorial && activeTasks.length === 0 ? (
            <TutorialPanel
              headline={lang === 'ja' ? 'チュートリアル完了！' : "You've completed the tutorial!"}
              subtext={lang === 'ja' ? 'サインアップしてタスクを保存し、デバイス間で同期しましょう。' : 'Sign up to save your own tasks and sync across devices.'}
              buttonLabel={lang === 'ja' ? 'サインアップ' : 'Sign up'}
              onSignUp={() => setModalOpen(true)}
            />
          ) : (
            <div className="space-y-2">
              {(currentList?.tasks ?? []).filter((t) => !t.completed).map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onComplete={handleComplete}
                  onEdit={handleEdit}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <ModalDialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Sign up"
        actions={[
          { label: 'Cancel', onClick: () => setModalOpen(false), variant: 'secondary' },
          { label: 'Sign up', onClick: () => setModalOpen(false), variant: 'signup' },
        ]}
      >
        <p className="text-[var(--pd-color-text-secondary)]">Auth form would go here (email + password).</p>
      </ModalDialog>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
