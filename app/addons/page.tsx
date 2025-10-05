export const dynamic = 'force-dynamic';
import { OverallAddonImpact } from '@/components/addons/OverallAddonImpact';
import { PageTitle } from '@/components/PageTitle';

export default function AddonsPage() {
  return (
    <div className="pb-16">
      <div className="mt-8">
        <PageTitle title="Addons Impact" subtitle="Overall severity across addons inferred from related articles." />
      </div>
      <div className="mt-6">
        <OverallAddonImpact />
      </div>
    </div>
  );
}


