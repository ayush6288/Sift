import { useCallback, useEffect, useMemo, useState } from 'react';
import EmailDetail from './components/EmailDetail';
import EmailList from './components/EmailList';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import SimulateEmailModal from './components/SimulateEmailModal';
import Toast from './components/Toast';
import { FOLDERS } from './data/mockEmails';
import {
  buildSeedRows,
  folderToCategory,
  mapEmailRow,
  mapEmailRows,
} from './lib/emailMapper';
import {
  fetchEmails,
  seedEmailRecords,
  updateEmailRecord,
} from './lib/emailService';

const byNewest = (a, b) => b.receivedAt - a.receivedAt;

const getInitialTheme = () => {
  if (typeof window === 'undefined') return 'dark';
  try {
    return window.localStorage.getItem('sift-theme') === 'light'
      ? 'light'
      : 'dark';
  } catch {
    return 'dark';
  }
};

const errorText = (error) =>
  error?.message || 'Please check the connection and try again.';

export default function App() {
  const [emails, setEmails] = useState([]);
  const [activeFolder, setActiveFolder] = useState('all');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [highPriorityOnly, setHighPriorityOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState(getInitialTheme);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [dataSource, setDataSource] = useState(null);
  const [seeding, setSeeding] = useState(false);
  const [simulateOpen, setSimulateOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const activeFolderMeta =
    FOLDERS.find((folder) => folder.id === activeFolder) ?? FOLDERS[0];

  const counts = useMemo(() => {
    const next = {};
    FOLDERS.forEach((folder) => {
      next[folder.id] = 0;
    });

    emails.forEach((email) => {
      if (email.folder !== 'archive') next.all += 1;
      if (Object.hasOwn(next, email.folder)) next[email.folder] += 1;
    });

    return next;
  }, [emails]);

  const unreadCounts = useMemo(() => {
    const next = {};
    FOLDERS.forEach((folder) => {
      next[folder.id] = 0;
    });

    emails.forEach((email) => {
      if (!email.unread) return;
      if (email.folder !== 'archive') next.all += 1;
      if (Object.hasOwn(next, email.folder)) next[email.folder] += 1;
    });

    return next;
  }, [emails]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;
    try {
      window.localStorage.setItem('sift-theme', theme);
    } catch {
      // Storage can be unavailable in private previews.
    }
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'dark' ? '#07150f' : '#f6f4ee');
  }, [theme]);

  const loadInbox = useCallback(async () => {
    try {
      const { rows, source } = await fetchEmails();
      const mapped = mapEmailRows(rows).sort(byNewest);

      setEmails(mapped);
      setDataSource(source);
      setSelectedId((current) => {
        if (current && mapped.some((email) => email.id === current)) {
          return current;
        }
        return (
          mapped.find((email) => email.folder !== 'archive')?.id ??
          mapped[0]?.id ??
          null
        );
      });
    } catch (error) {
      setEmails([]);
      setSelectedId(null);
      setDataSource(null);
      setLoadError(errorText(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // This effect synchronizes with the remote inbox. State is updated only
    // after the request settles, so the lint rule is a false positive here.
    // oxlint-disable-next-line react/set-state-in-effect
    loadInbox();
  }, [loadInbox]);

  const handleRetry = () => {
    setLoading(true);
    setLoadError('');
    loadInbox();
  };

  const priorityCount = useMemo(
    () =>
      emails.filter(
        (email) =>
          email.highPriority && !email.handled && email.folder !== 'archive',
      ).length,
    [emails],
  );

  const visibleEmails = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return emails
      .filter((email) => {
        if (query) {
          const folderLabel =
            FOLDERS.find((folder) => folder.id === email.folder)?.label ?? '';
          const searchable = [
            email.sender.name,
            email.sender.email,
            email.subject,
            email.snippet,
            email.tags.join(' '),
            folderLabel,
            email.body.join(' '),
            (email.attachments ?? [])
              .map((attachment) => attachment.name)
              .join(' '),
          ]
            .join(' ')
            .toLowerCase();

          if (!searchable.includes(query)) return false;
        } else if (activeFolder === 'all') {
          if (email.folder === 'archive') return false;
        } else if (email.folder !== activeFolder) {
          return false;
        }

        if (unreadOnly && !email.unread && email.id !== selectedId) return false;
        if (highPriorityOnly && !email.highPriority) return false;
        return true;
      })
      .sort(byNewest);
  }, [
    activeFolder,
    emails,
    highPriorityOnly,
    searchQuery,
    selectedId,
    unreadOnly,
  ]);

  const selectedEmail =
    visibleEmails.find((email) => email.id === selectedId) ??
    visibleEmails[0] ??
    null;
  const mobileReading = mobileDetailOpen && Boolean(selectedEmail);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 4800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!sidebarOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setSidebarOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen]);

  const pushToast = (message, undo = null) => {
    setToast({ id: Date.now() + Math.random(), message, undo });
  };

  const updateEmail = (id, patch) => {
    setEmails((current) =>
      current.map((email) => (email.id === id ? { ...email, ...patch } : email)),
    );
  };

  const handleFolderChange = (folderId) => {
    setActiveFolder(folderId);
    setSearchQuery('');
    setSidebarOpen(false);
    setMobileDetailOpen(false);
  };

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    setMobileDetailOpen(false);
  };

  const handleSelectEmail = (id) => {
    setSelectedId(id);
    setMobileDetailOpen(true);
    setEmails((current) =>
      current.map((email) =>
        email.id === id && email.unread ? { ...email, unread: false } : email,
      ),
    );
  };

  const handleToggleUnread = () => {
    setUnreadOnly((current) => !current);
    setMobileDetailOpen(false);
  };

  const handleToggleHighPriority = () => {
    setHighPriorityOnly((current) => !current);
    setMobileDetailOpen(false);
  };

  const handleClearQuickFilters = () => {
    setUnreadOnly(false);
    setHighPriorityOnly(false);
  };

  const handleClearFilters = () => {
    setUnreadOnly(false);
    setHighPriorityOnly(false);
    setSearchQuery('');
  };

  const handleReviewPriorities = () => {
    setActiveFolder('all');
    setUnreadOnly(false);
    setHighPriorityOnly(true);
    setSearchQuery('');
    setSidebarOpen(false);
    setMobileDetailOpen(false);
  };

  const handleToggleStar = (email) => {
    updateEmail(email.id, { starred: !email.starred });
  };

  const handleToggleHandled = async (email) => {
    const nextHandled = !email.handled;
    const previous = { handled: email.handled, unread: email.unread };
    updateEmail(email.id, { handled: nextHandled, unread: false });

    try {
      const { source } = await updateEmailRecord(email.id, {
        is_handled: nextHandled,
      });
      setDataSource(source);
      pushToast(
        nextHandled
          ? 'Marked as handled. Nicely done.'
          : 'Reopened — back on your radar.',
      );
    } catch (error) {
      updateEmail(email.id, previous);
      pushToast(`Could not update handled status. ${errorText(error)}`);
    }
  };

  const moveEmail = async (email, folderId, successMessage) => {
    const destination = FOLDERS.find((folder) => folder.id === folderId);
    if (!destination || email.folder === folderId) return;

    const previous = { folder: email.folder, unread: email.unread };
    const nextUnread = folderId === 'archive' ? false : email.unread;

    updateEmail(email.id, { folder: folderId, unread: nextUnread });
    setMobileDetailOpen(false);

    try {
      const { source } = await updateEmailRecord(email.id, {
        category: folderToCategory(folderId),
      });
      setDataSource(source);

      pushToast(
        successMessage ??
          (folderId === 'archive'
            ? 'Conversation archived.'
            : `Moved to ${destination.label}.`),
        async () => {
          updateEmail(email.id, previous);
          setSelectedId(email.id);

          try {
            const undoResult = await updateEmailRecord(email.id, {
              category: folderToCategory(previous.folder),
            });
            setDataSource(undoResult.source);
          } catch (error) {
            updateEmail(email.id, { folder: folderId, unread: nextUnread });
            pushToast(`Could not undo the move. ${errorText(error)}`);
          }
        },
      );
    } catch (error) {
      updateEmail(email.id, previous);
      pushToast(`Could not move this email. ${errorText(error)}`);
    }
  };

  const handleArchive = (email) => {
    if (email.folder === 'archive') return;
    return moveEmail(email, 'archive', 'Conversation archived.');
  };

  const handleRestore = (email) =>
    moveEmail(email, 'action', 'Moved back to Action Required.');

  const handleMove = (email, folderId) => {
    const destination = FOLDERS.find((folder) => folder.id === folderId);
    if (!destination) return;
    return moveEmail(
      email,
      folderId,
      folderId === 'archive'
        ? 'Conversation archived.'
        : `Moved to ${destination.label}.`,
    );
  };

  const handleSendReply = async (email) => {
    const previous = { handled: email.handled, unread: email.unread };
    updateEmail(email.id, { handled: true, unread: false });

    try {
      const { source } = await updateEmailRecord(email.id, {
        is_handled: true,
      });
      setDataSource(source);
      pushToast(`Reply sent to ${email.sender.name.split(' ')[0]}.`);
    } catch (error) {
      updateEmail(email.id, previous);
      pushToast(
        `Reply drafted, but the handled status could not be saved. ${errorText(
          error,
        )}`,
      );
    }
  };

  const handleSeed = async () => {
    if (seeding) return;

    setSeeding(true);
    setLoadError('');

    try {
      const seedRows = buildSeedRows();
      const { rows, source } = await seedEmailRecords(seedRows);
      const mapped = mapEmailRows(rows).sort(byNewest);

      if (mapped.length === 0) {
        throw new Error('Supabase did not return the seeded emails.');
      }

      const firstEmail =
        mapped.find((email) => email.folder !== 'archive') ?? mapped[0];

      setEmails(mapped);
      setDataSource(source);
      setSelectedId(firstEmail.id);
      setActiveFolder(firstEmail.folder === 'archive' ? 'archive' : 'all');
      setSearchQuery('');
      setUnreadOnly(false);
      setHighPriorityOnly(false);
      setMobileDetailOpen(false);
      pushToast(`${mapped.length} sample emails added to your inbox.`);
    } catch (error) {
      setLoadError(errorText(error));
      pushToast(`Seeding failed. ${errorText(error)}`);
    } finally {
      setSeeding(false);
    }
  };

  const handleEmailCreated = (row) => {
    const created = mapEmailRow(row);

    if (!created) {
      pushToast('Sift saved the email, but the response was incomplete.');
      return;
    }

    const newEmail = { ...created, unread: true };

    setEmails((current) => [
      newEmail,
      ...current.filter((email) => email.id !== newEmail.id),
    ]);
    setSelectedId(newEmail.id);
    setActiveFolder(newEmail.folder === 'archive' ? 'archive' : 'all');
    setSearchQuery('');
    setUnreadOnly(false);
    setHighPriorityOnly(false);
    setLoadError('');
    setDataSource((current) => current ?? 'api');
    setMobileDetailOpen(true);
    pushToast(
      `Sift filed this in ${newEmail.category} · ${newEmail.priority} priority.`,
    );
  };

  const handleUndo = () => {
    const undo = toast?.undo;
    setToast(null);
    if (!undo) return;

    try {
      Promise.resolve(undo()).catch(() => {});
    } catch {
      // The undo handler reports its own failures through a toast.
    }
  };

  const locationLabel = searchQuery.trim()
    ? 'Search results'
    : activeFolderMeta.label;

  return (
    <div className="flex h-dvh overflow-hidden bg-paper text-ink">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        activeFolder={activeFolder}
        onFolderChange={handleFolderChange}
        counts={counts}
        unreadCounts={unreadCounts}
        unreadOnly={unreadOnly}
        highPriorityOnly={highPriorityOnly}
        onToggleUnread={handleToggleUnread}
        onToggleHighPriority={handleToggleHighPriority}
        onClearQuickFilters={handleClearQuickFilters}
        onReviewPriorities={handleReviewPriorities}
        priorityCount={priorityCount}
      />

      {sidebarOpen ? (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-[#0d2118]/45 backdrop-blur-[2px] lg:hidden"
        />
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          locationLabel={locationLabel}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          onSimulateEmail={() => setSimulateOpen(true)}
          onOpenSidebar={() => setSidebarOpen(true)}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed((current) => !current)}
          theme={theme}
          onToggleTheme={() =>
            setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
          }
          onToast={pushToast}
        />

        <main className="flex min-h-0 flex-1">
          <EmailList
            emails={visibleEmails}
            selectedId={selectedEmail?.id ?? null}
            onSelect={handleSelectEmail}
            folder={activeFolderMeta}
            searchQuery={searchQuery}
            unreadOnly={unreadOnly}
            highPriorityOnly={highPriorityOnly}
            onClearUnread={handleToggleUnread}
            onClearHighPriority={handleToggleHighPriority}
            onClearFilters={handleClearFilters}
            hiddenOnMobile={mobileReading}
            loading={loading}
            loadError={loadError}
            inboxEmpty={emails.length === 0}
            onRetry={handleRetry}
            onSeed={handleSeed}
            seeding={seeding}
            dataSource={dataSource}
          />

          <EmailDetail
            key={selectedEmail?.id ?? 'empty'}
            email={selectedEmail}
            hiddenOnMobile={!mobileReading}
            onBack={() => setMobileDetailOpen(false)}
            onToggleStar={handleToggleStar}
            onArchive={handleArchive}
            onRestore={handleRestore}
            onToggleHandled={handleToggleHandled}
            onMove={handleMove}
            onSendReply={handleSendReply}
            onNotify={pushToast}
          />
        </main>
      </div>

      {simulateOpen ? (
        <SimulateEmailModal
          open
          onClose={() => setSimulateOpen(false)}
          onCreated={handleEmailCreated}
        />
      ) : null}

      <Toast
        toast={toast}
        onDismiss={() => setToast(null)}
        onUndo={handleUndo}
      />
    </div>
  );
}
