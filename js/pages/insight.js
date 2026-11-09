/** Insight (berbasis aturan) & catatan perkembangan siswa. */
(function () {
  'use strict';
  const { esc, ic, fmt, $, $$, on } = UI;
  const KAT = { Akademik: ['book', '#2563EB', 'b-primary'], Sikap: ['smile', '#0F766E', 'b-teal'], Prestasi: ['trophy', '#D97706', 'b-amber'], Catatan: ['note', '#64748B', 'b-slate'] };
  const TIPE = {
    alpa: { label: 'Alpa berulang', icon: 'alert', cls: 'ic-red', b: 'b-red', desc: '≥ 2x alpa dalam 14 hari' },
    tunggakan: { label: 'Tunggakan terlama', icon: 'wallet', cls: 'ic-amber', b: 'b-amber', desc: '≥ 3 periode belum bayar' },
    turun: { label: 'Kehadiran menurun', icon: 'insight', cls: 'ic-purple', b: 'b-purple', desc: 'Kehadiran < 85% (2 pekan)' },
    prestasi: { label: 'Prestasi baru', icon: 'trophy', cls: 'ic-green', b: 'b-green', desc: 'Dicatat 30 hari terakhir' }
  };

  async function formPerk(pre, done) {
    pre = pre || {};
    const rs = await API.load('siswa.list', {}, { maxAge: 120000 });
    const siswa = rs.success ? rs.data.siswa.filter(s => s.status === 'aktif') : [];
    let kat = pre.kategori || 'Akademik';
    const m = UI.modal({
      title: pre.id ? 'Ubah Catatan Perkembangan' : 'Catat Perkembangan Siswa',
      body: '<form class="form-stack" data-f novalidate><div class="form-grid"><div class="field"><label>Siswa<span class="req">*</span></label><select class="select" name="id_siswa">' + UI.siswaOptions(siswa, pre.id_siswa) + '</select></div>' +
        '<div class="field"><label>Tanggal</label><input class="input" type="date" name="tanggal" value="' + esc(pre.tanggal || UI.today()) + '" max="' + UI.today() + '"></div></div>' +
        '<div class="field"><label>Kategori</label><div class="chips" data-kat>' + Object.keys(KAT).map(k => '<button type="button" class="chip' + (k === kat ? ' on' : '') + '" data-v="' + k + '">' + ic(KAT[k][0], 'ic-sm') + k + '</button>').join('') + '</div></div>' +
        '<div class="field"><label>Isi catatan<span class="req">*</span></label><textarea class="textarea" name="isi" maxlength="1000" placeholder="mis. Juara 2 lomba karya tulis tingkat kota.">' + esc(pre.isi || '') + '</textarea><span class="help">Tulis fakta yang perlu ditindaklanjuti. Hindari informasi pribadi yang tidak perlu.</span></div><div data-err></div></form>',
      foot: '<button class="btn btn-outline" data-close>Batal</button><button class="btn btn-primary" data-save>' + ic('check') + 'Simpan Catatan</button>'
    });
    on(m.el, 'click', '[data-kat] button', (e, b) => { kat = b.dataset.v; m.$$('[data-kat] button').forEach(x => x.classList.toggle('on', x === b)); });
    m.$('[data-save]').addEventListener('click', async e => {
      const d = UI.formData(m.$('[data-f]'));
      if (!d.id_siswa) return UI.fieldError(m.el, 'id_siswa', 'Pilih siswa.');
      if (!d.isi) return UI.fieldError(m.el, 'isi', 'Isi catatan wajib diisi.');
      UI.setBusy(e.currentTarget, true);
      const r = await API.api('perk.save', { perk: Object.assign(d, { kategori: kat, id: pre.id }) });
      UI.setBusy(e.currentTarget, false);
      if (!r.success) { m.$('[data-err]').innerHTML = '<div class="banner danger">' + ic('alert-circle') + '<div>' + esc(r.message) + '</div></div>'; return; }
      m.close(); UI.toast(r.message); if (done) done();
    });
  }

  async function render(view, r) {
    let filter = r.query.get('tipe') || 'semua', katF = 'semua';
    view.innerHTML = App.head('Insight &amp; Perkembangan', 'Memuat…', '', [['Insight']]) + UI.skeleton('list');
    const res = await API.load('insight.get', {}, { maxAge: 30000 });
    if (!res.success) { view.innerHTML = App.errorBox(res.message, true); $('[data-retry]', view).onclick = () => App.reload(); return; }
    const d = res.data, reload = () => { API.invalidate(); App.reload(); };
    function daftar() {
      const list = d.insight.filter(i => filter === 'semua' || i.tipe === filter);
      return list.length ? '<div class="list">' + list.map(i => '<div class="attn attn-ins">' + UI.avatar(i.nama, '', '') + '<div class="grow"><div class="row wrap gap-sm"><b>' + esc(i.nama) + '</b><span class="badge ' + TIPE[i.tipe].b + '">' + esc(i.label) + '</span></div><p>' + esc(i.detail) + '</p></div><a class="btn btn-outline btn-xs" href="#/siswa/' + esc(i.id_siswa) + (i.tipe === 'tunggakan' ? '?tab=kas' : i.tipe === 'prestasi' ? '' : '?tab=absensi') + '">Lihat data asal' + ic('chev-r', 'ic-sm') + '</a></div>').join('') + '</div>'
        : '<div class="banner ok">' + ic('check-circle') + '<div>' + (filter === 'semua' ? 'Tidak ada insight saat ini. Kelas dalam kondisi baik.' : 'Tidak ada siswa pada kategori ini.') + '</div></div>';
    }
    function timeline() {
      const list = d.timeline.filter(p => katF === 'semua' || p.kategori === katF);
      return '<div class="chips scroll-x mb">' + ['semua'].concat(Object.keys(KAT)).map(k => '<button class="chip' + (k === katF ? ' on' : '') + '" data-kf="' + k + '">' + (k === 'semua' ? 'Semua' : k) + '</button>').join('') + '</div>' +
        (list.length ? '<div class="timeline">' + list.slice(0, 40).map(p => '<div class="tl-item"><span class="tl-dot" style="background:' + KAT[p.kategori][1] + '">' + ic(KAT[p.kategori][0]) + '</span><div class="tl-card"><div class="row between wrap gap-sm"><div class="row gap-sm"><span class="badge ' + KAT[p.kategori][2] + '">' + esc(p.kategori) + '</span><a href="#/siswa/' + esc(p.id_siswa) + '"><b>' + esc(p.nama) + '</b></a></div><span class="small muted">' + esc(fmt.tgl(p.tanggal)) + '</span></div><p>' + esc(p.isi) + '</p>' +
          '<div class="by"><span>Dicatat oleh <b>' + esc(p.dicatat_oleh || '-') + '</b></span><span class="row" style="gap:4px"><button class="btn btn-ghost btn-xs" data-edit="' + esc(p.id) + '">' + ic('pencil', 'ic-sm') + 'Ubah</button><button class="btn btn-ghost btn-xs" data-arsip="' + esc(p.id) + '">' + ic('archive', 'ic-sm') + '</button></span></div></div></div>').join('') + '</div>'
          : UI.empty('Belum ada catatan', 'Catat prestasi, sikap, dan perkembangan akademik siswa.', '<button class="btn btn-primary btn-sm" data-add>' + ic('plus') + 'Catat Perkembangan</button>'));
    }
    view.innerHTML = App.head('Insight &amp; Perkembangan', 'Pantau siswa yang perlu pembinaan — dihitung otomatis dari absensi, kas, dan catatan (bukan AI).', '<button class="btn btn-primary" data-add>' + ic('plus') + 'Catat Perkembangan</button>', [['Insight']]) +
      '<div class="stack"><div class="grid g4 stagger">' + Object.keys(TIPE).map(t => '<button class="card stat hoverable" data-tipe="' + t + '" style="text-align:left;cursor:pointer;font:inherit;' + (filter === t ? 'border-color:var(--primary);box-shadow:0 0 0 3px var(--primary-ring)' : '') + '"><div class="row between"><span class="t-label">' + TIPE[t].label + '</span><span class="icon-chip sm ' + TIPE[t].cls + '">' + ic(TIPE[t].icon) + '</span></div><div class="val"><span class="t-metric">' + d.ringkasan[t] + '</span><small>siswa</small></div><div class="foot small">' + TIPE[t].desc + '</div></button>').join('') + '</div>' +
      '<div class="grid" style="grid-template-columns:minmax(0,1fr) minmax(0,1fr);align-items:start" data-grid>' +
      '<div class="card"><div class="card-head"><div class="row"><span class="icon-chip sm ic-red">' + ic('alert') + '</span><div><div class="card-title">Daftar Perhatian</div><div class="sub">' + (filter === 'semua' ? 'Semua kategori' : TIPE[filter].label) + '</div></div></div>' + (filter !== 'semua' ? '<button class="link-btn" data-tipe="semua">Tampilkan semua</button>' : '') + '</div><div data-list>' + daftar() + '</div></div>' +
      '<div class="stack"><div class="card"><div class="card-title mb">Proporsi catatan (90 hari)</div>' + UI.donut(Object.keys(KAT).map(k => ({ label: k, value: d.kategori[k], color: KAT[k][1] })), [String(d.timeline.length), 'catatan']) + '</div>' +
      '<div class="card"><div class="card-head"><div class="card-title">Timeline Perkembangan Kelas</div></div><div data-tl>' + timeline() + '</div></div></div></div></div>';
    if (window.innerWidth < 1024) $('[data-grid]', view).style.gridTemplateColumns = '1fr';
    UI.animate(view);
    on(view, 'click', '[data-tipe]', (e, b) => { filter = b.dataset.tipe; $$('.stat[data-tipe]', view).forEach(x => { const onn = x.dataset.tipe === filter; x.style.borderColor = onn ? 'var(--primary)' : ''; x.style.boxShadow = onn ? '0 0 0 3px var(--primary-ring)' : ''; }); $('[data-list]', view).innerHTML = daftar(); });
    on(view, 'click', '[data-kf]', (e, b) => { katF = b.dataset.kf; $('[data-tl]', view).innerHTML = timeline(); });
    on(view, 'click', '[data-add]', () => formPerk({}, reload));
    on(view, 'click', '[data-edit]', (e, b) => formPerk(d.timeline.find(p => p.id === b.dataset.edit), reload));
    on(view, 'click', '[data-arsip]', async (e, b) => {
      if (!(await UI.confirmDlg({ message: 'Arsipkan catatan ini? Wali kelas dapat memulihkannya dari menu Arsip.', okText: 'Arsipkan', danger: true }))) return;
      const x = await API.api('perk.archive', { id: b.dataset.arsip }); UI.toast(x.message, x.success ? 'success' : 'error'); if (x.success) reload();
    });
    if (r.query.get('aksi') === 'baru') { history.replaceState(null, '', '#/insight'); formPerk({}, reload); }
  }
  Pages.insight = { title: 'Insight', render, formPerk };
})();
