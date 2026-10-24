import { useCallback, useEffect, useMemo, useState } from 'react';
import AuthPage from './components/AuthPage';
import ComposeModal from './components/ComposeModal';
import EmailDetail from './components/EmailDetail';
import EmailList from './components/EmailList';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Toast from './components/Toast';
import { FOLDERS } from './lib/folders';
import { folderToCategory, mapEmailRow, mapEmailRows } from './lib/emailMapper';
import {
  deleteEmailRecord,
  fetchEmails,
  subscribeToEmails,
  subscribeToLiveUpdates,
  updateEmailRecord,
} from './lib/emailService';
import { supabase } from './lib/supabaseClient';

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

function AuthLoading() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-paper text-ink">
      <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-forest text-primary-ink shadow-sm">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M4 7h16M7.5 12h9M10.5 17h3" />
          <circle cx="19" cy="17" r="2" fill="currentColor" stroke="none" />
        </svg>
      </div>
      <p className="mt-4 text-[11px] font-medium text-muted">
        Restoring your session…
      </p>
      <span className="mt-4 h-5 w-5 animate-spin rounded-full border-2 border-line border-t-accent-text" />
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(Boolean(supabase));
  const [theme, setTheme] = useState(getInitialTheme);

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

  useEffect(() => {
    if (!supabase) return undefined;

    let active = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return;
        setSession(data.session ?? null);
        setAuthLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setSession(null);
        setAuthLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      setAuthLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = useCallback(async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  const toggleTheme = () =>
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));

  if (authLoading) return <AuthLoading />;

  if (!session) {
    return <AuthPage theme={theme} onToggleTheme={toggleTheme} />;
  }

  return (
    <Dashboard
      key={session.user.id}
      session={session}
      theme={theme}
      onToggleTheme={toggleTheme}
      onSignOut={handleSignOut}
    />
  );
}

function Dashboard({ session, theme, onToggleTheme, onSignOut }) {
  const user = session.user;
  const userId = user.id;

  const [emails, setEmails] = useState([]);
  const [activeFolder, setActiveFolder] = useState('all');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [highPriorityOnly, setHighPriorityOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [dataSource, setDataSource] = useState(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
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

  const loadInbox = useCallback(
    async ({ silent = false } = {}) => {
      if (!userId) return;
      if (!silent) setLoading(true);

      try {
        const { rows, source } = await fetchEmails(userId);
        const mapped = mapEmailRows(rows).sort(byNewest);

        setEmails(mapped);
        setDataSource(source);
        setLoadError('');
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
        if (!silent) {
          setEmails([]);
          setSelectedId(null);
          setDataSource(null);
        }
        setLoadError(errorText(error));
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [userId],
  );

  useEffect(() => {
    // This effect synchronizes with the remote inbox. State is updated only
    // after the request settles, so the lint rule is a false positive here.
    // oxlint-disable-next-line react/set-state-in-effect
    loadInbox();
  }, [loadInbox]);

  useEffect(() => {
    if (!userId) return undefined;

    const unsubscribe = subscribeToEmails(userId, (payload) => {
      if (payload.eventType === 'INSERT') {
        const created = mapEmailRow(payload.new);
        if (!created) return;

        setEmails((current) =>
          current.some((email) => email.id === created.id)
            ? current
            : [{ ...created, unread: true }, ...current],
        );
        setDataSource('supabase');
        setSelectedId((current) => current ?? created.id);
      } else if (payload.eventType === 'UPDATE') {
        const updated = mapEmailRow(payload.new);
        if (!updated) return;

        setEmails((current) =>
          current.map((email) =>
            email.id === updated.id
              ? {
                  ...updated,
                  unread: email.unread,
                  starred: email.starred,
                }
              : email,
          ),
        );
      } else if (payload.eventType === 'DELETE') {
        const removedId = payload.old?.id;
        if (!removedId) return;

        setEmails((current) =>
          current.filter((email) => email.id !== removedId),
        );
        setSelectedId((current) => (current === removedId ? null : current));
      }
    });

    // The API broadcasts a row id after each write. A slow background refresh
    // covers missed events, background writes, and projects without realtime.
    let broadcastTimer = null;
    const unsubscribeBroadcast = subscribeToLiveUpdates(userId, () => {
      if (broadcastTimer) window.clearTimeout(broadcastTimer);
      broadcastTimer = window.setTimeout(() => {
        loadInbox({ silent: true });
      }, 350);
    });

    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadInbox({ silent: true });
      }
    }, 30_000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadInbox({ silent: true });
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      unsubscribe();
      unsubscribeBroadcast();
      if (broadcastTimer) window.clearTimeout(broadcastTimer);
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [loadInbox, userId]);

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
      const { source } = await updateEmailRecord(
        email.id,
        { is_handled: nextHandled },
        userId,
      );
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
      const { source } = await updateEmailRecord(
        email.id,
        { category: folderToCategory(folderId) },
        userId,
      );
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
            const undoResult = await updateEmailRecord(
              email.id,
              { category: folderToCategory(previous.folder) },
              userId,
            );
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
      const { source } = await updateEmailRecord(
        email.id,
        { is_handled: true },
        userId,
      );
      setDataSource(source);
      pushToast('Reply marked as handled. Copy the draft to send it.');
    } catch (error) {
      updateEmail(email.id, previous);
      pushToast(
        `The draft is ready, but the handled status could not be saved. ${errorText(
          error,
        )}`,
      );
    }
  };

  const handleDelete = async (email) => {
    const previous = emails;
    setEmails((current) => current.filter((item) => item.id !== email.id));
    setSelectedId((current) => (current === email.id ? null : current));
    setMobileDetailOpen(false);

    try {
      const { source } = await deleteEmailRecord(email.id, userId);
      setDataSource(source);
      pushToast('Conversation deleted.');
    } catch (error) {
      setEmails(previous);
      pushToast(`Could not delete this conversation. ${errorText(error)}`);
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

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);

    try {
      await onSignOut();
    } catch (error) {
      setSigningOut(false);
      pushToast(`Could not sign out. ${errorText(error)}`);
    }
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
        user={user}
        onSignOut={handleSignOut}
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
          onImportEmail={() => setComposeOpen(true)}
          onOpenSidebar={() => setSidebarOpen(true)}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed((current) => !current)}
          theme={theme}
          onToggleTheme={onToggleTheme}
          user={user}
          onSignOut={handleSignOut}
          signingOut={signingOut}
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
            onImportEmail={() => setComposeOpen(true)}
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
            onDelete={handleDelete}
            onNotify={pushToast}
            user={user}
          />
        </main>
      </div>

      {composeOpen ? (
        <ComposeModal
          open
          userId={userId}
          onClose={() => setComposeOpen(false)}
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
