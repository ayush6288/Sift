import { useEffect, useRef, useState } from 'react';
import Avatar from './Avatar';
import Icon from './Icons';
import Tag from './Tag';
import { CURRENT_USER, FOLDERS } from '../data/mockEmails';
import { formatFullTimestamp } from '../utils/format';

function buildReplyDraft(email) {
  const firstName = email.sender.name.split(' ')[0];
  const fallback = {
    action:
      'Thanks for the note — I’ve reviewed everything and I’m aligned on next steps. I’ll take care of this and follow up here once it’s done.',
    receipts:
      'Thanks — received and filed for our records. I’ll let you know if anything needs adjusting on our side.',
    newsletters:
      'Thanks for sharing this — saving it for a proper read later this week.',
    archive: 'Thanks for this — noted.',
  };

  return `Hi ${firstName},\n\n${
    fallback[email.folder] ?? fallback.action
  }\n\nBest,\nAlex`;
}

function EmptyPane() {
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-[#fcfbf7] px-8 py-16 text-center">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_32%,rgba(226,236,212,0.55),transparent_46%)]"
      />
      <div className="relative">
        <div className="relative mx-auto h-[122px] w-[170px]">
          <div className="absolute inset-x-6 top-3 h-[82px] rotate-[-7deg] rounded-2xl border border-[#e3e2d7] bg-white/55" />
          <div className="absolute inset-x-4 top-6 h-[98px] rotate-[4deg] rounded-2xl border border-[#dcded1] bg-[#fbfaf4] shadow-sm" />
          <div className="absolute inset-x-1 top-1 h-[100px] overflow-hidden rounded-2xl border border-[#dfe1d5] bg-white text-left shadow-[0_18px_35px_-24px_rgba(35,56,44,0.45)]">
            <div className="flex items-center gap-1.5 border-b border-[#eeeee7] px-3 py-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#c9cec2]" />
              <span className="h-1.5 w-1.5 rounded-full bg-[#d7dbd0]" />
              <span className="h-1.5 w-1.5 rounded-full bg-[#e2e5dc]" />
              <span className="ml-auto flex items-center gap-1 text-[7px] font-semibold uppercase tracking-[0.1em] text-[#7a9180]">
                <Icon name="sparkles" size={7} />
                Sift
              </span>
            </div>
            <div className="space-y-2 px-3 py-3">
              <div className="flex gap-1.5">
                <span className="h-4 w-4 rounded-full bg-[#e3ecd7]" />
                <span className="mt-1 h-1.5 w-14 rounded-full bg-[#e6e5dc]" />
              </div>
              <div className="h-1.5 w-[85%] rounded-full bg-[#e9e8df]" />
              <div className="h-1.5 w-[67%] rounded-full bg-[#efeee7]" />
              <div className="h-1.5 w-[76%] rounded-full bg-[#f1f0e9]" />
            </div>
          </div>
          <span className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full bg-[#1d4b3b] text-[#edf3e4] ring-4 ring-[#fcfbf7]">
            <Icon name="sparkles" size={15} />
          </span>
        </div>

        <p className="mt-7 text-[9px] font-semibold uppercase tracking-[0.2em] text-[#7f9788]">
          Reading pane
        </p>
        <h2 className="mt-2 font-display text-[33px] leading-[1.1] tracking-[-0.015em] text-ink">
          A calmer inbox awaits.
        </h2>
        <p className="mx-auto mt-2.5 max-w-[320px] text-[12px] leading-relaxed text-[#7d887f]">
          Choose a conversation from the left. Sift has already labelled the
          urgency and pulled out what matters.
        </p>
      </div>
    </div>
  );
}

export default function EmailDetail({
  email,
  hiddenOnMobile,
  onBack,
  onToggleStar,
  onArchive,
  onRestore,
  onToggleHandled,
  onMove,
  onSendReply,
  onNotify,
}) {
  const [moveOpen, setMoveOpen] = useState(false);
  const [draftOpen, setDraftOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const moveRef = useRef(null);
  const copyTimerRef = useRef(null);
  const draftTimerRef = useRef(null);

  const folder = email
    ? FOLDERS.find((item) => item.id === email.folder) ?? FOLDERS[0]
    : FOLDERS[0];
  const isArchived = email?.folder === 'archive';

  const closeDraft = () => {
    if (draftTimerRef.current) window.clearTimeout(draftTimerRef.current);
    setDraftOpen(false);
    setGenerating(false);
  };

  useEffect(() => {
    if (!moveOpen) return undefined;

    const handlePointerDown = (event) => {
      if (moveRef.current && !moveRef.current.contains(event.target)) {
        setMoveOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [moveOpen]);

  useEffect(() => {
    if (!draftOpen && !moveOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (draftTimerRef.current) window.clearTimeout(draftTimerRef.current);
        setDraftOpen(false);
        setGenerating(false);
        setMoveOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [draftOpen, moveOpen]);

  useEffect(
    () => () => {
      if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
      if (draftTimerRef.current) window.clearTimeout(draftTimerRef.current);
    },
    [],
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard?.writeText(draft);
    } catch {
      // Clipboard access can be blocked in previews; the draft stays selectable.
    }
    setCopied(true);
    copyTimerRef.current = window.setTimeout(() => setCopied(false), 2000);
  };

  if (!email) {
    return (
      <section
        aria-label="Reading pane"
        className={`min-h-0 min-w-0 flex-1 flex-col ${
          hiddenOnMobile ? 'hidden lg:flex' : 'flex'
        }`}
      >
        <EmptyPane />
      </section>
    );
  }

  const moveTargets = FOLDERS.filter(
    (item) => item.id !== 'all' && item.id !== email.folder,
  );

  const openDraft = () => {
    if (draftTimerRef.current) window.clearTimeout(draftTimerRef.current);
    setDraft('');
    setCopied(false);
    setGenerating(true);
    setDraftOpen(true);

    draftTimerRef.current = window.setTimeout(() => {
      setDraft(email.replyDraft ?? buildReplyDraft(email));
      setGenerating(false);
    }, 650);
  };

  return (
    <section
      aria-label="Reading pane"
      className={`min-h-0 min-w-0 flex-1 flex-col bg-[#fdfcf9] ${
        hiddenOnMobile ? 'hidden lg:flex' : 'flex'
      }`}
    >
      <div className="flex h-[54px] shrink-0 items-center gap-2 border-b border-line/80 px-3 sm:px-5">
        <button
          type="button"
          onClick={onBack}
          className="-ml-1 flex h-9 items-center gap-1.5 rounded-lg px-2 text-[11.5px] font-medium text-[#5f6c63] transition hover:bg-white hover:text-ink lg:hidden"
        >
          <Icon name="arrowLeft" size={15} />
          Back
        </button>
        <div className="hidden min-w-0 items-center gap-1.5 text-[10px] text-[#98a096] sm:flex">
          <Icon name="sparkles" size={12} className="text-[#7f9c87]" />
          <span>Sift view</span>
          <span className="text-[#c3c8c0]">/</span>
          <span className="truncate text-[#7d877e]">{folder.label}</span>
        </div>
        <span className="truncate text-[10px] font-medium uppercase tracking-[0.1em] text-[#9aa299] sm:hidden">
          {folder.shortLabel}
        </span>

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => onToggleStar(email)}
            aria-pressed={email.starred}
            title={email.starred ? 'Remove star' : 'Star conversation'}
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
              email.starred
                ? 'bg-[#faf2dc] text-[#b28b37]'
                : 'text-[#7f8a81] hover:bg-white hover:text-ink'
            }`}
          >
            <Icon
              name="star"
              size={15}
              fill={email.starred ? 'currentColor' : 'none'}
            />
          </button>
          <button
            type="button"
            onClick={() => (isArchived ? onRestore(email) : onArchive(email))}
            title={isArchived ? 'Move out of archive' : 'Archive conversation'}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#7f8a81] transition hover:bg-white hover:text-ink"
          >
            <Icon name={isArchived ? 'inbox' : 'archive'} size={16} />
          </button>
        </div>
      </div>

      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto">
        <article
          key={email.id}
          className="animate-detail-in mx-auto w-full max-w-[780px] px-5 pb-16 pt-6 sm:px-8 sm:pt-8 lg:px-10"
        >
          <div className="flex flex-wrap items-center gap-1.5">
            {email.tags.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
            {email.handled ? (
              <span className="inline-flex items-center gap-1 rounded-[5px] bg-[#e8f0e2] px-1.5 py-[3px] text-[9.5px] font-semibold uppercase leading-none tracking-[0.07em] text-[#45634e] ring-1 ring-inset ring-[#d3e3cd]">
                <Icon name="checkCircle" size={9} strokeWidth={2} />
                Handled
              </span>
            ) : null}
            <span className="ml-auto hidden items-center gap-1 text-[9.5px] text-[#9aa299] sm:flex">
              <Icon name="clock" size={10} />
              {formatFullTimestamp(email.receivedAt)}
            </span>
          </div>

          <h1 className="mt-4 text-balance font-display text-[32px] leading-[1.08] tracking-[-0.015em] text-[#1d2b24] sm:text-[38px]">
            {email.subject}
          </h1>

          <div className="mt-5 flex items-start gap-3 border-y border-line/80 py-4">
            <Avatar
              name={email.sender.name}
              tone={email.sender.tone}
              size="lg"
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="text-[12.5px] font-semibold text-ink">
                  {email.sender.name}
                </span>
                <span className="truncate text-[10.5px] text-[#889289]">
                  {email.sender.email}
                </span>
              </div>
              <p className="mt-1 text-[10px] text-[#9ca39b]">
                to Alex Morgan
                <span className="sm:hidden">
                  {' '}
                  · {formatFullTimestamp(email.receivedAt)}
                </span>
                <span className="hidden sm:inline"> · sorted by Sift AI</span>
              </p>
            </div>
          </div>

          <section
            aria-label="AI summary"
            className="relative mt-6 overflow-hidden rounded-2xl border border-[#dbe5d2] bg-[linear-gradient(140deg,#f0f5e9_0%,#f8f5ea_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] sm:p-5"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-8 -top-12 h-32 w-32 rounded-full bg-[#cbdcb8]/35 blur-2xl"
            />
            <div className="relative">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1d4b3b] text-[#edf3e3] shadow-sm">
                  <Icon name="sparkles" size={14} />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#35553f]">
                      AI Summary
                    </h2>
                    <span className="rounded-full border border-[#dfe6d4] bg-white/70 px-1.5 py-0.5 text-[8px] font-medium uppercase tracking-[0.08em] text-[#75816d]">
                      2-sec read
                    </span>
                  </div>
                  <p className="mt-0.5 text-[9.5px] text-[#7a8672]">
                    Written by Sift AI · reviewed for accuracy
                  </p>
                </div>
                <span className="ml-auto hidden shrink-0 items-center gap-1 text-[9px] font-medium text-[#71816a] sm:flex">
                  <span className="h-1 w-1 rounded-full bg-[#6f9a67]" />
                  96% confidence
                </span>
              </div>

              <ul className="mt-3.5 space-y-2">
                {email.summary.map((point) => (
                  <li
                    key={point}
                    className="flex gap-2.5 text-[12px] leading-[1.65] text-[#3c4a3f]"
                  >
                    <span className="mt-[8px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#6c9568]" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-[#e6e1ce] bg-white/65 px-3 py-2.5">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#f5ead0] text-[#987226]">
                  <Icon name="flag" size={11} strokeWidth={2} />
                </span>
                <div className="min-w-0">
                  <p className="text-[8.5px] font-semibold uppercase tracking-[0.15em] text-[#8d8870]">
                    Detected action
                  </p>
                  <p className="mt-0.5 text-[11.5px] font-medium leading-snug text-[#464c3f]">
                    {email.actionItem}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onToggleHandled(email)}
              title={email.handled ? 'Click to reopen this task' : undefined}
              className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-[11px] font-medium shadow-sm transition ${
                email.handled
                  ? 'bg-[#e8f0e2] text-[#365e45] ring-1 ring-inset ring-[#d0e1ca] hover:bg-[#eef4e9]'
                  : 'bg-[#1d4b3b] text-[#f2f6ec] hover:bg-[#285e4b]'
              }`}
            >
              <Icon
                name={email.handled ? 'checkCircle' : 'check'}
                size={13}
                strokeWidth={2}
              />
              {email.handled ? 'Handled' : 'Mark handled'}
            </button>

            <div ref={moveRef} className="relative">
              <button
                type="button"
                onClick={() => setMoveOpen((current) => !current)}
                aria-haspopup="menu"
                aria-expanded={moveOpen}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#daddd2] bg-white px-3 text-[11px] font-medium text-[#526056] shadow-sm transition hover:border-[#c7cdc1] hover:text-ink"
              >
                <Icon name="folder" size={13} />
                Move to folder
                <Icon
                  name="chevronDown"
                  size={11}
                  className={`text-[#9ca49a] transition ${
                    moveOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {moveOpen ? (
                <div
                  role="menu"
                  aria-label="Move conversation to folder"
                  className="animate-fade-slide absolute left-0 top-[calc(100%+6px)] z-30 w-[252px] max-w-[calc(100vw-2.5rem)] rounded-xl border border-line bg-[#fcfbf8] p-1.5 shadow-[0_18px_45px_-18px_rgba(32,49,40,0.4)]"
                >
                  <p className="px-2 pb-1.5 pt-1 text-[8.5px] font-semibold uppercase tracking-[0.14em] text-[#9aa198]">
                    Move conversation to
                  </p>
                  {moveTargets.map((target) => (
                    <button
                      key={target.id}
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        onMove(email, target.id);
                        setMoveOpen(false);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-[11.5px] font-medium text-[#4c594f] transition hover:bg-[#f0f2e9] hover:text-ink"
                    >
                      <Icon
                        name={target.icon}
                        size={14}
                        className="text-[#7f9084]"
                      />
                      <span className="flex-1 truncate">{target.label}</span>
                      <Icon
                        name="arrowRight"
                        size={11}
                        className="text-[#b0b6ae]"
                      />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <button
              type="button"
              onClick={openDraft}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#d4dfca] bg-[#f7faf2] px-3 text-[11px] font-medium text-[#31553f] shadow-sm transition hover:border-[#bfcfb5] hover:bg-[#f0f6e9]"
            >
              <Icon name="sparkles" size={13} />
              Draft AI reply
            </button>
          </div>

          <div className="mt-7 space-y-4 text-[13px] leading-[1.8] text-[#3e4a42]">
            {email.body.map((paragraph) => (
              <p key={paragraph} className="whitespace-pre-line">
                {paragraph}
              </p>
            ))}
          </div>

          {email.attachments?.length ? (
            <div className="mt-7">
              <p className="text-[8.5px] font-semibold uppercase tracking-[0.15em] text-[#9ba29a]">
                {email.attachments.length}{' '}
                {email.attachments.length === 1 ? 'attachment' : 'attachments'}
              </p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {email.attachments.map((attachment) => (
                  <button
                    key={attachment.name}
                    type="button"
                    onClick={() =>
                      onNotify('Attachment previews are mocked in this demo.')
                    }
                    className="group flex items-center gap-3 rounded-xl border border-line/90 bg-[#fbfaf6] p-2.5 text-left transition hover:border-[#cfd8c8] hover:bg-white"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f1ece0] text-[#806f4c]">
                      <Icon name="fileText" size={16} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[10.5px] font-medium text-[#49554c]">
                        {attachment.name}
                      </span>
                      <span className="mt-0.5 block text-[9px] text-[#9aa299]">
                        {attachment.size}
                      </span>
                    </span>
                    <Icon
                      name="download"
                      size={14}
                      className="text-[#a6ada5] transition group-hover:text-[#41664f]"
                    />
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-8 flex items-center gap-2 rounded-xl border border-line/90 bg-[#fbfaf5] p-2">
            <button
              type="button"
              onClick={openDraft}
              className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-1 py-1 text-left"
            >
              <Avatar
                name={CURRENT_USER.name}
                tone={CURRENT_USER.tone}
                size="sm"
              />
              <span className="truncate text-[11px] text-[#949d94]">
                Reply to {email.sender.name.split(' ')[0]}…
              </span>
            </button>
            <button
              type="button"
              onClick={openDraft}
              className="flex shrink-0 items-center gap-1 rounded-lg border border-[#dbe4d2] bg-white px-2 py-1.5 text-[9.5px] font-semibold uppercase tracking-[0.06em] text-[#45644f] shadow-sm transition hover:bg-[#f4f8ef]"
            >
              <Icon name="sparkles" size={11} />
              Draft
            </button>
          </div>
        </article>
      </div>

      {draftOpen ? (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-[#10241b]/35 sm:items-center sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeDraft();
          }}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 backdrop-blur-[2px]"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="draft-title"
            className="animate-modal-in scroll-thin relative max-h-[92dvh] w-full max-w-[520px] overflow-y-auto rounded-t-[24px] border border-line bg-[#fcfbf7] shadow-[0_30px_80px_-25px_rgba(22,40,31,0.5)] sm:rounded-3xl"
          >
            <div className="flex items-center gap-3 border-b border-line px-5 py-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#1d4b3b] text-[#edf3e4] shadow-sm">
                <Icon name="sparkles" size={16} />
              </span>
              <div className="min-w-0">
                <h2
                  id="draft-title"
                  className="text-[12.5px] font-semibold text-ink"
                >
                  Draft AI reply
                </h2>
                <p className="mt-0.5 truncate text-[10px] text-[#8d968d]">
                  To {email.sender.name} · Sift writes, you decide
                </p>
              </div>
              <button
                type="button"
                onClick={closeDraft}
                aria-label="Close draft"
                className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#8c968c] transition hover:bg-paper hover:text-ink"
              >
                <Icon name="x" size={16} />
              </button>
            </div>

            <div className="px-5 py-4">
              <div className="min-h-[230px]">
                {generating ? (
                  <div>
                    <p className="flex items-center gap-2 text-[11px] font-medium text-[#486351]">
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-[#dbe4d1] border-t-[#31583f]" />
                      Composing a thoughtful reply…
                    </p>
                    <div className="mt-4 space-y-2.5">
                      <div className="h-2.5 w-[78%] animate-pulse rounded-full bg-[#eceae1]" />
                      <div className="h-2.5 w-[92%] animate-pulse rounded-full bg-[#eeede5]" />
                      <div className="h-2.5 w-[68%] animate-pulse rounded-full bg-[#f0efe8]" />
                      <div className="mt-4 h-2.5 w-[45%] animate-pulse rounded-full bg-[#eeede5]" />
                      <div className="h-2.5 w-[82%] animate-pulse rounded-full bg-[#f0efe8]" />
                    </div>
                  </div>
                ) : (
                  <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    rows={11}
                    autoFocus
                    aria-label="AI drafted reply"
                    className="w-full resize-none rounded-xl border border-[#dfded4] bg-white p-3.5 text-[12px] leading-[1.75] text-[#3d4a41] shadow-[inset_0_1px_2px_rgba(30,45,35,0.03)] outline-none transition focus:border-[#b8c9b1] focus:ring-4 focus:ring-[#dbe7cd]/45"
                  />
                )}
              </div>
              <p className="mt-2 flex items-center gap-1.5 text-[9px] text-[#9ba29a]">
                <Icon name="sparkles" size={10} />
                AI-generated from this thread. Review before sending.
              </p>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-line px-5 py-4 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={handleCopy}
                disabled={generating}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#dbded3] bg-white px-3 text-[11px] font-medium text-[#58655b] shadow-sm transition hover:border-[#c8cfc1] hover:text-ink disabled:opacity-50"
              >
                <Icon name={copied ? 'check' : 'copy'} size={13} />
                {copied ? 'Copied' : 'Copy draft'}
              </button>
              <button
                type="button"
                onClick={() => {
                  onSendReply(email);
                  closeDraft();
                }}
                disabled={generating || !draft.trim()}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#1d4b3b] px-4 text-[11px] font-medium text-[#f2f6ec] shadow-sm transition hover:bg-[#285e4b] disabled:cursor-not-allowed disabled:opacity-50 sm:ml-auto"
              >
                <Icon name="send" size={13} />
                Send reply
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
