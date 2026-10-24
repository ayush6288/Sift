import { useEffect, useRef, useState } from 'react';
import Icon from './Icons';

export default function WebhookPopover({ userId }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const rootRef = useRef(null);
  const timerRef = useRef(null);

  const webhookUrl = `${window.location.origin}/api/sift?user_id=${userId}`;

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  useEffect(
    () => () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    },
    [],
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setCopied(true);
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be blocked by the browser. The URL remains visible.
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="dialog"
        aria-expanded={open}
        title="Inbound webhook setup"
        className="flex h-10 items-center gap-2 rounded-xl border border-line bg-raised px-3 text-[11px] font-medium text-soft-ink shadow-sm transition hover:border-line-strong hover:text-ink"
      >
        <Icon name="settings" size={15} />
        <span className="hidden xl:inline">Webhook</span>
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Inbound webhook setup"
          className="animate-menu-in fixed left-4 right-4 top-[74px] z-50 origin-top-right rounded-2xl border border-line bg-menu p-4 shadow-[0_22px_60px_-18px_rgba(10,28,19,0.35)] sm:absolute sm:left-auto sm:right-0 sm:top-[calc(100%+9px)] sm:w-[390px]"
        >
          <div className="flex items-start gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-forest-soft text-accent-text ring-1 ring-inset ring-accent-line">
              <Icon name="settings" size={15} />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-[12.5px] font-semibold text-ink">
                Inbound webhook setup
              </h3>
              <p className="mt-0.5 text-[10px] leading-relaxed text-muted">
                Point Gmail auto-forwarding, Postmark, CloudMailin, or SendGrid
                at this endpoint.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close webhook setup"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted transition hover:bg-hover hover:text-ink"
            >
              <Icon name="x" size={14} />
            </button>
          </div>

          <div className="mt-3 rounded-xl border border-line bg-field p-2.5">
            <p className="text-[8.5px] font-semibold uppercase tracking-[0.14em] text-faint">
              Your personal endpoint
            </p>
            <code className="mt-1.5 block break-all font-mono text-[9.5px] leading-relaxed text-body">
              {webhookUrl}
            </code>
            <button
              type="button"
              onClick={handleCopy}
              className="mt-2 flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border border-accent-line bg-accent-soft px-3 text-[10px] font-semibold text-accent-text transition hover:bg-forest-soft"
            >
              <Icon name={copied ? 'check' : 'copy'} size={12} />
              {copied ? 'Copied endpoint' : 'Copy endpoint'}
            </button>
          </div>

          <div className="mt-3 space-y-2 text-[10px] leading-relaxed text-muted">
            <p>
              Send a <span className="font-semibold text-body">POST</span> with
              standard inbound fields. Sift accepts Postmark
              <span className="font-mono text-[9px]"> From / Subject / TextBody</span>
              , CloudMailin
              <span className="font-mono text-[9px]"> from / subject / plain</span>
              , and SendGrid
              <span className="font-mono text-[9px]"> from / subject / text</span>
              .
            </p>
            <p className="rounded-lg border border-warning/25 bg-warning-soft px-2.5 py-2 text-[9.5px] text-body">
              Keep this URL private. Anyone who has it can add mail to your
              inbox.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
