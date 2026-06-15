import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';

function Icon({ name, className = '' }) {
  return <span className={`material-symbols-outlined ${className}`}>{name}</span>;
}
const GRADIENT = 'bg-gradient-to-br from-[#1e3a5f] to-[#0B1220]';
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }) : '';

export default function ArticleDetail() {
  const { slug } = useParams();
  const { data: a, isLoading, isError } = useQuery({ queryKey: ['article', slug], queryFn: () => api.get(`/articles/${slug}`).then((r) => r.data) });

  if (isLoading) return <div className="max-w-3xl mx-auto px-gutter-mobile py-2xl animate-pulse space-y-4"><div className="h-8 bg-surface-container rounded w-3/4" /><div className="h-64 bg-surface-container rounded-2xl" /></div>;
  if (isError || !a) return <div className="text-center py-24"><p className="text-on-surface-variant text-body-lg">Article not found.</p><Link to="/news" className="mt-4 inline-block bg-primary text-on-primary rounded-xl px-lg py-sm font-label-md">Back to News</Link></div>;

  const paragraphs = (a.body || '').split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

  return (
    <div className="bg-background min-h-screen">
      <main className="max-w-3xl mx-auto px-gutter-mobile md:px-gutter-desktop py-xl">
        <nav className="flex items-center gap-sm text-label-sm text-on-surface-variant mb-md">
          <Link to="/news" className="hover:text-primary">News &amp; Reviews</Link>
          <Icon name="chevron_right" className="text-[14px]" />
          <span>{a.category}</span>
        </nav>

        <span className="bg-primary/10 text-primary text-label-sm font-bold px-2 py-1 rounded-full uppercase tracking-wide">{a.category}</span>
        <h1 className="text-headline-lg font-headline-lg text-on-surface mt-md mb-sm">{a.title}</h1>
        <p className="text-on-surface-variant text-body-sm mb-lg">{a.authorName || 'Ryderr'} · {fmtDate(a.publishedAt || a.createdAt)}</p>

        <div className="aspect-[16/9] rounded-2xl overflow-hidden mb-xl">
          {a.coverUrl ? <img src={a.coverUrl} alt="" className="w-full h-full object-cover" /> : <div className={`h-full w-full ${GRADIENT}`} />}
        </div>

        {a.excerpt && <p className="text-body-lg text-on-surface-variant leading-relaxed mb-lg font-medium">{a.excerpt}</p>}

        <article className="space-y-lg">
          {paragraphs.map((p, i) => <p key={i} className="text-body-lg text-on-surface leading-relaxed">{p}</p>)}
        </article>

        <div className="mt-2xl pt-lg border-t border-border-subtle flex items-center justify-between">
          <Link to="/news" className="text-primary font-label-md hover:underline flex items-center gap-1"><Icon name="arrow_back" className="text-[18px]" /> All articles</Link>
          <Link to="/cars" className="bg-primary text-on-primary rounded-xl px-lg py-sm font-label-md">Browse Cars</Link>
        </div>
      </main>
    </div>
  );
}
