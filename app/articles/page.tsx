export const dynamic = 'force-dynamic';
import { Suspense } from 'react';
import { ArticleList } from '@/components/articles/ArticleList';
import { PageTitle } from '@/components/PageTitle';

export default function ArticlesPage() {
  return (
    <div className="pb-16">
      <div className="mt-8"><PageTitle title="Articles" /></div>
      <Suspense>
        {/* Server component fetches from Supabase */}
        <ArticleList />
      </Suspense>
    </div>
  );
}


