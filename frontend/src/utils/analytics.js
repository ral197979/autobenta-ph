// Session ID — generated once per browser session
function getSessionId() {
  let sid = sessionStorage.getItem('abph_sid');
  if (!sid) {
    sid = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
    sessionStorage.setItem('abph_sid', sid);
  }
  return sid;
}

function getDevice() {
  const w = window.innerWidth;
  if (w < 768) return 'mobile';
  if (w < 1024) return 'tablet';
  return 'desktop';
}

function getSource() {
  const ref = document.referrer;
  const params = new URLSearchParams(window.location.search);
  const utm = params.get('utm_source');
  if (utm) return utm;
  if (!ref) return 'direct';
  if (ref.includes('google')) return 'google';
  if (ref.includes('facebook')) return 'facebook';
  if (ref.includes(window.location.hostname)) return 'internal';
  return 'referral';
}

export function trackEvent(eventType, payload = {}) {
  // Fire and forget — never block UI
  try {
    const body = {
      eventType,
      sessionId: getSessionId(),
      device: getDevice(),
      source: getSource(),
      referrer: document.referrer || undefined,
      ...payload,
    };
    // Use fetch directly (not api client) so it never throws into React
    fetch('/api/analytics/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    }).catch(() => {}); // swallow all errors
  } catch (_) {}
}
