import Avatar from './Avatar';
import Icon from './Icons';
import Tag from './Tag';
import { FOLDERS } from '../lib/folders';
import { formatListTime, pluralize } from '../utils/format';

function FilterChip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-line bg-raised/80 py-1 pl-2 pr-1 text-[10px] font-medium text-body">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label} filter`}
        className="flex h-4 w-4 items-center justify-center rounded-full text-faint transition hover:bg-hover hover:text-ink"
      >
        <Icon name="x" size={10} strokeWidth={2.2} />
      </button>
    </span>
  );
}

function LoadingState() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-8 py-16 text-center">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-accent-text" />
      <p className="mt-4 text-[11.5px] font-medium text-body">
        Loading your live inbox…
      </p>
      <p className="mt-1 text-[10px] text-faint">Checking Supabase for email</p>
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-8 py-16 text-center">
      <div className="flex h-[64px] w-[64px] items-center justify-center rounded-[20px] border border-danger/25 bg-danger-soft text-danger">
        <Icon name="flag" size={24} strokeWidth={1.7} />
      </div>
      <h2 className="mt-5 font-display text-[25px] leading-tight text-ink">
        Inbox unavailable.
      </h2>
      <p className="mt-2 max-w-[280px] text-[11px] leading-relaxed text-muted">
        {message}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-raised px-3 text-[11px] font-medium text-body shadow-sm transition hover:border-line-strong hover:text-ink"
      >
        <Icon name="refresh" size={12} />
        Try again
      </button>
    </div>
  );
}

function EmptyInboxState({ onImportEmail }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-8 py-16 text-center">
      <div className="relative flex h-[72px] w-[72px] items-center justify-center rounded-[22px] border border-line bg-raised text-kicker shadow-[0_8px_24px_-14px_rgba(30,60,45,0.25)]">
        <Icon name="inbox" size={27} strokeWidth={1.6} />
        <span className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-accent-ink ring-4 ring-panel">
          <Icon name="sparkles" size={11} />
        </span>
      </div>
      <h2 className="mt-5 font-display text-[26px] leading-tight text-ink">
        All clear.
      </h2>
      <p className="mt-2 max-w-[285px] text-[11.5px] leading-relaxed text-muted">
        Your inbox is clean. Forward emails to your Sift webhook or click
        &apos;+ Import Email&apos; to classify a message.
      </p>
      <button
        type="button"
        onClick={onImportEmail}
        className="mt-4 inline-flex h-9 items-center justify-center rounded-lg bg-forest px-3.5 text-[11px] font-medium text-primary-ink shadow-sm transition hover:bg-forest-hover"
      >
        + Import Email
      </button>
    </div>
  );
}

