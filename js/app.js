/**
 * Kerangka aplikasi: boot, tema, login, ganti sandi, shell (sidebar/topbar/bottom nav), router hash.
 */
(function () {
  'use strict';
  const { $, $$, h, on, ic, esc, fmt } = UI;
  const root = document.getElementById('root');
  const Pages = window.Pages = window.Pages || {};
  const App = window.App = { me: null, config: null, page: null, route: null, guard: null };

  const NAV = [
    { id: 'beranda', label: 'Beranda', icon: 'home' },
    { id: 'absensi', label: 'Absensi', icon: 'absensi' },
    { id: 'kas', label: 'Kas', icon: 'kas' },
    { id: 'siswa', label: 'Siswa', icon: 'siswa' },
    { id: 'jadwal', label: 'Jadwal & Piket', icon: 'jadwal' },
    { id: 'insight', label: 'Insight', icon: 'insight' },
    { id: 'notulensi', label: 'Notulensi', icon: 'notulensi' },
    { id: 'periode', label: 'Periode', icon: 'periode', lock: true, cond: me => me.canPeriode }
  ];
  const NAV2 = [
    { id: 'laporan', label: 'Laporan', icon: 'laporan' },
    { id: 'pengaturan', label: 'Pengaturan', icon: 'pengaturan' },
    { id: 'akun', label: 'Kelola Akun', icon: 'akun', cond: me => me.role === 'walikelas' }
  ];
  const BOTTOM = ['beranda', 'absensi', 'kas', 'siswa'];
  const ROLE = { walikelas: 'Wali Kelas', sekretaris: 'Sekretaris' };

  const cfg = () => App.config || {};
  App.roleLabel = r => ROLE[r] || r;
  App.isWK = () => App.me && App.me.role === 'walikelas';
  App.logoHtml = function (big) { const c = cfg(); return c.logo_thumb ? '<img src="' + c.logo_thumb + '" alt="">' : ic('grad', big ? 'ic-xl' : 'ic-lg'); };
  function applyConfig(c) {
    if (!c) return;
    App.config = c;
    try { localStorage.setItem('oc_pub', JSON.stringify(c)); } catch (e) { }
    UI.applyTheme(c.warna_utama, c.warna_aksen);
    document.title = c.nama_aplikasi || 'Our Class';
    const link = $('link[rel=icon]'); if (link && c.logo_thumb) link.href = c.logo_thumb;
  }
  App.applyConfig = c => { applyConfig(c); if (App.me) paintBrand(); };

  // =================================================================
  //  BOOT
  // =================================================================
  async function boot() {
    let cached = null; try { cached = JSON.parse(localStorage.getItem('oc_pub')); } catch (e) { }
    if (cached) applyConfig(cached);
    if (!API.configured()) return renderConfigError();
    API.onAuthFail = msg => { if (App.me) logout(true, msg); };
    API.onMustChange = () => { if (App.me) { App.me.wajib_ganti_sandi = true; renderForcedPassword(); } };
    window.addEventListener('beforeunload', e => { if (App.dirty) { e.preventDefault(); e.returnValue = ''; } });
    if (!API.Token.get()) { renderLogin(); refreshPublic(); return; }
    root.innerHTML = '<div class="boot"><div class="brand-logo">' + App.logoHtml(true) + '</div></div>';
    const r = await API.api('auth.me');
    if (!r.success) {
      if (r.network) return renderOffline(r.message);
      API.Token.clear(); renderLogin(r.code === 'AUTH' ? 'Sesi Anda telah berakhir. Silakan masuk kembali.' : r.message); refreshPublic(); return;
    }
    App.me = r.data.me; applyConfig(r.data.config);
    startShell();
  }
  async function refreshPublic() {
    API.warm('pub');
    const r = await API.api('public.config');
    if (r.success && !App.me) {
      const changed = JSON.stringify(r.data) !== JSON.stringify(App.config);
      applyConfig(r.data);
      if (changed && $('.auth')) { $$('.auth .brand-logo, .auth .logo-xl').forEach(el => { el.innerHTML = App.logoHtml(el.classList.contains('logo-xl')); }); $$('[data-appname]').forEach(el => { el.textContent = r.data.nama_aplikasi; }); $$('[data-kelas]').forEach(el => { el.textContent = r.data.nama_kelas; }); }
    }
  }
  function renderConfigError() {
    root.innerHTML = '<div class="config-err card card-pad-lg"><div class="icon-chip ic-amber" style="margin-bottom:14px">' + ic('alert') + '</div><h1 class="t-h1">Konfigurasi belum lengkap</h1>' +
      '<p class="muted mt-sm" style="line-height:22px">Alamat server (URL Web App Apps Script) belum diisi. Buka berkas <b>js/config.js</b>, ganti nilai <code>GAS_URL</code> dengan URL <code>/exec</code> hasil deploy, lalu unggah ulang ke GitHub.</p>' +
      '<div class="banner info mt">' + ic('info') + '<div>Panduan lengkap ada di <b>PANDUAN-INSTALASI.md</b>, bagian "Menghubungkan frontend".</div></div></div>';
  }
  function renderOffline(msg) {
    root.innerHTML = '<div class="config-err card card-pad-lg" style="text-align:center"><div class="icon-chip ic-red" style="margin:0 auto 14px">' + ic('alert-circle') + '</div><h1 class="t-h2">Tidak dapat terhubung</h1><p class="muted mt-sm">' + esc(msg) + '</p><button class="btn btn-primary mt" data-retry>' + ic('refresh') + 'Coba lagi</button></div>';
    $('[data-retry]').addEventListener('click', boot);
  }

  // =================================================================
  //  LOGIN
  // =================================================================
  function renderLogin(msg) {
    App.me = null; App.dirty = false;
    const c = cfg();
    root.innerHTML =
      '<div class="auth">' +
      '<section class="auth-art"><div class="brand"><span class="brand-logo">' + App.logoHtml() + '</span><span class="brand-text"><b data-appname>' + esc(c.nama_aplikasi || 'Our Class') + '</b><small data-kelas>' + esc(c.nama_kelas || 'Kelas') + '</small></span></div>' +
      UI.illus('login') +
      '<div class="quote"><h2>Semua catatan kelas, dalam satu tempat.</h2><p>Absensi, kas, jadwal piket, hingga laporan PDF — rapi, aman, dan siap dicetak kapan saja.</p></div></section>' +
      '<section class="auth-form"><form class="auth-card" novalidate autocomplete="on">' +
      '<div class="logo-xl">' + App.logoHtml(true) + '</div>' +
      '<h1>Masuk</h1><p class="lead">Kelola kelas <b data-kelas>' + esc(c.nama_kelas || '') + '</b> bersama <span data-appname>' + esc(c.nama_aplikasi || 'Our Class') + '</span>.</p>' +
      (msg ? '<div class="banner warn mb">' + ic('info') + '<div>' + esc(msg) + '</div></div>' : '') +
      '<div class="form-stack">' +
      '<div class="field"><label for="lg-u">Username</label><div class="input-wrap">' + ic('user') + '<input class="input" id="lg-u" name="username" autocomplete="username" autocapitalize="none" spellcheck="false" placeholder="mis. walikelas" required></div></div>' +
      '<div class="field"><label for="lg-p">Kata Sandi</label><div class="input-wrap">' + ic('lock') + '<input class="input" id="lg-p" name="password" type="password" autocomplete="current-password" placeholder="••••••••" required style="padding-right:48px"><button type="button" class="pw-toggle" aria-label="Tampilkan kata sandi">' + ic('eye') + '</button></div></div>' +
      '<div data-err></div>' +
      '<button class="btn btn-primary btn-block" type="submit">Masuk' + ic('arrow-r') + '</button></div>' +
      '<div class="auth-foot">Lupa kata sandi? Hubungi wali kelas.</div></form></section></div>';
    const form = $('.auth-card');
    bindPwToggle(form);
    setTimeout(() => { const u = $('#lg-u'); if (u && window.innerWidth > 767 && !u.value) u.focus(); }, 300);
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const d = UI.formData(form), err = $('[data-err]', form), btn = $('button[type=submit]', form);
      err.innerHTML = '';
      if (!d.username) return UI.fieldError(form, 'username', 'Username wajib diisi.');
      if (!d.password) return UI.fieldError(form, 'password', 'Kata sandi wajib diisi.');
      UI.fieldError(form);
      UI.setBusy(btn, true, 'Memeriksa…');
      const r = await API.api('auth.login', { username: d.username, password: d.password });
      UI.setBusy(btn, false);
      if (!r.success) {
        err.innerHTML = '<div class="banner danger">' + ic('alert-circle') + '<div>' + esc(r.message) + '</div></div>';
        form.classList.remove('shake'); void form.offsetWidth; form.classList.add('shake');
        $('#lg-p').value = ''; $('#lg-p').focus();
        return;
      }
      API.Token.set(r.data.token); API.invalidate();
      App.me = r.data.me; applyConfig(r.data.config);
      const card = $('.auth'); card.style.transition = 'opacity .3s ease, transform .3s ease'; card.style.opacity = '0'; card.style.transform = 'scale(.99)';
      setTimeout(startShell, UI.reduceMotion() ? 0 : 260);
    });
  }
  function bindPwToggle(scope) {
    on(scope, 'click', '.pw-toggle', (e, b) => {
      const inp = b.parentElement.querySelector('input'), show = inp.type === 'password';
      inp.type = show ? 'text' : 'password'; b.innerHTML = ic(show ? 'eye-off' : 'eye'); b.setAttribute('aria-label', show ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi');
    });
  }

  // =================================================================
  //  GANTI SANDI (wajib & sukarela)
  // =================================================================
  function pwForm(forced) {
    return '<form class="form-stack" data-pwform novalidate>' +
      (forced ? '<div class="banner warn">' + ic('key') + '<div><b>Anda wajib mengganti kata sandi sementara.</b><br>Buat kata sandi baru yang hanya Anda ketahui.</div></div>' : '') +
      ['lama|Kata Sandi Lama|current-password', 'baru|Kata Sandi Baru|new-password', 'ulang|Ulangi Kata Sandi Baru|new-password'].map(x => {
        const p = x.split('|');
        return '<div class="field"><label for="pw-' + p[0] + '">' + p[1] + '</label><div class="input-wrap">' + ic('lock') + '<input class="input" id="pw-' + p[0] + '" name="' + p[0] + '" type="password" autocomplete="' + p[2] + '" style="padding-right:48px" required><button type="button" class="pw-toggle" aria-label="Tampilkan">' + ic('eye') + '</button></div>' +
          (p[0] === 'baru' ? '<div class="meter" aria-hidden="true"><i></i><i></i><i></i><i></i></div><div class="row between small"><span class="subtle" data-meter-label>Kekuatan sandi</span></div><div class="checklist"><span data-c="len">' + ic('check', 'ic-sm') + 'Minimal 8 karakter</span><span data-c="mix">' + ic('check', 'ic-sm') + 'Memuat huruf dan angka</span></div>' : '') + '</div>';
      }).join('') +
      '<div data-err></div><button class="btn btn-primary btn-block" type="submit">' + ic('check') + 'Simpan Kata Sandi</button></form>';
  }
  function bindPwForm(scope, onDone) {
    const form = $('[data-pwform]', scope);
    bindPwToggle(form);
    const baru = $('[name=baru]', form);
    baru.addEventListener('input', () => {
      const v = baru.value, len = v.length >= 8, mix = /[A-Za-z]/.test(v) && /\d/.test(v);
      let s = 0; if (v.length >= 8) s++; if (mix) s++; if (v.length >= 12) s++; if (/[^A-Za-z0-9]/.test(v) || (/[a-z]/.test(v) && /[A-Z]/.test(v))) s++;
      const col = ['#DCE5F0', '#DC2626', '#D97706', '#16A34A', '#15803D'][s];
      $$('.meter i', form).forEach((i, k) => { i.style.background = k < s ? col : ''; });
      $('[data-meter-label]', form).textContent = v ? ['Sangat lemah', 'Lemah', 'Sedang', 'Kuat', 'Sangat kuat'][s] : 'Kekuatan sandi';
      $('[data-c=len]', form).classList.toggle('ok', len); $('[data-c=mix]', form).classList.toggle('ok', mix);
    });
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const d = UI.formData(form), btn = $('button[type=submit]', form), err = $('[data-err]', form);
      err.innerHTML = '';
      if (!d.lama) return UI.fieldError(form, 'lama', 'Isi kata sandi lama.');
      if (d.baru.length < 8) return UI.fieldError(form, 'baru', 'Minimal 8 karakter.');
      if (!/[A-Za-z]/.test(d.baru) || !/\d/.test(d.baru)) return UI.fieldError(form, 'baru', 'Harus memuat huruf dan angka.');
      if (d.baru !== d.ulang) return UI.fieldError(form, 'ulang', 'Ulangan kata sandi tidak sama.');
      UI.fieldError(form);
      UI.setBusy(btn, true);
      const r = await API.api('auth.changePassword', { lama: d.lama, baru: d.baru });
      UI.setBusy(btn, false);
      if (!r.success) { err.innerHTML = '<div class="banner danger">' + ic('alert-circle') + '<div>' + esc(r.message) + '</div></div>'; return; }
      API.Token.set(r.data.token); App.me = r.data.me;
      UI.toast('Kata sandi berhasil diganti.');
      onDone();
    });
  }
  function renderForcedPassword() {
    const c = cfg();
    root.innerHTML = '<div class="auth" style="grid-template-columns:1fr"><section class="auth-form" style="margin:0;padding:32px 16px"><div class="auth-card">' +
      '<div class="logo-xl">' + App.logoHtml(true) + '</div><h1>Ganti Kata Sandi</h1><p class="lead">Halo, ' + esc(App.me.nama) + '. Satu langkah lagi sebelum masuk ke ' + esc(c.nama_aplikasi) + '.</p>' +
      pwForm(true) + '<div class="auth-foot"><button class="link-btn" data-out>Keluar</button></div></div></section></div>';
    bindPwForm(root, () => startShell());
    $('[data-out]').addEventListener('click', () => logout(false));
  }
  Pages.sandi = {
    title: 'Ganti Kata Sandi',
    render(view) {
      view.innerHTML = App.head('Ganti Kata Sandi', 'Gunakan kata sandi yang kuat dan hanya Anda yang tahu.') +
        '<div class="card card-pad-lg" style="max-width:520px">' + pwForm(false) + '</div>';
      bindPwForm(view, () => { location.hash = '#/beranda'; });
    }
  };

  // =================================================================
  //  SHELL
  // =================================================================
  function navLink(n) {
    return '<a href="#/' + n.id + '" data-r="' + n.id + '" title="' + esc(n.label) + '">' + ic(n.icon) + '<span>' + esc(n.label) + '</span>' + (n.lock ? ic('lock', 'lock') : '') + '</a>';
  }
  function shellHtml() {
    const me = App.me, c = cfg();
    const nav = NAV.filter(n => !n.cond || n.cond(me)), nav2 = NAV2.filter(n => !n.cond || n.cond(me));
    const sem = 'Semester ' + esc(c.semester || 'Ganjil') + (c.tahun_ajaran ? ' ' + esc(c.tahun_ajaran) : '');
    return '<div class="app">' +
      '<aside class="sidebar" aria-label="Navigasi utama">' +
      '<a class="brand" href="#/beranda"><span class="brand-logo" data-logo>' + App.logoHtml() + '</span><span class="brand-text"><b data-appname>' + esc(c.nama_aplikasi) + '</b><small data-kelas>' + esc(c.nama_kelas) + '</small></span></a>' +
      '<button class="btn btn-soft btn-block quick" data-quick title="Catat cepat">' + ic('plus') + '<span>Catat Cepat</span></button>' +
      '<nav class="nav">' + nav.map(navLink).join('') + '</nav><div class="spacer"></div><div class="nav-sep"></div>' +
      '<nav class="nav">' + nav2.map(navLink).join('') + '</nav>' +
      '<div class="user-card">' + UI.avatar(me.nama, '', 'sm') + '<div class="who"><b>' + esc(me.nama) + '</b><span>' + esc(App.roleLabel(me.role)) + '</span></div><button class="btn btn-ghost btn-icon btn-xs" data-logout title="Keluar" aria-label="Keluar">' + ic('logout', 'ic-sm') + '</button></div>' +
      '</aside>' +
      '<div class="main"><header class="topbar">' +
      '<a class="top-brand" href="#/beranda"><span class="brand-logo" data-logo>' + App.logoHtml() + '</span><span class="tb-txt"><b data-appname>' + esc(c.nama_aplikasi) + '</b><small data-kelas>' + esc(c.nama_kelas) + '</small></span></a>' +
      '<div class="search"><div class="input-wrap">' + ic('search') + '<input class="input" type="search" placeholder="Cari siswa, NIS…" data-search aria-label="Cari siswa"></div><div class="search-pop hidden" role="listbox"></div></div>' +
      '<div class="grow hide-m"></div>' +
      '<span class="sem-chip"><span class="dot"></span><span data-sem>' + sem + '</span></span>' +
      '<button class="icon-btn show-m" data-msearch aria-label="Cari siswa">' + ic('search') + '</button>' +
      '<button class="icon-btn" data-bell aria-label="Pengingat hari ini">' + ic('bell') + '<span class="pip hidden"></span></button>' +
      '<button class="top-user" data-usermenu aria-label="Menu akun">' + UI.avatar(me.nama, '', 'sm') + '<span class="who-txt"><b>' + esc(me.nama) + '</b><span>' + esc(App.roleLabel(me.role)) + ' · ' + esc(c.nama_kelas) + '</span></span></button>' +
      '</header><main id="view" class="view" tabindex="-1"></main></div>' +
      '<nav class="bottomnav" aria-label="Navigasi bawah">' + BOTTOM.map(id => { const n = NAV.find(x => x.id === id); return '<a href="#/' + id + '" data-r="' + id + '">' + ic(n.icon) + '<span>' + (id === 'beranda' ? 'Beranda' : n.label) + '</span></a>'; }).join('') +
      '<button data-more>' + ic('menu') + '<span>Lainnya</span></button></nav></div>';
  }
  function paintBrand() {
    const c = cfg();
    $$('[data-logo]').forEach(el => { el.innerHTML = App.logoHtml(); });
    $$('[data-appname]').forEach(el => { el.textContent = c.nama_aplikasi; });
    $$('[data-kelas]').forEach(el => { el.textContent = c.nama_kelas; });
    const s = $('[data-sem]'); if (s) s.textContent = 'Semester ' + (c.semester || 'Ganjil') + (c.tahun_ajaran ? ' ' + c.tahun_ajaran : '');
  }
  function startShell() {
    if (App.me.wajib_ganti_sandi) return renderForcedPassword();
    root.innerHTML = shellHtml();
    bindShell();
    window.removeEventListener('hashchange', onRoute);
    window.addEventListener('hashchange', onRoute);
    lastHash = '';
    if (!location.hash || location.hash === '#' || location.hash === '#/') location.replace('#/beranda'); else onRoute();
    API.warm('app');
    setTimeout(() => API.load('siswa.list', {}, { maxAge: 120000 }), 1200);
  }
  function bindShell() {
    on(root, 'click', '[data-logout]', () => logout(false));
    on(root, 'click', '[data-quick]', (e, b) => quickMenu(b));
    on(root, 'click', '[data-usermenu]', (e, b) => {
      UI.popover(b, '<div class="ph"><b>' + esc(App.me.nama) + '</b><div class="small muted">@' + esc(App.me.username) + ' · ' + esc(App.roleLabel(App.me.role)) + '</div></div><div class="nav-sep"></div>' +
        UI.menuItems([{ v: 'sandi', label: 'Ganti kata sandi', icon: 'key' }, { v: 'pengaturan', label: 'Pengaturan', icon: 'pengaturan' }, '-', { v: 'keluar', label: 'Keluar', icon: 'logout', danger: true }]),
        { onPick: v => { if (v === 'keluar') logout(false); else location.hash = '#/' + v; } });
    });
    on(root, 'click', '[data-bell]', (e, b) => bellMenu(b));
    on(root, 'click', '[data-more]', () => moreSheet());
    on(root, 'click', '[data-msearch]', () => mobileSearch());
    bindSearch($('.topbar .search'));
  }
  function quickMenu(anchor) {
    UI.popover(anchor, '<div class="ph t-over">Catat cepat</div>' + UI.menuItems([
      { v: 'absensi', label: 'Isi absensi hari ini', icon: 'absensi' },
      { v: 'kas?aksi=bayar', label: 'Catat pembayaran kas', icon: 'kas' },
      { v: 'kas?aksi=keluar', label: 'Catat pengeluaran', icon: 'out' },
      { v: 'insight?aksi=baru', label: 'Catatan perkembangan', icon: 'insight' },
      { v: 'notulensi/baru', label: 'Notulensi rapat baru', icon: 'notulensi' },
      { v: 'siswa?aksi=baru', label: 'Tambah siswa', icon: 'siswa' }
    ]), { align: 'left', onPick: v => { location.hash = '#/' + v; } });
  }
  App.updateBell = function (d) {
    App.bellData = d;
    const pip = $('[data-bell] .pip'); if (!pip || !d) return;
    const sekolah = !d.libur && UI.dow(d.tanggal) <= 5;
    const n = (sekolah && !d.kehadiran.sudah_diisi ? 1 : 0) + d.ultah.filter(u => u.hari_ini).length + (d.perhatian.length ? 1 : 0);
    pip.classList.toggle('hidden', !n);
  };
  async function bellMenu(anchor) {
    let d = App.bellData;
    if (!d) { const r = await API.load('dashboard.get', {}, { maxAge: 60000 }); if (r.success) d = r.data; }
    if (!d) return UI.toast('Gagal memuat pengingat.', 'error');
    const items = [], sekolah = !d.libur && UI.dow(d.tanggal) <= 5;
    if (d.libur) items.push(['calendar', 'Hari ini libur', d.libur, 'beranda']);
    else if (sekolah && !d.kehadiran.sudah_diisi) items.push(['absensi', 'Absensi hari ini belum diisi', 'Isi sebelum jam pertama selesai', 'absensi']);
    else if (sekolah) items.push(['check-circle', 'Absensi hari ini sudah diisi', d.kehadiran.terisi + ' dari ' + d.kehadiran.total + ' siswa', 'absensi']);
    d.ultah.filter(u => u.hari_ini).forEach(u => items.push(['cake', u.nama + ' berulang tahun hari ini', 'Jangan lupa ucapkan selamat', 'beranda']));
    if (d.notulensi.tindak_lanjut_aktif) items.push(['notulensi', d.notulensi.tindak_lanjut_aktif + ' tindak lanjut rapat masih berjalan', 'Lihat notulensi', 'notulensi']);
    if (d.perhatian.length) items.push(['alert', d.perhatian.length + ' siswa perlu perhatian', 'Lihat insight', 'insight']);
    UI.popover(anchor, '<div class="ph"><b>Pengingat hari ini</b><div class="small muted">' + esc(fmt.tglHari(d.tanggal)) + '</div></div><div class="nav-sep"></div>' +
      (items.length ? items.map(i => '<button class="mi" data-pop="' + esc(i[3]) + '" style="align-items:flex-start">' + ic(i[0]) + '<span><b style="display:block;font-weight:600">' + esc(i[1]) + '</b><span class="small muted">' + esc(i[2]) + '</span></span></button>').join('') : '<div class="ph small muted">Tidak ada pengingat.</div>'),
      { onPick: v => { location.hash = '#/' + v; } }).style.maxWidth = '340px';
  }
  function moreSheet() {
    const me = App.me;
    const list = NAV.concat(NAV2).filter(n => BOTTOM.indexOf(n.id) === -1 && (!n.cond || n.cond(me)));
    const m = UI.modal({
      title: 'Menu lainnya', body: '<div class="grid g3" style="grid-template-columns:repeat(3,1fr);gap:10px">' +
        list.map(n => '<a href="#/' + n.id + '" class="tile blue" style="padding:14px 6px;gap:8px" data-close><span class="tic" style="width:42px;height:42px;border-radius:12px">' + ic(n.icon) + '</span><b style="font-size:12px">' + esc(n.label) + '</b></a>').join('') +
        '</div><div class="nav-sep" style="margin:16px 0"></div><div class="list"><a class="li" href="#/sandi" data-close>' + ic('key') + '<span class="grow">Ganti kata sandi</span>' + ic('chev-r') + '</a>' +
        '<button class="li" data-logout2 style="cursor:pointer;color:var(--danger);font:inherit;text-align:left">' + ic('logout') + '<span class="grow">Keluar</span></button></div>'
    });
    m.$('[data-logout2]').addEventListener('click', () => { m.close(); logout(false); });
  }

  // ---- Pencarian siswa ----
  function searchSiswa(q) {
    const hit = API.Store.get('oc_c_siswa.list|{}');
    const list = hit && hit.d ? hit.d.siswa : [];
    q = q.trim().toLowerCase(); if (!q) return [];
    return list.filter(s => String(s.nama_lengkap).toLowerCase().indexOf(q) > -1 || String(s.nis).indexOf(q) > -1 || String(s.nama_panggilan || '').toLowerCase().indexOf(q) > -1).slice(0, 8);
  }
  function resultHtml(res, q) {
    if (!q.trim()) return '';
    if (!res.length) return '<div class="small muted" style="padding:10px">Tidak ada siswa cocok dengan "' + esc(q) + '".</div>';
    return res.map((s, i) => '<div class="mi' + (i === 0 ? ' on' : '') + '" data-go="' + esc(s.id) + '">' + UI.avatar(s.nama_lengkap, s.foto_thumb, 'sm') + '<div><b>' + esc(s.nama_lengkap) + '</b><div class="small muted">NIS ' + esc(s.nis) + '</div></div></div>').join('');
  }
  function bindSearch(box) {
    if (!box) return;
    const inp = $('input', box), pop = $('.search-pop', box);
    const upd = UI.debounce(async () => {
      if (!API.Store.get('oc_c_siswa.list|{}')) await API.load('siswa.list', {});
      const res = searchSiswa(inp.value); pop.innerHTML = resultHtml(res, inp.value); pop.classList.toggle('hidden', !inp.value.trim());
    }, 160);
    inp.addEventListener('input', upd);
    inp.addEventListener('keydown', e => {
      const items = $$('.mi', pop), cur = items.findIndex(x => x.classList.contains('on'));
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); if (!items.length) return; const n = (cur + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length; items.forEach((x, i) => x.classList.toggle('on', i === n)); }
      else if (e.key === 'Enter') { const t = items[cur > -1 ? cur : 0]; if (t) { location.hash = '#/siswa/' + t.dataset.go; inp.value = ''; pop.classList.add('hidden'); inp.blur(); } }
      else if (e.key === 'Escape') { pop.classList.add('hidden'); inp.blur(); }
    });
    on(pop, 'click', '[data-go]', (e, t) => { location.hash = '#/siswa/' + t.dataset.go; inp.value = ''; pop.classList.add('hidden'); });
    document.addEventListener('mousedown', e => { if (!box.contains(e.target)) pop.classList.add('hidden'); });
  }
  function mobileSearch() {
    const m = UI.modal({ title: 'Cari siswa', body: '<div class="search"><div class="input-wrap">' + ic('search') + '<input class="input" type="search" placeholder="Nama atau NIS…" autofocus></div><div class="list mt" data-res></div></div>' });
    const inp = m.$('input'), res = m.$('[data-res]');
    setTimeout(() => inp.focus(), 100);
    inp.addEventListener('input', UI.debounce(async () => {
      if (!API.Store.get('oc_c_siswa.list|{}')) await API.load('siswa.list', {});
      res.innerHTML = resultHtml(searchSiswa(inp.value), inp.value).replace(/class="mi[^"]*"/g, 'class="li" style="cursor:pointer"');
    }, 160));
    on(res, 'click', '[data-go]', (e, t) => { m.close(); location.hash = '#/siswa/' + t.dataset.go; });
  }

  // =================================================================
  //  ROUTER
  // =================================================================
  let lastHash = '';
  function parseHash() {
    const raw = location.hash.replace(/^#\/?/, ''), qi = raw.indexOf('?');
    const path = qi > -1 ? raw.slice(0, qi) : raw, q = new URLSearchParams(qi > -1 ? raw.slice(qi + 1) : '');
    const parts = path.split('/').filter(Boolean).map(decodeURIComponent);
    return { name: parts[0] || 'beranda', params: parts.slice(1), query: q };
  }
  async function onRoute() {
    if (!App.me) return;
    if (App.guard && location.hash !== lastHash) {
      const ok = await App.guard();
      if (!ok) { history.replaceState(null, '', lastHash || '#/beranda'); return; }
    }
    App.guard = null; App.dirty = false; lastHash = location.hash;
    UI.closePop();
    const r = parseHash(), page = Pages[r.name], old = $('#view');
    if (!old) return;
    if (App.page && App.page.leave) { try { App.page.leave(); } catch (e) { } }
    // Elemen view baru setiap pindah halaman → listener halaman lama ikut terbuang
    const view = old.cloneNode(false); old.replaceWith(view);
    $$('.nav a, .bottomnav a').forEach(a => a.classList.toggle('on', a.dataset.r === r.name));
    const more = $('[data-more]'); if (more) more.classList.toggle('on', BOTTOM.indexOf(r.name) === -1);
    document.body.classList.remove('has-sticky');
    App.page = page; App.route = r;
    view.classList.remove('view-enter'); void view.offsetWidth; view.classList.add('view-enter');
    window.scrollTo(0, 0);
    if (!page) { view.innerHTML = UI.empty('Halaman tidak ditemukan', 'Alamat yang Anda buka tidak tersedia.', '<a class="btn btn-primary mt-sm" href="#/beranda">Ke Beranda</a>'); return; }
    if (page.allow && !page.allow(App.me)) { view.innerHTML = App.denied(); return; }
    document.title = (page.title ? page.title + ' · ' : '') + (cfg().nama_aplikasi || 'Our Class');
    try { await page.render(view, r); }
    catch (e) { console.error(e); view.innerHTML = '<div class="banner danger">' + ic('alert-circle') + '<div>Terjadi kesalahan saat menampilkan halaman. ' + esc(e.message) + '</div></div>'; }
  }
  App.go = path => { location.hash = '#/' + path; };
  App.reload = () => onRoute();

  async function logout(expired, msg) {
    const tok = API.Token.get();
    if (!expired && tok) API.api('auth.logout');
    API.Token.clear(); API.invalidate(); App.me = null; App.page = null; App.bellData = null; App.dirty = false; App.guard = null;
    try { sessionStorage.clear(); } catch (e) { }
    history.replaceState(null, '', location.pathname + location.search);
    renderLogin(expired ? (msg || 'Sesi Anda telah berakhir. Silakan masuk kembali.') : '');
    refreshPublic();
  }
  App.logout = logout;

  // =================================================================
  //  HELPER HALAMAN
  // =================================================================
  App.head = function (title, sub, actions, crumbs) {
    return '<div class="page-head"><div>' + (crumbs ? '<div class="crumbs"><a href="#/beranda">Beranda</a>' + crumbs.map((c, i) => ic('chev-r') + (i === crumbs.length - 1 ? '<b>' + esc(c[0]) + '</b>' : '<a href="' + c[1] + '">' + esc(c[0]) + '</a>')).join('') + '</div>' : '') +
      '<h1 class="t-h1">' + title + '</h1>' + (sub ? '<div class="sub">' + sub + '</div>' : '') + '</div>' + (actions ? '<div class="page-actions">' + actions + '</div>' : '') + '</div>';
  };
  App.denied = () => '<div class="card card-pad-lg" style="max-width:520px;margin:40px auto;text-align:center"><div class="icon-chip ic-slate" style="margin:0 auto 14px">' + ic('lock') + '</div><h2 class="t-h2">Anda tidak memiliki akses ke halaman ini</h2><p class="muted mt-sm">Hubungi wali kelas bila Anda memerlukan akses.</p><a class="btn btn-outline mt" href="#/beranda">Kembali ke Beranda</a></div>';
  App.errorBox = (msg, retry) => '<div class="banner danger">' + ic('alert-circle') + '<div class="grow" style="flex:1">' + esc(msg) + '</div>' + (retry ? '<button class="btn btn-sm btn-outline" data-retry>' + ic('refresh') + 'Coba lagi</button>' : '') + '</div>';
  /** Tanyakan sebelum meninggalkan halaman dengan perubahan yang belum disimpan. */
  App.setDirty = function (dirty, msg) {
    App.dirty = !!dirty;
    App.guard = dirty ? () => UI.confirmDlg({ title: 'Tinggalkan halaman?', message: msg || 'Ada perubahan yang belum disimpan. Perubahan akan hilang jika Anda keluar dari halaman ini.', okText: 'Tinggalkan', danger: true }) : null;
  };

  document.addEventListener('DOMContentLoaded', boot);
})();
