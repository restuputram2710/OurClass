/** Data siswa: daftar, detail, form tambah/ubah. */
(function () {
  'use strict';
  const { esc, ic, fmt, $, $$, on } = UI;
  const PER_PAGE = 10;

  // ---------------------------------------------------------------
  //  FORM SISWA (modal)
  // ---------------------------------------------------------------
  function formSiswa(s, onSaved) {
    s = s || {};
    let foto = null, hapusFoto = false;
    const preview = s.foto_thumb ? '<img src="' + s.foto_thumb + '" alt="">' : esc(UI.inisial(s.nama_lengkap || '?'));
    const m = UI.modal({
      title: s.id ? 'Ubah Data Siswa' : 'Tambah Siswa Baru', sub: s.id ? s.nama_lengkap : 'Data dipakai di semua modul (absensi, kas, piket).', size: 'lg',
      body: '<form class="form-stack" novalidate data-f>' +
        '<div class="row" style="gap:16px"><span class="av av-xl c' + 2 + '" data-prev>' + preview + '</span><div class="stack" style="gap:8px"><b>Foto siswa</b><div class="row wrap gap-sm"><label class="btn btn-outline btn-sm" style="position:relative">' + ic('upload') + 'Pilih foto<input type="file" accept="image/*" data-foto style="position:absolute;inset:0;opacity:0;cursor:pointer"></label>' + (s.foto_file_id ? '<button type="button" class="btn btn-danger-ghost btn-sm" data-hapus-foto>' + ic('trash') + 'Hapus</button>' : '') + '</div><span class="help">JPG/PNG. Otomatis dikecilkan sebelum diunggah.</span></div></div>' +
        '<div class="form-grid">' +
        '<div class="field"><label>NIS<span class="req">*</span></label><input class="input" name="nis" value="' + esc(s.nis || '') + '" inputmode="numeric" maxlength="30" required></div>' +
        '<div class="field"><label>No. Absen</label><input class="input" name="no_absen" type="number" min="1" max="99" value="' + esc(s.no_absen || '') + '" placeholder="Otomatis"></div>' +
        '<div class="field full"><label>Nama Lengkap<span class="req">*</span></label><input class="input" name="nama_lengkap" value="' + esc(s.nama_lengkap || '') + '" maxlength="100" required></div>' +
        '<div class="field"><label>Nama Panggilan</label><input class="input" name="nama_panggilan" value="' + esc(s.nama_panggilan || '') + '" maxlength="40"></div>' +
        '<div class="field"><label>Jenis Kelamin<span class="req">*</span></label><div class="seg" data-jk style="width:100%"><button type="button" data-v="L" style="flex:1" class="' + (s.jenis_kelamin === 'L' ? 'on' : '') + '">Laki-laki</button><button type="button" data-v="P" style="flex:1" class="' + (s.jenis_kelamin === 'P' ? 'on' : '') + '">Perempuan</button></div><input type="hidden" name="jenis_kelamin" value="' + esc(s.jenis_kelamin || '') + '"></div>' +
        '<div class="field"><label>Tanggal Lahir</label><input class="input" type="date" name="tanggal_lahir" value="' + esc(s.tanggal_lahir || '') + '" max="' + UI.today() + '"><span class="help">Dipakai untuk pengingat ulang tahun.</span></div>' +
        '<div class="field"><label>Status</label><select class="select" name="status">' + [['aktif', 'Aktif'], ['pindah', 'Pindah'], ['nonaktif', 'Nonaktif']].map(o => '<option value="' + o[0] + '"' + ((s.status || 'aktif') === o[0] ? ' selected' : '') + '>' + o[1] + '</option>').join('') + '</select></div>' +
        '<div class="field full"><label>Alamat</label><textarea class="textarea" name="alamat" rows="2" maxlength="250" style="min-height:70px">' + esc(s.alamat || '') + '</textarea></div>' +
        '<div class="field"><label>Nama Orang Tua / Wali</label><input class="input" name="nama_wali" value="' + esc(s.nama_wali || '') + '" maxlength="80"></div>' +
        '<div class="field"><label>Kontak Wali</label><input class="input" type="tel" name="kontak_wali" value="' + esc(s.kontak_wali || '') + '" placeholder="08xx" maxlength="20"></div>' +
        '</div><div data-err></div></form>',
      foot: '<button class="btn btn-outline" data-close>Batal</button><button class="btn btn-primary" data-save>' + ic('check') + 'Simpan</button>'
    });
    const form = m.$('[data-f]'), idem = API.newIdem();
    on(form, 'click', '[data-jk] button', (e, b) => { $$('[data-jk] button', form).forEach(x => x.classList.toggle('on', x === b)); $('[name=jenis_kelamin]', form).value = b.dataset.v; });
    $('[data-foto]', form).addEventListener('change', async e => {
      const f = e.target.files[0]; if (!f) return;
      if (!/^image\//.test(f.type)) return UI.toast('Pilih berkas gambar.', 'error');
      try {
        const big = await UI.resizeImage(f, 480, 'image/jpeg', .85), thumb = await UI.resizeImage(f, 96, 'image/jpeg', .72, true);
        foto = { data: big, mime: 'image/jpeg', thumb }; hapusFoto = false;
        m.$('[data-prev]').innerHTML = '<img src="' + thumb + '" alt="">';
      } catch (err) { UI.toast(err.message, 'error'); }
    });
    const hf = m.$('[data-hapus-foto]'); if (hf) hf.addEventListener('click', () => { hapusFoto = true; foto = null; m.$('[data-prev]').textContent = UI.inisial(s.nama_lengkap); });
    m.$('[data-save]').addEventListener('click', async e => {
      const d = UI.formData(form);
      if (!d.nis) return UI.fieldError(form, 'nis', 'NIS wajib diisi.');
      if (!d.nama_lengkap) return UI.fieldError(form, 'nama_lengkap', 'Nama lengkap wajib diisi.');
      if (!d.jenis_kelamin) { UI.fieldError(form); return UI.toast('Pilih jenis kelamin.', 'warning'); }
      UI.fieldError(form);
      d.id = s.id;
      UI.setBusy(e.currentTarget, true);
      const r = await API.api('siswa.save', { siswa: d, foto, hapusFoto, _idem: idem });
      UI.setBusy(e.currentTarget, false);
      if (!r.success) { m.$('[data-err]').innerHTML = '<div class="banner danger">' + ic('alert-circle') + '<div>' + esc(r.message) + '</div></div>'; return; }
      m.close(); UI.toast(r.message); if (onSaved) onSaved(r.data.siswa);
    });
  }
  async function arsipkan(s, done) {
    if (!(await UI.confirmDlg({ title: 'Arsipkan siswa?', message: s.nama_lengkap + ' akan disembunyikan dari daftar dan form harian. Riwayatnya tetap tersimpan dan wali kelas dapat memulihkannya dari menu Arsip.', okText: 'Arsipkan', danger: true }))) return;
    const r = await API.api('siswa.archive', { id: s.id });
    UI.toast(r.message, r.success ? 'success' : 'error');
    if (r.success && done) done();
  }

  // ---------------------------------------------------------------
  //  DAFTAR
  // ---------------------------------------------------------------
  async function daftar(view, query) {
    let data = null, filter = 'semua', q = '', sort = 'absen', page = 1;
    const satuan = () => (data && data.satuan) || 'pekan';
    function head() {
      return App.head('Data &amp; Direktori Siswa', 'Kelas ' + esc((App.config || {}).nama_kelas || '') + ' · Total <b data-total>' + (data ? data.siswa.filter(s => s.status === 'aktif').length : '–') + '</b> siswa aktif',
        (App.isWK() ? '<a class="btn btn-outline" href="#/pengaturan/impor">' + ic('upload') + 'Impor Data</a>' : '') + '<button class="btn btn-primary" data-add>' + ic('plus') + 'Tambah Siswa</button>', [['Siswa']]);
    }
    function filtered() {
      const bln = UI.today().slice(5, 7), qq = q.toLowerCase();
      let list = data.siswa.filter(s => {
        if (filter === 'semua' && s.status !== 'aktif') return false;
        if (filter === 'L' && (s.jenis_kelamin !== 'L' || s.status !== 'aktif')) return false;
        if (filter === 'P' && (s.jenis_kelamin !== 'P' || s.status !== 'aktif')) return false;
        if (filter === 'lunas' && (s.tunggakan > 0 || s.status !== 'aktif')) return false;
        if (filter === 'tunggak' && !(s.tunggakan > 0)) return false;
        if (filter === 'ultah' && !(s.tanggal_lahir && s.tanggal_lahir.slice(5, 7) === bln && s.status === 'aktif')) return false;
        if (filter === 'nonaktif' && s.status === 'aktif') return false;
        return !qq || [s.nama_lengkap, s.nis, s.nama_panggilan, s.nama_wali, s.kontak_wali].some(v => String(v || '').toLowerCase().indexOf(qq) > -1);
      });
      const cmp = { absen: (a, b) => (a.no_absen || 999) - (b.no_absen || 999), nama: (a, b) => a.nama_lengkap.localeCompare(b.nama_lengkap), hadir: (a, b) => (a.persen_hadir === null ? 999 : a.persen_hadir) - (b.persen_hadir === null ? 999 : b.persen_hadir), tunggak: (a, b) => b.tunggakan - a.tunggakan }[sort];
      return list.sort(cmp);
    }
    function kasChip(s) { return s.tunggakan > 0 ? '<span class="badge b-red">' + ic('alert-circle') + 'Tunggakan ' + s.tunggakan_periode + ' ' + satuan() + ' (' + fmt.rp(s.tunggakan) + ')</span>' : '<span class="badge b-green">' + ic('check') + 'Lunas</span>'; }
    function hadirBar(s) { const p = s.persen_hadir; if (p === null) return '<span class="small subtle">Belum ada data</span>'; const col = p >= 95 ? 'var(--success)' : p >= 85 ? '#D97706' : 'var(--danger)'; return '<div class="bar-inline"><span class="badge ' + (p >= 95 ? 'b-green' : p >= 85 ? 'b-amber' : 'b-red') + '">' + fmt.pct(p) + '</span><div class="progress"><i style="width:' + p + '%;background:' + col + '"></i></div></div>'; }
    function statusChip(s) { return s.status === 'aktif' ? '<span class="badge b-green">Aktif</span>' : '<span class="badge b-slate">' + (s.status === 'pindah' ? 'Pindah' : 'Nonaktif') + '</span>'; }
    function body() {
      const list = filtered(), pages = Math.max(1, Math.ceil(list.length / PER_PAGE)); page = Math.min(page, pages);
      const slice = list.slice((page - 1) * PER_PAGE, page * PER_PAGE);
      const actions = s => '<div class="row" style="gap:6px;justify-content:flex-end"><a class="btn btn-outline btn-xs" href="#/siswa/' + esc(s.id) + '">Lihat Profil</a><button class="btn btn-ghost btn-icon btn-xs" data-edit="' + esc(s.id) + '" aria-label="Ubah">' + ic('pencil', 'ic-sm') + '</button><button class="btn btn-ghost btn-icon btn-xs" data-more="' + esc(s.id) + '" aria-label="Lainnya">' + ic('more', 'ic-sm') + '</button></div>';
      const tbl = slice.length ? '<div class="table-wrap hide-m"><table class="table"><thead><tr><th>No &amp; Profil Siswa</th><th>Kontak &amp; Nama Wali</th><th>Kehadiran (30 hari)</th><th>Status Kas</th><th>Status</th><th class="r">Aksi</th></tr></thead><tbody>' +
        slice.map(s => '<tr><td><div class="person"><span class="muted num" style="width:22px">' + UI.pad(s.no_absen || 0) + '</span>' + UI.avatar(s.nama_lengkap, s.foto_thumb) + '<div style="min-width:0"><a class="nm" href="#/siswa/' + esc(s.id) + '" style="color:var(--text)">' + esc(s.nama_lengkap) + '</a> <span class="gender ' + esc(s.jenis_kelamin) + '">' + esc(s.jenis_kelamin) + '</span><div class="meta">NIS: ' + esc(s.nis) + '</div></div></div></td>' +
          '<td>' + (s.nama_wali ? '<b style="font-weight:500">' + esc(s.nama_wali) + '</b>' : '<span class="subtle">–</span>') + (s.kontak_wali ? '<div class="small muted row gap-sm" style="gap:4px">' + ic('phone', 'ic-sm') + esc(s.kontak_wali) + '</div>' : '') + '</td>' +
          '<td style="min-width:160px">' + hadirBar(s) + '</td><td>' + kasChip(s) + '</td><td>' + statusChip(s) + '</td><td>' + actions(s) + '</td></tr>').join('') + '</tbody></table></div>' : '';
      const cards = slice.length ? '<div class="list show-m" style="padding:12px">' + slice.map(s => '<div class="li" style="flex-direction:column;align-items:stretch;gap:10px"><div class="person">' + UI.avatar(s.nama_lengkap, s.foto_thumb, 'lg') + '<div style="flex:1;min-width:0"><div class="row gap-sm"><span class="badge b-outline">Absen ' + UI.pad(s.no_absen || 0) + '</span><span class="gender ' + esc(s.jenis_kelamin) + '">' + esc(s.jenis_kelamin) + '</span></div><div class="nm mt-sm">' + esc(s.nama_lengkap) + '</div><div class="meta">NIS: ' + esc(s.nis) + (s.nama_panggilan ? ' · ' + esc(s.nama_panggilan) : '') + '</div></div>' + statusChip(s) + '</div>' +
        '<div class="row wrap gap-sm small">' + (s.persen_hadir === null ? '' : '<span class="row" style="gap:4px">' + ic('check-circle', 'ic-sm') + 'Kehadiran ' + fmt.pct(s.persen_hadir) + '</span>') + kasChip(s) + '</div>' +
        '<div class="row gap-sm"><a class="btn btn-outline btn-sm" style="flex:1" href="#/siswa/' + esc(s.id) + '">' + ic('eye', 'ic-sm') + 'Detail Profil</a><button class="btn btn-outline btn-icon btn-sm" data-edit="' + esc(s.id) + '" aria-label="Ubah">' + ic('pencil', 'ic-sm') + '</button><button class="btn btn-outline btn-icon btn-sm" data-more="' + esc(s.id) + '" aria-label="Lainnya">' + ic('more', 'ic-sm') + '</button></div></div>').join('') + '</div>' : '';
      const none = !slice.length ? UI.empty(data.siswa.length ? 'Tidak ada siswa yang cocok' : 'Belum ada data siswa', data.siswa.length ? 'Ubah kata kunci atau filter.' : 'Tambahkan siswa satu per satu, atau impor dari spreadsheet.', data.siswa.length ? '' : '<div class="row gap-sm"><button class="btn btn-primary btn-sm" data-add>' + ic('plus') + 'Tambah Siswa</button>' + (App.isWK() ? '<a class="btn btn-outline btn-sm" href="#/pengaturan/impor">Impor</a>' : '') + '</div>') : '';
      const foot = list.length ? '<div class="table-foot"><span>Menampilkan <b>' + slice.length + '</b> dari <b>' + list.length + '</b> siswa</span>' + (pages > 1 ? '<div class="pager"><button data-pg="' + (page - 1) + '"' + (page === 1 ? ' disabled' : '') + '>' + ic('chev-l', 'ic-sm') + '</button>' + Array.from({ length: pages }, (_, i) => '<button data-pg="' + (i + 1) + '" class="' + (i + 1 === page ? 'on' : '') + '">' + (i + 1) + '</button>').join('') + '<button data-pg="' + (page + 1) + '"' + (page === pages ? ' disabled' : '') + '>' + ic('chev-r', 'ic-sm') + '</button></div>' : '') + '</div>' : '';
      return tbl + cards + none + foot;
    }
    function full() {
      const aktif = data.siswa.filter(s => s.status === 'aktif'), L = aktif.filter(s => s.jenis_kelamin === 'L').length, P = aktif.length - L;
      const ph = aktif.filter(s => s.persen_hadir !== null), avg = ph.length ? ph.reduce((a, s) => a + s.persen_hadir, 0) / ph.length : null, tung = aktif.filter(s => s.tunggakan > 0).length;
      const bln = UI.today().slice(5, 7), ult = aktif.filter(s => s.tanggal_lahir && s.tanggal_lahir.slice(5, 7) === bln).length;
      const nonaktif = data.siswa.length - aktif.length;
      view.innerHTML = head() + '<div class="stack"><div class="grid g4 stagger">' +
        '<div class="card stat"><div class="row between"><span class="t-label">Total Siswa</span><span class="icon-chip sm">' + ic('grad') + '</span></div><div class="val"><span class="t-metric" data-count="' + aktif.length + '">' + aktif.length + '</span><small>siswa</small></div><div class="foot t-green">' + ic('check-circle', 'ic-sm') + 'Aktif belajar</div></div>' +
        '<div class="card stat"><div class="row between"><span class="t-label">Siswa Laki-laki</span><span class="icon-chip sm">' + ic('user') + '</span></div><div class="val"><span class="t-metric" data-count="' + L + '">' + L + '</span><small>siswa</small></div><div class="foot">Proporsi <b class="t-primary">' + fmt.pct(aktif.length ? L / aktif.length * 100 : 0) + '</b></div></div>' +
        '<div class="card stat"><div class="row between"><span class="t-label">Siswi Perempuan</span><span class="icon-chip sm ic-purple">' + ic('user') + '</span></div><div class="val"><span class="t-metric" data-count="' + P + '">' + P + '</span><small>siswi</small></div><div class="foot">Proporsi <b class="t-purple">' + fmt.pct(aktif.length ? P / aktif.length * 100 : 0) + '</b></div></div>' +
        '<div class="card stat"><div class="row between"><span class="t-label">Kehadiran &amp; Kas</span><span class="icon-chip sm ic-amber">' + ic('insight') + '</span></div><div class="val"><span class="t-metric t-green">' + fmt.pct(avg) + '</span><small>rata-rata</small></div><div class="foot t-red">' + ic('alert', 'ic-sm') + tung + ' siswa menunggak kas</div></div></div>' +
        '<div class="card"><div class="toolbar"><div class="input-wrap">' + ic('search') + '<input class="input" type="search" data-q placeholder="Cari nama, NIS, atau kontak wali…" value="' + esc(q) + '"></div><label class="row gap-sm hide-m"><span class="muted small">Urutkan</span><select class="select" data-sort style="width:190px">' + [['absen', 'No. absen'], ['nama', 'Nama (A–Z)'], ['hadir', 'Kehadiran terendah'], ['tunggak', 'Tunggakan terbesar']].map(o => '<option value="' + o[0] + '"' + (sort === o[0] ? ' selected' : '') + '>' + o[1] + '</option>').join('') + '</select></label></div>' +
        '<div class="chips scroll-x mt">' + [['semua', 'Semua Aktif (' + aktif.length + ')', ''], ['L', 'Laki-laki (' + L + ')', ''], ['P', 'Perempuan (' + P + ')', ''], ['lunas', 'Lunas Kas (' + (aktif.length - tung) + ')', ''], ['tunggak', 'Ada Tunggakan (' + tung + ')', 'c-A'], ['ultah', 'Ulang Tahun Bulan Ini (' + ult + ')', 'c-I']].concat(nonaktif ? [['nonaktif', 'Pindah/Nonaktif (' + nonaktif + ')', '']] : [])
          .map(f => '<button class="chip ' + f[2] + (filter === f[0] ? ' on' : '') + '" data-filter="' + f[0] + '">' + (f[0] === 'ultah' ? ic('cake', 'ic-sm') : '') + f[1] + '</button>').join('') + '</div></div>' +
        '<div class="card flush" data-body>' + body() + '</div></div>';
      UI.animate(view);
    }
    function repaint() { $('[data-body]', view).innerHTML = body(); }
    function byId(id) { return data.siswa.find(s => s.id === id); }

    view.innerHTML = head() + UI.skeleton('list');
    on(view, 'click', '[data-add]', () => formSiswa(null, () => App.reload()));
    on(view, 'click', '[data-edit]', (e, b) => formSiswa(byId(b.dataset.edit), () => App.reload()));
    on(view, 'click', '[data-more]', (e, b) => {
      const s = byId(b.dataset.more);
      UI.popover(b, UI.menuItems([{ v: 'lihat', label: 'Lihat profil', icon: 'eye' }, { v: 'ubah', label: 'Ubah data', icon: 'pencil' }, { v: 'absen', label: 'Rekap absensi', icon: 'absensi' }, '-', { v: 'arsip', label: 'Arsipkan', icon: 'archive', danger: true }]),
        { onPick: v => { if (v === 'lihat') App.go('siswa/' + s.id); else if (v === 'ubah') formSiswa(s, () => App.reload()); else if (v === 'absen') App.go('siswa/' + s.id + '?tab=absensi'); else arsipkan(s, () => App.reload()); } });
    });
    on(view, 'click', '[data-filter]', (e, b) => { filter = b.dataset.filter; page = 1; $$('[data-filter]', view).forEach(x => x.classList.toggle('on', x === b)); repaint(); });
    on(view, 'click', '[data-pg]', (e, b) => { if (b.disabled) return; page = +b.dataset.pg; repaint(); view.querySelector('[data-body]').scrollIntoView({ behavior: UI.reduceMotion() ? 'auto' : 'smooth', block: 'start' }); });
    on(view, 'input', '[data-q]', UI.debounce((e, t) => { q = t.value; page = 1; repaint(); }, 150));
    on(view, 'change', '[data-sort]', (e, t) => { sort = t.value; repaint(); });
    const r = await API.load('siswa.list', {}, { maxAge: 20000, onData: d => { data = d; full(); } });
    if (!r.success && !data) { view.innerHTML = head() + App.errorBox(r.message, true); $('[data-retry]', view).onclick = () => App.reload(); }
    if (query.get('aksi') === 'baru') { history.replaceState(null, '', '#/siswa'); formSiswa(null, () => App.reload()); }
  }

  // ---------------------------------------------------------------
  //  DETAIL
  // ---------------------------------------------------------------
  async function detail(view, id, tab) {
    view.innerHTML = '<a class="back-link" href="#/siswa">' + ic('arrow-l', 'ic-sm') + 'Kembali ke Daftar Siswa</a>' + UI.skeleton();
    const r = await API.load('siswa.get', { id }, { maxAge: 15000 });
    if (!r.success) { view.innerHTML = '<a class="back-link" href="#/siswa">' + ic('arrow-l', 'ic-sm') + 'Kembali</a>' + App.errorBox(r.message); return; }
    const d = r.data, s = d.siswa, today = UI.today(), t = d.absensi.total, tot = t.H + t.I + t.S + t.A, pct = tot ? t.H / tot * 100 : null;
    const usia = s.tanggal_lahir ? (+today.slice(0, 4) - +s.tanggal_lahir.slice(0, 4) - (today.slice(5) < s.tanggal_lahir.slice(5) ? 1 : 0)) : null;
    const satuan = d.kas.periode === 'bulanan' ? 'bulan' : 'pekan';
    const tung = d.kas.tunggakan;
    tab = tab || 'ringkasan';
    const ucapan = 'Selamat ulang tahun ke-' + ((+today.slice(0, 4)) - (+String(s.tanggal_lahir).slice(0, 4))) + ', ' + (s.nama_panggilan || s.nama_lengkap.split(' ')[0]) + '! Semoga sehat selalu dan makin berprestasi.';

    const left = '<div class="card" style="text-align:center"><div class="profile-photo" data-photo>' + (s.foto_thumb ? '<img src="' + s.foto_thumb + '" alt="">' : esc(UI.inisial(s.nama_lengkap))) + '</div>' +
      '<div class="mt"><span class="badge ' + (s.status === 'aktif' ? 'b-green' : 'b-slate') + '"><span class="dot"></span>Siswa ' + esc(s.status === 'aktif' ? 'Aktif' : s.status === 'pindah' ? 'Pindah' : 'Nonaktif') + '</span></div>' +
      '<h2 class="t-h2 mt-sm">' + esc(s.nama_lengkap) + '</h2><div class="small muted">NIS: ' + esc(s.nis) + (s.no_absen ? ' · Absen ' + esc(s.no_absen) : '') + '</div>' +
      '<div class="row gap-sm mt-sm" style="justify-content:center"><span class="badge b-outline">' + (s.jenis_kelamin === 'P' ? 'Perempuan' : 'Laki-laki') + '</span>' + (s.nama_panggilan ? '<span class="badge b-primary">' + esc(s.nama_panggilan) + '</span>' : '') + '</div>' +
      '<div class="divider"></div><div style="text-align:left"><div class="t-over mb">Info Pribadi</div>' +
      (d.ultahHariIni ? '<div class="bday-today mb"><b class="row gap-sm" style="color:var(--accent-text)">' + ic('cake', 'ic-sm') + 'Hari ini ulang tahun ke-' + usia + '!</b></div>' : '') +
      '<dl class="kv"><dt>Tanggal lahir</dt><dd>' + (s.tanggal_lahir ? esc(fmt.tgl(s.tanggal_lahir)) + ' (' + usia + ' th)' : '–') + '</dd><dt>Alamat</dt><dd>' + esc(s.alamat || '–') + '</dd><dt>Piket</dt><dd>' + (d.piket.length ? esc(d.piket.join(', ')) : '–') + '</dd></dl>' +
      '<div class="divider"></div><div class="row between mb"><span class="t-over">Kontak Wali Murid</span></div>' +
      '<div class="li soft" style="flex-direction:column;align-items:stretch;gap:6px"><div class="row gap-sm">' + ic('user', 'ic-sm') + '<b>' + esc(s.nama_wali || '–') + '</b></div><div class="row gap-sm muted">' + ic('phone', 'ic-sm') + esc(s.kontak_wali || '–') + '</div></div>' +
      (s.kontak_wali ? '<div class="row gap-sm mt-sm"><a class="btn btn-success btn-sm" style="flex:1" href="' + UI.waLink(s.kontak_wali) + '" target="_blank" rel="noopener">' + ic('message', 'ic-sm') + 'WhatsApp</a><a class="btn btn-outline btn-sm" style="flex:1" href="tel:' + esc(s.kontak_wali) + '">' + ic('phone', 'ic-sm') + 'Telepon</a></div>' : '') +
      '<div class="divider"></div><div class="t-over mb">Ringkasan</div>' +
      '<div class="li soft" style="flex-direction:column;align-items:stretch"><div class="row between"><span>Kehadiran</span><b class="t-green">' + fmt.pct(pct) + '</b></div><div class="progress mt-sm"><i style="width:' + (pct || 0) + '%;background:var(--success)"></i></div><div class="row gap-sm mt-sm">' + ['H', 'I', 'S', 'A'].map(k => '<span class="badge b-' + k + '">' + k + ': ' + t[k] + '</span>').join('') + '</div></div>' +
      '<div class="li soft mt-sm"><span class="icon-chip sm ' + (tung ? 'ic-red' : 'ic-green') + '">' + ic(tung ? 'alert' : 'check-circle') + '</span><div class="grow"><b>Kas kelas</b><div class="sub">' + (tung ? 'Tunggakan ' + tung.jumlah_periode + ' ' + satuan + ' · ' + fmt.rp(tung.jumlah) : 'Lunas sampai periode berjalan') + '</div></div><span class="badge ' + (tung ? 'b-red' : 'b-green') + '">' + (tung ? 'Menunggak' : 'Lunas') + '</span></div></div></div>';

    // grid 30 hari tercatat
    // hanya hari sekolah Senin–Jumat; Sabtu/Minggu ikut tampil hanya bila memang ada catatan
    const recMap = {}; d.absensi.riwayat.forEach(a => { recMap[a.tanggal] = a; });
    const hari = [];
    for (let i = 55; i >= 0; i--) { const x = UI.addDays(today, -i); if (UI.dow(x) <= 5 || recMap[x]) hari.push(x); }
    const hari30 = hari.slice(-30), awal30 = hari30[0];
    const grid30 = hari30.map(x => '<span class="dchip ' + (recMap[x] ? recMap[x].status : '') + '" title="' + esc(fmt.tglHari(x) + (recMap[x] ? ': ' + UI.STATUS[recMap[x].status][0] : ': belum ada data')) + '">' + UI.pad(+x.slice(8)) + '</span>').join('');
    const tc = { H: 0, I: 0, S: 0, A: 0 }; d.absensi.riwayat.filter(a => a.tanggal >= awal30 && a.tanggal <= today).forEach(a => { if (tc[a.status] !== undefined) tc[a.status]++; });
    const katIc = { Akademik: ['book', '#2563EB'], Sikap: ['smile', '#0F766E'], Prestasi: ['trophy', '#D97706'], Catatan: ['note', '#64748B'] };
    const katB = { Akademik: 'b-primary', Sikap: 'b-teal', Prestasi: 'b-amber', Catatan: 'b-slate' };
    const timeline = d.perkembangan.length ? '<div class="timeline">' + d.perkembangan.map(p => '<div class="tl-item"><span class="tl-dot" style="background:' + katIc[p.kategori][1] + '">' + ic(katIc[p.kategori][0]) + '</span><div class="tl-card"><div class="row between"><span class="badge ' + katB[p.kategori] + '">' + esc(p.kategori) + '</span><span class="small muted">' + esc(fmt.tgl(p.tanggal)) + '</span></div><p>' + esc(p.isi) + '</p><div class="by"><span class="row gap-sm" style="gap:6px">' + ic('pencil', 'ic-sm') + 'Dicatat oleh: <b>' + esc(p.dicatat_oleh || '-') + '</b></span></div></div></div>').join('') + '</div>' : UI.empty('Belum ada catatan perkembangan', 'Catat prestasi, sikap, atau catatan akademik siswa di sini.');

    const tabs = [['ringkasan', 'Ringkasan & Perkembangan', 'home'], ['absensi', 'Riwayat Absensi', 'calendar-check'], ['kas', 'Riwayat Kas', 'wallet']];
    const panel = {
      ringkasan: (d.ultahHariIni ? '<div class="bday-today"><div class="row wrap"><span class="icon-chip" style="background:var(--accent);color:#fff">' + ic('party') + '</span><div style="flex:1;min-width:200px"><b>' + esc(s.nama_lengkap) + ' berulang tahun hari ini!</b><div class="small" style="color:var(--accent-text)">Jangan lupa berikan ucapan selamat di kelas.</div></div><button class="btn btn-sm" style="background:var(--accent);color:#fff" data-ucapan>' + ic('copy', 'ic-sm') + 'Salin Template Ucapan</button></div></div>' : '') +
        '<div class="card"><div class="card-head"><div><div class="card-title">Ringkasan 30 Hari Sekolah Terakhir</div><div class="sub">Tinjauan visual presensi siswa</div></div><span class="badge ' + (tc.A ? 'b-red' : 'b-green') + ' badge-lg">' + ic(tc.A ? 'alert' : 'check-circle') + (tc.A ? tc.A + 'x alpa' : 'Tidak pernah alpa') + '</span></div>' +
        '<div class="legend mb"><span><i style="background:var(--h-bg);border:1px solid #BBF7D0"></i>Hadir (' + tc.H + ')</span><span><i style="background:var(--i-bg)"></i>Izin (' + tc.I + ')</span><span><i style="background:var(--s-bg)"></i>Sakit (' + tc.S + ')</span><span><i style="background:var(--a-bg)"></i>Alpa (' + tc.A + ')</span><span><i style="background:#fff;border:1px solid var(--border)"></i>Belum ada data</span></div><div class="daychips">' + grid30 + '</div></div>' +
        '<div class="card"><div class="card-head"><div class="row"><span class="icon-chip sm">' + ic('insight') + '</span><div><div class="card-title">Timeline Catatan Perkembangan</div><div class="sub">Karakter, prestasi, dan catatan akademik</div></div></div><button class="btn btn-soft btn-sm" data-perk>' + ic('plus') + 'Tambah Catatan</button></div>' + timeline + '</div>',
      absensi: '<div class="card"><div class="card-head"><div class="card-title">Riwayat Absensi (45 hari)</div><span class="small muted">Total: H ' + t.H + ' · I ' + t.I + ' · S ' + t.S + ' · A ' + t.A + '</span></div>' +
        (d.absensi.riwayat.length ? '<div class="list">' + d.absensi.riwayat.slice().reverse().map(a => '<div class="li"><div class="grow"><div class="ttl">' + esc(fmt.tglHari(a.tanggal)) + '</div>' + (a.keterangan ? '<div class="sub">' + esc(a.keterangan) + '</div>' : '') + '</div>' + UI.statusBadge(a.status) + '</div>').join('') + '</div>' : UI.empty('Belum ada catatan absensi', '')) + '</div>',
      kas: '<div class="card"><div class="card-head"><div class="row"><span class="icon-chip sm ic-green">' + ic('wallet') + '</span><div><div class="card-title">Riwayat Transaksi Kas</div><div class="sub">Iuran ' + fmt.rp(d.kas.nominal) + ' per ' + satuan + '</div></div></div><a class="btn btn-primary btn-sm" href="#/kas?aksi=bayar&siswa=' + esc(s.id) + '">' + ic('plus') + 'Catat Bayar</a></div>' +
        (tung ? '<div class="banner danger mb">' + ic('alert') + '<div><b>Tunggakan ' + fmt.rp(tung.jumlah) + '</b> (' + tung.jumlah_periode + ' ' + satuan + ')<div class="period-chips mt-sm">' + tung.periode.map(p => '<span class="badge b-red">' + esc(p) + '</span>').join('') + '</div></div></div>' : '<div class="banner ok mb">' + ic('check-circle') + '<div>Iuran lunas sampai periode berjalan.</div></div>') +
        (d.kas.transaksi.length ? d.kas.transaksi.map(x => '<div class="trx"><span class="io in">' + ic('in') + '</span><div class="grow"><div class="ttl">' + esc(x.kategori) + (x.periode_dibayar ? ' <span class="badge b-green">' + String(x.periode_dibayar).split(',').length + ' ' + satuan + '</span>' : '') + '</div><div class="sub">' + esc(fmt.tgl(x.tanggal)) + ' · dicatat ' + esc(x.dicatat_oleh || '-') + (x.keterangan ? ' · ' + esc(x.keterangan) : '') + '</div></div>' + (x.bukti_file_id ? '<button class="btn btn-ghost btn-xs" data-file="' + esc(x.bukti_file_id) + '">' + ic('image', 'ic-sm') + 'Bukti</button>' : '') + '<span class="amt t-green">+' + fmt.rp(x.nominal) + '</span></div>').join('') : UI.empty('Belum ada pembayaran', '')) + '</div>'
    };
    view.innerHTML = '<div class="row between wrap mb"><div><div class="crumbs"><a href="#/beranda">Beranda</a>' + ic('chev-r') + '<a href="#/siswa">Siswa</a>' + ic('chev-r') + '<b>' + esc(s.nama_lengkap) + '</b></div><a class="back-link" href="#/siswa" style="margin:0">' + ic('arrow-l', 'ic-sm') + 'Kembali ke Daftar Siswa</a></div>' +
      '<div class="page-actions" style="width:auto"><button class="btn btn-outline" data-edit>' + ic('pencil') + 'Ubah Data</button><button class="btn btn-ghost btn-icon" data-more aria-label="Lainnya">' + ic('more') + '</button></div></div>' +
      '<div class="grid" style="grid-template-columns:320px minmax(0,1fr);align-items:start" data-grid>' + left + '<div class="stack"><div class="tabs">' + tabs.map(x => '<button data-tab="' + x[0] + '" class="' + (tab === x[0] ? 'on' : '') + '">' + ic(x[2], 'ic-sm') + esc(x[1]) + '</button>').join('') + '</div><div data-panel class="stack">' + panel[tab] + '</div></div></div>';
    if (window.innerWidth < 1024) $('[data-grid]', view).style.gridTemplateColumns = '1fr';
    // Foto ukuran besar diambil dari Drive (privat) lewat server
    if (s.foto_file_id) API.api('file.get', { id: s.foto_file_id }).then(f => { if (f.success) { const el = $('[data-photo]', view); if (el) el.innerHTML = '<img src="data:' + f.data.mime + ';base64,' + f.data.data + '" alt="">'; } });
    on(view, 'click', '[data-tab]', (e, b) => { tab = b.dataset.tab; $$('[data-tab]', view).forEach(x => x.classList.toggle('on', x === b)); $('[data-panel]', view).innerHTML = panel[tab]; history.replaceState(null, '', '#/siswa/' + s.id + '?tab=' + tab); });
    on(view, 'click', '[data-edit]', () => formSiswa(s, () => { API.invalidate(); App.reload(); }));
    on(view, 'click', '[data-ucapan]', () => UI.copyText(ucapan, 'Template ucapan disalin.'));
    on(view, 'click', '[data-perk]', () => Pages.insight.formPerk({ id_siswa: s.id }, () => App.reload()));
    on(view, 'click', '[data-file]', (e, b) => UI.openFile(b.dataset.file, 'Bukti pembayaran'));
    on(view, 'click', '[data-more]', (e, b) => UI.popover(b, UI.menuItems([{ v: 'kas', label: 'Catat pembayaran kas', icon: 'wallet' }, { v: 'perk', label: 'Tambah catatan', icon: 'insight' }, '-', { v: 'arsip', label: 'Arsipkan siswa', icon: 'archive', danger: true }]),
      { onPick: v => { if (v === 'kas') App.go('kas?aksi=bayar&siswa=' + s.id); else if (v === 'perk') Pages.insight.formPerk({ id_siswa: s.id }, () => App.reload()); else arsipkan(s, () => App.go('siswa')); } }));
  }

  Pages.siswa = {
    title: 'Siswa',
    render(view, r) { return r.params[0] ? detail(view, r.params[0], r.query.get('tab')) : daftar(view, r.query); },
    form: formSiswa
  };
})();
