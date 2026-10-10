export function adminHead(title: string, description: string) {
  return { meta: [{ title: `${title} — Tumdo Kalenjin Connect` }, { name: 'description', content: description }, { property: 'og:title', content: `${title} — Tumdo Kalenjin Connect` }, { property: 'og:description', content: description }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }, { name: 'robots', content: 'noindex' }] };
}
export function downloadCsv(name: string, headers: string[], rows: unknown[][]) {
  const cell = (v: unknown) => { const text = String(v ?? ''); return `"${(/^[=+@\-\t\r]/.test(text) ? "'" : '') + text.replace(/"/g, '""')}"`; };
  const blob = new Blob(['\uFEFF' + [headers, ...rows].map(row => row.map(cell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = `${name}.csv`; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function ticketToken(value: string) {
  const text = value.trim();
  if (/^[a-f0-9]{48}$/.test(text)) return text;
  try { const url = new URL(text); const match = url.pathname.match(/^\/tickets\/([a-f0-9]{48})$/); return match?.[1] ?? null; } catch { return null; }
}
