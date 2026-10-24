import { useEffect, useRef, useState } from 'react';
import Icon from './Icons';
import { fetchWebhookConfig } from '../lib/emailService';

export default function WebhookPopover() {
  const [open, setOpen] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [tokenError, setTokenError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [copied, setCopied] = useState(false);
  const rootRef = useRef(null);
  const timerRef = useRef(null);
  const tokenLoading = open && !webhookUrl && !tokenError;

  useEffect(() => {
    if (!open || webhookUrl) return undefined;

    let active = true;

    fetchWebhookConfig()
      .then((config) => {
        if (active) setWebhookUrl(config.url);
      })
      .catch((error) => {
        if (active) {
          setTokenError(
            error?.message || 'The secure webhook endpoint is unavailable.',
          );
        }
      });

    return () => {
      active = false;
    };
  }, [attempt, open, webhookUrl]);

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
    if (!webhookUrl) return;
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setCopied(true);
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be blocked by the browser. The URL remains visible.
    }
  };

  const toggleOpen = () => {
    if (!open) setTokenError('');
    setOpen((current) => !current);
  };

  const retryToken = () => {
    setWebhookUrl('');
    setTokenError('');
    setAttempt((current) => current + 1);
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={toggleOpen}
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
            <div aria-live="polite">
              {tokenLoading ? (
                <p className="mt-1.5 flex items-center gap-2 font-mono text-[9.5px] text-muted">
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-line-strong border-t-accent-text" />
                  Generating secure endpoint…
                </p>
              ) : webhookUrl ? (
                <code className="mt-1.5 block break-all font-mono text-[9.5px] leading-relaxed text-body">
                  {webhookUrl}
                </code>
              ) : (
                <div className="mt-1.5 space-y-2">
                  <p className="text-[9.5px] leading-relaxed text-danger">
                    {tokenError || 'The secure webhook endpoint is unavailable.'}
                  </p>
                  <button
                    type="button"
                    onClick={retryToken}
                    className="text-[9.5px] font-semibold text-accent-text underline decoration-accent-line underline-offset-2 transition hover:text-ink"
                  >
                    Try again
                  </button>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={handleCopy}
              disabled={!webhookUrl || tokenLoading}
              className="mt-2 flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border border-accent-line bg-accent-soft px-3 text-[10px] font-semibold text-accent-text transition hover:bg-forest-soft disabled:cursor-not-allowed disabled:opacity-50"
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
              Treat this URL like a password. It contains a secret token that
              authorizes anyone who has it to add mail to your inbox. If it is
              exposed, create a new endpoint by rotating the server secret.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
