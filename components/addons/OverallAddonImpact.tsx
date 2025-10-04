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
          <div className="h-2 w-40 rounded bg-yellow-200">
            <div
              className="h-2 rounded"
              style={{
                width: `${Math.min(100, Math.max(0, (i.severity / 5) * 100))}%`,
                background: 'linear-gradient(90deg, #fde047, #ef4444)'
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}


