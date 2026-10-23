import { useEffect, useMemo, useRef, useState } from 'react';
import EmailDetail from './components/EmailDetail';
import EmailList from './components/EmailList';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Toast from './components/Toast';
import { FOLDERS, incomingEmails, initialEmails } from './data/mockEmails';

const byNewest = (a, b) => b.receivedAt - a.receivedAt;

export default function App() {
  const [emails, setEmails] = useState(initialEmails);
  const [activeFolder, setActiveFolder] = useState('all');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [highPriorityOnly, setHighPriorityOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState(initialEmails[0]?.id ?? null);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncQueue, setSyncQueue] = useState(incomingEmails);
  const [toast, setToast] = useState(null);
  const syncTimerRef = useRef(null);

  const activeFolderMeta =
    FOLDERS.find((folder) => folder.id === activeFolder) ?? FOLDERS[0];

  const counts = useMemo(() => {
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

  useEffect(
    () => () => {
      if (syncTimerRef.current) window.clearTimeout(syncTimerRef.current);
    },
    [],
  );

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

  const handleToggleHandled = (email) => {
    const nextHandled = !email.handled;
    updateEmail(email.id, { handled: nextHandled, unread: false });
    pushToast(
      nextHandled
        ? 'Marked as handled. Nicely done.'
        : 'Reopened — back on your radar.',
    );
  };

  const handleArchive = (email) => {
    if (email.folder === 'archive') return;

    const previous = { folder: email.folder, unread: email.unread };
    updateEmail(email.id, { folder: 'archive', unread: false });
    setMobileDetailOpen(false);
    pushToast('Conversation archived.', () => {
      updateEmail(email.id, previous);
      setSelectedId(email.id);
    });
  };

  const handleRestore = (email) => {
    updateEmail(email.id, { folder: 'action', unread: false });
    setMobileDetailOpen(false);
    pushToast('Moved back to Action Required.', () => {
      updateEmail(email.id, { folder: 'archive' });
      setSelectedId(email.id);
    });
  };

  const handleMove = (email, folderId) => {
    const destination = FOLDERS.find((folder) => folder.id === folderId);
    if (!destination || email.folder === folderId) return;

    const previous = { folder: email.folder, unread: email.unread };
    updateEmail(email.id, {
      folder: folderId,
      unread: folderId === 'archive' ? false : email.unread,
    });
    setMobileDetailOpen(false);
    pushToast(
      folderId === 'archive'
        ? 'Conversation archived.'
        : `Moved to ${destination.label}.`,
      () => {
        updateEmail(email.id, previous);
        setSelectedId(email.id);
      },
    );
  };

  const handleSendReply = (email) => {
    updateEmail(email.id, { handled: true, unread: false });
    pushToast(`Reply sent to ${email.sender.name.split(' ')[0]}.`);
  };

  const handleSync = () => {
    if (syncing) return;

    setSyncing(true);
    const batch = syncQueue.slice(0, 2);

    syncTimerRef.current = window.setTimeout(() => {
      if (batch.length > 0) {
        const createdAt = Date.now();
        const fresh = batch.map((email, index) => ({
          ...email,
          id: `${email.id}-${createdAt}-${index}`,
          receivedAt: createdAt - index * 15000,
          unread: true,
        }));

        setEmails((current) => [...fresh, ...current]);
        setSyncQueue((current) => current.slice(batch.length));
        pushToast(
          `${fresh.length} new ${
            fresh.length === 1 ? 'email' : 'emails'
          } sorted into your inbox.`,
          () => {
            setEmails((current) =>
              current.filter(
                (email) => !fresh.some((freshEmail) => freshEmail.id === email.id),
              ),
            );
          },
        );
      } else {
        pushToast('You’re all caught up. No new mail.');
      }

      setSyncing(false);
    }, 1200);
  };

  const handleUndo = () => {
    if (toast?.undo) toast.undo();
    setToast(null);
  };

  const locationLabel = searchQuery.trim()
    ? 'Search results'
    : activeFolderMeta.label;

  return (
    <div className="flex h-dvh overflow-hidden bg-paper text-ink">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeFolder={activeFolder}
        onFolderChange={handleFolderChange}
        counts={counts}
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
          onSync={handleSync}
          syncing={syncing}
          onOpenSidebar={() => setSidebarOpen(true)}
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

      <Toast
        toast={toast}
        onDismiss={() => setToast(null)}
        onUndo={handleUndo}
      />
    </div>
  );
}
