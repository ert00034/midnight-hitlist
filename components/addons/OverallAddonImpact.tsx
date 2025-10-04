'use client';

import { useEffect, useState } from 'react';

type AddonImpact = {
  addon_name: string;
  severity: number;
};

export function OverallAddonImpact() {
  const [impacts, setImpacts] = useState<AddonImpact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetch('/api/overall-impacts').then(async (r) => {
      const data = await r.json();
      if (mounted) {
        setImpacts(data.impacts ?? []);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return <div className="text-slate-400">Loading impacts...</div>;
  }

  if (!impacts.length) {
    return <div className="text-slate-400">No addon impacts yet.</div>;
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {impacts.map((i) => (
        <div key={i.addon_name} className="flex items-center justify-between rounded-lg bg-slate-900/40 p-4 ring-1 ring-white/10">
          <span className="font-medium">{i.addon_name}</span>
          <SeverityLabel severity={i.severity} />
        </div>
      ))}
    </div>
  );
}

function SeverityLabel({ severity }: { severity: number }) {
  const label = severity >= 5 ? 'disabled' : severity >= 4 ? 'high' : severity === 3 ? 'medium' : 'low';
  const cls = label === 'low' ? 'bg-yellow-200 text-slate-900' : label === 'medium' ? 'bg-orange-400 text-white' : label === 'high' ? 'bg-orange-500 text-white' : 'bg-red-500 text-white';
  const text = label.charAt(0).toUpperCase() + label.slice(1);
  return <span className={`rounded px-2 py-0.5 text-xs ${cls}`}>{text}</span>;
}


