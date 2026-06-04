import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

function Icon({ name, className = '', filled = false }) {
  return <span className={`material-symbols-outlined ${className}`} style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}>{name}</span>;
}

const INPUT = 'w-full bg-surface-container-low border border-border-subtle rounded-lg p-md text-body-md text-on-surface focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder-on-surface-variant/60';
const SECTIONS = [
  { id: 'profile', icon: 'person', label: 'Profile Settings' },
  { id: 'preferences', icon: 'settings_suggest', label: 'Preferences' },
  { id: 'security', icon: 'security', label: 'Security & Privacy' },
];

export default function AccountSettings() {
  const { user, setUser, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null);

  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [savingPw, setSavingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState(null);

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const saveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      const { data } = await api.patch('/auth/me', { name, phone });
      const merged = { ...user, ...data };
      setUser(merged);
      localStorage.setItem('user', JSON.stringify(merged));
      setProfileMsg({ ok: true, text: 'Profile updated.' });
    } catch (err) {
      setProfileMsg({ ok: false, text: err.response?.data?.error || 'Update failed.' });
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    setPwMsg(null);
    if (pw.newPassword !== pw.confirm) return setPwMsg({ ok: false, text: 'New passwords do not match.' });
    if (pw.newPassword.length < 6) return setPwMsg({ ok: false, text: 'New password must be at least 6 characters.' });
    setSavingPw(true);
    try {
      await api.post('/auth/change-password', { currentPassword: pw.currentPassword, newPassword: pw.newPassword });
      setPw({ currentPassword: '', newPassword: '', confirm: '' });
      setPwMsg({ ok: true, text: 'Password changed.' });
    } catch (err) {
      setPwMsg({ ok: false, text: err.response?.data?.error || 'Could not change password.' });
    } finally {
      setSavingPw(false);
    }
  };

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div className="bg-background min-h-screen">
      <main className="max-w-container-max mx-auto px-gutter-mobile md:px-gutter-desktop py-xl">
        <div className="flex flex-col md:flex-row gap-3xl">
          {/* Sidebar */}
          <aside className="w-full md:w-72 shrink-0">
            <div className="md:sticky md:top-24 space-y-md">
              {SECTIONS.map((s) => (
                <button key={s.id} onClick={() => scrollTo(s.id)} className="w-full flex items-center gap-md p-md rounded-xl text-on-surface-variant hover:bg-surface-container-high transition-all text-left">
                  <Icon name={s.icon} />
                  <span className="text-label-md font-label-md">{s.label}</span>
                </button>
              ))}
              <div className="h-px bg-border-subtle my-md" />
              <button onClick={handleLogout} className="w-full flex items-center gap-md p-md rounded-xl text-error hover:bg-error-container/20 transition-all text-left">
                <Icon name="logout" />
                <span className="text-label-md font-label-md">Sign Out</span>
              </button>
            </div>
          </aside>

          {/* Content */}
          <section className="flex-1 space-y-xl min-w-0">
            {/* Profile hero */}
            <div id="profile" className="flex flex-col md:flex-row items-center md:items-end gap-xl pb-xl border-b border-border-subtle scroll-mt-24">
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-primary-container text-on-primary flex items-center justify-center text-5xl font-bold border-4 border-surface-container shadow-2xl">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-trust-emerald p-1.5 rounded-full border-4 border-background">
                  <Icon name="verified" className="text-white text-[18px]" filled />
                </div>
              </div>
              <div className="text-center md:text-left space-y-xs">
                <h1 className="text-headline-lg font-headline-lg text-on-surface">{user?.name}</h1>
                <p className="text-body-md text-secondary capitalize">{user?.role} • Philippines</p>
                <p className="text-label-sm text-on-tertiary-container">{user?.email}</p>
              </div>
            </div>

            {/* Account information */}
            <form onSubmit={saveProfile} className="space-y-md">
              <h2 className="text-headline-sm font-headline-sm text-on-surface flex items-center gap-sm"><Icon name="badge" /> Account Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                <div className="space-y-xs">
                  <label className="text-label-sm font-label-sm text-secondary px-xs">Full Name</label>
                  <input className={INPUT} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
                </div>
                <div className="space-y-xs">
                  <label className="text-label-sm font-label-sm text-secondary px-xs">Phone Number</label>
                  <input className={INPUT} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09XXXXXXXXX" />
                </div>
                <div className="space-y-xs md:col-span-2">
                  <label className="text-label-sm font-label-sm text-secondary px-xs">Email Address</label>
                  <input className={`${INPUT} opacity-60 cursor-not-allowed`} type="email" value={user?.email || ''} readOnly title="Email cannot be changed" />
                </div>
              </div>
              <div className="flex items-center gap-md">
                <button type="submit" disabled={savingProfile} className="bg-primary text-on-primary rounded-xl px-lg py-sm font-label-md hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-50">
                  {savingProfile ? 'Saving…' : 'Save Changes'}
                </button>
                {profileMsg && <span className={`text-body-sm ${profileMsg.ok ? 'text-trust-emerald' : 'text-error'}`}>{profileMsg.text}</span>}
              </div>
            </form>

            {/* Preferences */}
            <div id="preferences" className="space-y-md scroll-mt-24 pt-xl border-t border-border-subtle">
              <h2 className="text-headline-sm font-headline-sm text-on-surface flex items-center gap-sm"><Icon name="settings_suggest" /> Preferences</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
                <div className="bg-surface-container-low border border-border-subtle p-lg rounded-xl flex flex-col justify-between h-40">
                  <div className="flex justify-between items-start">
                    <Icon name={isDark ? 'dark_mode' : 'light_mode'} className="text-primary" />
                    <button onClick={toggleTheme} role="switch" aria-checked={isDark} className={`relative w-12 h-6 rounded-full transition-colors ${isDark ? 'bg-primary' : 'bg-surface-container-highest'}`}>
                      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isDark ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>
                  <div>
                    <h3 className="text-label-md font-label-md text-on-surface">{isDark ? 'Kinetic Dark' : 'Ryderr Kinetic'}</h3>
                    <p className="text-body-sm text-secondary">{isDark ? 'Optimized for low-light viewing.' : 'Bright, high-clarity interface.'}</p>
                  </div>
                </div>
                <div className="bg-surface-container-low border border-border-subtle p-lg rounded-xl flex flex-col justify-between h-40">
                  <Icon name="language" className="text-primary" />
                  <div>
                    <h3 className="text-label-md font-label-md text-on-surface">Language</h3>
                    <p className="text-body-sm text-secondary">English (Philippines)</p>
                  </div>
                </div>
                <div className="bg-surface-container-low border border-border-subtle p-lg rounded-xl flex flex-col justify-between h-40">
                  <Icon name="payments" className="text-primary" />
                  <div>
                    <h3 className="text-label-md font-label-md text-on-surface">Currency</h3>
                    <p className="text-body-sm text-secondary">Philippine Peso (₱)</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Security */}
            <form onSubmit={savePassword} id="security" className="space-y-md scroll-mt-24 pt-xl border-t border-border-subtle">
              <h2 className="text-headline-sm font-headline-sm text-on-surface flex items-center gap-sm"><Icon name="security" /> Security & Privacy</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                <div className="space-y-xs md:col-span-2">
                  <label className="text-label-sm font-label-sm text-secondary px-xs">Current Password</label>
                  <input className={INPUT} type="password" value={pw.currentPassword} onChange={(e) => setPw(p => ({ ...p, currentPassword: e.target.value }))} placeholder="••••••••" />
                </div>
                <div className="space-y-xs">
                  <label className="text-label-sm font-label-sm text-secondary px-xs">New Password</label>
                  <input className={INPUT} type="password" value={pw.newPassword} onChange={(e) => setPw(p => ({ ...p, newPassword: e.target.value }))} placeholder="Min. 6 characters" />
                </div>
                <div className="space-y-xs">
                  <label className="text-label-sm font-label-sm text-secondary px-xs">Confirm New Password</label>
                  <input className={INPUT} type="password" value={pw.confirm} onChange={(e) => setPw(p => ({ ...p, confirm: e.target.value }))} placeholder="Repeat new password" />
                </div>
              </div>
              <div className="flex items-center gap-md">
                <button type="submit" disabled={savingPw} className="rounded-xl border border-border-subtle text-on-surface px-lg py-sm font-label-md hover:bg-surface-container transition-colors disabled:opacity-50">
                  {savingPw ? 'Updating…' : 'Change Password'}
                </button>
                {pwMsg && <span className={`text-body-sm ${pwMsg.ok ? 'text-trust-emerald' : 'text-error'}`}>{pwMsg.text}</span>}
              </div>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}
