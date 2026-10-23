import Icon from './Icons';
import { FOLDERS } from '../data/mockEmails';

function QuickToggle({ checked, onChange, icon, label, collapsed }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={`${label}${checked ? ', on' : ''}`}
      title={`${label}${checked ? ' — on' : ''}`}
      onClick={onChange}
      className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] text-[#c1cfc5] transition hover:bg-white/[0.055] hover:text-[#f0f4ed] ${
        collapsed ? 'lg:justify-center lg:gap-0 lg:px-0' : ''
      }`}
    >
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition ${
          checked
            ? 'bg-[#dce8cb] text-[#214533]'
            : 'bg-white/[0.055] text-[#8fa598] group-hover:text-[#c9d8cc]'
        }`}
      >
        <Icon name={icon} size={14} strokeWidth={1.9} />
      </span>
      <span
        className={`flex-1 font-medium ${checked ? 'text-[#f2f5ed]' : ''} ${
          collapsed ? 'lg:hidden' : ''
        }`}
      >
        {label}
      </span>
      <span
        className={`relative h-[18px] w-8 rounded-full transition-colors duration-200 ${
          checked ? 'bg-[#dbe7c9]' : 'bg-white/15'
        } ${collapsed ? 'lg:hidden' : ''}`}
      >
        <span
          className={`absolute top-[3px] h-3 w-3 rounded-full shadow-sm transition-all duration-200 ${
            checked
              ? 'left-[17px] bg-[#1d4032]'
              : 'left-[3px] bg-[#e8eee5]'
          }`}
        />
      </span>
    </button>
  );
}

