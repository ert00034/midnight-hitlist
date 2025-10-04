import { Navbar } from '@/components/Navbar';
import { OverallAddonImpact } from '@/components/addons/OverallAddonImpact';

export default function AddonsPage() {
  return (
    <div className="pb-16">
      <Navbar />
      <h1 className="mt-8 text-3xl font-semibold">Addons Impact</h1>
      <p className="mt-2 text-slate-300">Overall severity across addons inferred from related articles.</p>
      <div className="mt-6">
        <OverallAddonImpact />
      </div>
    </div>
  );
}


