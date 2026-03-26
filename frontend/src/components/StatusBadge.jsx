const statusConfig = {
  a: { label: 'Available', color: 'bg-green-100 text-green-700 border-green-200', dot: 'bg-green-500' },
  d: { label: 'Doubtful', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', dot: 'bg-yellow-500' },
  i: { label: 'Injured', color: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500' },
  s: { label: 'Suspended', color: 'bg-orange-100 text-orange-700 border-orange-200', dot: 'bg-orange-500' },
  u: { label: 'Unavailable', color: 'bg-gray-100 text-gray-600 border-gray-200', dot: 'bg-gray-400' },
  n: { label: 'Not in squad', color: 'bg-gray-100 text-gray-500 border-gray-200', dot: 'bg-gray-300' },
};

export default function StatusBadge({ status, chanceOfPlaying, showLabel = true }) {
  const config = statusConfig[status] || statusConfig['a'];

  const displayLabel =
    status === 'd' && chanceOfPlaying != null
      ? `${chanceOfPlaying}%`
      : config.label;

  if (!showLabel) {
    return (
      <span
        className={`inline-block w-2.5 h-2.5 rounded-full ${config.dot}`}
        title={displayLabel}
      />
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border ${config.color}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {displayLabel}
    </span>
  );
}
