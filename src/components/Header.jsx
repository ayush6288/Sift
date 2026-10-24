import { useEffect, useRef, useState } from 'react';
import Avatar from './Avatar';
import Icon from './Icons';
import WebhookPopover from './WebhookPopover';
import { userDisplayName } from '../lib/user';

function SearchField({ inputRef, value, onChange, showShortcut = false }) {
  return (
    <div className="group relative w-full">
      <Icon
        name="search"
        size={16}
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint transition group-focus-within:text-accent-text"
      />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            if (value) {
              onChange('');
            } else {
              event.currentTarget.blur();
            }
          }
        }}
        placeholder="Search senders, subjects, keywords…"
        aria-label="Search emails"
        className={`h-10 w-full rounded-xl border border-line bg-field/85 pl-9 text-[12.5px] text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] outline-none transition placeholder:text-faint focus:border-accent-line focus:bg-field focus:ring-4 focus:ring-accent/30 dark:shadow-none ${
          value ? 'pr-10' : showShortcut ? 'pr-16' : 'pr-4'
        }`}
      />
      {value ? (
        <button
          type="button"
          onClick={() => {
            onChange('');
            inputRef.current?.focus();
          }}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-muted transition hover:bg-hover hover:text-ink"
        >
          <Icon name="x" size={14} />
        </button>
      ) : showShortcut ? (
        <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 items-center rounded-md border border-line bg-paper px-1.5 py-0.5 font-sans text-[9.5px] font-medium text-faint sm:flex">
          ⌘K
        </kbd>
      ) : null}
    </div>
  );
}

