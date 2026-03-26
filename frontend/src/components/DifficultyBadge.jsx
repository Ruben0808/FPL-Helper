const difficultyConfig = {
  1: { bg: 'bg-green-500', text: 'text-white', label: 'Very Easy' },
  2: { bg: 'bg-green-400', text: 'text-white', label: 'Easy' },
  3: { bg: 'bg-yellow-400', text: 'text-gray-900', label: 'Medium' },
  4: { bg: 'bg-orange-500', text: 'text-white', label: 'Hard' },
  5: { bg: 'bg-red-600', text: 'text-white', label: 'Very Hard' },
};

// Fixed-width uniform badge used everywhere fixtures are shown
export default function DifficultyBadge({ difficulty, opponent, isHome, size = 'md' }) {
  const config = difficultyConfig[difficulty] || difficultyConfig[3];

  const dims = {
    sm: { box: 'w-10 h-10', name: 'text-[10px]', fdr: 'text-sm' },
    md: { box: 'w-12 h-12', name: 'text-[11px]', fdr: 'text-base' },
    lg: { box: 'w-14 h-14', name: 'text-xs',     fdr: 'text-lg'  },
  }[size] || { box: 'w-12 h-12', name: 'text-[11px]', fdr: 'text-base' };

  return (
    <div
      className={`diff-badge relative inline-flex flex-col items-center justify-center rounded-xl font-bold ${config.bg} ${config.text} ${dims.box} shrink-0`}
      title={`${opponent ?? ''} ${isHome ? '(Home)' : '(Away)'} — FDR ${difficulty} (${config.label})`}
    >
      {/* Opponent name — always 3 chars, no (A) clutter */}
      {opponent && (
        <span className={`${dims.name} font-black leading-none tracking-tight uppercase`}>
          {opponent.slice(0, 3)}
        </span>
      )}

      {/* FDR number */}
      <span className={`${opponent ? 'text-[11px]' : dims.fdr} font-black leading-none opacity-90`}>
        {difficulty}
      </span>

      {/* Away indicator — small dot bottom-right, not text */}
      {!isHome && (
        <span
          className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-white/60"
          title="Away fixture"
        />
      )}
    </div>
  );
}
