import Icon from './Icons';

export default function Toast({ toast, onDismiss, onUndo }) {
  if (!toast) return null;

  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-4 z-[90] flex justify-center sm:inset-x-auto sm:bottom-6 sm:right-6">
      <div
        key={toast.id}
        role="status"
        className="animate-toast-in pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl bg-[#17362b] px-3.5 py-3 text-[#eef3e9] shadow-[0_18px_50px_-12px_rgba(18,38,29,0.55)] ring-1 ring-white/10"
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#dce8cb] text-[#214533]">
          <Icon name="check" size={14} strokeWidth={2.2} />
        </span>
        <p className="min-w-0 flex-1 text-[12.5px] font-medium leading-snug">
          {toast.message}
        </p>
        {toast.undo ? (
          <button
            type="button"
            onClick={onUndo}
            className="shrink-0 rounded-md px-1.5 py-1 text-[12px] font-semibold text-[#dce8cb] underline decoration-[#dce8cb]/40 underline-offset-2 transition hover:text-white hover:decoration-white/60"
          >
            Undo
          </button>
        ) : null}
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss notification"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[#9fb3a6] transition hover:bg-white/10 hover:text-white"
        >
          <Icon name="x" size={14} />
        </button>
      </div>
    </div>
  );
}
