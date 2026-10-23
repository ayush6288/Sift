const TONES = {
  sage: 'bg-[#e3ecd7] text-[#34573f]',
  clay: 'bg-[#f5e3d8] text-[#8a4a33]',
  sand: 'bg-[#f2ead4] text-[#79642c]',
  sky: 'bg-[#dcebed] text-[#356169]',
  lilac: 'bg-[#e9e3f2] text-[#5d4b7b]',
  rose: 'bg-[#f5e0e3] text-[#874250]',
  slate: 'bg-[#e5e8e4] text-[#4a554f]',
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
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold tracking-[0.02em] ring-1 ring-inset ring-black/[0.035] ${
        TONES[tone] ?? TONES.sage
      } ${SIZES[size] ?? SIZES.md} ${className}`}
    >
      {initials ?? getInitials(name)}
    </span>
  );
}
