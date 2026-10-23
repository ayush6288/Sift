const TONES = {
  sage: 'bg-[#e3ecd7] text-[#34573f] dark:bg-[#253c2c] dark:text-[#cfe3b7]',
  clay: 'bg-[#f5e3d8] text-[#8a4a33] dark:bg-[#3b2921] dark:text-[#edbca7]',
  sand: 'bg-[#f2ead4] text-[#79642c] dark:bg-[#352f1f] dark:text-[#e2cf9d]',
  sky: 'bg-[#dcebed] text-[#356169] dark:bg-[#1e3339] dark:text-[#a9d4de]',
  lilac: 'bg-[#e9e3f2] text-[#5d4b7b] dark:bg-[#2e273c] dark:text-[#cfbce9]',
  rose: 'bg-[#f5e0e3] text-[#874250] dark:bg-[#3a252a] dark:text-[#efbcc5]',
  slate: 'bg-[#e5e8e4] text-[#4a554f] dark:bg-[#272f28] dark:text-[#c4d1c7]',
};

const SIZES = {
  sm: 'h-8 w-8 text-[10px]',
  md: 'h-10 w-10 text-[11px]',
  lg: 'h-11 w-11 text-xs',
};

function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export default function Avatar({
  name,
  initials,
  tone = 'sage',
  size = 'md',
  className = '',
}) {
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold tracking-[0.02em] ring-1 ring-inset ring-black/[0.035] dark:ring-white/10 ${
        TONES[tone] ?? TONES.sage
      } ${SIZES[size] ?? SIZES.md} ${className}`}
    >
      {initials ?? getInitials(name)}
    </span>
  );
}
