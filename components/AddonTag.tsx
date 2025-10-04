type Props = { name: string; severity: number };

export function AddonTag({ name, severity }: Props) {
  const clamped = Math.min(5, Math.max(1, Math.round(severity)));
  const bgMap: Record<number, string> = {
    1: 'bg-yellow-200 text-slate-900',
    2: 'bg-yellow-300 text-slate-900',
    3: 'bg-orange-400 text-white',
    4: 'bg-orange-500 text-white',
    5: 'bg-red-500 text-white',
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-white/10 ${bgMap[clamped]}`}>
      {name}
    </span>
  );
}


