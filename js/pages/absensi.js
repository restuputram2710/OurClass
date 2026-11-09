/** Absensi harian + rekap bulanan. */
(function () {
  'use strict';
  const { esc, ic, fmt, $, $$, on } = UI;
  const ST = ['H', 'I', 'S', 'A'];

  // ---------------------------------------------------------------
  //  HARIAN
  // ---------------------------------------------------------------
  async function harian(view, tanggal) {
    const today = UI.today();
    if (!UI.isDate(tanggal) || tanggal > today) tanggal = today;
    view.innerHTML = UI.skeleton('list');
    const [rs, rd] = await Promise.all([API.load('siswa.list', {}, { maxAge: 120000 }), API.apiQ('absensi.day', { tanggal })]);
    if (!rd.success) { view.innerHTML = App.errorBox(rd.message, true); $('[data-retry]', view).onclick = () => App.reload(); return; }
    const d = rd.data, thumbs = {};
    if (rs.success) rs.data.siswa.forEach(s => { thumbs[s.id] = s.foto_thumb; });
    const state = {}, orig = {};
    d.siswa.forEach(s => { const r = d.records[s.id]; state[s.id] = { status: r ? r.status : '', ket: r ? r.keterangan : '' }; orig[s.id] = JSON.stringify(state[s.id]); });
    let filter = 'semua', q = '';
    const libur = !!d.libur, total = d.siswa.length;

    const head = App.head('Absensi Harian Kelas', esc(fmt.tglPanjang(tanggal)) + ' · ' + esc((App.config || {}).nama_kelas || ''),
      '<div class="seg"><button class="on">Harian</button><button data-go="absensi/rekap">Rekap Bulanan</button></div>' +
      '<button class="btn btn-soft" data-all' + (libur ? ' disabled' : '') + '>' + ic('check-check') + '<span data-all-label>Tandai Semua Hadir</span></button>',
      [['Absensi', '#/absensi'], ['Harian']]);

    const dateCard = '<div class="card"><div class="datebar">' +
      '<div class="datebox"><a class="btn btn-ghost btn-icon btn-sm" href="#/absensi/' + UI.addDays(tanggal, -1) + '" aria-label="Hari sebelumnya">' + ic('chev-l') + '</a>' +
      '<label class="cur">' + ic('calendar', 'ic-sm') + '<span>' + esc(fmt.tglHari(tanggal)) + '</span><input type="date" data-date value="' + tanggal + '" max="' + today + '" aria-label="Pilih tanggal"></label>' +
      (tanggal < today ? '<a class="btn btn-ghost btn-icon btn-sm" href="#/absensi/' + UI.addDays(tanggal, 1) + '" aria-label="Hari berikutnya">' + ic('chev-r') + '</a>' : '<span class="btn btn-ghost btn-icon btn-sm" style="opacity:.3">' + ic('chev-r') + '</span>') + '</div>' +
      (tanggal !== today ? '<a class="btn btn-outline btn-sm" href="#/absensi">Ke hari ini</a>' : '<span class="badge b-primary badge-lg"><span class="dot"></span>Hari ini</span>') +
      (d.tersimpan ? '<span class="pill hide-m">' + ic('cloud', 'ic-sm') + 'Tersimpan ' + esc(fmt.jam(d.tersimpan.at)) + (d.tersimpan.oleh ? ' · ' + esc(d.tersimpan.oleh) : '') + '</span>' : '') +
      '<div style="flex:1"></div><label class="row" style="gap:10px;cursor:pointer"><span class="muted">Tandai hari libur</span><span class="switch"><input type="checkbox" data-libur' + (libur ? ' checked' : '') + '><span></span></span></label></div>' +
      (libur ? '<div class="banner slate mt">' + ic('calendar') + '<div><b>Hari libur: ' + esc(d.libur.keterangan) + '.</b> Tanggal ini tidak dihitung dalam rekap. Matikan tanda libur untuk mengisi absensi.</div></div>' : '') + '</div>';

    const statCard = (s, label, icon, deco) => '<div class="card stat" style="--deco:' + deco + '"><div class="row between"><span class="t-label">' + label + '</span><span class="icon-chip sm ic-' + { H: 'green', I: 'amber', S: 'purple', A: 'red' }[s] + '">' + ic(icon) + '</span></div>' +
      '<div class="val"><span class="t-metric" data-n="' + s + '">0</span><small>' + (s === 'H' ? '/ ' + total + ' siswa' : 'siswa') + '</small></div><div class="foot"><span class="badge b-' + s + '" data-p="' + s + '">0%</span></div></div>';
    const stats = '<div class="grid g4 hide-m">' + statCard('H', 'Total Hadir', 'check-circle', 'var(--h-bg)') + statCard('I', 'Total Izin', 'note', 'var(--i-bg)') + statCard('S', 'Total Sakit', 'plus-circle', 'var(--s-bg)') + statCard('A', 'Tanpa Keterangan (Alpa)', 'alert', 'var(--a-bg)') + '</div>' +
      '<div class="card show-m"><div class="row between"><b>Progres pengisian</b><b class="t-primary" data-pct>0%</b></div><div class="small muted" data-prog-txt></div><div class="progress mt-sm"><i data-prog style="width:0"></i></div>' +
      '<div class="hisa mt">' + ST.map(s => '<div class="' + s + '"><b data-n="' + s + '">0</b><span>' + UI.STATUS[s][0] + '</span></div>').join('') + '</div></div>';

    const filters = '<div class="card"><div class="toolbar"><div class="chips scroll-x" data-filters style="flex:1;min-width:0">' +
      [['semua', 'Semua'], ['kosong', 'Belum diisi'], ['H', 'Hadir'], ['I', 'Izin'], ['S', 'Sakit'], ['A', 'Alpa']].map(f => '<button class="chip ' + (f[0].length === 1 ? 'c-' + f[0] : '') + (f[0] === 'semua' ? ' on' : '') + '" data-f="' + f[0] + '">' + f[1] + ' <span class="cnt">(<span data-fc="' + f[0] + '">0</span>)</span></button>').join('') +
      '</div><div class="input-wrap" style="max-width:280px">' + ic('search') + '<input class="input" type="search" placeholder="Cari nama atau NIS…" data-q></div></div></div>';

    const rows = d.siswa.map((s, i) => {
      const seg = '<div class="status-seg' + (libur ? ' disabled' : '') + '" role="radiogroup" aria-label="Status ' + esc(s.nama_lengkap) + '">' + ST.map(k => '<button type="button" class="' + k + '" data-st="' + k + '" role="radio" aria-label="' + UI.STATUS[k][0] + '">' + ic(UI.STATUS[k][1]) + k + '</button>').join('') + '</div>';
      const tren = (d.tren.data[s.id] || []).map(x => '<i class="' + (x || '') + '" title="' + (x ? UI.STATUS[x][0] : '–') + '"></i>').join('');
      return { s, i, seg, tren };
    });
    const table = '<div class="card flush hide-m"><div class="table-wrap"><table class="table"><thead><tr><th style="width:56px">No</th><th>Nama Lengkap &amp; NIS</th><th class="hide-m">Tren ' + d.tren.tanggal.length + ' Hari</th><th>Status Kehadiran</th><th style="width:28%">Catatan / Keterangan</th></tr></thead><tbody>' +
      rows.map(r => '<tr class="abs-row" data-id="' + esc(r.s.id) + '"><td class="muted num">' + UI.pad(r.s.no_absen || r.i + 1) + '</td>' +
        '<td><div class="person">' + UI.avatar(r.s.nama_lengkap, thumbs[r.s.id]) + '<div style="min-width:0"><div class="nm">' + esc(r.s.nama_lengkap) + ' <span class="gender ' + esc(r.s.jenis_kelamin) + '">' + esc(r.s.jenis_kelamin) + '</span></div><div class="meta">NIS: ' + esc(r.s.nis) + '</div></div></div></td>' +
        '<td><div class="tren">' + (r.tren || '<span class="small subtle">–</span>') + '</div></td><td>' + r.seg + '</td>' +
        '<td><input class="input ket-input" data-ket placeholder="Tambah catatan (opsional)" maxlength="200"' + (libur ? ' disabled' : '') + '></td></tr>').join('') +
      '</tbody></table></div>' + (total ? '' : UI.empty('Belum ada siswa aktif', 'Tambahkan siswa terlebih dahulu di menu Siswa.', '<a class="btn btn-primary btn-sm" href="#/siswa?aksi=baru">Tambah siswa</a>')) + '</div>';
    const cards = '<div class="list show-m">' + rows.map(r => '<div class="card abs-card abs-row" data-id="' + esc(r.s.id) + '"><div class="person"><span style="position:relative">' + UI.avatar(r.s.nama_lengkap, thumbs[r.s.id]) + '<span class="av-badge" style="background:var(--primary)">' + esc(r.s.no_absen || r.i + 1) + '</span></span><div style="flex:1;min-width:0"><div class="nm">' + esc(r.s.nama_lengkap) + ' <span class="gender ' + esc(r.s.jenis_kelamin) + '">' + esc(r.s.jenis_kelamin) + '</span></div><div class="meta">NIS: ' + esc(r.s.nis) + '</div></div><span data-badge></span></div>' + r.seg +
      '<div class="mt-sm"><button class="link-btn small" data-show-ket' + (libur ? ' disabled' : '') + '>' + ic('plus-circle', 'ic-sm') + ' Tambah keterangan</button><input class="input ket-input hidden mt-sm" data-ket placeholder="Keterangan (opsional)" maxlength="200"' + (libur ? ' disabled' : '') + '></div></div>').join('') +
      (total ? '' : UI.empty('Belum ada siswa aktif', '', '<a class="btn btn-primary btn-sm" href="#/siswa?aksi=baru">Tambah siswa</a>')) + '</div>';

    const sticky = libur || !total ? '' : '<div class="sticky-bar"><span class="icon-chip sm ic-green hide-m">' + ic('check-circle') + '</span><div class="grow"><div><b data-filled>0</b> dari ' + total + ' siswa sudah diisi <span class="badge b-green" data-done-chip>0% lengkap</span></div><div class="small muted hide-m" data-dirty-txt>Belum ada perubahan</div></div>' +
      '<button class="btn btn-outline hide-m" data-reset>Batal</button><button class="btn btn-primary" data-save>' + ic('check') + 'Simpan Absensi</button></div>';

    view.innerHTML = head + '<div class="stack">' + dateCard + stats + filters + table + cards + '</div>' + sticky;
    if (sticky) document.body.classList.add('has-sticky');

    // ---- isi nilai awal & sinkron UI ----
    const rowsOf = id => $$('.abs-row[data-id="' + CSS.escape(id) + '"]', view);
    function paintRow(id) {
      const st = state[id];
      rowsOf(id).forEach(row => {
        $$('[data-st]', row).forEach(b => { const on_ = b.dataset.st === st.status; b.classList.toggle('on', on_); b.setAttribute('aria-checked', on_); });
        $$('[data-ket]', row).forEach(inp => { if (document.activeElement !== inp) inp.value = st.ket; if (st.ket) inp.classList.remove('hidden'); });
        const bd = $('[data-badge]', row); if (bd) bd.innerHTML = UI.statusBadge(st.status);
        row.classList.toggle('changed', JSON.stringify(st) !== orig[id]);
      });
    }
    function counts() {
      const c = { H: 0, I: 0, S: 0, A: 0, kosong: 0 };
      d.siswa.forEach(s => { const x = state[s.id].status; if (x) c[x]++; else c.kosong++; });
      return c;
    }
    function changed() { return d.siswa.filter(s => JSON.stringify(state[s.id]) !== orig[s.id]).length; }
    function refresh() {
      const c = counts(), filled = total - c.kosong, pct = total ? Math.round(filled / total * 1000) / 10 : 0, n = changed();
      ST.forEach(s => { $$('[data-n="' + s + '"]', view).forEach(el => { el.textContent = c[s]; }); const p = $('[data-p="' + s + '"]', view); if (p) p.textContent = fmt.pct(total ? c[s] / total * 100 : 0) + (s === 'H' ? ' kehadiran' : ' dari kelas'); });
      $$('[data-fc]', view).forEach(el => { const f = el.dataset.fc; el.textContent = f === 'semua' ? total : c[f]; });
      const pe = $('[data-pct]', view); if (pe) pe.textContent = fmt.pct(pct);
      const pg = $('[data-prog]', view); if (pg) pg.style.width = pct + '%';
      const pt = $('[data-prog-txt]', view); if (pt) pt.textContent = filled + ' / ' + total + ' siswa terdata';
      const fl = $('[data-filled]', view); if (fl) fl.textContent = filled;
      const dc = $('[data-done-chip]', view); if (dc) { dc.textContent = fmt.pct(pct) + ' lengkap'; dc.className = 'badge ' + (pct === 100 ? 'b-green' : 'b-amber'); }
      const dt = $('[data-dirty-txt]', view); if (dt) dt.textContent = n ? n + ' perubahan belum disimpan' : (d.tersimpan ? 'Tersimpan ' + fmt.jam(d.tersimpan.at) + ' · ' + d.tersimpan.oleh : 'Belum ada perubahan');
      const al = $('[data-all-label]', view); if (al) al.textContent = 'Tandai Semua Hadir (' + (c.kosong || total) + ')';
      App.setDirty(n > 0, n + ' perubahan absensi belum disimpan. Tinggalkan halaman?');
    }
    function applyFilter() {
      const qq = q.toLowerCase();
      d.siswa.forEach(s => {
        const st = state[s.id].status;
        const okF = filter === 'semua' || (filter === 'kosong' ? !st : st === filter);
        const okQ = !qq || s.nama_lengkap.toLowerCase().indexOf(qq) > -1 || String(s.nis).indexOf(qq) > -1;
        rowsOf(s.id).forEach(r => r.classList.toggle('hidden', !(okF && okQ)));
      });
    }
    d.siswa.forEach(s => paintRow(s.id)); refresh();

    on(view, 'click', '[data-st]', (e, b) => {
      const id = b.closest('.abs-row').dataset.id;
      state[id].status = state[id].status === b.dataset.st && !d.records[id] ? '' : b.dataset.st;
      paintRow(id); refresh(); if (filter !== 'semua') applyFilter();
    });
    on(view, 'input', '[data-ket]', (e, inp) => { const id = inp.closest('.abs-row').dataset.id; state[id].ket = inp.value; refresh(); });
    on(view, 'click', '[data-show-ket]', (e, b) => { const i = b.parentElement.querySelector('[data-ket]'); i.classList.remove('hidden'); i.focus(); b.classList.add('hidden'); });
    on(view, 'click', '[data-f]', (e, b) => { filter = b.dataset.f; $$('[data-f]', view).forEach(x => x.classList.toggle('on', x === b)); applyFilter(); });
    $('[data-q]', view).addEventListener('input', UI.debounce(e => { q = e.target.value; applyFilter(); }, 150));
    on(view, 'click', '[data-go]', (e, b) => App.go(b.dataset.go));
    $('[data-date]', view).addEventListener('change', e => { if (e.target.value) location.hash = '#/absensi/' + e.target.value; });
    const allBtn = $('[data-all]', view);
    if (allBtn) allBtn.addEventListener('click', () => {
      const kosong = d.siswa.filter(s => !state[s.id].status);
      (kosong.length ? kosong : d.siswa).forEach(s => { state[s.id].status = 'H'; paintRow(s.id); });
      refresh(); applyFilter(); UI.toast((kosong.length || total) + ' siswa ditandai hadir. Ubah yang berhalangan, lalu simpan.', 'info');
    });
    const reset = $('[data-reset]', view);
    if (reset) reset.addEventListener('click', () => { d.siswa.forEach(s => { state[s.id] = JSON.parse(orig[s.id]); paintRow(s.id); }); refresh(); applyFilter(); });
    const save = $('[data-save]', view);
    if (save) save.addEventListener('click', async () => {
      const recs = d.siswa.filter(s => state[s.id].status).map(s => ({ id_siswa: s.id, status: state[s.id].status, keterangan: state[s.id].ket }));
      if (!recs.length) return UI.toast('Belum ada status yang dipilih.', 'warning');
      const kosong = total - recs.length;
      if (kosong && !(await UI.confirmDlg({ title: 'Simpan sebagian?', message: kosong + ' siswa belum diisi statusnya. Simpan yang sudah diisi saja?', okText: 'Simpan' }))) return;
      UI.setBusy(save, true);
      const r = await API.api('absensi.save', { tanggal, records: recs, _idem: API.newIdem() });
      UI.setBusy(save, false);
      if (!r.success) return UI.toast(r.message, 'error');
      d.siswa.forEach(s => { orig[s.id] = JSON.stringify(state[s.id]); paintRow(s.id); });
      d.tersimpan = { at: new Date().toISOString(), oleh: App.me.nama };
      App.setDirty(false); refresh();
      UI.toast(r.message);
    });
    $('[data-libur]', view).addEventListener('change', async e => {
      const cb = e.target, mau = cb.checked;
      let ket = '';
      if (mau) {
        const m = UI.modal({ title: 'Tandai hari libur', size: 'sm', body: '<div class="field"><label>Keterangan</label><input class="input" data-k placeholder="mis. Libur nasional" maxlength="100"></div><p class="help mt-sm">Tanggal libur tidak dihitung dalam rekap absensi.</p>', foot: '<button class="btn btn-outline" data-close>Batal</button><button class="btn btn-primary" data-ok>Tandai Libur</button>', onClose: v => { if (v !== true) cb.checked = false; } });
        const ok = await new Promise(res => { m.$('[data-ok]').onclick = () => { ket = m.$('[data-k]').value; m.close(true); res(true); }; m.el.addEventListener('click', ev => { if (ev.target.closest('[data-close]')) res(false); }); });
        if (!ok) return;
      } else if (!(await UI.confirmDlg({ message: 'Hapus tanda libur untuk tanggal ini?', okText: 'Hapus tanda' }))) { cb.checked = true; return; }
      const r = await API.api('absensi.libur', { tanggal, libur: mau, keterangan: ket });
      if (!r.success) { cb.checked = !mau; return UI.toast(r.message, 'error'); }
      UI.toast(r.message); App.setDirty(false); App.reload();
    });
  }

  // ---------------------------------------------------------------
  //  REKAP BULANAN
  // ---------------------------------------------------------------
  async function rekap(view, bulan) {
    const now = UI.today().slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(bulan || '')) bulan = now;
    view.innerHTML = App.head('Rekap Absensi', esc(fmt.bulan(bulan)), '<div class="seg"><button data-go="absensi">Harian</button><button class="on">Rekap Bulanan</button></div>', [['Absensi', '#/absensi'], ['Rekap']]) + UI.skeleton('list');
    const r = await API.apiQ('absensi.rekap', { bulan });
    if (!r.success) { view.innerHTML = App.errorBox(r.message); return; }
    const d = r.data, t = d.total, semua = t.H + t.I + t.S + t.A;
    view.innerHTML = App.head('Rekap Absensi', esc(fmt.bulan(bulan)) + ' · ' + d.hari_efektif + ' hari tercatat',
      '<div class="seg"><button data-go="absensi">Harian</button><button class="on">Rekap Bulanan</button></div><input type="month" class="input" style="width:170px" data-bulan value="' + bulan + '" max="' + now + '"><button class="btn btn-primary" data-pdf' + (d.hari_efektif ? '' : ' disabled') + '>' + ic('printer') + 'Cetak PDF</button>', [['Absensi', '#/absensi'], ['Rekap']]) +
      '<div class="stack"><div class="grid g4 stagger">' +
      '<div class="card stat" style="--deco:var(--primary-soft)"><span class="t-label">Kehadiran kelas</span><div class="val"><span class="t-metric">' + fmt.pct(d.persen) + '</span></div><div class="foot">' + t.H + ' dari ' + semua + ' catatan</div></div>' +
      '<div class="card stat" style="--deco:var(--i-bg)"><span class="t-label">Izin</span><div class="val"><span class="t-metric t-amber">' + t.I + '</span></div><div class="foot">kali</div></div>' +
      '<div class="card stat" style="--deco:var(--s-bg)"><span class="t-label">Sakit</span><div class="val"><span class="t-metric t-purple">' + t.S + '</span></div><div class="foot">kali</div></div>' +
      '<div class="card stat" style="--deco:var(--a-bg)"><span class="t-label">Alpa</span><div class="val"><span class="t-metric t-red">' + t.A + '</span></div><div class="foot">kali</div></div></div>' +
      '<div class="grid" style="grid-template-columns:minmax(0,1fr) 320px" id="rk-grid">' +
      '<div class="card flush"><div class="card-head"><div class="card-title">Rekap per siswa</div></div>' + (d.siswa.length ? '<div class="table-wrap"><table class="table"><thead><tr><th>No</th><th>Nama</th><th class="c">H</th><th class="c">I</th><th class="c">S</th><th class="c">A</th><th>% Hadir</th></tr></thead><tbody>' +
        d.siswa.map((s, i) => '<tr><td class="muted">' + (s.no_absen || i + 1) + '</td><td><a href="#/siswa/' + esc(s.id) + '"><b>' + esc(s.nama_lengkap) + '</b></a><div class="small subtle">' + esc(s.nis) + '</div></td><td class="c">' + s.H + '</td><td class="c">' + s.I + '</td><td class="c">' + s.S + '</td><td class="c ' + (s.A ? 't-red' : '') + '">' + s.A + '</td>' +
          '<td style="min-width:150px"><div class="bar-inline"><div class="progress"><i data-w="' + (s.persen || 0) + '%" style="width:0;background:' + (s.persen === null ? 'var(--border)' : s.persen >= 95 ? 'var(--success)' : s.persen >= 85 ? '#D97706' : 'var(--danger)') + '"></i></div><b class="num small">' + fmt.pct(s.persen) + '</b></div></td></tr>').join('') +
        '</tbody></table></div>' : UI.empty('Belum ada data', 'Isi absensi harian terlebih dahulu.')) + '</div>' +
      '<div class="card"><div class="card-title mb">Proporsi kehadiran</div>' + UI.donut([{ label: 'Hadir', value: t.H, color: '#15803D' }, { label: 'Izin', value: t.I, color: '#D97706' }, { label: 'Sakit', value: t.S, color: '#9333EA' }, { label: 'Alpa', value: t.A, color: '#B91C1C' }], [fmt.pct(d.persen), 'hadir']) +
      '<div class="banner info mt">' + ic('info') + '<div class="small">Persentase = Hadir ÷ jumlah hari tercatat. Hari yang ditandai libur tidak dihitung.</div></div></div></div></div>';
    if (window.innerWidth < 1024) $('#rk-grid', view).style.gridTemplateColumns = '1fr';
    UI.animate(view);
    on(view, 'click', '[data-go]', (e, b) => App.go(b.dataset.go));
    $('[data-bulan]', view).addEventListener('change', e => { if (e.target.value) location.hash = '#/absensi/rekap?bulan=' + e.target.value; });
    $('[data-pdf]', view).addEventListener('click', e => Pages.laporan.buat('absensi', { bulan }, e.currentTarget));
  }

  Pages.absensi = {
    title: 'Absensi',
    render(view, r) {
      if (r.params[0] === 'rekap') return rekap(view, r.query.get('bulan'));
      return harian(view, r.params[0]);
    },
    leave() { document.body.classList.remove('has-sticky'); }
  };
})();