function ProfileMenuItem({ icon, label, onClick, destructive = false, disabled = false }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[12px] font-medium transition disabled:cursor-wait disabled:opacity-60 ${
        destructive
          ? 'text-danger hover:bg-danger-soft'
          : 'text-body hover:bg-soft hover:text-ink'
      }`}
    >
      <Icon
        name={icon}
        size={15}
        className={destructive ? 'text-danger' : 'text-muted'}
      />
      {label}
    </button>
  );
}

export default function Header({
  locationLabel,
  searchQuery,
  onSearchChange,
  onImportEmail,
  onOpenSidebar,
  sidebarCollapsed,
  onToggleSidebar,
  theme,
  onToggleTheme,
  user,
  onSignOut,
  signingOut = false,
}) {
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const desktopSearchRef = useRef(null);
  const mobileSearchRef = useRef(null);
  const email = user?.email ?? '';

  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        const isDesktop = window.matchMedia('(min-width: 768px)').matches;
        const target = isDesktop ? desktopSearchRef.current : mobileSearchRef.current;
        target?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!profileOpen) return undefined;

    const handlePointerDown = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setProfileOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [profileOpen]);

  const handleSignOut = () => {
    setProfileOpen(false);
    onSignOut();
  };

  return (
    <header className="relative z-30 shrink-0 border-b border-line/90 bg-paper/90 backdrop-blur-md">
      <div className="flex h-[68px] items-center gap-2 px-4 sm:gap-3 sm:px-6">
        <button
          type="button"
          onClick={onOpenSidebar}
          aria-label="Open navigation"
          className="-ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-soft-ink transition hover:bg-hover hover:text-ink lg:hidden"
        >
          <Icon name="menu" size={19} />
        </button>

        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label={sidebarCollapsed ? 'Expand navigation' : 'Collapse navigation'}
          aria-expanded={!sidebarCollapsed}
          title={sidebarCollapsed ? 'Expand navigation' : 'Collapse navigation'}
          className="-ml-1 hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg text-soft-ink transition hover:bg-hover hover:text-ink lg:flex"
        >
          <Icon
            name={sidebarCollapsed ? 'panelLeftOpen' : 'panelLeftClose'}
            size={18}
          />
        </button>

        <div className="flex shrink-0 items-center gap-2.5 lg:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-forest text-primary-ink shadow-sm">
            <Icon name="logo" size={18} strokeWidth={2.1} />
          </div>
          <span className="font-display text-[23px] leading-none tracking-[-0.01em] text-ink">
            Sift
          </span>
        </div>

        <div className="hidden min-w-0 items-center gap-2 lg:flex">
          <Icon name="inbox" size={14} className="text-kicker" />
          <span className="text-[12px] font-medium text-ink">Inbox</span>
          <Icon
            name="chevronRight"
            size={12}
            className="hidden text-faint xl:block"
          />
          <span className="hidden max-w-[210px] truncate text-[12px] text-muted xl:block">
            {locationLabel}
          </span>
        </div>

        <div className="hidden min-w-0 flex-1 justify-center px-2 md:flex">
          <div className="w-full max-w-[430px]">
            <SearchField
              inputRef={desktopSearchRef}
              value={searchQuery}
              onChange={onSearchChange}
              showShortcut
            />
          </div>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-1.5 md:ml-0">
          <button
            type="button"
            onClick={onImportEmail}
            title="Import or forward an email"
            className="hidden h-10 items-center gap-2 rounded-xl bg-forest px-3 text-[11.5px] font-medium text-primary-ink shadow-[0_1px_2px_rgba(25,55,43,0.18)] transition hover:bg-forest-hover md:flex"
          >
            <Icon name="plus" size={15} strokeWidth={2.2} />
            <span className="hidden lg:inline">Import Email</span>
          </button>

          <WebhookPopover key={user?.id} />

          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={
              theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
            }
            title={
              theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
            }
            className="flex h-10 w-10 items-center justify-center rounded-xl text-soft-ink transition hover:bg-hover hover:text-ink"
          >
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={17} />
          </button>

          <span className="mx-0.5 hidden h-6 w-px bg-line sm:block" />

          <div ref={profileRef} className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen((current) => !current)}
              aria-haspopup="menu"
              aria-expanded={profileOpen}
              aria-label="Open profile menu"
              className="flex h-10 items-center gap-2 rounded-xl pl-1 pr-1.5 transition hover:bg-hover sm:pr-2"
            >
              <Avatar name={userDisplayName(user)} tone="sage" size="sm" />
              <span className="hidden max-w-[170px] truncate text-left text-[10.5px] font-medium text-body xl:block">
                {email}
              </span>
              <Icon
                name="chevronDown"
                size={13}
                className={`hidden text-faint transition xl:block ${
                  profileOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {profileOpen ? (
              <div
                role="menu"
                aria-label="Profile"
                className="animate-menu-in absolute right-0 top-[calc(100%+9px)] z-50 w-[276px] origin-top-right rounded-2xl border border-line bg-menu p-2 shadow-[0_22px_60px_-18px_rgba(10,28,19,0.35)]"
              >
                <div className="flex items-center gap-3 rounded-xl bg-soft px-3 py-3">
                  <Avatar name={userDisplayName(user)} tone="sage" size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-semibold text-ink">
                      {userDisplayName(user)}
                    </p>
                    <p className="mt-0.5 truncate text-[10.5px] text-muted">
                      {email}
                    </p>
                  </div>
                </div>

                <div className="mt-1.5 space-y-0.5">
                  <ProfileMenuItem
                    icon="logOut"
                    label={signingOut ? 'Signing out…' : 'Sign out'}
                    onClick={handleSignOut}
                    destructive
                    disabled={signingOut}
                  />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex gap-2 px-4 pb-3 md:hidden">
        <div className="min-w-0 flex-1">
          <SearchField
            inputRef={mobileSearchRef}
            value={searchQuery}
            onChange={onSearchChange}
          />
        </div>
        <button
          type="button"
          onClick={onImportEmail}
          aria-label="Import or forward an email"
          className="flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-forest px-3 text-[11px] font-medium text-primary-ink shadow-sm transition hover:bg-forest-hover"
        >
          <Icon name="plus" size={14} strokeWidth={2.2} />
          Import
        </button>
      </div>
    </header>
  );
}
