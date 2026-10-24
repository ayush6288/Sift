import { useEffect, useRef, useState } from 'react';
import Icon from './Icons';
import { API_BASE_URL, siftEmail } from '../lib/emailService';

const EMPTY_FORM = { sender: '', subject: '', body: '' };

const SAMPLE_EMAIL = {
  sender: 'Maya Chen <maya.chen@northwind.studio>',
  subject: 'Invoice INV-2214 is ready for review',
  body: `Hi Alex,

Our finance team has finalized invoice INV-2214 for the October design retainer. The total is $4,800.00 and payment is due on November 5.

Please review the attached invoice and let me know if anything needs adjusting before we submit it for payment.

Thanks,
Maya`,
};

export default function SimulateEmailModal({
  open,
  onClose,
  onCreated,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const senderRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const focusTimer = window.setTimeout(() => senderRef.current?.focus(), 60);
    return () => window.clearTimeout(focusTimer);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !submitting) onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose, submitting]);

  if (!open) return null;

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;

    if (!form.sender.trim() || !form.subject.trim() || !form.body.trim()) {
      setError('Sender, subject, and email body are all required.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const row = await siftEmail({
        sender: form.sender.trim(),
        subject: form.subject.trim(),
        body: form.body.trim(),
      });

      onCreated(row);
      onClose();
    } catch (requestError) {
      setError(requestError.message || 'Sift could not process this email.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-[#10241b]/50 sm:items-center sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !submitting) onClose();
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 backdrop-blur-[3px]"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="simulate-email-title"
        aria-describedby="simulate-email-description"
        className="animate-modal-in relative max-h-[94dvh] w-full max-w-[590px] overflow-y-auto rounded-t-[26px] border border-line bg-menu shadow-[0_35px_90px_-28px_rgba(4,18,11,0.62)] sm:rounded-3xl"
      >
        <div className="flex items-start gap-3 border-b border-line px-5 py-4 sm:px-6">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-forest text-primary-ink shadow-sm">
            <Icon name="sparkles" size={18} />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2
                id="simulate-email-title"
                className="font-display text-[24px] leading-none tracking-[-0.01em] text-ink"
              >
                Simulate incoming email
              </h2>
              <span className="rounded-full border border-accent-line bg-accent-soft px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-[0.1em] text-accent-text">
                AI triage
              </span>
            </div>
            <p
              id="simulate-email-description"
              className="mt-1.5 text-[11px] leading-relaxed text-muted"
            >
              Gemini will classify the message, summarize it, and save it to
              Supabase.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close simulate email dialog"
            className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition hover:bg-hover hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} aria-busy={submitting}>
          <div className="space-y-4 px-5 py-5 sm:px-6">
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-soft px-3 py-2.5">
              <p className="min-w-0 flex-1 text-[10.5px] leading-relaxed text-muted">
                Want to test the flow quickly? Drop in a realistic message.
              </p>
              <button
                type="button"
                onClick={() => {
                  setForm(SAMPLE_EMAIL);
                  setError('');
                }}
                disabled={submitting}
                className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-lg border border-accent-line bg-raised px-2.5 text-[10px] font-semibold text-accent-text shadow-sm transition hover:bg-accent-soft disabled:opacity-50"
              >
                <Icon name="sparkles" size={10} />
                Fill sample email
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-[9.5px] font-semibold uppercase tracking-[0.13em] text-kicker">
                  Sender
                </span>
                <input
                  ref={senderRef}
                  type="text"
                  value={form.sender}
                  onChange={(event) =>
                    updateField('sender', event.target.value)
                  }
                  maxLength={500}
                  autoComplete="off"
                  placeholder="Maya Chen <maya@company.com>"
                  disabled={submitting}
                  className="h-10 w-full rounded-xl border border-line bg-field px-3 text-[12px] text-ink shadow-[inset_0_1px_2px_rgba(30,45,35,0.03)] outline-none transition placeholder:text-faint focus:border-accent-line focus:ring-4 focus:ring-accent/30 disabled:opacity-60 dark:shadow-none"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[9.5px] font-semibold uppercase tracking-[0.13em] text-kicker">
                  Subject
                </span>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(event) =>
                    updateField('subject', event.target.value)
                  }
                  maxLength={1000}
                  autoComplete="off"
                  placeholder="Invoice ready for review"
                  disabled={submitting}
                  className="h-10 w-full rounded-xl border border-line bg-field px-3 text-[12px] text-ink shadow-[inset_0_1px_2px_rgba(30,45,35,0.03)] outline-none transition placeholder:text-faint focus:border-accent-line focus:ring-4 focus:ring-accent/30 disabled:opacity-60 dark:shadow-none"
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-[9.5px] font-semibold uppercase tracking-[0.13em] text-kicker">
                Email body
              </span>
              <textarea
                value={form.body}
                onChange={(event) => updateField('body', event.target.value)}
                rows={7}
                maxLength={50000}
                placeholder="Paste the email content here…"
                disabled={submitting}
                className="w-full resize-none rounded-xl border border-line bg-field p-3.5 text-[12px] leading-[1.7] text-body shadow-[inset_0_1px_2px_rgba(30,45,35,0.03)] outline-none transition placeholder:text-faint focus:border-accent-line focus:ring-4 focus:ring-accent/30 disabled:opacity-60 dark:shadow-none"
              />
            </label>

            {error ? (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-danger/30 bg-danger-soft px-3 py-2.5 text-[11px] leading-relaxed text-danger"
              >
                <Icon name="flag" size={13} className="mt-0.5" />
                <span>{error}</span>
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-2.5 border-t border-line px-5 py-4 sm:flex-row sm:items-center sm:px-6">
            <p className="flex min-w-0 items-center gap-1.5 text-[9px] text-faint">
              <Icon name="sparkles" size={10} className="text-kicker" />
              <span className="truncate">
                FastAPI · Gemini · Supabase
              </span>
              <span className="hidden text-faint/60 xl:inline">·</span>
              <span className="hidden truncate xl:inline">{API_BASE_URL}</span>
            </p>

            <div className="flex items-center gap-2 sm:ml-auto">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="h-9 flex-1 rounded-lg border border-line bg-raised px-3 text-[11px] font-medium text-soft-ink shadow-sm transition hover:border-line-strong hover:text-ink disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-forest px-4 text-[11px] font-medium text-primary-ink shadow-sm transition hover:bg-forest-hover disabled:cursor-wait disabled:opacity-80 sm:flex-none"
              >
                {submitting ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-ink/30 border-t-primary-ink" />
                    AI is sifting email...
                  </>
                ) : (
                  <>
                    <Icon name="plus" size={13} strokeWidth={2.2} />
                    Sift this email
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
