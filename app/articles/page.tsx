export const dynamic = 'force-dynamic';
import { Suspense } from 'react';
import { Navbar } from '@/components/Navbar';
import { ArticleList } from '@/components/articles/ArticleList';
import { ArticleToolbar } from '@/components/articles/ArticleToolbar';

export default function ArticlesPage() {
  return (
    <div className="pb-16">
      <Navbar />
      <h1 className="mt-8 text-3xl font-semibold">Articles</h1>
      <ArticleToolbar />
      <Suspense>
        {/* Server component fetches from Supabase */}
        <ArticleList />
      </Suspense>
    </div>
  );
}


