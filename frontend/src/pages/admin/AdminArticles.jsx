import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';

function Icon({ name, className = '' }) {
  return <span className={`material-symbols-outlined ${className}`}>{name}</span>;
}
const INPUT = 'w-full bg-surface-container border border-border-subtle rounded-lg px-3 py-2 text-body-sm text-on-surface focus:ring-2 focus:ring-primary outline-none';
const CATS = ['News', 'Review', 'Guide', 'Feature'];
const blank = () => ({ title: '', category: 'News', excerpt: '', body: '', coverUrl: '', authorName: 'Ryderr Team', published: true });

export default function AdminArticles() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null);
  const { data, isLoading } = useQuery({ queryKey: ['admin-articles'], queryFn: () => api.get('/articles/admin/all').then((r) => r.data) });
  const articles = data || [];

  const del = useMutation({ mutationFn: (id) => api.delete(`/articles/${id}`), onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-articles'] }) });

  return (
    <div className="bg-background min-h-screen">
      <main className="max-w-container-max mx-auto px-gutter-mobile md:px-gutter-desktop py-2xl">
        <div className="flex items-center justify-between mb-lg gap-4">
          <div>
            <h1 className="text-headline-lg font-headline-lg text-on-surface">News &amp; Reviews</h1>
            <p className="text-body-sm text-on-surface-variant mt-1">{articles.length} articles · author and publish content</p>
          </div>
          <button onClick={() => setEditing('new')} className="bg-primary text-on-primary rounded-xl px-lg py-sm font-label-md flex items-center gap-1.5 hover:opacity-90"><Icon name="add" /> New Article</button>
        </div>

        <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl overflow-hidden">
          {isLoading ? (
            <div className="p-lg space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-12 bg-surface-container rounded animate-pulse" />)}</div>
          ) : articles.length === 0 ? (
            <p className="text-center text-on-surface-variant py-16">No articles yet.</p>
          ) : (
            <div className="divide-y divide-border-subtle">
              {articles.map((a) => (
                <div key={a.id} className="flex items-center gap-md p-md">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-on-surface truncate">{a.title}
                      {a.published ? <span className="text-[10px] bg-trust-emerald/15 text-trust-emerald px-1.5 py-0.5 rounded ml-2">Published</span> : <span className="text-[10px] bg-alert-orange/15 text-alert-orange px-1.5 py-0.5 rounded ml-2">Draft</span>}
                    </p>
                    <p className="text-label-sm text-on-surface-variant">{a.category} · {a.authorName || 'Ryderr'}</p>
                  </div>
                  {a.published && <Link to={`/news/${a.slug}`} className="rounded-lg border border-border-subtle text-on-surface px-3 py-1.5 text-label-sm hover:bg-surface-container">View</Link>}
                  <button onClick={() => setEditing(a)} className="rounded-lg border border-border-subtle text-on-surface px-3 py-1.5 text-label-sm hover:bg-surface-container flex items-center gap-1"><Icon name="edit" className="text-[16px]" /> Edit</button>
                  <button onClick={() => { if (confirm(`Delete "${a.title}"?`)) del.mutate(a.id); }} className="rounded-lg border border-error/40 text-error px-3 py-1.5 text-label-sm hover:bg-error/10"><Icon name="delete" className="text-[16px]" /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {editing && <ArticleForm article={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={() => { qc.invalidateQueries({ queryKey: ['admin-articles'] }); setEditing(null); }} />}
    </div>
  );
}

function ArticleForm({ article, onClose, onSaved }) {
  const isEdit = !!article;
  const [f, setF] = useState(() => (article ? { ...blank(), ...article, excerpt: article.excerpt || '', coverUrl: article.coverUrl || '', body: article.body || '' } : blank()));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  // The admin list endpoint omits body; fetch it when editing.
  useQuery({ queryKey: ['article-full', article?.slug], enabled: isEdit && !f.body, queryFn: () => api.get(`/articles/${article.slug}?preview=true`).then((r) => r.data), onSuccess: (d) => setF((p) => ({ ...p, body: d.body || '' })) });

  const save = async (e) => {
    e.preventDefault();
    if (!f.title || !f.body) return setError('Title and body are required.');
    setSaving(true); setError(null);
    const payload = { title: f.title, category: f.category, excerpt: f.excerpt, body: f.body, coverUrl: f.coverUrl || null, authorName: f.authorName, published: !!f.published };
    try {
      if (isEdit) await api.patch(`/articles/${article.id}`, payload);
      else await api.post('/articles', payload);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || 'Save failed.');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-start md:items-center justify-center p-0 md:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full md:max-w-2xl bg-surface-container-lowest md:rounded-2xl border border-border-subtle shadow-2xl max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between p-lg border-b border-border-subtle sticky top-0 bg-surface-container-lowest z-10">
          <h2 className="text-headline-sm font-headline-sm text-on-surface">{isEdit ? 'Edit Article' : 'New Article'}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-container text-on-surface-variant"><Icon name="close" /></button>
        </div>
        <form onSubmit={save} className="p-lg space-y-md">
          <Field label="Title"><input value={f.title} onChange={(e) => set('title', e.target.value)} className={INPUT} /></Field>
          <div className="grid grid-cols-2 gap-md">
            <Field label="Category"><select value={f.category} onChange={(e) => set('category', e.target.value)} className={INPUT}>{CATS.map((c) => <option key={c}>{c}</option>)}</select></Field>
            <Field label="Author"><input value={f.authorName} onChange={(e) => set('authorName', e.target.value)} className={INPUT} /></Field>
          </div>
          <Field label="Cover image URL"><input value={f.coverUrl} onChange={(e) => set('coverUrl', e.target.value)} className={INPUT} placeholder="https://…" /></Field>
          <Field label="Excerpt"><textarea rows={2} value={f.excerpt} onChange={(e) => set('excerpt', e.target.value)} className={`${INPUT} resize-none`} placeholder="One-line summary shown on cards" /></Field>
          <Field label="Body (separate paragraphs with a blank line)"><textarea rows={10} value={f.body} onChange={(e) => set('body', e.target.value)} className={`${INPUT} resize-y`} /></Field>
          <label className="flex items-center gap-2 text-body-sm text-on-surface"><input type="checkbox" checked={f.published} onChange={(e) => set('published', e.target.checked)} className="h-4 w-4 rounded text-primary" /> Published</label>
          {error && <p className="rounded-lg bg-error/10 border border-error/30 px-3 py-2 text-body-sm text-error">{error}</p>}
          <div className="flex justify-end gap-md pt-md border-t border-border-subtle">
            <button type="button" onClick={onClose} className="rounded-xl border border-border-subtle text-on-surface px-lg py-sm font-label-md hover:bg-surface-container">Cancel</button>
            <button type="submit" disabled={saving} className="bg-primary text-on-primary rounded-xl px-lg py-sm font-label-md hover:opacity-90 disabled:opacity-50">{saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Publish'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return <label className="block space-y-1"><span className="block text-label-sm font-label-sm text-on-surface-variant">{label}</span>{children}</label>;
}
