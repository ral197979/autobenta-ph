import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';

const CATS = ['All', 'News', 'Review', 'Guide', 'Feature'];
const GRADIENT = 'bg-gradient-to-br from-[#1e3a5f] to-[#0B1220]';
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

function Card({ a }) {
  return (
    <Link to={`/news/${a.slug}`} className="group bg-surface-container-lowest border border-border-subtle rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col">
      <div className="relative h-44 overflow-hidden">
        {a.coverUrl
          ? <img src={a.coverUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          : <div className={`h-full w-full ${GRADIENT} flex items-center justify-center p-4`}><span className="text-headline-sm font-bold text-white/90 text-center line-clamp-3">{a.title}</span></div>}
        <span className="absolute top-3 left-3 bg-surface-container-lowest/90 text-primary text-label-sm font-bold px-2 py-1 rounded-full uppercase tracking-wide">{a.category}</span>
      </div>
      <div className="p-md flex flex-col gap-1 flex-1">
        <h3 className="text-headline-sm font-headline-sm text-on-surface group-hover:text-primary transition-colors line-clamp-2">{a.title}</h3>
        {a.excerpt && <p className="text-body-sm text-on-surface-variant line-clamp-2">{a.excerpt}</p>}
        <p className="text-label-sm text-on-surface-variant/70 mt-auto pt-sm">{a.authorName || 'Ryderr'} · {fmtDate(a.publishedAt || a.createdAt)}</p>
      </div>
    </Link>
  );
}

export default function News() {
  const [cat, setCat] = useState('All');
  const { data, isLoading } = useQuery({ queryKey: ['articles', cat], queryFn: () => api.get(`/articles${cat !== 'All' ? `?category=${cat}` : ''}`).then((r) => r.data) });
  const articles = data?.articles || [];

  return (
    <div className="bg-background min-h-screen">
      <main className="max-w-container-max mx-auto px-gutter-mobile md:px-gutter-desktop py-xl">
        <div className="mb-lg">
          <h1 className="text-headline-lg font-headline-lg text-on-surface">News &amp; Reviews</h1>
          <p className="text-body-sm text-on-surface-variant mt-1">Buying guides, car reviews, and the latest from the Philippine auto scene.</p>
        </div>

        <div className="flex gap-2 overflow-x-auto hide-scrollbar mb-lg">
          {CATS.map((c) => (
            <button key={c} onClick={() => setCat(c)} className={`px-md py-sm rounded-full text-label-md whitespace-nowrap transition-colors ${cat === c ? 'bg-primary text-on-primary' : 'border border-border-subtle text-on-surface hover:bg-surface-container'}`}>{c}</button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-lg">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-72 rounded-2xl border border-border-subtle bg-surface-container animate-pulse" />)}</div>
        ) : articles.length === 0 ? (
          <p className="text-center text-on-surface-variant py-20">No articles in this category yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-lg">
            {articles.map((a) => <Card key={a.id} a={a} />)}
          </div>
        )}
      </main>
    </div>
  );
}
