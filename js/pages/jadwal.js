/** Jadwal pelajaran & regu piket. */
(function () {
  'use strict';
  const { esc, ic, fmt, $, $$, on } = UI;
  const HARI = [1, 2, 3, 4, 5, 6];

  function formJadwal(j, defHari, done) {
    j = j || {};
    const m = UI.modal({
      title: j.id ? 'Ubah Jadwal' : 'Tambah Mata Pelajaran',
      body: '<form class="form-stack" data-f novalidate><div class="form-grid">' +
        '<div class="field full"><label>Mata pelajaran<span class="req">*</span></label><input class="input" name="mata_pelajaran" value="' + esc(j.mata_pelajaran || '') + '" maxlength="60" placeholder="mis. Matematika Wajib"></div>' +
        '<div class="field full"><label>Hari</label><div class="seg" data-hari style="width:100%;flex-wrap:wrap">' + HARI.map(h => '<button type="button" style="flex:1" data-v="' + h + '" class="' + ((j.hari || defHari) == h ? 'on' : '') + '">' + UI.HARI_P[h] + '</button>').join('') + '</div></div>' +
        '<div class="field"><label>Jam mulai</label><input class="input" type="time" name="jam_mulai" value="' + esc(j.jam_mulai || '07:00') + '"></div>' +
        '<div class="field"><label>Jam selesai</label><input class="input" type="time" name="jam_selesai" value="' + esc(j.jam_selesai || '08:30') + '"></div>' +
        '<div class="field"><label>Guru pengampu</label><input class="input" name="guru" value="' + esc(j.guru || '') + '" maxlength="80"></div>' +
        '<div class="field"><label>Ruang</label><input class="input" name="ruang" value="' + esc(j.ruang || '') + '" maxlength="40" placeholder="mis. Lab Fisika"></div>' +
        '</div><div data-err></div></form>',
      foot: (j.id ? '<button class="btn btn-danger-ghost left" data-arsip>' + ic('archive') + 'Arsipkan</button>' : '') + '<button class="btn btn-outline" data-close>Batal</button><button class="btn btn-primary" data-save>' + ic('check') + 'Simpan</button>'
    });
    let hari = j.hari || defHari;
    on(m.el, 'click', '[data-hari] button', (e, b) => { hari = +b.dataset.v; m.$$('[data-hari] button').forEach(x => x.classList.toggle('on', x === b)); });
    m.$('[data-save]').addEventListener('click', async e => {
      const d = UI.formData(m.$('[data-f]'));
      if (!d.mata_pelajaran) return UI.fieldError(m.el, 'mata_pelajaran', 'Isi mata pelajaran.');
      UI.setBusy(e.currentTarget, true);
      const r = await API.api('jadwal.save', { jadwal: Object.assign(d, { id: j.id, hari }) });
      UI.setBusy(e.currentTarget, false);
      if (!r.success) { m.$('[data-err]').innerHTML = '<div class="banner danger">' + ic('alert-circle') + '<div>' + esc(r.message) + '</div></div>'; return; }
      m.close(); UI.toast(r.message); done();
    });
    const ar = m.$('[data-arsip]');
    if (ar) ar.addEventListener('click', async () => { if (!(await UI.confirmDlg({ message: 'Arsipkan jadwal ' + j.mata_pelajaran + '?', okText: 'Arsipkan', danger: true }))) return; const r = await API.api('jadwal.archive', { id: j.id }); UI.toast(r.message, r.success ? 'success' : 'error'); if (r.success) { m.close(); done(); } });
  }
  function formPiket(siswa, defHari, done) {
    const m = UI.modal({
      title: 'Tambah Petugas Piket', size: 'sm',
      body: '<form class="form-stack" data-f><div class="field"><label>Hari</label><select class="select" name="hari">' + HARI.map(h => '<option value="' + h + '"' + (h == defHari ? ' selected' : '') + '>' + UI.HARI[h] + '</option>').join('') + '</select></div>' +
        '<div class="field"><label>Siswa<span class="req">*</span></label><select class="select" name="id_siswa">' + UI.siswaOptions(siswa) + '</select></div>' +
        '<div class="field"><label>Tugas</label><input class="input" name="tugas" maxlength="60" placeholder="mis. Papan tulis & meja guru" list="tugas-list"><datalist id="tugas-list"><option>Papan tulis & meja guru</option><option>Sapu & pel lantai</option><option>Kaca jendela</option><option>Buang sampah</option><option>Rapikan meja kursi</option></datalist></div><div data-err></div></form>',
      foot: '<button class="btn btn-outline" data-close>Batal</button><button class="btn btn-primary" data-save>' + ic('check') + 'Simpan</button>'
    });
    m.$('[data-save]').addEventListener('click', async e => {
      const d = UI.formData(m.$('[data-f]'));
      if (!d.id_siswa) return UI.fieldError(m.el, 'id_siswa', 'Pilih siswa.');
      UI.setBusy(e.currentTarget, true);
      const r = await API.api('piket.save', { piket: d });
      UI.setBusy(e.currentTarget, false);
      if (!r.success) { m.$('[data-err]').innerHTML = '<div class="banner warn">' + ic('alert') + '<div>' + esc(r.message) + '</div></div>'; return; }
      m.close(); UI.toast(r.message); done();
    });
  }

  async function render(view, r) {
    let tab = r.query.get('tab') || 'jadwal';
    view.innerHTML = App.head('Jadwal Pelajaran &amp; Piket', 'Memuat…', '', [['Jadwal & Piket']]) + UI.skeleton('list');
    const [rj, rs] = await Promise.all([API.load('jadwal.get', {}, { maxAge: 30000 }), API.load('siswa.list', {}, { maxAge: 120000 })]);
    if (!rj.success) { view.innerHTML = App.errorBox(rj.message, true); $('[data-retry]', view).onclick = () => App.reload(); return; }
    const d = rj.data, siswa = rs.success ? rs.data.siswa.filter(s => s.status === 'aktif') : [], today = UI.today();
    const hariIni = d.hari_ini <= 6 ? d.hari_ini : 1;
    let hari = +(r.query.get('hari') || hariIni);
    const reload = () => { API.invalidate(); App.reload(); };
    const byHari = h => d.jadwal.filter(j => +j.hari === h), piketHari = h => d.piket.filter(p => +p.hari === h);
    const nowHM = UI.nowParts().hm;
    const status = j => { if (+j.hari !== d.hari_ini) return ''; if (nowHM >= j.jam_selesai) return 'selesai'; if (nowHM >= j.jam_mulai) return 'berlangsung'; return 'nanti'; };
    const menit = j => { const a = j.jam_mulai.split(':'), b = j.jam_selesai.split(':'); return (+b[0] * 60 + +b[1]) - (+a[0] * 60 + +a[1]); };

    function jadwalHtml() {
      const list = byHari(hari);
      return '<div class="card-head"><div class="row"><span class="icon-chip sm">' + ic('jadwal') + '</span><div><div class="card-title">Jadwal Pelajaran Mingguan</div><div class="sub">Semester ' + esc((App.config || {}).semester || '') + ' ' + esc((App.config || {}).tahun_ajaran || '') + '</div></div></div><button class="btn btn-soft btn-sm" data-add-j>' + ic('plus') + 'Tambah</button></div>' +
        '<div class="chips scroll-x mb">' + HARI.map(h => '<button class="chip' + (h === hari ? ' on' : '') + '" data-hari="' + h + '">' + UI.HARI[h] + (h === d.hari_ini ? ' · Hari ini' : '') + ' <span class="small" style="opacity:.75">' + byHari(h).length + ' sesi</span></button>').join('') + '</div>' +
        (list.length ? '<div class="list">' + list.map(j => {
          const st = status(j);
          const chip = st === 'berlangsung' ? '<span class="badge b-primary"><span class="dot"></span>Sedang berlangsung</span>' : st === 'selesai' ? '<span class="badge b-slate">Selesai</span>' : st === 'nanti' ? '<span class="badge b-amber">Akan datang</span>' : '';
          return '<div class="lesson ' + (st === 'berlangsung' ? 'now' : '') + '" style="background:' + (st === 'berlangsung' ? '#fff' : 'var(--surface)') + ';border:1px solid ' + (st === 'berlangsung' ? 'var(--primary)' : 'var(--border)') + '"><div class="time-box">' + esc(j.jam_mulai) + ' –<br>' + esc(j.jam_selesai) + '<small>' + menit(j) + ' menit</small></div>' +
            '<div style="flex:1;min-width:0"><div class="row wrap gap-sm"><span class="ttl" style="font-size:15px">' + esc(j.mata_pelajaran) + '</span>' + chip + '</div><div class="sub row wrap" style="gap:12px;margin-top:4px">' + (j.guru ? '<span class="row" style="gap:4px">' + ic('user', 'ic-sm') + esc(j.guru) + '</span>' : '') + (j.ruang ? '<span class="row" style="gap:4px">' + ic('pin', 'ic-sm') + esc(j.ruang) + '</span>' : '') + '</div></div>' +
            '<button class="btn btn-ghost btn-icon btn-sm" data-edit-j="' + esc(j.id) + '" aria-label="Ubah">' + ic('pencil', 'ic-sm') + '</button></div>';
        }).join('') + '</div>' : UI.empty('Belum ada jadwal hari ' + UI.HARI[hari], 'Tambahkan mata pelajaran untuk hari ini.', '<button class="btn btn-primary btn-sm" data-add-j>' + ic('plus') + 'Tambah Mata Pelajaran</button>'));
    }
    function piketHtml() {
      return '<div class="card-head"><div class="row"><span class="icon-chip sm ic-amber">' + ic('brush') + '</span><div><div class="card-title">Regu Piket Kebersihan</div><div class="sub">Satu siswa hanya boleh bertugas sekali di hari yang sama</div></div></div><button class="btn btn-soft btn-sm" data-add-p>' + ic('plus') + 'Tambah Petugas</button></div>' +
        '<div class="grid g3">' + HARI.filter(h => h <= 5 || piketHari(h).length).map(h => '<div class="li" style="flex-direction:column;align-items:stretch;' + (h === d.hari_ini ? 'border-color:var(--primary);box-shadow:0 0 0 3px var(--primary-ring)' : '') + '"><div class="row between"><b>' + UI.HARI[h] + (h === d.hari_ini ? ' <span class="badge b-primary">Hari ini</span>' : '') + '</b><span class="small muted">' + piketHari(h).length + ' siswa</span></div>' +
          '<div class="list mt-sm" style="gap:6px">' + (piketHari(h).map(p => '<div class="row" style="gap:8px">' + UI.avatar(p.nama, '', 'sm') + '<div style="flex:1;min-width:0"><div class="small" style="font-weight:600">' + esc(p.nama) + ' <span class="gender ' + esc(p.jenis_kelamin) + '">' + esc(p.jenis_kelamin) + '</span></div><div class="small subtle">' + esc(p.tugas || '–') + '</div></div><button class="btn btn-ghost btn-icon btn-xs" data-hapus-p="' + esc(p.id) + '" aria-label="Hapus petugas">' + ic('x', 'ic-sm') + '</button></div>').join('') || '<span class="small subtle">Belum ada petugas.</span>') + '</div>' +
          '<button class="btn btn-outline btn-xs mt-sm" data-add-p="' + h + '">' + ic('plus', 'ic-sm') + 'Tambah</button></div>').join('') + '</div>';
    }
    const totalSesi = d.jadwal.length, sesiHariIni = byHari(d.hari_ini).length, piketToday = piketHari(d.hari_ini);
    const now = byHari(d.hari_ini).find(j => status(j) === 'berlangsung');
    const regu = '<div class="card"><div class="card-head"><div class="row"><span class="icon-chip sm ic-amber">' + ic('brush') + '</span><div><div class="card-title">Regu Piket Hari Ini</div><div class="sub">' + esc(UI.HARI[d.hari_ini] || '') + ' · ' + piketToday.length + ' petugas</div></div></div></div>' +
      (piketToday.length ? '<div class="list">' + piketToday.map(p => '<div class="li soft">' + UI.avatar(p.nama, '', 'sm') + '<div class="grow"><div class="ttl small">' + esc(p.nama) + '</div><div class="sub">' + esc(p.tugas || '–') + '</div></div></div>').join('') + '</div>' : '<span class="small muted">Tidak ada petugas piket hari ini.</span>') +
      '<div class="divider"></div><div class="card-title mb" style="font-size:14px">Rotasi Regu Mingguan</div><div class="list" style="gap:8px">' + [1, 2, 3, 4, 5].map(h => '<div class="row between small' + (h === d.hari_ini ? ' t-primary' : '') + '"><b>' + UI.HARI[h] + '</b><span class="muted" style="text-align:right;max-width:70%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(piketHari(h).map(p => p.nama.split(' ')[0]).join(', ') || '–') + '</span></div>').join('') + '</div></div>';

    view.innerHTML = App.head('Jadwal Pelajaran &amp; Piket', 'Kelola agenda mata pelajaran mingguan dan rotasi regu piket kelas ' + esc((App.config || {}).nama_kelas || ''),
      '<button class="btn btn-outline" data-tabgo="piket">' + ic('brush') + 'Atur Regu Piket</button><button class="btn btn-primary" data-add-j>' + ic('plus') + 'Tambah Mata Pelajaran</button>', [['Jadwal & Piket']]) +
      '<div class="stack"><div class="grid g4 stagger">' +
      '<div class="card stat"><div class="row between"><span class="t-label">Total Sesi / Pekan</span><span class="icon-chip sm">' + ic('clock') + '</span></div><div class="val"><span class="t-metric">' + totalSesi + '</span><small>sesi</small></div></div>' +
      '<div class="card stat"><div class="row between"><span class="t-label">Petugas Piket Hari Ini</span><span class="icon-chip sm ic-amber">' + ic('brush') + '</span></div><div class="val"><span class="t-metric">' + piketToday.length + '</span><small>siswa</small></div><div class="foot small">' + esc(piketToday.map(p => p.nama.split(' ')[0]).slice(0, 4).join(', ') || '–') + '</div></div>' +
      '<div class="card stat"><div class="row between"><span class="t-label">Jadwal Hari Ini</span><span class="icon-chip sm">' + ic('book') + '</span></div><div class="val"><span class="t-metric t-primary">' + sesiHariIni + '</span><small>sesi</small></div><div class="foot t-primary small">' + (now ? '● ' + esc(now.mata_pelajaran) : 'Tidak ada sesi berjalan') + '</div></div>' +
      '<div class="card stat"><div class="row between"><span class="t-label">Distribusi Piket</span><span class="icon-chip sm ic-green">' + ic('siswa') + '</span></div><div class="val"><span class="t-metric">' + new Set(d.piket.map(p => p.id_siswa)).size + '</span><small>/ ' + siswa.length + ' siswa</small></div><div class="foot small">sudah punya jadwal piket</div></div></div>' +
      '<div class="tabs"><button data-tab="jadwal" class="' + (tab === 'jadwal' ? 'on' : '') + '">' + ic('jadwal', 'ic-sm') + 'Jadwal Pelajaran</button><button data-tab="piket" class="' + (tab === 'piket' ? 'on' : '') + '">' + ic('brush', 'ic-sm') + 'Regu Piket</button></div>' +
      '<div class="grid" style="grid-template-columns:minmax(0,1fr) 320px;align-items:start" data-grid><div class="card" data-panel></div>' + regu + '</div></div>';
    if (window.innerWidth < 1024) $('[data-grid]', view).style.gridTemplateColumns = '1fr';
    const panel = () => { $('[data-panel]', view).innerHTML = tab === 'jadwal' ? jadwalHtml() : piketHtml(); };
    panel(); UI.animate(view);
    on(view, 'click', '[data-tab]', (e, b) => { tab = b.dataset.tab; $$('[data-tab]', view).forEach(x => x.classList.toggle('on', x === b)); panel(); });
    on(view, 'click', '[data-tabgo]', () => { tab = 'piket'; $$('[data-tab]', view).forEach(x => x.classList.toggle('on', x.dataset.tab === 'piket')); panel(); });
    on(view, 'click', '[data-hari]', (e, b) => { hari = +b.dataset.hari; panel(); });
    on(view, 'click', '[data-add-j]', () => formJadwal(null, hari, reload));
    on(view, 'click', '[data-edit-j]', (e, b) => formJadwal(d.jadwal.find(j => j.id === b.dataset.editJ), hari, reload));
    on(view, 'click', '[data-add-p]', (e, b) => formPiket(siswa, +b.dataset.addP || hariIni, reload));
    on(view, 'click', '[data-hapus-p]', async (e, b) => {
      const p = d.piket.find(x => x.id === b.dataset.hapusP);
      if (!(await UI.confirmDlg({ message: 'Hapus ' + p.nama + ' dari regu piket ' + UI.HARI[p.hari] + '?', okText: 'Hapus', danger: true }))) return;
      const res = await API.api('piket.archive', { id: p.id }); UI.toast(res.success ? 'Petugas piket dihapus.' : res.message, res.success ? 'success' : 'error'); if (res.success) reload();
    });
    void today; void fmt;
  }
  Pages.jadwal = { title: 'Jadwal & Piket', render };
})();