function EmailCard({ email, selected, onSelect, isSearching }) {
  const folder = FOLDERS.find((item) => item.id === email.folder);

  return (
    <button
      type="button"
      onClick={() => onSelect(email.id)}
      aria-current={selected ? 'true' : undefined}
      className={`group relative flex w-full gap-3 px-4 py-4 text-left transition-colors sm:px-5 ${
        selected ? 'bg-raised' : 'hover:bg-hover'
      } ${email.handled ? 'opacity-[0.78]' : ''}`}
    >
      {selected ? (
        <span className="absolute inset-y-3 left-0 w-[3px] rounded-r-full bg-forest" />
      ) : null}

      <div className="relative shrink-0 pt-0.5">
        <Avatar
          name={email.sender.name}
          tone={email.sender.tone}
          size="md"
        />
        {email.unread ? (
          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-forest ring-2 ring-panel group-hover:ring-raised" />
        ) : null}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <p
            className={`min-w-0 flex-1 truncate text-[12.5px] ${
              email.unread
                ? 'font-semibold text-ink'
                : 'font-medium text-soft-ink'
            }`}
          >
            {email.sender.name}
          </p>
          <span
            className={`shrink-0 text-[10px] tabular-nums ${
              email.unread ? 'font-medium text-forest-mid' : 'text-faint'
            }`}
          >
            {formatListTime(email.receivedAt)}
          </span>
        </div>

        <h3
          className={`mt-0.5 truncate text-[12.5px] ${
            email.unread
              ? 'font-semibold text-ink'
              : 'font-normal text-body'
          }`}
        >
          {email.subject}
        </h3>

        <p className="mt-1 line-clamp-1 text-[11.5px] leading-[1.25rem] text-muted">
          {email.snippet}
        </p>

        <div className="mt-2 flex min-w-0 items-center gap-1.5">
          {email.tags.slice(0, 2).map((tag) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
          {email.attachments?.length ? (
            <span
              className="flex items-center text-faint"
              title={`${email.attachments.length} attachment${email.attachments.length > 1 ? 's' : ''}`}
            >
              <Icon name="paperclip" size={11} strokeWidth={2} />
            </span>
          ) : null}
          <span className="ml-auto flex min-w-0 items-center gap-1.5">
            {isSearching && folder ? (
              <span className="truncate text-[9px] font-medium uppercase tracking-[0.08em] text-faint">
                {folder.shortLabel}
              </span>
            ) : null}
            {email.starred ? (
              <Icon
                name="star"
                size={11}
                fill="currentColor"
                className="text-warning"
              />
            ) : null}
            {email.handled ? (
              <span className="flex items-center gap-0.5 text-[9px] font-medium text-muted">
                <Icon name="checkCircle" size={10} />
                Handled
              </span>
            ) : null}
          </span>
        </div>
      </div>
    </button>
  );
}

export default function EmailList({
  emails,
  selectedId,
  onSelect,
  folder,
  searchQuery,
  unreadOnly,
  highPriorityOnly,
  onClearUnread,
  onClearHighPriority,
  onClearFilters,
  hiddenOnMobile,
  loading = false,
  loadError = '',
  inboxEmpty = false,
  onRetry,
  onImportEmail,
  dataSource = null,
}) {
  const trimmedQuery = searchQuery.trim();
  const isSearching = trimmedQuery.length > 0;
  const filtersActive = unreadOnly || highPriorityOnly;
  const count = emails.length;
  const sourceLabel =
    dataSource === 'supabase'
      ? 'Supabase direct'
      : dataSource === 'api'
        ? 'Vercel API'
        : null;
  const sourceTitle =
    dataSource === 'supabase'
      ? 'Reads and writes go directly to Supabase with the browser anon key.'
      : 'Reads and writes go through the same-origin Vercel Python function.';

  return (
    <section
      aria-label="Email list"
      className={`min-h-0 w-full flex-1 flex-col border-r border-line/90 bg-panel lg:flex lg:w-[345px] lg:flex-none xl:w-[395px] 2xl:w-[425px] ${
        hiddenOnMobile ? 'hidden' : 'flex'
      }`}
    >
      <div className="shrink-0 border-b border-line/80 px-4 pb-4 pt-5 sm:px-5">
        <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-kicker">
          {isSearching ? 'Live search' : folder.kicker}
        </p>
        <div className="mt-1.5 flex items-start justify-between gap-3">
          <h1 className="min-w-0 font-display text-[31px] leading-[1.02] tracking-[-0.018em] text-ink">
            {isSearching ? 'Search results' : folder.label}
          </h1>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1.5">
          <p className="text-[11px] leading-relaxed text-muted">
            {count} {pluralize(count, 'conversation')}
            {isSearching
              ? ` matching “${trimmedQuery}”`
              : ` · ${folder.blurb}`}
          </p>
        </div>

        {filtersActive ? (
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {unreadOnly ? (
              <FilterChip label="Unread only" onRemove={onClearUnread} />
            ) : null}
            {highPriorityOnly ? (
              <FilterChip label="High priority" onRemove={onClearHighPriority} />
            ) : null}
            <button
              type="button"
              onClick={onClearFilters}
              className="rounded-full px-1.5 py-1 text-[10px] font-medium text-muted underline decoration-line-strong underline-offset-2 transition hover:text-ink"
            >
              Clear
            </button>
          </div>
        ) : null}
      </div>

      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto">
        {loading && count === 0 ? (
          <LoadingState />
        ) : loadError && count === 0 ? (
          <ErrorState message={loadError} onRetry={onRetry} />
        ) : count > 0 ? (
          <div className="divide-y divide-line/70">
            {emails.map((email) => (
              <EmailCard
                key={email.id}
                email={email}
                selected={email.id === selectedId}
                onSelect={onSelect}
                isSearching={isSearching}
              />
            ))}
          </div>
        ) : inboxEmpty && !isSearching && !filtersActive ? (
          <EmptyInboxState onImportEmail={onImportEmail} />
        ) : (
          <div className="flex h-full flex-col items-center justify-center px-8 py-16 text-center">
            <div className="relative flex h-[72px] w-[72px] items-center justify-center rounded-[22px] border border-line bg-raised text-kicker shadow-[0_8px_24px_-14px_rgba(30,60,45,0.25)]">
              <Icon
                name={isSearching ? 'search' : 'inbox'}
                size={27}
                strokeWidth={1.6}
              />
              <span className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-accent-ink ring-4 ring-panel">
                <Icon name="sparkles" size={11} />
              </span>
            </div>
            <h2 className="mt-5 font-display text-[26px] leading-tight text-ink">
              {isSearching ? 'No matches this time.' : 'Nothing in this view.'}
            </h2>
            <p className="mt-2 max-w-[250px] text-[11.5px] leading-relaxed text-muted">
              {isSearching
                ? `We couldn’t find anything for “${trimmedQuery}”. Try a sender, subject, or keyword.`
                : 'No conversations match these filters. Sift will keep sorting the rest for you.'}
            </p>
            {isSearching || filtersActive ? (
              <button
                type="button"
                onClick={onClearFilters}
                className="mt-4 rounded-lg border border-line bg-raised px-3 py-1.5 text-[11px] font-medium text-body shadow-sm transition hover:border-line-strong hover:text-ink"
              >
                Clear filters
              </button>
            ) : null}
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1.5 border-t border-line/80 px-4 py-2.5 text-[9px] font-medium tracking-[0.02em] text-faint sm:px-5">
        <Icon name="sparkles" size={10} className="text-kicker" />
        <span className="whitespace-nowrap">Sorted by Sift AI</span>
        {sourceLabel ? (
          <>
            <span className="text-faint/60">·</span>
            <span
              title={sourceTitle}
              className="truncate uppercase tracking-[0.06em]"
            >
              {sourceLabel}
            </span>
          </>
        ) : null}
        <span className="ml-auto whitespace-nowrap text-faint/60">
          {count} in view
        </span>
      </div>
    </section>
  );
}
