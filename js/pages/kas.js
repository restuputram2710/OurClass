/** Kas & tunggakan. */
(function () {
  'use strict';
  const { esc, ic, fmt, $, $$, on } = UI;
  const KAT_KELUAR = ['Perlengkapan', 'Kegiatan', 'Konsumsi', 'Kebersihan', 'Sosial', 'Lainnya'];

  async function buktiPayload(file) {
    if (!file) return null;
    if (file.type === 'application/pdf') {
      if (file.size > 5 * 1048576) throw new Error('PDF bukti maksimal 5 MB.');
      return { data: await UI.readAsDataURL(file), mime: 'application/pdf' };
    }
    if (!/^image\//.test(file.type)) throw new Error('Bukti harus berupa gambar (JPG/PNG) atau PDF.');
    const d = await UI.resizeImage(file, 1400, 'image/jpeg', .82);
    if (UI.dataUrlBytes(d) > 5 * 1048576) throw new Error('Gambar bukti terlalu besar.');
    return { data: d, mime: 'image/jpeg' };
  }
  function dropzone(label) { return '<div class="dropzone" data-dz>' + ic('upload') + '<b>' + esc(label) + '</b><div class="small">JPG, PNG, atau PDF · maks. 5 MB</div><input type="file" accept="image/*,application/pdf" data-file></div><div data-fileinfo></div>'; }
  function bindDropzone(m, onFile) {
    const inp = m.$('[data-file]'), info = m.$('[data-fileinfo]'), dz = m.$('[data-dz]');
    ['dragenter', 'dragover'].forEach(ev => dz.addEventListener(ev, () => dz.classList.add('drag')));
    ['dragleave', 'drop'].forEach(ev => dz.addEventListener(ev, () => dz.classList.remove('drag')));
    inp.addEventListener('change', () => {
      const f = inp.files[0]; onFile(f || null);
      info.innerHTML = f ? '<div class="file-chip mt-sm">' + ic(f.type === 'application/pdf' ? 'file' : 'image') + '<div class="grow" style="flex:1;min-width:0"><b class="small" style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(f.name) + '</b><span class="small muted">' + Math.round(f.size / 1024) + ' KB</span></div><button type="button" class="btn btn-ghost btn-icon btn-xs" data-clear aria-label="Hapus">' + ic('x', 'ic-sm') + '</button></div>' : '';
      const c = info.querySelector('[data-clear]'); if (c) c.onclick = () => { inp.value = ''; info.innerHTML = ''; onFile(null); };
    });
  }

  // ---------------------------------------------------------------
  //  FORM PEMBAYARAN / PEMASUKAN
  // ---------------------------------------------------------------
  function formBayar(k, siswaList, pre, done) {
    pre = pre || {};
    const conf = k.pengaturan, satuan = conf.periode === 'bulanan' ? 'bulan' : 'pekan', tung = {};
    k.tunggakan.forEach(t => { tung[t.id_siswa] = t; });
    let file = null, kategori = pre.kategori || 'Iuran';
    const m = UI.modal({
      title: 'Catat Pembayaran', sub: 'Iuran ' + fmt.rp(conf.nominal_iuran) + ' per ' + satuan, size: 'lg',
      body: '<form class="form-stack" novalidate data-f>' +
        '<div class="field"><label>Jenis pemasukan</label><div class="seg" data-kat style="width:100%"><button type="button" style="flex:1" data-v="Iuran" class="' + (kategori === 'Iuran' ? 'on' : '') + '">Iuran kas</button><button type="button" style="flex:1" data-v="Lainnya" class="' + (kategori !== 'Iuran' ? 'on' : '') + '">Pemasukan lain</button></div></div>' +
        '<div class="form-grid"><div class="field"><label>Siswa<span class="req" data-req>*</span></label><select class="select" name="id_siswa">' + UI.siswaOptions(siswaList, pre.id_siswa) + '</select></div>' +
        '<div class="field"><label>Tanggal<span class="req">*</span></label><input class="input" type="date" name="tanggal" value="' + UI.today() + '" max="' + UI.today() + '"></div></div>' +
        '<div class="field" data-periode-box><div class="row between"><label>Periode yang dibayar</label><button type="button" class="link-btn" data-pilih-tunggak>Pilih semua tunggakan</button></div><div class="period-chips" data-periode></div><span class="help">Garis merah = belum dibayar. Garis putus-putus = bayar di muka.</span></div>' +
        '<div class="form-grid"><div class="field"><label>Nominal<span class="req">*</span></label><div class="input-wrap"><span class="input-prefix">Rp</span><input class="input num" name="nominal" inputmode="numeric" placeholder="0"></div><span class="help" data-nom-help></span></div>' +
        '<div class="field"><label>Keterangan</label><input class="input" name="keterangan" maxlength="200" placeholder="Opsional"></div></div>' +
        '<div class="field"><label>Bukti pembayaran (opsional)</label>' + dropzone('Unggah foto atau PDF bukti') + '</div><div data-err></div></form>',
      foot: '<button class="btn btn-outline" data-close>Batal</button><button class="btn btn-primary" data-save>' + ic('check') + 'Simpan Pembayaran</button>'
    });
    const form = m.$('[data-f]'), idem = API.newIdem();
    let dipilih = {};
    const nomInp = $('[name=nominal]', form);
    const fmtNom = v => (Number(String(v).replace(/\D/g, '')) || 0).toLocaleString('id-ID');
    nomInp.addEventListener('input', () => { const pos = nomInp.value.length; nomInp.value = nomInp.value.replace(/\D/g, '') ? fmtNom(nomInp.value) : ''; void pos; });
    function paintPeriode() {
      const sid = $('[name=id_siswa]', form).value, t = tung[sid], belum = {};
      (t ? t.periode : []).forEach(p => { belum[p] = 1; });
      $('[data-periode]', form).innerHTML = sid ? k.periode_pilihan.map(p => '<button type="button" class="pchip ' + (belum[p.short] ? 'unpaid ' : '') + (p.depan ? 'future ' : '') + (dipilih[p.key] ? 'on' : '') + '" data-p="' + esc(p.key) + '" title="' + esc(p.label) + '">' + (dipilih[p.key] ? ic('check', 'ic-sm') : '') + esc(p.short) + '</button>').join('') : '<span class="small muted">Pilih siswa terlebih dahulu.</span>';
      const n = Object.keys(dipilih).length;
      if (kategori === 'Iuran') { nomInp.value = n ? fmtNom(n * conf.nominal_iuran) : ''; $('[data-nom-help]', form).textContent = n ? n + ' ' + satuan + ' × ' + fmt.rp(conf.nominal_iuran) : (t ? 'Tunggakan: ' + fmt.rp(t.jumlah) + ' (' + t.jumlah_periode + ' ' + satuan + ')' : sid ? 'Siswa ini sudah lunas.' : ''); }
    }
    function pilihTunggakan() { const t = tung[$('[name=id_siswa]', form).value]; dipilih = {}; if (t) k.periode_pilihan.forEach(p => { if (t.periode.indexOf(p.short) > -1) dipilih[p.key] = 1; }); paintPeriode(); }
    function paintKat() {
      $$('[data-kat] button', form).forEach(b => b.classList.toggle('on', b.dataset.v === kategori));
      $('[data-periode-box]', form).classList.toggle('hidden', kategori !== 'Iuran');
      $('[data-req]', form).classList.toggle('hidden', kategori !== 'Iuran');
      if (kategori !== 'Iuran') { $('[data-nom-help]', form).textContent = 'Mis. donasi, sisa kegiatan, dll.'; }
      else paintPeriode();
    }
    on(form, 'click', '[data-kat] button', (e, b) => { kategori = b.dataset.v; dipilih = {}; nomInp.value = ''; paintKat(); });
    $('[name=id_siswa]', form).addEventListener('change', () => { pilihTunggakan(); });
    on(form, 'click', '[data-p]', (e, b) => { const key = b.dataset.p; if (dipilih[key]) delete dipilih[key]; else dipilih[key] = 1; paintPeriode(); });
    on(form, 'click', '[data-pilih-tunggak]', pilihTunggakan);
    bindDropzone(m, f => { file = f; });
    if (pre.id_siswa) pilihTunggakan();
    paintKat();
    m.$('[data-save]').addEventListener('click', async e => {
      const d = UI.formData(form), nominal = Number(String(d.nominal).replace(/\D/g, ''));
      if (kategori === 'Iuran' && !d.id_siswa) return UI.fieldError(form, 'id_siswa', 'Pilih siswa.');
      if (!d.tanggal) return UI.fieldError(form, 'tanggal', 'Isi tanggal.');
      if (!(nominal > 0)) return UI.fieldError(form, 'nominal', 'Nominal harus lebih dari 0.');
      if (kategori === 'Iuran' && !Object.keys(dipilih).length && !(await UI.confirmDlg({ message: 'Belum ada periode yang dipilih. Simpan pembayaran tanpa periode?', okText: 'Simpan' }))) return;
      UI.fieldError(form);
      let bukti = null;
      try { bukti = await buktiPayload(file); } catch (err) { return UI.toast(err.message, 'error'); }
      UI.setBusy(e.currentTarget, true);
      const r = await API.api('kas.save', { trx: { jenis: 'Pemasukan', kategori, id_siswa: d.id_siswa, tanggal: d.tanggal, nominal, keterangan: d.keterangan, periode_dibayar: Object.keys(dipilih) }, bukti, _idem: idem });
      UI.setBusy(e.currentTarget, false);
      if (!r.success) { m.$('[data-err]').innerHTML = '<div class="banner danger">' + ic('alert-circle') + '<div>' + esc(r.message) + '</div></div>'; return; }
      m.close(); UI.toast(r.message); done();
    });
  }
  function formKeluar(k, done) {
    let file = null;
    const m = UI.modal({
      title: 'Catat Pengeluaran', sub: 'Saldo saat ini ' + fmt.rp(k.ringkasan.saldo),
      body: '<form class="form-stack" novalidate data-f><div class="form-grid">' +
        '<div class="field"><label>Tanggal<span class="req">*</span></label><input class="input" type="date" name="tanggal" value="' + UI.today() + '" max="' + UI.today() + '"></div>' +
        '<div class="field"><label>Kategori</label><select class="select" name="kategori">' + KAT_KELUAR.map(x => '<option>' + x + '</option>').join('') + '</select></div>' +
        '<div class="field full"><label>Nominal<span class="req">*</span></label><div class="input-wrap"><span class="input-prefix">Rp</span><input class="input num" name="nominal" inputmode="numeric" placeholder="0"></div></div>' +
        '<div class="field full"><label>Keterangan</label><input class="input" name="keterangan" maxlength="200" placeholder="mis. Beli spidol & penghapus"></div></div>' +
        '<div class="field"><label>Bukti / nota (opsional)</label>' + dropzone('Unggah foto nota atau PDF') + '</div><div data-err></div></form>',
      foot: '<button class="btn btn-outline" data-close>Batal</button><button class="btn btn-primary" data-save>' + ic('check') + 'Simpan Pengeluaran</button>'
    });
    const form = m.$('[data-f]'), idem = API.newIdem(), nom = $('[name=nominal]', form);
    nom.addEventListener('input', () => { const v = nom.value.replace(/\D/g, ''); nom.value = v ? Number(v).toLocaleString('id-ID') : ''; });
    bindDropzone(m, f => { file = f; });
    m.$('[data-save]').addEventListener('click', async e => {
      const d = UI.formData(form), nominal = Number(String(d.nominal).replace(/\D/g, ''));
      if (!(nominal > 0)) return UI.fieldError(form, 'nominal', 'Nominal harus lebih dari 0.');
      if (nominal > k.ringkasan.saldo && !(await UI.confirmDlg({ message: 'Pengeluaran melebihi saldo kas (' + fmt.rp(k.ringkasan.saldo) + '). Tetap simpan?', okText: 'Tetap simpan' }))) return;
      UI.fieldError(form);
      let bukti = null; try { bukti = await buktiPayload(file); } catch (err) { return UI.toast(err.message, 'error'); }
      UI.setBusy(e.currentTarget, true);
      const r = await API.api('kas.save', { trx: { jenis: 'Pengeluaran', kategori: d.kategori, tanggal: d.tanggal, nominal, keterangan: d.keterangan }, bukti, _idem: idem });
      UI.setBusy(e.currentTarget, false);
      if (!r.success) { m.$('[data-err]').innerHTML = '<div class="banner danger">' + ic('alert-circle') + '<div>' + esc(r.message) + '</div></div>'; return; }
      m.close(); UI.toast(r.message); done();
    });
  }
  function formSetting(k, done) {
    const c = k.pengaturan;
    const m = UI.modal({
      title: 'Atur Nominal & Jadwal Iuran', size: 'sm',
      body: '<form class="form-stack" data-f><div class="field"><label>Nominal iuran</label><div class="input-wrap"><span class="input-prefix">Rp</span><input class="input num" name="nominal_iuran" inputmode="numeric" value="' + Number(c.nominal_iuran).toLocaleString('id-ID') + '"></div></div>' +
        '<div class="field"><label>Periode</label><div class="seg" data-per style="width:100%"><button type="button" style="flex:1" data-v="mingguan" class="' + (c.periode === 'mingguan' ? 'on' : '') + '">Mingguan</button><button type="button" style="flex:1" data-v="bulanan" class="' + (c.periode === 'bulanan' ? 'on' : '') + '">Bulanan</button></div></div>' +
        '<div class="field"><label>Mulai ditagih sejak</label><input class="input" type="date" name="tanggal_mulai" value="' + esc(c.tanggal_mulai) + '"></div>' +
        '<div class="banner warn">' + ic('info') + '<div class="small">Mengubah nominal, periode, atau tanggal mulai akan menghitung ulang tunggakan seluruh siswa.</div></div></form>',
      foot: '<button class="btn btn-outline" data-close>Batal</button><button class="btn btn-primary" data-save>Simpan</button>'
    });
    let periode = c.periode;
    on(m.el, 'click', '[data-per] button', (e, b) => { periode = b.dataset.v; m.$$('[data-per] button').forEach(x => x.classList.toggle('on', x === b)); });
    m.$('[data-save]').addEventListener('click', async e => {
      const d = UI.formData(m.$('[data-f]'));
      UI.setBusy(e.currentTarget, true);
      const r = await API.api('kas.setting', { nominal_iuran: Number(String(d.nominal_iuran).replace(/\D/g, '')), periode, tanggal_mulai: d.tanggal_mulai });
      UI.setBusy(e.currentTarget, false);
      if (!r.success) return UI.toast(r.message, 'error');
      m.close(); UI.toast(r.message); done();
    });
  }

  // ---------------------------------------------------------------
  //  HALAMAN
  // ---------------------------------------------------------------
  async function render(view, query) {
    let k = null, siswa = [], tab = query.get('tab') || 'tunggakan', q = '', jf = 'semua';
    view.innerHTML = App.head('Kas &amp; Tunggakan', 'Memuat…', '', [['Kas']]) + UI.skeleton('list');
    const [rk, rs] = await Promise.all([API.load('kas.get', {}, { maxAge: 15000 }), API.load('siswa.list', {}, { maxAge: 120000 })]);
    if (!rk.success) { view.innerHTML = App.head('Kas &amp; Tunggakan', '', '', [['Kas']]) + App.errorBox(rk.message, true); $('[data-retry]', view).onclick = () => App.reload(); return; }
    k = rk.data; siswa = rs.success ? rs.data.siswa.filter(s => s.status === 'aktif') : [];
    const thumbs = {}; siswa.forEach(s => { thumbs[s.id] = s.foto_thumb; });
    const c = k.pengaturan, satuan = c.periode === 'bulanan' ? 'bulan' : 'pekan', R = k.ringkasan;
    const reload = () => { API.invalidate(); App.reload(); };
    const terkumpul = Math.max(0, R.target_terkumpul - R.total_tunggakan), pctT = R.target_terkumpul ? Math.round(terkumpul / R.target_terkumpul * 100) : 100;

    function tunggakanHtml() {
      const qq = q.toLowerCase(), list = k.tunggakan.filter(t => !qq || t.nama.toLowerCase().indexOf(qq) > -1 || String(t.nis).indexOf(qq) > -1);
      if (!k.tunggakan.length) return '<div class="banner ok">' + ic('check-circle') + '<div><b>Semua siswa lunas.</b> Tidak ada tunggakan sampai periode berjalan.</div></div>';
      return '<div class="toolbar mb"><div class="input-wrap">' + ic('search') + '<input class="input" type="search" data-q placeholder="Cari siswa / NIS…" value="' + esc(q) + '"></div><button class="btn btn-outline" data-salin-semua>' + ic('copy') + 'Salin daftar penagihan</button></div>' +
        '<div class="list">' + list.map((t, i) => '<div class="li" style="' + (i === 0 && !q ? 'border:1.5px solid #FCA5A5;box-shadow:0 6px 18px -12px rgba(220,38,38,.45);' : '') + 'flex-wrap:wrap">' + UI.avatar(t.nama, thumbs[t.id_siswa]) +
          '<div class="grow"><div class="row gap-sm"><a class="ttl" href="#/siswa/' + esc(t.id_siswa) + '" style="color:var(--text)">' + esc(t.nama) + '</a><span class="badge b-red">' + t.jumlah_periode + ' ' + satuan + '</span></div><div class="sub">NIS: ' + esc(t.nis) + (t.no_absen ? ' · Absen ' + esc(t.no_absen) : '') + '</div>' +
          '<div class="period-chips mt-sm">' + t.periode.slice(0, 8).map(p => '<span class="badge b-outline">' + esc(p) + '</span>').join('') + (t.periode.length > 8 ? '<span class="badge b-outline">+' + (t.periode.length - 8) + '</span>' : '') + '</div></div>' +
          '<div style="text-align:right"><div class="small muted">Tunggakan</div><div class="t-h3 t-red num">' + fmt.rp(t.jumlah) + '</div><div class="row gap-sm mt-sm" style="justify-content:flex-end"><button class="btn btn-outline btn-xs" data-salin="' + esc(t.id_siswa) + '">' + ic('copy', 'ic-sm') + 'Salin Pengingat</button><button class="btn btn-primary btn-xs" data-bayar="' + esc(t.id_siswa) + '">' + ic('check', 'ic-sm') + 'Catat Bayar</button></div></div></div>').join('') + '</div>' +
        (list.length ? '' : UI.empty('Tidak ada yang cocok', ''));
    }
    function trxHtml() {
      const list = k.transaksi.filter(t => jf === 'semua' || t.jenis === jf);
      return '<div class="chips mb">' + [['semua', 'Semua'], ['Pemasukan', 'Pemasukan'], ['Pengeluaran', 'Pengeluaran']].map(x => '<button class="chip' + (jf === x[0] ? ' on' : '') + '" data-jf="' + x[0] + '">' + x[1] + '</button>').join('') + '</div>' +
        (list.length ? list.map(t => {
          const masuk = t.jenis !== 'Pengeluaran', per = t.periode_dibayar ? String(t.periode_dibayar).split(',').length : 0;
          return '<div class="trx"><span class="io ' + (masuk ? 'in' : 'out') + '">' + ic(masuk ? 'in' : 'out') + '</span><div class="grow"><div class="ttl">' + esc(masuk ? (t.nama_siswa || t.kategori) : (t.keterangan || t.kategori)) + ' ' + (per ? '<span class="badge b-green">' + per + ' ' + satuan + '</span>' : '<span class="badge b-outline">' + esc(t.kategori) + '</span>') + '</div>' +
            '<div class="sub">' + esc(fmt.tgl(t.tanggal)) + ' · dicatat ' + esc(t.dicatat_oleh || '-') + (masuk && t.keterangan ? ' · ' + esc(t.keterangan) : '') + '</div></div>' +
            (t.bukti_file_id ? '<button class="btn btn-ghost btn-icon btn-xs" data-file="' + esc(t.bukti_file_id) + '" title="Lihat bukti" aria-label="Lihat bukti">' + ic('clip', 'ic-sm') + '</button>' : '') +
            '<span class="amt ' + (masuk ? 't-green' : 't-red') + '">' + (masuk ? '+' : '−') + fmt.rp(t.nominal).replace('Rp ', 'Rp ') + '</span><button class="btn btn-ghost btn-icon btn-xs" data-tmore="' + esc(t.id) + '" aria-label="Lainnya">' + ic('more', 'ic-sm') + '</button></div>';
        }).join('') : UI.empty('Belum ada transaksi', 'Catat pembayaran iuran atau pengeluaran kelas.'));
    }
    function statHtml() {
      const top = k.tunggakan.slice(0, 10), max = top.length ? top[0].jumlah : 1;
      return '<div class="grid g2"><div><div class="card-title mb">Pemasukan vs pengeluaran (6 bulan)</div>' + UI.groupBars(k.statistik.map(b => ({ label: b.label, a: b.masuk, b: b.keluar })), { la: 'Pemasukan', lb: 'Pengeluaran', label: 'Pemasukan dan pengeluaran per bulan' }) +
        '<div class="legend mt-sm"><span><i style="background:var(--primary)"></i>Pemasukan</span><span><i style="background:#94A3B8"></i>Pengeluaran</span></div></div>' +
        '<div><div class="card-title mb">Tunggakan per siswa</div>' + (top.length ? '<div class="hbars">' + top.map(t => '<div class="hbar"><span class="nm">' + esc(t.nama) + '</span><div class="progress"><i data-w="' + Math.round(t.jumlah / max * 100) + '%" style="width:0;background:var(--danger)"></i></div><b class="num small">' + fmt.rp(t.jumlah) + '</b></div>').join('') + '</div>' : '<div class="banner ok">' + ic('check-circle') + '<div>Tidak ada tunggakan.</div></div>') + '</div></div>';
    }
    function panel() { const p = $('[data-panel]', view); p.innerHTML = tab === 'tunggakan' ? tunggakanHtml() : tab === 'transaksi' ? trxHtml() : statHtml(); UI.animate(p); }

    view.innerHTML = App.head('Kas &amp; Tunggakan', 'Kelas ' + esc((App.config || {}).nama_kelas || '') + ' · ' + fmt.rp(c.nominal_iuran) + '/' + satuan,
      '<button class="btn btn-primary" data-act="bayar">' + ic('plus-circle') + 'Catat Bayar</button><button class="btn btn-outline" data-act="keluar">' + ic('out') + 'Pengeluaran</button><button class="btn btn-ghost btn-icon" data-act="atur" title="Atur iuran" aria-label="Atur iuran">' + ic('pengaturan') + '</button>', [['Kas']]) +
      '<div class="stack"><div class="banner info">' + ic('info') + '<div><b>Iuran aktif: ' + fmt.rp(c.nominal_iuran) + ' / ' + satuan + '</b> · mulai ' + esc(fmt.tgl(c.tanggal_mulai)) + (k.periode_berjalan ? ' · periode berjalan: ' + esc(k.periode_berjalan.label) : '') + '</div></div>' +
      '<div class="grid g4 stagger">' +
      '<div class="card stat" style="--deco:var(--success-soft)"><div class="row between"><span class="t-label">Saldo Kas Saat Ini</span><span class="icon-chip sm ic-green">' + ic('wallet') + '</span></div><div class="val"><span class="t-metric" data-count="' + R.saldo + '" data-fmt="rp">' + fmt.rp(R.saldo) + '</span></div><div class="foot"><span class="dot" style="color:' + (R.saldo >= 0 ? 'var(--success)' : 'var(--danger)') + '"></span>' + (R.saldo >= 0 ? 'Sehat & aman' : 'Saldo minus') + '</div></div>' +
      '<div class="card stat" style="--deco:var(--danger-soft);border:1.5px solid ' + (R.siswa_menunggak ? '#FCA5A5' : 'var(--border)') + '"><div class="row between"><span class="t-label">Siswa Menunggak</span><span class="icon-chip sm ic-red">' + ic('alert') + '</span></div><div class="val"><span class="t-metric" data-count="' + R.siswa_menunggak + '">' + R.siswa_menunggak + '</span><small>siswa</small></div><div class="foot">Total <b class="t-red">' + fmt.rp(R.total_tunggakan) + '</b></div></div>' +
      '<div class="card stat"><div class="row between"><span class="t-label">Pemasukan Bulan Ini</span><span class="icon-chip sm ic-green">' + ic('in') + '</span></div><div class="val"><span class="t-metric t-green" data-count="' + R.masuk_bulan_ini + '" data-fmt="rp">' + fmt.rp(R.masuk_bulan_ini) + '</span></div><div class="foot">' + esc(fmt.bulan(UI.today().slice(0, 7))) + '</div></div>' +
      '<div class="card stat"><div class="row between"><span class="t-label">Pengeluaran Bulan Ini</span><span class="icon-chip sm ic-red">' + ic('out') + '</span></div><div class="val"><span class="t-metric t-red" data-count="' + R.keluar_bulan_ini + '" data-fmt="rp">' + fmt.rp(R.keluar_bulan_ini) + '</span></div><div class="foot">Operasional kelas</div></div></div>' +
      '<div class="card"><div class="row between wrap"><span class="t-over">Komposisi realisasi iuran</span><span class="small muted">Target: ' + fmt.rp(R.target_terkumpul) + '</span></div><div class="progress lg mt-sm"><i data-w="' + pctT + '%" style="width:0;background:var(--text)"></i></div>' +
      '<div class="legend mt-sm"><span><i style="background:var(--text)"></i>Terkumpul ' + pctT + '% (' + fmt.rp(terkumpul) + ')</span><span><i style="background:var(--surface-muted);border:1px solid var(--border)"></i>Tunggakan (' + fmt.rp(R.total_tunggakan) + ')</span></div></div>' +
      '<div class="tabs">' + [['tunggakan', 'Tunggakan', k.tunggakan.length], ['transaksi', 'Transaksi', k.transaksi.length], ['statistik', 'Statistik']].map(x => '<button data-tab="' + x[0] + '" class="' + (tab === x[0] ? 'on' : '') + '">' + x[1] + (x[2] !== undefined ? '<span class="count">' + x[2] + '</span>' : '') + '</button>').join('') + '</div>' +
      '<div class="card" data-panel></div></div>';
    UI.animate(view); panel();

    on(view, 'click', '[data-act]', (e, b) => { const a = b.dataset.act; if (a === 'bayar') formBayar(k, siswa, {}, reload); else if (a === 'keluar') formKeluar(k, reload); else formSetting(k, reload); });
    on(view, 'click', '[data-tab]', (e, b) => { tab = b.dataset.tab; $$('[data-tab]', view).forEach(x => x.classList.toggle('on', x === b)); panel(); history.replaceState(null, '', '#/kas?tab=' + tab); });
    on(view, 'click', '[data-bayar]', (e, b) => formBayar(k, siswa, { id_siswa: b.dataset.bayar }, reload));
    on(view, 'click', '[data-jf]', (e, b) => { jf = b.dataset.jf; panel(); });
    on(view, 'input', '[data-q]', UI.debounce((e, t) => { q = t.value; panel(); const i = $('[data-q]', view); if (i) { i.focus(); i.setSelectionRange(q.length, q.length); } }, 200));
    on(view, 'click', '[data-file]', (e, b) => UI.openFile(b.dataset.file, 'Bukti transaksi'));
    const kelas = (App.config || {}).nama_kelas || 'kelas';
    const pesan = t => 'Halo, mengingatkan iuran kas ' + kelas + ' atas nama ' + t.nama + ' sebesar ' + fmt.rp(t.jumlah) + ' (' + t.jumlah_periode + ' ' + satuan + ': ' + t.periode.join(', ') + '). Terima kasih.';
    on(view, 'click', '[data-salin]', (e, b) => { const t = k.tunggakan.find(x => x.id_siswa === b.dataset.salin); UI.copyText(pesan(t), 'Pesan pengingat disalin.'); });
    on(view, 'click', '[data-salin-semua]', () => UI.copyText('Daftar tunggakan kas ' + kelas + ' per ' + fmt.tgl(UI.today()) + ':\n' + k.tunggakan.map((t, i) => (i + 1) + '. ' + t.nama + ' — ' + fmt.rp(t.jumlah) + ' (' + t.jumlah_periode + ' ' + satuan + ')').join('\n'), 'Daftar penagihan disalin.'));
    on(view, 'click', '[data-tmore]', (e, b) => {
      const t = k.transaksi.find(x => x.id === b.dataset.tmore);
      UI.popover(b, UI.menuItems([].concat(t.bukti_file_id ? [{ v: 'bukti', label: 'Lihat bukti', icon: 'image' }] : []).concat([{ v: 'arsip', label: 'Arsipkan transaksi', icon: 'archive', danger: true }])), {
        onPick: async v => {
          if (v === 'bukti') return UI.openFile(t.bukti_file_id, 'Bukti transaksi');
          if (!(await UI.confirmDlg({ title: 'Arsipkan transaksi?', message: t.jenis + ' ' + fmt.rp(t.nominal) + ' tanggal ' + fmt.tgl(t.tanggal) + ' akan dikeluarkan dari perhitungan saldo dan tunggakan. Wali kelas dapat memulihkannya dari Arsip.', okText: 'Arsipkan', danger: true }))) return;
          const r = await API.api('kas.archive', { id: t.id }); UI.toast(r.message, r.success ? 'success' : 'error'); if (r.success) reload();
        }
      });
    });
    const aksi = query.get('aksi');
    if (aksi) { history.replaceState(null, '', '#/kas'); if (aksi === 'bayar') formBayar(k, siswa, { id_siswa: query.get('siswa') || '' }, reload); else if (aksi === 'keluar') formKeluar(k, reload); }
  }

  Pages.kas = { title: 'Kas', render: (view, r) => render(view, r.query) };
})();
