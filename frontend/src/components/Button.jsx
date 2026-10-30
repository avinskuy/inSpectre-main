const VARIANTS = {
  primary:
    'bg-[#f5b96b] text-[#0b1220] hover:bg-[#ffd08d] focus-visible:ring-[#f5b96b]',
  danger:
    'bg-red-600 text-white hover:bg-red-500 focus-visible:ring-red-600',
  outline:
    'border border-white/15 bg-transparent text-slate-200 hover:border-[#62dcd5]/50 hover:bg-white/5 hover:text-[#62dcd5] focus-visible:ring-[#62dcd5]',
};
VARIANTS.secondary = VARIANTS.outline; // alias — dipakai di halaman Riwayat

const SIZES = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTS[variant] ?? VARIANTS.primary} ${SIZES[size] ?? SIZES.md} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