export default function Sidebar({
  open,
  onClose,
  collapsed,
  activeFolder,
  onFolderChange,
  counts,
  unreadCounts,
  unreadOnly,
  highPriorityOnly,
  onToggleUnread,
  onToggleHighPriority,
  onClearQuickFilters,
  onReviewPriorities,
  priorityCount,
}) {
  const filtersActive = unreadOnly || highPriorityOnly;

  return (
    <aside
      aria-label="Mailbox navigation"
      className={`fixed inset-y-0 left-0 z-50 flex w-[280px] shrink-0 flex-col overflow-hidden bg-sidebar text-[#e9efe7] shadow-2xl transition-[transform,width] duration-300 ease-out lg:static lg:z-auto lg:translate-x-0 lg:shadow-none ${
        open ? 'translate-x-0' : '-translate-x-full'
      } ${collapsed ? 'lg:w-[78px]' : 'lg:w-[280px]'}`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_18%_0%,rgba(162,196,158,0.22),transparent_62%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-[#6f9c7e]/10 blur-3xl"
      />

      <div className="relative flex h-full min-h-0 flex-col">
        <div
          className={`flex shrink-0 items-center gap-3 px-5 pb-6 pt-5 ${
            collapsed ? 'lg:justify-center lg:px-0' : ''
          }`}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] bg-[#e1ebd1] text-[#17362b] shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
            <Icon name="logo" size={21} strokeWidth={2.1} />
          </div>
          <div className={`min-w-0 ${collapsed ? 'lg:hidden' : ''}`}>
            <p className="font-display text-[27px] leading-none tracking-[-0.01em] text-[#f6f8f0]">
              Sift
            </p>
            <p className="mt-1.5 whitespace-nowrap text-[9px] font-medium uppercase tracking-[0.22em] text-[#8fa79a]">
              Inbox, sorted
            </p>
          </div>
          <span
            className={`ml-auto rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[8.5px] font-semibold uppercase tracking-[0.14em] text-[#a8bbad] ${
              collapsed ? 'hidden' : 'hidden lg:inline-block'
            }`}
          >
            Beta
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="ml-1 flex h-8 w-8 items-center justify-center rounded-lg text-[#a7bbac] transition hover:bg-white/10 hover:text-white lg:hidden"
          >
            <Icon name="x" size={17} />
          </button>
        </div>

        <div className="scroll-dark min-h-0 flex-1 overflow-y-auto px-3 pb-3">
          <p
            className={`px-3 pb-2 pt-1 text-[9.5px] font-semibold uppercase tracking-[0.2em] text-[#7f988a] ${
              collapsed ? 'lg:hidden' : ''
            }`}
          >
            Mailbox
          </p>
          <nav aria-label="Folders">
            <ul className="space-y-1">
              {FOLDERS.map((folder) => {
                const active = activeFolder === folder.id;
                const total = counts[folder.id] ?? 0;
                const unread = unreadCounts[folder.id] ?? 0;
                const label = `${folder.label}: ${total} ${
                  total === 1 ? 'conversation' : 'conversations'
                }, ${unread} unread`;

                return (
                  <li key={folder.id}>
                    <button
                      type="button"
                      onClick={() => onFolderChange(folder.id)}
                      aria-current={active ? 'page' : undefined}
                      aria-label={label}
                      title={label}
                      className={`group relative flex w-full items-center gap-2.5 rounded-xl px-3 py-[9px] text-[12px] transition ${
                        active
                          ? 'bg-[#f0f2e7] text-[#19362b] shadow-[0_1px_2px_rgba(0,0,0,0.12)]'
                          : 'text-[#c2d0c6] hover:bg-white/[0.055] hover:text-[#f1f5ee]'
                      } ${collapsed ? 'lg:justify-center lg:gap-0 lg:px-0' : ''}`}
                    >
                      <Icon
                        name={folder.icon}
                        size={16}
                        strokeWidth={1.9}
                        className={
                          active
                            ? 'text-[#2e5845]'
                            : 'text-[#89a294] transition group-hover:text-[#ccdbcf]'
                        }
                      />
                      <span
                        className={`min-w-0 flex-1 truncate text-left font-medium ${
                          collapsed ? 'lg:hidden' : ''
                        }`}
                      >
                        {folder.label}
                      </span>
                      <span
                        className={`flex items-center gap-1.5 ${
                          collapsed ? 'lg:hidden' : ''
                        }`}
                      >
                        {unread > 0 ? (
                          <span
                            aria-hidden="true"
                            className={`h-1.5 w-1.5 rounded-full ${
                              active ? 'bg-[#587a55]' : 'bg-[#a7c998]'
                            }`}
                          />
                        ) : null}
                        <span
                          className={`min-w-[22px] rounded-full px-1.5 py-[3px] text-center text-[9.5px] font-semibold leading-none tabular-nums ${
                            active
                              ? 'bg-[#dbe8cd] text-[#274c3a]'
                              : total > 0
                                ? 'bg-white/[0.11] text-[#edf2e9]'
                                : 'bg-white/[0.04] text-[#7f988a]'
                          }`}
                        >
                          {total}
                        </span>
                      </span>
                      {collapsed ? (
                        <span
                          aria-hidden="true"
                          className={`absolute right-1 top-1 hidden min-w-[17px] rounded-full px-1 py-[3px] text-center text-[8px] font-semibold leading-none tabular-nums lg:block ${
                            active
                              ? 'bg-[#dbe8cd] text-[#274c3a]'
                              : 'bg-white/[0.11] text-[#edf2e9]'
                          }`}
                        >
                          {total}
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="mt-7">
            <div
              className={`flex items-center justify-between px-3 pb-1.5 ${
                collapsed ? 'lg:hidden' : ''
              }`}
            >
              <p className="text-[9.5px] font-semibold uppercase tracking-[0.2em] text-[#7f988a]">
                Quick filters
              </p>
              {filtersActive ? (
                <button
                  type="button"
                  onClick={onClearQuickFilters}
                  className="rounded px-1 py-0.5 text-[9.5px] font-medium text-[#9db2a4] transition hover:text-[#f0f4ed]"
                >
                  Reset
                </button>
              ) : null}
            </div>
            <div className="space-y-0.5">
              <QuickToggle
                checked={unreadOnly}
                onChange={onToggleUnread}
                icon="mailOpen"
                label="Unread only"
                collapsed={collapsed}
              />
              <QuickToggle
                checked={highPriorityOnly}
                onChange={onToggleHighPriority}
                icon="flag"
                label="High priority"
                collapsed={collapsed}
              />
            </div>
          </div>
        </div>

        <div className="shrink-0 px-3 pb-4 pt-1">
          <div
            className={`relative overflow-hidden rounded-2xl border border-white/[0.09] bg-[#1d4033] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] ${
              collapsed ? 'lg:hidden' : ''
            }`}
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-[#a3c489]/20 blur-2xl"
            />
            <div className="relative">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#c3d6ba]">
                  <Icon name="sparkles" size={12} />
                  Sift AI
                </span>
                <span className="flex items-center gap-1.5 text-[8.5px] font-medium uppercase tracking-[0.12em] text-[#a9c0aa]">
                  <span className="h-1 w-1 animate-pulse rounded-full bg-[#b6d9a4]" />
                  Live
                </span>
              </div>
              <p className="mt-3 font-display text-[20px] leading-[1.15] text-[#f4f6eb]">
                Your inbox is in focus.
              </p>
              <p className="mt-1.5 text-[11px] leading-[1.55] text-[#aac0b1]">
                {priorityCount > 0
                  ? `${priorityCount} ${priorityCount === 1 ? 'conversation needs' : 'conversations need'} you today. The rest can wait.`
                  : 'Nothing needs you right now. The rest can wait.'}
              </p>
              <button
                type="button"
                onClick={onReviewPriorities}
                className="mt-3 flex w-full items-center justify-between rounded-lg bg-[#dce8cb] px-3 py-2 text-[11px] font-semibold text-[#1c3b2d] transition hover:bg-[#e8f0da]"
              >
                Review priorities
                <Icon name="arrowRight" size={13} strokeWidth={2} />
              </button>
            </div>
          </div>
          {collapsed ? (
            <button
              type="button"
              onClick={onReviewPriorities}
              title="Review priorities"
              aria-label="Review priorities"
              className="hidden h-11 w-full items-center justify-center rounded-xl border border-white/10 bg-[#1d4033] text-[#dce8cb] transition hover:bg-[#24513f] hover:text-[#f2f6ec] lg:flex"
            >
              <Icon name="sparkles" size={17} />
            </button>
          ) : null}
          <p
            className={`mt-3 px-2 text-[9px] tracking-[0.04em] text-[#6f8a7a] ${
              collapsed ? 'lg:hidden' : ''
            }`}
          >
            Sift demo · AI sorting on · v0.1
          </p>
        </div>
      </div>
    </aside>
  );
}
