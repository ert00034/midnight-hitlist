type Props = { level: number };

const levelToLabel: Record<number, string> = {
  1: 'Low',
  2: 'Moderate',
  3: 'Notable',
  4: 'High',
  5: 'Critical',
};

export function SeverityPill({ level }: Props) {
  const clamped = Math.min(5, Math.max(1, Math.round(level)));
  const bgMap: Record<number, string> = {
    1: 'bg-yellow-200 text-slate-900',
    2: 'bg-yellow-300 text-slate-900',
    3: 'bg-orange-400 text-white',
    4: 'bg-orange-500 text-white',
    5: 'bg-red-500 text-white',
  };
  return (
    <span className={`severity-pill ${bgMap[clamped]}`}>{levelToLabel[clamped]}</span>
  );
}


