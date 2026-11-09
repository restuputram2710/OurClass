/**
 * Komponen UI, ikon, format, grafik SVG, ilustrasi, dan utilitas gambar.
 * Semua teks dari server SELALU melewati esc() sebelum masuk HTML (cegah XSS).
 */
(function () {
  'use strict';
  const TZ = 'Asia/Jakarta';
  const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const BULAN_P = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const HARI = ['', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
  const HARI_P = ['', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
  const reduceMotion = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------------- DOM ----------------
  const esc = s => String(s === undefined || s === null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  function h(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }
  function on(root, ev, sel, fn) { root.addEventListener(ev, e => { const t = e.target.closest(sel); if (t && root.contains(t)) fn(e, t); }); }

  // ---------------- Ikon (garis, gaya Lucide) ----------------
  const CAL = '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>';
  const I = {
    home: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/>',
    absensi: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="m16 11 2 2 4-4"/>',
    kas: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/>',
    wallet: '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
    siswa: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    jadwal: CAL + '<path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/>',
    calendar: CAL, 'calendar-check': CAL + '<path d="m9 16 2 2 4-4"/>',
    insight: '<path d="M22 7 13.5 15.5 8.5 10.5 2 17"/><path d="M16 7h6v6"/>',
    notulensi: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4M10 9H8M16 13H8M16 17H8"/>',
    periode: CAL + '<circle cx="12" cy="16" r="2"/>',
    laporan: '<path d="M3 3v18h18"/><path d="M18 17V9M13 17V5M8 17v-3"/>',
    pengaturan: '<path d="M20 7h-9M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/>',
    akun: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    plus: '<path d="M5 12h14M12 5v14"/>', 'plus-circle': '<circle cx="12" cy="12" r="10"/><path d="M8 12h8M12 8v8"/>',
    check: '<path d="M20 6 9 17l-5-5"/>', 'check-circle': '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
    'check-check': '<path d="M18 6 7 17l-5-5"/><path d="m22 10-7.5 7.5L13 16"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>', 'x-circle': '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4M12 17h.01"/>',
    'alert-circle': '<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>',
    'chev-l': '<path d="m15 18-6-6 6-6"/>', 'chev-r': '<path d="m9 18 6-6-6-6"/>', 'chev-d': '<path d="m6 9 6 6 6-6"/>',
    'arrow-l': '<path d="m12 19-7-7 7-7M19 12H5"/>', 'arrow-r': '<path d="M5 12h14M12 5l7 7-7 7"/>',
    eye: '<path d="M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0"/><circle cx="12" cy="12" r="3"/>',
    'eye-off': '<path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c4.97 0 8.8 3.12 9.94 6.65a1 1 0 0 1 0 .7 10.66 10.66 0 0 1-1.67 2.89"/><path d="M14.08 14.16a3 3 0 0 1-4.24-4.24"/><path d="M17.48 17.5A10.5 10.5 0 0 1 2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 4.45-5.14"/><path d="m2 2 20 20"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5M12 15V3"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5M12 3v12"/>',
    copy: '<rect x="8" y="8" width="14" height="14" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
    pencil: '<path d="M21.17 6.81a1 1 0 0 0-3.99-3.99L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.35a.5.5 0 0 0 .62.62l4.35-1.32a2 2 0 0 0 .83-.5z"/><path d="m15 5 4 4"/>',
    archive: '<rect x="2" y="3" width="20" height="5" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8M10 12h4"/>',
    more: '<circle cx="12" cy="5" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="12" cy="19" r="1.2"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    refresh: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    cake: '<path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"/><path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1"/><path d="M2 21h20M7 8v3M12 8v3M17 8v3M7 4h.01M12 4h.01M17 4h.01"/>',
    party: '<path d="M5.8 11.3 2 22l10.7-3.79"/><path d="M4 3h.01M22 8h.01M15 2h.01M22 20h.01"/><path d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10"/><path d="M11 13c1.93 1.93 2.83 4.17 2 5-.83.83-3.07-.07-5-2-1.93-1.93-2.83-4.17-2-5 .83-.83 3.07.07 5 2"/>',
    brush: '<path d="m9.06 11.9 8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08"/><path d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1.08 1.1 2.49 2.02 4 2.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-3-3.02z"/>',
    book: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
    clipboard: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4M12 16h4M8 11h.01M8 16h.01"/>',
    phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
    message: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
    pin: '<path d="M20 10c0 4.99-5.54 10.19-7.4 11.8a1 1 0 0 1-1.2 0C9.54 20.19 4 14.99 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
    user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    grad: '<path d="M21.42 10.92a1 1 0 0 0-.02-1.84L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.83l8.57 3.91a2 2 0 0 0 1.66 0z"/><path d="M22 10v6M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>',
    'in': '<path d="M17 7 7 17M17 17H7V7"/>', out: '<path d="M7 7h10v10M7 17 17 7"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21"/>',
    clip: '<path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>',
    sort: '<path d="m21 16-4 4-4-4M17 20V4M3 8l4-4 4 4M7 4v16"/>',
    trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
    smile: '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/>',
    note: '<path d="M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8Z"/><path d="M15 3v4a2 2 0 0 0 2 2h4"/>',
    key: '<path d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4M21 2l-9.6 9.6"/><circle cx="7.5" cy="15.5" r="5.5"/>',
    database: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/>',
    restore: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
    trash: '<path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6"/>',
    palette: '<circle cx="13.5" cy="6.5" r=".8"/><circle cx="17.5" cy="10.5" r=".8"/><circle cx="8.5" cy="7.5" r=".8"/><circle cx="6.5" cy="12.5" r=".8"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.65-.75 1.65-1.69 0-.44-.18-.84-.44-1.13-.29-.29-.44-.65-.44-1.13a1.64 1.64 0 0 1 1.67-1.67h2c3.05 0 5.55-2.5 5.55-5.55C21.97 6.01 17.46 2 12 2z"/>',
    school: '<path d="m4 6 8-4 8 4"/><path d="m18 10 4 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8l4-2"/><path d="M14 22v-4a2 2 0 0 0-4 0v4M18 5v17M6 5v17"/><circle cx="12" cy="9" r="2"/>',
    history: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5M12 7v5l4 2"/>',
    printer: '<path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8" rx="1"/>',
    cloud: '<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/><path d="m9 14 2 2 4-4"/>',
    list: '<path d="m3 17 2 2 4-4M3 7l2 2 4-4M13 6h8M13 12h8M13 18h8"/>',
    file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/>',
    filter: '<path d="M22 3H2l8 9.46V19l4 2v-8.54z"/>',
    star: '<path d="M11.52 2.3a.53.53 0 0 1 .96 0l2.31 4.68a2.12 2.12 0 0 0 1.6 1.16l5.16.76a.53.53 0 0 1 .3.9l-3.74 3.64a2.12 2.12 0 0 0-.61 1.88l.88 5.14a.53.53 0 0 1-.77.56l-4.62-2.43a2.12 2.12 0 0 0-1.97 0L6.4 21.01a.53.53 0 0 1-.77-.56l.88-5.13a2.12 2.12 0 0 0-.61-1.88L2.16 9.8a.53.53 0 0 1 .29-.9l5.17-.76a2.12 2.12 0 0 0 1.6-1.16z"/>',
    send: '<path d="M14.54 21.69a.5.5 0 0 0 .94-.03l6.5-19a.5.5 0 0 0-.64-.64l-19 6.5a.5.5 0 0 0-.03.94l7.93 3.18a2 2 0 0 1 1.11 1.11z"/><path d="m21.85 2.15-10.94 10.94"/>',
    shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>'
  };
  function ic(name, cls) { return '<svg class="ic ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true">' + (I[name] || I.info) + '</svg>'; }

  // ---------------- Format ----------------
  const pad = n => (n < 10 ? '0' : '') + n;
  function nowParts() {
    const p = {}; new Intl.DateTimeFormat('en-GB', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date()).forEach(x => { p[x.type] = x.value; });
    return { date: p.year + '-' + p.month + '-' + p.day, h: +p.hour % 24, m: +p.minute, hm: (p.hour === '24' ? '00' : p.hour) + ':' + p.minute };
  }
  const today = () => nowParts().date;
  const dd = s => { const p = String(s).split('-'); return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2], 12)); };
  const isDate = s => /^\d{4}-\d{2}-\d{2}$/.test(String(s || ''));
  const addDays = (s, n) => { const d = dd(s); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
  const dow = s => { const w = dd(s).getUTCDay(); return w === 0 ? 7 : w; };
  const diffDays = (a, b) => Math.round((dd(b) - dd(a)) / 864e5);
  const fmt = {
    rp: n => { const v = Math.round(Number(n) || 0); return (v < 0 ? '−Rp ' : 'Rp ') + Math.abs(v).toLocaleString('id-ID'); },
    rpShort: n => { const v = Number(n) || 0; return v >= 1e6 ? 'Rp ' + (v / 1e6).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + ' jt' : v >= 1e3 ? 'Rp ' + Math.round(v / 1e3) + 'rb' : 'Rp ' + v; },
    num: n => (Number(n) || 0).toLocaleString('id-ID'),
    pct: n => n === null || n === undefined ? '–' : (Math.round(n * 10) / 10).toLocaleString('id-ID') + '%',
    tgl: s => { if (!isDate(s)) return s || '–'; const p = s.split('-'); return +p[2] + ' ' + BULAN[+p[1] - 1] + ' ' + p[0]; },
    tglPendek: s => { if (!isDate(s)) return s || '–'; const p = s.split('-'); return +p[2] + ' ' + BULAN[+p[1] - 1]; },
    tglPanjang: s => { if (!isDate(s)) return s || '–'; const p = s.split('-'); return HARI[dow(s)] + ', ' + (+p[2]) + ' ' + BULAN_P[+p[1] - 1] + ' ' + p[0]; },
    tglHari: s => { if (!isDate(s)) return s || '–'; const p = s.split('-'); return HARI[dow(s)] + ', ' + (+p[2]) + ' ' + BULAN[+p[1] - 1] + ' ' + p[0]; },
    bulan: ym => { const p = String(ym).split('-'); return BULAN_P[+p[1] - 1] + ' ' + p[0]; },
    waktu: iso => { if (!iso) return '–'; const d = new Date(iso); if (isNaN(d)) return '–'; return new Intl.DateTimeFormat('id-ID', { timeZone: TZ, day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(d).replace(/\./g, ':') + ' WIB'; },
    jam: iso => { if (!iso) return '–'; const d = new Date(iso); return new Intl.DateTimeFormat('id-ID', { timeZone: TZ, hour: '2-digit', minute: '2-digit' }).format(d).replace('.', ':') + ' WIB'; },
    rel: iso => {
      if (!iso) return 'belum pernah'; const s = (Date.now() - new Date(iso).getTime()) / 1000;
      if (s < 60) return 'baru saja'; if (s < 3600) return Math.floor(s / 60) + ' menit lalu'; if (s < 86400) return Math.floor(s / 3600) + ' jam lalu';
      if (s < 86400 * 7) return Math.floor(s / 86400) + ' hari lalu'; return fmt.waktu(iso);
    },
    hari: n => HARI[n] || '', hariPendek: n => HARI_P[n] || ''
  };
  function salam() { const h = nowParts().h; return h < 11 ? 'Selamat pagi' : h < 15 ? 'Selamat siang' : h < 18 ? 'Selamat sore' : 'Selamat malam'; }
  function inisial(n) { const p = String(n || '?').replace(/[^A-Za-zÀ-ɏ ]/g, ' ').trim().split(/\s+/); return ((p[0] || '?')[0] + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase(); }
  function warnaIdx(s) { let x = 0; String(s || '').split('').forEach(c => { x = (x * 31 + c.charCodeAt(0)) >>> 0; }); return (x % 6) + 1; }
  function avatar(nama, thumb, size, extra) {
    const img = thumb && /^data:image\/(png|jpeg|webp);base64,/.test(thumb) ? '<img src="' + thumb + '" alt="">' : esc(inisial(nama));
    return '<span class="av ' + (size ? 'av-' + size : '') + ' c' + warnaIdx(nama) + ' ' + (extra || '') + '">' + img + '</span>';
  }
  const STATUS = { H: ['Hadir', 'check'], I: ['Izin', 'info'], S: ['Sakit', 'plus-circle'], A: ['Alpa', 'x'] };
  function statusBadge(st) { const s = STATUS[st]; return s ? '<span class="badge b-' + st + '">' + ic(s[1]) + s[0] + '</span>' : '<span class="badge b-slate">Belum diisi</span>'; }

  // ---------------- Toast / modal / popover ----------------
  let toastBox = null;
  function toast(msg, type, ms) {
    type = type || 'success';
    if (!toastBox) { toastBox = h('<div class="toasts" role="status" aria-live="polite"></div>'); document.body.appendChild(toastBox); }
    const icn = { success: 'check-circle', error: 'x-circle', warning: 'alert', info: 'info' }[type] || 'info';
    const el = h('<div class="toast ' + type + '">' + ic(icn) + '<div>' + esc(msg) + '</div></div>');
    toastBox.appendChild(el);
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 220); }, ms || (type === 'error' ? 5200 : 3200));
  }
  const openModals = [];
  function modal(o) {
    const ov = h('<div class="overlay" role="dialog" aria-modal="true"><div class="modal ' + (o.size || '') + '">' +
      '<div class="modal-head"><div><h3>' + esc(o.title || '') + '</h3>' + (o.sub ? '<div class="sub">' + esc(o.sub) + '</div>' : '') + '</div>' +
      '<button class="btn btn-ghost btn-icon btn-sm" data-close aria-label="Tutup">' + ic('x') + '</button></div>' +
      '<div class="modal-body">' + (o.body || '') + '</div>' + (o.foot ? '<div class="modal-foot">' + o.foot + '</div>' : '') + '</div></div>');
    const prevFocus = document.activeElement;
    let closed = false;
    const close = (val) => {
      if (closed) return; closed = true;
      ov.classList.add('closing'); setTimeout(() => ov.remove(), 160);
      openModals.splice(openModals.indexOf(api), 1);
      document.removeEventListener('keydown', onKey);
      if (prevFocus && prevFocus.focus) try { prevFocus.focus(); } catch (e) { }
      if (o.onClose) o.onClose(val);
    };
    const onKey = e => { if (e.key === 'Escape' && openModals[openModals.length - 1] === api && !o.lock) close(); };
    ov.addEventListener('mousedown', e => { if (e.target === ov && !o.lock) close(); });
    on(ov, 'click', '[data-close]', () => close());
    document.addEventListener('keydown', onKey);
    document.body.appendChild(ov);
    const api = { el: ov, close, $: s => ov.querySelector(s), $$: s => Array.from(ov.querySelectorAll(s)) };
    openModals.push(api);
    setTimeout(() => { const f = ov.querySelector('[autofocus], .modal-body input:not([type=hidden]):not([type=file]), .modal-body select, .modal-body textarea'); if (f && window.innerWidth > 767) f.focus(); }, 60);
    return api;
  }
  function confirmDlg(o) {
    return new Promise(res => {
      const m = modal({
        title: o.title || 'Konfirmasi', size: 'sm', body: '<p class="muted" style="line-height:22px">' + esc(o.message || '') + '</p>',
        foot: '<button class="btn btn-outline" data-close>' + esc(o.cancelText || 'Batal') + '</button><button class="btn ' + (o.danger ? 'btn-danger' : 'btn-primary') + '" data-ok>' + esc(o.okText || 'Ya, lanjutkan') + '</button>',
        onClose: v => res(v === true)
      });
      m.$('[data-ok]').addEventListener('click', () => m.close(true));
    });
  }
  let popEl = null;
  function closePop() { if (popEl) { popEl.remove(); popEl = null; document.removeEventListener('mousedown', outside, true); } }
  function outside(e) { if (popEl && !popEl.contains(e.target)) closePop(); }
  function popover(anchor, html, opts) {
    closePop(); opts = opts || {};
    popEl = h('<div class="popover">' + html + '</div>');
    document.body.appendChild(popEl);
    const r = anchor.getBoundingClientRect(), w = popEl.offsetWidth, hgt = popEl.offsetHeight;
    let left = opts.align === 'left' ? r.left : r.right - w; left = Math.max(8, Math.min(left, window.innerWidth - w - 8));
    let top = r.bottom + 6; if (top + hgt > window.innerHeight - 8) top = Math.max(8, r.top - hgt - 6);
    popEl.style.left = left + 'px'; popEl.style.top = top + 'px';
    setTimeout(() => document.addEventListener('mousedown', outside, true), 0);
    on(popEl, 'click', '[data-pop]', (e, t) => { const v = t.getAttribute('data-pop'); closePop(); if (opts.onPick) opts.onPick(v, t); });
    return popEl;
  }
  function menuItems(items) { return items.map(it => it === '-' ? '<div class="nav-sep"></div>' : '<button class="mi ' + (it.danger ? 'danger' : '') + '" data-pop="' + esc(it.v) + '">' + ic(it.icon) + esc(it.label) + '</button>').join(''); }

  // ---------------- Kosong / skeleton ----------------
  function empty(title, text, action, kind) {
    return '<div class="empty">' + illus(kind || 'empty') + '<b>' + esc(title) + '</b>' + (text ? '<div class="small">' + esc(text) + '</div>' : '') + (action || '') + '</div>';
  }
  function skeleton(kind) {
    if (kind === 'dash') return '<div class="dash"><div class="dash-main"><div class="sk" style="height:236px;border-radius:20px"></div><div class="grid g3"><div class="sk sk-card"></div><div class="sk sk-card"></div><div class="sk sk-card"></div></div><div class="grid g2"><div class="sk" style="height:300px;border-radius:16px"></div><div class="sk" style="height:300px;border-radius:16px"></div></div></div><div class="dash-rail"><div class="sk" style="height:420px;border-radius:16px"></div><div class="sk" style="height:260px;border-radius:16px"></div></div></div>';
    if (kind === 'list') return '<div class="stack"><div class="grid g4"><div class="sk sk-card"></div><div class="sk sk-card"></div><div class="sk sk-card"></div><div class="sk sk-card"></div></div><div class="card">' + '<div class="sk sk-line" style="width:40%"></div>'.repeat(1) + Array(6).fill('<div class="sk" style="height:52px;margin:12px 0;border-radius:12px"></div>').join('') + '</div></div>';
    return '<div class="card">' + Array(5).fill('<div class="sk" style="height:44px;margin:12px 0;border-radius:12px"></div>').join('') + '</div>';
  }

  // ---------------- Grafik SVG ----------------
  function ring(pct, size, stroke) {
    size = size || 168; stroke = stroke || 14;
    const r = (size - stroke) / 2, c = 2 * Math.PI * r, v = Math.max(0, Math.min(100, Number(pct) || 0));
    return '<svg viewBox="0 0 ' + size + ' ' + size + '"><circle class="ring-bg" cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke-width="' + stroke + '"/>' +
      '<circle class="ring-fg" cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke-width="' + stroke + '" stroke-linecap="round" stroke-dasharray="' + c + '" stroke-dashoffset="' + c + '" data-offset="' + (c * (1 - v / 100)) + '"/></svg>';
  }
  /** Bar chart: items [{label, value, sub, hi}], opts {max, target, fmt, height} */
  function barChart(items, o) {
    o = o || {};
    const W = o.width || (window.innerWidth < 768 ? 340 : 520), H = o.height || 220, padL = 34, padB = 28, padT = 22, cw = W - padL - 8, ch = H - padB - padT;
    const max = o.max || Math.max(1, ...items.map(i => i.value || 0)) * 1.15;
    const bw = Math.min(48, cw / items.length * .5), gap = cw / items.length;
    let s = '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(o.label || 'Grafik') + '">';
    [0, .5, 1].forEach(t => { const y = padT + ch * (1 - t); s += '<line x1="' + padL + '" x2="' + (W - 4) + '" y1="' + y + '" y2="' + y + '" stroke="#E6EDF5" stroke-width="1"/><text x="' + (padL - 6) + '" y="' + (y + 4) + '" text-anchor="end">' + esc(o.axis ? o.axis(max * t) : Math.round(max * t)) + '</text>'; });
    if (o.target) { const y = padT + ch * (1 - o.target / max); s += '<line x1="' + padL + '" x2="' + (W - 4) + '" y1="' + y + '" y2="' + y + '" stroke="var(--primary)" stroke-dasharray="5 5" stroke-width="1.5" opacity=".7"/>' + (o.targetText === false ? '' : '<text x="' + (W - 6) + '" y="' + (y - 6) + '" text-anchor="end" style="fill:var(--primary);font-weight:600">Target ' + o.target + (o.suffix || '') + '</text>'); }
    items.forEach((it, i) => {
      const x = padL + gap * i + (gap - bw) / 2, v = it.value || 0, hh = v ? Math.max(4, ch * v / max) : 0, y = padT + ch - hh;
      const fill = it.empty ? '#EEF4FA' : (it.hi ? 'var(--primary)' : (o.target && v < o.target ? 'var(--primary-soft-hover)' : 'var(--primary)'));
      s += '<rect class="bar" x="' + x + '" y="' + (padT + ch) + '" width="' + bw + '" height="0" rx="8" fill="' + fill + '" data-y="' + y + '" data-h="' + hh + '"><title>' + esc(it.label + ': ' + (it.title || v)) + '</title></rect>';
      if (it.empty) s += '<rect x="' + x + '" y="' + (padT + ch - 24) + '" width="' + bw + '" height="24" rx="8" fill="none" stroke="#DCE5F0" stroke-dasharray="4 4"/>';
      if (v) s += '<text x="' + (x + bw / 2) + '" y="' + (y - 7) + '" text-anchor="middle" style="fill:var(--text);font-weight:600">' + esc(o.fmt ? o.fmt(v) : v) + '</text>';
      s += '<text x="' + (x + bw / 2) + '" y="' + (H - 8) + '" text-anchor="middle" style="' + (it.hi ? 'fill:var(--primary);font-weight:700' : '') + '">' + esc(it.label) + '</text>';
    });
    return s + '</svg>';
  }
  /** Grouped bars: items [{label, a, b}] */
  function groupBars(items, o) {
    o = o || {};
    const W = o.width || (window.innerWidth < 768 ? 340 : 420), H = o.height || 230, padL = 46, padB = 28, padT = 16, cw = W - padL - 8, ch = H - padB - padT;
    const max = Math.max(1, ...items.map(i => Math.max(i.a || 0, i.b || 0))) * 1.12, gap = cw / items.length, bw = Math.min(22, gap * .28);
    let s = '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(o.label || 'Grafik') + '">';
    [0, .5, 1].forEach(t => { const y = padT + ch * (1 - t); s += '<line x1="' + padL + '" x2="' + (W - 4) + '" y1="' + y + '" y2="' + y + '" stroke="#E6EDF5"/><text x="' + (padL - 6) + '" y="' + (y + 4) + '" text-anchor="end">' + esc(fmt.rpShort(max * t).replace('Rp ', '')) + '</text>'; });
    items.forEach((it, i) => {
      const cx = padL + gap * i + gap / 2;
      [['a', 'var(--primary)', -1], ['b', '#94A3B8', 1]].forEach(k => {
        const v = it[k[0]] || 0, hh = v ? Math.max(3, ch * v / max) : 0, x = cx + (k[2] < 0 ? -bw - 2 : 2), y = padT + ch - hh;
        s += '<rect class="bar" x="' + x + '" y="' + (padT + ch) + '" width="' + bw + '" height="0" rx="5" fill="' + k[1] + '" data-y="' + y + '" data-h="' + hh + '"><title>' + esc(it.label + ' · ' + (k[0] === 'a' ? (o.la || 'A') : (o.lb || 'B')) + ': ' + fmt.rp(v)) + '</title></rect>';
      });
      s += '<text x="' + cx + '" y="' + (H - 8) + '" text-anchor="middle">' + esc(it.label) + '</text>';
    });
    return s + '</svg>';
  }
  function donut(segs, center) {
    const total = segs.reduce((a, s) => a + (s.value || 0), 0), r = 52, c = 2 * Math.PI * r;
    let off = 0, s = '<svg viewBox="0 0 140 140"><circle cx="70" cy="70" r="' + r + '" fill="none" stroke="#EEF4FA" stroke-width="20"/>';
    if (total) segs.forEach(sg => { const len = c * (sg.value || 0) / total; if (len > 0) s += '<circle cx="70" cy="70" r="' + r + '" fill="none" stroke="' + sg.color + '" stroke-width="20" stroke-dasharray="' + len + ' ' + (c - len) + '" stroke-dashoffset="' + (-off) + '"><title>' + esc(sg.label + ': ' + sg.value) + '</title></circle>'; off += len; });
    s += '</svg>';
    const legend = '<div class="legend" style="flex-direction:column;gap:8px">' + segs.map(sg => '<span><i style="background:' + sg.color + '"></i>' + esc(sg.label) + ' <b style="color:var(--text)">' + sg.value + '</b>' + (total ? ' <span class="subtle">(' + Math.round(sg.value / total * 100) + '%)</span>' : '') + '</span>').join('') + '</div>';
    return '<div class="donut-wrap"><div style="position:relative">' + s + (center ? '<div style="position:absolute;inset:0;display:grid;place-items:center;text-align:center"><div><b style="font-size:22px">' + esc(center[0]) + '</b><div class="small muted">' + esc(center[1]) + '</div></div></div>' : '') + '</div>' + legend + '</div>';
  }
  /** Jalankan animasi: count-up angka, ring, bar. Hormati prefers-reduced-motion. */
  function animate(root) {
    const rm = reduceMotion();
    $$('[data-count]', root).forEach(el => {
      const to = Number(el.getAttribute('data-count')) || 0, kind = el.getAttribute('data-fmt') || 'num';
      const f = v => kind === 'rp' ? fmt.rp(v) : kind === 'pct' ? fmt.pct(v) : fmt.num(Math.round(v));
      if (rm || !to) { el.textContent = f(to); return; }
      const t0 = performance.now(), dur = 900;
      const step = t => { const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3); el.textContent = f(kind === 'pct' ? to * e : Math.round(to * e)); if (p < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    });
    requestAnimationFrame(() => requestAnimationFrame(() => {
      $$('.ring-fg[data-offset]', root).forEach(el => { el.style.strokeDashoffset = el.getAttribute('data-offset'); });
      $$('rect.bar[data-h]', root).forEach(el => { el.setAttribute('y', el.getAttribute('data-y')); el.setAttribute('height', el.getAttribute('data-h')); });
      $$('.progress > i[data-w]', root).forEach(el => { el.style.width = el.getAttribute('data-w'); });
    }));
    $$('.stagger', root).forEach(box => Array.from(box.children).forEach((c, i) => { if (!rm) { c.style.animation = 'viewIn .45s var(--ease) both'; c.style.animationDelay = (i * 55) + 'ms'; } }));
  }

  // ---------------- Ilustrasi orisinal (SVG) ----------------
  function illus(kind) {
    if (kind === 'login') return '<svg class="art" viewBox="0 0 520 420" aria-hidden="true">' +
      '<ellipse cx="260" cy="392" rx="210" ry="16" fill="#C7D7EE" opacity=".5"/>' +
      '<circle cx="270" cy="190" r="178" fill="#fff" opacity=".7"/>' +
      '<rect x="96" y="44" width="328" height="214" rx="22" fill="#F59E0B"/><rect x="108" y="56" width="304" height="190" rx="14" fill="#1E3A5F"/>' +
      '<text x="136" y="112" font-family="Inter,Arial" font-size="38" font-weight="800" fill="#FDE68A">A+</text>' +
      '<path d="M140 210 L188 176 L232 192 L280 140 L326 160 L378 112" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" opacity=".95"/>' +
      '<g fill="#fff"><circle cx="188" cy="176" r="6"/><circle cx="280" cy="140" r="6"/><circle cx="378" cy="112" r="7" fill="#FDE68A"/></g>' +
      '<path d="M246 86l8 8 16-16M300 86l8 8 16-16M354 86l8 8 16-16" fill="none" stroke="#86EFAC" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<rect x="160" y="262" width="200" height="10" rx="5" fill="#B45309"/><rect x="190" y="254" width="22" height="8" rx="3" fill="#fff"/><rect x="222" y="255" width="16" height="7" rx="3" fill="#FDE68A"/>' +
      '<circle cx="452" cy="74" r="30" fill="#fff" stroke="#DCE5F0" stroke-width="4"/><path d="M452 56v18l12 8" stroke="#2563EB" stroke-width="4" stroke-linecap="round" fill="none"/>' +
      '<path d="M40 110 L96 88 L70 132 L64 116 Z" fill="#fff" stroke="#93C5FD" stroke-width="3" stroke-linejoin="round"/>' +
      '<rect x="44" y="330" width="432" height="18" rx="9" fill="#BFD0E6"/><rect x="74" y="346" width="12" height="40" rx="5" fill="#A9BCD6"/><rect x="434" y="346" width="12" height="40" rx="5" fill="#A9BCD6"/>' +
      '<rect x="80" y="304" width="96" height="16" rx="4" fill="#2563EB"/><rect x="88" y="288" width="84" height="16" rx="4" fill="#F59E0B"/><rect x="84" y="272" width="88" height="16" rx="4" fill="#16A34A"/><rect x="92" y="320" width="80" height="10" rx="3" fill="#1D4ED8"/>' +
      '<path d="M360 330 L368 286 L412 286 L420 330 Z" fill="#EA580C"/><rect x="362" y="280" width="56" height="10" rx="4" fill="#C2410C"/>' +
      '<g fill="#22C55E"><ellipse cx="376" cy="250" rx="12" ry="30" transform="rotate(-24 376 250)"/><ellipse cx="404" cy="246" rx="12" ry="32" transform="rotate(22 404 246)"/><ellipse cx="390" cy="236" rx="11" ry="36"/></g>' +
      '<rect x="250" y="292" width="34" height="38" rx="6" fill="#fff" stroke="#DCE5F0" stroke-width="3"/><path d="M256 292 L250 256 M266 292 L270 250 M276 292 L288 262" stroke="#2563EB" stroke-width="5" stroke-linecap="round"/>' +
      '<circle cx="64" cy="230" r="8" fill="#FDE68A"/><circle cx="476" cy="200" r="10" fill="#BFDBFE"/><circle cx="440" cy="148" r="5" fill="#F59E0B"/></svg>';
    if (kind === 'hero') return '<svg class="art" viewBox="0 0 380 250" aria-hidden="true">' +
      '<circle cx="250" cy="120" r="110" fill="#fff" opacity=".65"/>' +
      '<rect x="40" y="206" width="320" height="12" rx="6" fill="#BFD0E6"/>' +
      '<rect x="128" y="70" width="168" height="112" rx="12" fill="#1E3A5F"/><rect x="138" y="80" width="148" height="92" rx="7" fill="#EFF6FF"/>' +
      '<rect x="154" y="134" width="16" height="28" rx="4" fill="#93C5FD"/><rect x="178" y="116" width="16" height="46" rx="4" fill="#2563EB"/><rect x="202" y="126" width="16" height="36" rx="4" fill="#93C5FD"/><rect x="226" y="100" width="16" height="62" rx="4" fill="#2563EB"/><rect x="250" y="110" width="16" height="52" rx="4" fill="#F59E0B"/>' +
      '<rect x="110" y="182" width="204" height="12" rx="6" fill="#94A3B8"/><rect x="186" y="194" width="52" height="12" rx="3" fill="#A9BCD6"/>' +
      '<rect x="56" y="178" width="58" height="12" rx="3" fill="#16A34A"/><rect x="60" y="166" width="52" height="12" rx="3" fill="#F59E0B"/><rect x="54" y="190" width="62" height="16" rx="3" fill="#2563EB"/>' +
      '<path d="M318 206 L322 168 L352 168 L356 206 Z" fill="#EA580C"/><g fill="#22C55E"><ellipse cx="328" cy="146" rx="9" ry="22" transform="rotate(-20 328 146)"/><ellipse cx="348" cy="144" rx="9" ry="24" transform="rotate(20 348 144)"/><ellipse cx="338" cy="136" rx="8" ry="26"/></g>' +
      '<g transform="translate(70 70) rotate(-8)"><rect width="56" height="70" rx="8" fill="#fff" stroke="#DCE5F0" stroke-width="3"/><path d="M12 20l5 5 10-10M12 40l5 5 10-10" stroke="#16A34A" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M33 22h12M33 42h12" stroke="#CBD5E1" stroke-width="3.5" stroke-linecap="round"/></g>' +
      '<path d="M300 44l4 10 10 4-10 4-4 10-4-10-10-4 10-4z" fill="#F59E0B"/><path d="M98 34l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="#93C5FD"/><circle cx="350" cy="80" r="6" fill="#BFDBFE"/></svg>';
    return '<svg class="illus" viewBox="0 0 160 120" aria-hidden="true"><ellipse cx="80" cy="108" rx="56" ry="7" fill="#E2EAF4"/>' +
      '<rect x="40" y="16" width="70" height="86" rx="10" fill="#fff" stroke="#DCE5F0" stroke-width="3"/><rect x="60" y="10" width="30" height="12" rx="4" fill="#BFDBFE"/>' +
      '<path d="M52 42h46M52 56h40M52 70h30" stroke="#DCE5F0" stroke-width="5" stroke-linecap="round"/>' +
      '<circle cx="110" cy="74" r="18" fill="#EFF6FF" stroke="#2563EB" stroke-width="4"/><path d="M123 88l14 14" stroke="#2563EB" stroke-width="6" stroke-linecap="round"/>' +
      '<path d="M26 30l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#F59E0B"/></svg>';
  }

  // ---------------- Gambar & berkas ----------------
  function readAsDataURL(file) { return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(new Error('Berkas tidak bisa dibaca.')); r.readAsDataURL(file); }); }
  function loadImg(src) { return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('Gambar tidak valid.')); i.src = src; }); }
  /** Kecilkan gambar di browser sebelum diunggah. square=true → potong tengah persegi. */
  async function resizeImage(fileOrUrl, maxSide, mime, quality, square) {
    const src = typeof fileOrUrl === 'string' ? fileOrUrl : await readAsDataURL(fileOrUrl);
    const img = await loadImg(src);
    let sw = img.naturalWidth, sh = img.naturalHeight, sx = 0, sy = 0;
    if (square) { const m = Math.min(sw, sh); sx = (sw - m) / 2; sy = (sh - m) / 2; sw = sh = m; }
    const scale = Math.min(1, maxSide / Math.max(sw, sh)), w = Math.round(sw * scale), hh = Math.round(sh * scale);
    const c = document.createElement('canvas'); c.width = w; c.height = hh;
    const cx = c.getContext('2d');
    if (mime === 'image/jpeg') { cx.fillStyle = '#fff'; cx.fillRect(0, 0, w, hh); }
    cx.imageSmoothingQuality = 'high';
    cx.drawImage(img, sx, sy, sw, sh, 0, 0, w, hh);
    return c.toDataURL(mime || 'image/jpeg', quality || .85);
  }
  function dataUrlBytes(d) { const b = String(d).split(',')[1] || ''; return Math.floor(b.length * 3 / 4); }
  function b64ToBlob(b64, mime) { const bin = atob(b64), arr = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i); return new Blob([arr], { type: mime }); }
  function download(b64, mime, name) { const url = URL.createObjectURL(b64ToBlob(b64, mime)); const a = document.createElement('a'); a.href = url; a.download = name || 'berkas'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000); }
  /** Pratinjau berkas privat Drive (diambil lewat server). */
  async function openFile(id, title) {
    const m = modal({ title: title || 'Berkas', size: 'lg', body: '<div class="empty"><span class="spinner" style="color:var(--primary)"></span><div>Memuat berkas…</div></div>' });
    const r = await API.api('file.get', { id });
    if (!r.success) { m.$('.modal-body').innerHTML = '<div class="banner danger">' + ic('alert-circle') + '<div>' + esc(r.message) + '</div></div>'; return; }
    const d = r.data, url = URL.createObjectURL(b64ToBlob(d.data, d.mime));
    const isImg = /^image\//.test(d.mime), mobile = window.innerWidth < 768;
    m.$('.modal-body').innerHTML = (isImg ? '<img src="' + url + '" alt="" style="max-width:100%;max-height:70vh;margin:0 auto;border-radius:12px">' :
      (mobile ? '<div class="file-chip">' + ic('file') + '<div class="grow"><b>' + esc(d.nama) + '</b><div class="small muted">Pratinjau PDF di HP: tekan Unduh atau Buka.</div></div></div>' : '<iframe class="pdf-frame" src="' + url + '" title="Pratinjau"></iframe>')) +
      '<div class="row mt" style="justify-content:flex-end"><a class="btn btn-outline btn-sm" href="' + url + '" target="_blank" rel="noopener">' + ic('eye') + 'Buka</a><a class="btn btn-primary btn-sm" href="' + url + '" download="' + esc(d.nama) + '">' + ic('download') + 'Unduh</a></div>';
  }
  async function copyText(t, msg) {
    try { await navigator.clipboard.writeText(t); toast(msg || 'Disalin ke clipboard.'); }
    catch (e) { const ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); toast(msg || 'Disalin ke clipboard.'); } catch (x) { toast('Gagal menyalin.', 'error'); } ta.remove(); }
  }
  function waLink(no, text) { let n = String(no || '').replace(/\D/g, ''); if (n.indexOf('0') === 0) n = '62' + n.slice(1); return 'https://wa.me/' + n + (text ? '?text=' + encodeURIComponent(text) : ''); }

  // ---------------- Warna & tema ----------------
  const hexRgb = h => { const m = /^#?([\da-f]{6})$/i.exec(h || ''); if (!m) return null; const n = parseInt(m[1], 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  const rgbHex = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('').toUpperCase();
  const mix = (a, b, t) => rgbHex(hexRgb(a).map((v, i) => v + (hexRgb(b)[i] - v) * t));
  const lum = h => { const c = hexRgb(h).map(v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; };
  const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
  function themeVars(primary, accent) {
    if (!hexRgb(primary)) primary = '#2563EB'; if (!hexRgb(accent)) accent = '#F59E0B';
    let softText = mix(primary, '#000000', .15); let k = .15; while (contrast(softText, mix(primary, '#FFFFFF', .85)) < 4.5 && k < .7) { k += .08; softText = mix(primary, '#000000', k); }
    const rgb = hexRgb(primary);
    return {
      '--primary': primary, '--primary-hover': mix(primary, '#000000', .14), '--primary-soft': mix(primary, '#FFFFFF', .85), '--primary-soft-hover': mix(primary, '#FFFFFF', .72),
      '--primary-soft-text': softText, '--primary-ring': 'rgba(' + rgb.join(',') + ',.22)', '--on-primary': contrast(primary, '#FFFFFF') >= 3 ? '#FFFFFF' : '#0F172A',
      '--accent': accent, '--accent-soft': mix(accent, '#FFFFFF', .85), '--accent-border': mix(accent, '#FFFFFF', .6), '--accent-text': mix(accent, '#000000', .35),
      '--canvas-start': mix(primary, '#FFFFFF', .965), '--canvas-end': mix(primary, '#FFFFFF', .91)
    };
  }
  function applyTheme(primary, accent, el) { const v = themeVars(primary, accent), t = el || document.documentElement; Object.keys(v).forEach(k => t.style.setProperty(k, v[k])); const m = document.querySelector('meta[name=theme-color]'); if (m && !el) m.setAttribute('content', v['--primary']); }

  // ---------------- CSV ----------------
  function parseCSV(text) {
    text = String(text || '').replace(/^﻿/, '');
    const first = text.split(/\r?\n/)[0] || '';
    const sep = (first.match(/;/g) || []).length > (first.match(/,/g) || []).length ? ';' : (first.indexOf('\t') > -1 ? '\t' : ',');
    const rows = []; let row = [], cur = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) { if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
      else if (c === '"') q = true;
      else if (c === sep) { row.push(cur); cur = ''; }
      else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cur); rows.push(row); row = []; cur = ''; }
      else cur += c;
    }
    if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
    const clean = rows.filter(r => r.some(x => String(x).trim() !== ''));
    if (clean.length < 2) return [];
    const head = clean[0].map(x => x.trim());
    return clean.slice(1).map(r => { const o = {}; head.forEach((k, i) => { if (k) o[k] = (r[i] || '').trim(); }); return o; });
  }

  // ---------------- Lain-lain ----------------
  function debounce(fn, ms) { let t; return function () { const a = arguments; clearTimeout(t); t = setTimeout(() => fn.apply(this, a), ms || 250); }; }
  function setBusy(btn, busy, text) {
    if (!btn) return;
    if (busy) { btn.dataset.html = btn.innerHTML; btn.disabled = true; btn.innerHTML = '<span class="spinner"></span>' + esc(text || 'Menyimpan…'); }
    else { btn.disabled = false; if (btn.dataset.html) btn.innerHTML = btn.dataset.html; }
  }
  function formData(root) {
    const o = {};
    $$('[name]', root).forEach(el => {
      if (el.type === 'checkbox') o[el.name] = el.checked;
      else if (el.type === 'radio') { if (el.checked) o[el.name] = el.value; }
      else if (el.type !== 'file') o[el.name] = el.value.trim();
    });
    return o;
  }
  function fieldError(root, name, msg) {
    $$('.err-msg', root).forEach(e => e.remove()); $$('.invalid', root).forEach(e => e.classList.remove('invalid'));
    if (!name) return;
    const el = $('[name="' + name + '"]', root); if (!el) return;
    el.classList.add('invalid'); el.focus();
    const f = el.closest('.field'); if (f) f.appendChild(h('<div class="err-msg">' + ic('alert-circle', 'ic-sm') + esc(msg) + '</div>'));
  }
  function siswaOptions(list, selected, placeholder) {
    return '<option value="">' + esc(placeholder || 'Pilih siswa…') + '</option>' + list.map(s => '<option value="' + esc(s.id) + '"' + (s.id === selected ? ' selected' : '') + '>' + esc((s.no_absen ? s.no_absen + '. ' : '') + s.nama_lengkap) + '</option>').join('');
  }

  window.UI = {
    esc, $, $$, h, on, ic, fmt, salam, inisial, avatar, statusBadge, STATUS, toast, modal, confirmDlg, popover, closePop, menuItems,
    empty, skeleton, ring, barChart, groupBars, donut, animate, illus, readAsDataURL, loadImg, resizeImage, dataUrlBytes, b64ToBlob, download, openFile,
    copyText, waLink, applyTheme, themeVars, contrast, hexRgb, mix, parseCSV, debounce, setBusy, formData, fieldError, siswaOptions,
    today, addDays, dow, diffDays, isDate, nowParts, pad, BULAN, BULAN_P, HARI, HARI_P, reduceMotion
  };
})();
