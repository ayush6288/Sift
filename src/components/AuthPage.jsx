import { useState } from 'react';
import Icon from './Icons';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';

const FEATURES = [
  'AI sorting into action, receipts, newsletters, and archive',
  'Two-sentence summaries with the next step pulled out',
  'Private, per-user inbox protected by Supabase row-level security',
];

export default function AuthPage({ theme, onToggleTheme }) {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const isSignUp = mode === 'signup';

  const switchMode = () => {
    setMode((current) => (current === 'signin' ? 'signup' : 'signin'));
    setError('');
    setNotice('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading || !supabase) return;

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError('Enter your email address and password.');
      return;
    }
    if (isSignUp && password.length < 6) {
      setError('Choose a password with at least 6 characters.');
      return;
    }

    setLoading(true);
    setError('');
    setNotice('');

    try {
      const credentials = { email: cleanEmail, password };
      const { data, error: authError } = isSignUp
        ? await supabase.auth.signUp(credentials)
        : await supabase.auth.signInWithPassword(credentials);

      if (authError) {
        setError(authError.message);
        return;
      }

      if (isSignUp && !data.session) {
        setNotice(
          'Account created. Check your email to confirm your address, then sign in.',
        );
      }
    } catch (requestError) {
      setError(
        requestError?.message || 'Authentication failed. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-paper text-ink">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(116,156,121,0.2),transparent_38%),radial-gradient(circle_at_86%_92%,rgba(220,232,203,0.24),transparent_36%)]"
      />

      <header className="relative z-10 flex items-center justify-between px-5 py-5 sm:px-8">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-forest text-primary-ink shadow-sm">
            <Icon name="logo" size={19} strokeWidth={2.1} />
          </div>
          <div>
            <p className="font-display text-[25px] leading-none tracking-[-0.01em] text-ink">
              Sift
            </p>
            <p className="mt-1 text-[8px] font-semibold uppercase tracking-[0.2em] text-kicker">
              Inbox, sorted
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={
            theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
          }
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-raised/80 text-soft-ink shadow-sm transition hover:border-line-strong hover:text-ink"
        >
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={16} />
        </button>
      </header>

      <main className="relative z-10 mx-auto grid w-full max-w-6xl flex-1 items-center gap-12 px-5 py-8 sm:px-8 lg:grid-cols-[1.08fr_0.92fr] lg:py-14">
        <section className="hidden lg:block">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-kicker">
            AI email triage
          </p>
          <h1 className="mt-4 max-w-[560px] font-display text-[58px] leading-[0.98] tracking-[-0.03em] text-ink">
            The inbox that decides what deserves you.
          </h1>
          <p className="mt-6 max-w-[520px] text-[14px] leading-[1.8] text-muted">
            Sift reads every message, writes a two-sentence brief, and files it
            into the right folder. Your action items stay visible. Everything
            else waits quietly.
          </p>
          <ul className="mt-8 space-y-3">
            {FEATURES.map((feature) => (
              <li
                key={feature}
                className="flex items-start gap-3 text-[12.5px] leading-relaxed text-body"
              >
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-forest-soft text-accent-text ring-1 ring-inset ring-accent-line">
                  <Icon name="check" size={11} strokeWidth={2.4} />
                </span>
                {feature}
              </li>
            ))}
          </ul>
        </section>

        <section className="mx-auto w-full max-w-[430px]">
          <div className="rounded-[26px] border border-line bg-raised/95 p-6 shadow-[0_30px_80px_-38px_rgba(12,40,26,0.45)] backdrop-blur sm:p-8">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-forest-soft text-accent-text ring-1 ring-inset ring-accent-line">
                <Icon name="sparkles" size={17} />
              </span>
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-kicker">
                  {isSignUp ? 'New account' : 'Welcome back'}
                </p>
                <h2 className="mt-0.5 text-[20px] font-semibold tracking-[-0.01em] text-ink">
                  {isSignUp ? 'Create your Sift account' : 'Sign in to Sift'}
                </h2>
              </div>
            </div>

            {!isSupabaseConfigured || !supabase ? (
              <div
                role="alert"
                className="mt-6 rounded-xl border border-danger/30 bg-danger-soft px-3.5 py-3 text-[11.5px] leading-relaxed text-danger"
              >
                Authentication is not configured. Add
                {' '}
                <code className="font-semibold">VITE_SUPABASE_URL</code>
                {' '}and
                {' '}
                <code className="font-semibold">VITE_SUPABASE_ANON_KEY</code>
                {' '}to the build environment, then redeploy.
              </div>
            ) : (
              <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                <label className="block">
                  <span className="mb-1.5 block text-[9.5px] font-semibold uppercase tracking-[0.13em] text-kicker">
                    Email address
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    inputMode="email"
                    placeholder="you@company.com"
                    required
                    disabled={loading}
                    className="h-11 w-full rounded-xl border border-line bg-field px-3.5 text-[13px] text-ink outline-none transition placeholder:text-faint focus:border-accent-line focus:ring-4 focus:ring-accent/30 disabled:opacity-60"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-[9.5px] font-semibold uppercase tracking-[0.13em] text-kicker">
                    Password
                  </span>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      autoComplete={isSignUp ? 'new-password' : 'current-password'}
                      minLength={6}
                      placeholder={isSignUp ? 'At least 6 characters' : 'Your password'}
                      required
                      disabled={loading}
                      className="h-11 w-full rounded-xl border border-line bg-field px-3.5 pr-16 text-[13px] text-ink outline-none transition placeholder:text-faint focus:border-accent-line focus:ring-4 focus:ring-accent/30 disabled:opacity-60"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute right-2 top-1/2 h-7 -translate-y-1/2 rounded-md px-1.5 text-[9.5px] font-semibold uppercase tracking-[0.08em] text-faint transition hover:bg-hover hover:text-ink"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </label>

                {error ? (
                  <div
                    role="alert"
                    className="rounded-xl border border-danger/30 bg-danger-soft px-3.5 py-2.5 text-[11.5px] leading-relaxed text-danger"
                  >
                    {error}
                  </div>
                ) : null}

                {notice ? (
                  <div
                    role="status"
                    className="rounded-xl border border-accent-line bg-forest-soft px-3.5 py-2.5 text-[11.5px] leading-relaxed text-accent-text"
                  >
                    {notice}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-forest px-4 text-[12px] font-semibold text-primary-ink shadow-sm transition hover:bg-forest-hover disabled:cursor-wait disabled:opacity-75"
                >
                  {loading ? (
                    <>
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-ink/30 border-t-primary-ink" />
                      {isSignUp ? 'Creating account…' : 'Signing in…'}
                    </>
                  ) : isSignUp ? (
                    'Create account'
                  ) : (
                    'Sign in'
                  )}
                </button>
              </form>
            )}

            <p className="mt-5 text-center text-[11px] text-muted">
              {isSignUp ? 'Already have an account?' : 'New to Sift?'}
              {' '}
              <button
                type="button"
                onClick={switchMode}
                className="font-semibold text-accent-text underline decoration-accent-line underline-offset-2 transition hover:text-ink"
              >
                {isSignUp ? 'Sign in' : 'Create an account'}
              </button>
            </p>
          </div>

          <p className="mt-4 text-center text-[9.5px] leading-relaxed text-faint">
            Your mailbox is scoped to your account. Sift never exposes another
            user's email.
          </p>
        </section>
      </main>
    </div>
  );
}
