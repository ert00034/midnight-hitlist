import { Suspense } from 'react';
import { Navbar } from '@/components/Navbar';
import { ArticleList } from '@/components/articles/ArticleList';

export default function ArticlesPage() {
  return (
    <div className="pb-16">
      <Navbar />
      <h1 className="mt-8 text-3xl font-semibold">Articles</h1>
      <p className="mt-2 text-slate-300">Links to Wowhead articles with AI-assisted relevance and severity.</p>
      <Suspense>
        {/* Server component fetches from Supabase */}
        <ArticleList />
      </Suspense>
    </div>
  );
}


