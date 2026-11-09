/** Pengaturan: identitas aplikasi, data kelas, impor data, arsip. */
(function () {
  'use strict';
  const { esc, ic, fmt, $, $$, on } = UI;
  const PRESET = [['#2563EB', '#F59E0B', 'Biru'], ['#0F766E', '#F59E0B', 'Toska'], ['#7C3AED', '#EC4899', 'Ungu'], ['#B91C1C', '#F59E0B', 'Marun'], ['#4338CA', '#10B981', 'Indigo'], ['#C2410C', '#0EA5E9', 'Jingga']];
  const DEF = { nama_aplikasi: 'Our Class', warna_utama: '#2563EB', warna_aksen: '#F59E0B' };

  // ---------------------------------------------------------------
  //  CROPPER LOGO (persegi)
  // ---------------------------------------------------------------
  function cropper(src) {
    return new Promise(async resolve => {
      const img = await UI.loadImg(src).catch(() => null);
      if (!img) { UI.toast('Gambar tidak valid.', 'error'); return resolve(null); }
      const m = UI.modal({
        title: 'Potong logo', sub: 'Geser untuk mengatur posisi, gunakan slider untuk memperbesar.', size: 'sm',
        body: '<div class="crop-stage"><canvas width="560" height="560"></canvas></div><div class="row mt" style="gap:12px">' + ic('image', 'ic-sm') + '<input type="range" min="1" max="4" step="0.01" value="1" data-z style="flex:1;accent-color:var(--primary)" aria-label="Perbesar">' + ic('image') + '</div>',
        foot: '<button class="btn btn-outline" data-close>Batal</button><button class="btn btn-primary" data-ok>' + ic('check') + 'Gunakan</button>', onClose: v => resolve(v || null)
      });
      const cv = m.$('canvas'), cx = cv.getContext('2d'), S = 560, base = S / Math.min(img.naturalWidth, img.naturalHeight);
      let z = 1, ox = 0, oy = 0, drag = null;
      function clamp() { const w = img.naturalWidth * base * z, h = img.naturalHeight * base * z; ox = Math.min(0, Math.max(S - w, ox)); oy = Math.min(0, Math.max(S - h, oy)); }
      function draw() { clamp(); cx.fillStyle = '#fff'; cx.fillRect(0, 0, S, S); cx.drawImage(img, ox, oy, img.naturalWidth * base * z, img.naturalHeight * base * z); }
      ox = (S - img.naturalWidth * base) / 2; oy = (S - img.naturalHeight * base) / 2; draw();
      m.$('[data-z]').addEventListener('input', e => { const nz = +e.target.value, c = S / 2; ox = c - (c - ox) * nz / z; oy = c - (c - oy) * nz / z; z = nz; draw(); });
      const stage = m.$('.crop-stage');
      stage.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, ox, oy }; stage.setPointerCapture(e.pointerId); stage.style.cursor = 'grabbing'; });
      stage.addEventListener('pointermove', e => { if (!drag) return; const k = S / stage.clientWidth; ox = drag.ox + (e.clientX - drag.x) * k; oy = drag.oy + (e.clientY - drag.y) * k; draw(); });
      stage.addEventListener('pointerup', () => { drag = null; stage.style.cursor = ''; });
      m.$('[data-ok]').addEventListener('click', () => {
        const out = n => { const c = document.createElement('canvas'); c.width = c.height = n; const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(cv, 0, 0, S, S, 0, 0, n, n); return c; };
        let thumb = out(128).toDataURL('image/png');
        if (thumb.length > 55000) thumb = out(128).toDataURL('image/jpeg', .85);
        m.close({ thumb, data: out(512).toDataURL('image/png'), mime: 'image/png' });
      });
    });
  }

  // ---------------------------------------------------------------
  //  TAB: IDENTITAS
  // ---------------------------------------------------------------
  function identitas(box, s) {
    let logo = null, hapusLogo = false, warna = s.warna_utama, aksen = s.warna_aksen, nama = s.nama_aplikasi, thumb = s.logo_thumb;
    box.innerHTML = '<div class="grid" style="grid-template-columns:minmax(0,1.2fr) minmax(0,1fr);align-items:start" data-grid>' +
      '<div class="card card-pad-lg"><div class="form-stack">' +
      '<div class="field"><div class="row between"><label for="st-nama">Nama aplikasi</label><span class="small muted" data-cnt>0/40</span></div><input class="input" id="st-nama" maxlength="40" data-nama value="' + esc(nama) + '"></div>' +
      '<div class="field"><label>Logo (thumbnail persegi)</label><div class="row" style="gap:16px"><span class="brand-logo" style="width:64px;height:64px;border-radius:16px" data-logoprev>' + (thumb ? '<img src="' + thumb + '" alt="">' : ic('grad', 'ic-xl')) + '</span>' +
      '<div class="stack" style="gap:8px"><div class="row wrap gap-sm"><label class="btn btn-outline btn-sm" style="position:relative">' + ic('upload') + 'Pilih berkas<input type="file" accept="image/png,image/jpeg,image/webp" data-logo style="position:absolute;inset:0;opacity:0;cursor:pointer"></label>' + '<button type="button" class="btn btn-danger-ghost btn-sm' + (thumb ? '' : ' hidden') + '" data-hapuslogo>' + ic('trash') + 'Hapus</button></div><span class="help">PNG/JPG maksimal 2 MB. Anda bisa memotong menjadi persegi.</span></div></div></div>' +
      '<div class="field"><label>Warna utama &amp; aksen</label><div class="row wrap" style="gap:12px"><input type="color" data-c1 value="' + esc(warna) + '" aria-label="Warna utama"><input type="color" data-c2 value="' + esc(aksen) + '" aria-label="Warna aksen"><span class="small muted">Utama · Aksen</span><span data-kontras></span></div>' +
      '<div class="t-label mt-sm">Palet siap pakai</div><div class="swatches">' + PRESET.map(p => '<button type="button" class="swatch" title="' + p[2] + '" data-p1="' + p[0] + '" data-p2="' + p[1] + '" style="background:linear-gradient(135deg,' + p[0] + ' 0 60%,' + p[1] + ' 60%)"></button>').join('') + '</div></div>' +
      '<div class="row wrap" style="gap:10px"><button class="btn btn-primary" data-save>' + ic('check') + 'Simpan Perubahan</button><button class="btn btn-outline" data-batal>Batal</button><button class="btn btn-ghost" data-reset>' + ic('restore') + 'Kembalikan ke bawaan</button></div></div></div>' +
      '<div class="card"><div class="card-title mb">Pratinjau langsung</div><div class="stack" data-prev style="gap:14px">' +
      '<div class="preview-box"><div class="t-over mb">Halaman login</div><div class="mini-login"><div class="lg" data-pl></div><b data-pn></b><div class="fake"></div><div class="fake"></div><div class="fake btn-f"></div></div></div>' +
      '<div class="preview-box"><div class="t-over mb">Sidebar</div><div class="brand" style="padding:0"><span class="brand-logo" data-pl></span><span class="brand-text"><b data-pn></b><small>' + esc(s.nama_kelas) + '</small></span></div><div class="nav mt-sm"><a class="on">' + ic('home') + '<span>Beranda</span></a><a>' + ic('absensi') + '<span>Absensi</span></a></div></div>' +
      '<div class="preview-box"><div class="t-over mb">Kop PDF</div><div class="row" style="border-bottom:2px solid var(--primary-soft-text);padding-bottom:8px"><span class="brand-logo" style="width:40px;height:40px;border-radius:10px" data-pl></span><div><b style="color:var(--primary-soft-text)">' + esc(s.nama_sekolah || 'Nama Sekolah') + '</b><div class="small muted"><span data-pn></span> · Kelas ' + esc(s.nama_kelas) + '</div></div></div></div></div></div></div>';
    if (window.innerWidth < 1024) $('[data-grid]', box).style.gridTemplateColumns = '1fr';
    const prev = $('[data-prev]', box);
    function paint() {
      UI.applyTheme(warna, aksen, prev);
      $$('[data-pl]', box).forEach(el => { el.innerHTML = thumb ? '<img src="' + thumb + '" alt="">' : ic('grad'); });
      $$('[data-pn]', box).forEach(el => { el.textContent = nama || '…'; });
      $('[data-logoprev]', box).innerHTML = thumb ? '<img src="' + thumb + '" alt="">' : ic('grad', 'ic-xl');
      $('[data-cnt]', box).textContent = (nama || '').length + '/40';
      const k = UI.contrast('#FFFFFF', warna), ok = k >= 4.5;
      $('[data-kontras]', box).innerHTML = '<span class="badge ' + (ok ? 'b-green' : 'b-amber') + '">' + ic(ok ? 'check' : 'alert') + (ok ? 'Kontras baik' : 'Kontras rendah untuk teks') + ' (' + (Math.round(k * 10) / 10).toLocaleString('id-ID') + ':1)</span>';
      $$('.swatch', box).forEach(x => x.classList.toggle('on', x.dataset.p1.toUpperCase() === warna.toUpperCase() && x.dataset.p2.toUpperCase() === aksen.toUpperCase()));
      $('[data-hapuslogo]', box).classList.toggle('hidden', !thumb);
    }
    paint();
    $('[data-nama]', box).addEventListener('input', e => { nama = e.target.value; paint(); });
    $('[data-c1]', box).addEventListener('input', e => { warna = e.target.value.toUpperCase(); paint(); });
    $('[data-c2]', box).addEventListener('input', e => { aksen = e.target.value.toUpperCase(); paint(); });
    on(box, 'click', '.swatch', (e, b) => { warna = b.dataset.p1; aksen = b.dataset.p2; $('[data-c1]', box).value = warna; $('[data-c2]', box).value = aksen; paint(); });
    $('[data-logo]', box).addEventListener('change', async e => {
      const f = e.target.files[0]; e.target.value = ''; if (!f) return;
      if (f.size > 8 * 1048576) return UI.toast('Berkas terlalu besar.', 'error');
      const src = await UI.resizeImage(f, 1200, 'image/png');
      const res = await cropper(src);
      if (res) { logo = res; thumb = res.thumb; hapusLogo = false; paint(); }
    });
    on(box, 'click', '[data-hapuslogo]', () => { logo = null; thumb = ''; hapusLogo = true; paint(); });
    on(box, 'click', '[data-batal]', () => App.reload());
    on(box, 'click', '[data-reset]', async () => {
      if (!(await UI.confirmDlg({ title: 'Kembalikan ke bawaan?', message: 'Nama aplikasi, logo, dan warna akan dikembalikan ke tampilan awal Our Class.', okText: 'Kembalikan' }))) return;
      const r = await API.api('set.reset'); if (!r.success) return UI.toast(r.message, 'error');
      UI.toast(r.message); await refreshConfig(); App.reload();
    });
    on(box, 'click', '[data-save]', async (e, b) => {
      if (!nama.trim()) return UI.toast('Nama aplikasi wajib diisi.', 'warning');
      if (UI.contrast('#FFFFFF', warna) < 3 && !(await UI.confirmDlg({ message: 'Warna utama terlalu terang sehingga teks putih sulit dibaca. Tetap simpan?', okText: 'Tetap simpan' }))) return;
      UI.setBusy(b, true);
      const r = await API.api('set.save', { data: { nama_aplikasi: nama.trim(), warna_utama: warna, warna_aksen: aksen }, logo: logo ? { data: logo.data, mime: logo.mime, thumb: logo.thumb } : null, hapusLogo });
      UI.setBusy(b, false);
      if (!r.success) return UI.toast(r.message, 'error');
      UI.toast('Identitas aplikasi tersimpan.'); await refreshConfig(); App.reload();
    });
    void DEF;
  }
  async function refreshConfig() { const r = await API.api('public.config', { _fresh: true }); if (r.success) App.applyConfig(r.data); }

  // ---------------------------------------------------------------
  //  TAB: DATA KELAS
  // ---------------------------------------------------------------
  function dataKelas(box, s) {
    box.innerHTML = '<div class="card card-pad-lg" style="max-width:720px"><div class="card-title mb">Data kelas &amp; kop laporan</div><form class="form-grid" data-f>' +
      '<div class="field"><label>Nama kelas</label><input class="input" name="nama_kelas" value="' + esc(s.nama_kelas) + '" maxlength="40" placeholder="mis. XII MIPA 2"></div>' +
      '<div class="field"><label>Nama wali kelas</label><input class="input" name="nama_wali_kelas" value="' + esc(s.nama_wali_kelas) + '" maxlength="80" placeholder="mis. Ibu Nurhayati, S.Pd."></div>' +
      '<div class="field full"><label>Nama sekolah</label><input class="input" name="nama_sekolah" value="' + esc(s.nama_sekolah) + '" maxlength="100"></div>' +
      '<div class="field"><label>Tahun ajaran</label><input class="input" name="tahun_ajaran" value="' + esc(s.tahun_ajaran) + '" maxlength="20" placeholder="2026/2027"></div>' +
      '<div class="field"><label>Semester</label><select class="select" name="semester"><option' + (s.semester === 'Ganjil' ? ' selected' : '') + '>Ganjil</option><option' + (s.semester === 'Genap' ? ' selected' : '') + '>Genap</option></select></div>' +
      '<div class="full"><button class="btn btn-primary" type="submit">' + ic('check') + 'Simpan</button></div></form><p class="help mt">Data ini tampil di header aplikasi, halaman login, dan kop setiap laporan PDF.</p></div>';
    $('[data-f]', box).addEventListener('submit', async e => {
      e.preventDefault();
      const b = $('button[type=submit]', box); UI.setBusy(b, true);
      const r = await API.api('set.save', { data: UI.formData(e.target) }); UI.setBusy(b, false);
      if (!r.success) return UI.toast(r.message, 'error');
      UI.toast('Data kelas tersimpan.'); await refreshConfig();
    });
  }

  // ---------------------------------------------------------------
  //  TAB: IMPOR DATA
  // ---------------------------------------------------------------
  function hasilImpor(d) {
    const nama = { Siswa: 'Siswa', Hari_Libur: 'Hari libur', Absensi: 'Absensi', Kas_Transaksi: 'Transaksi kas', Jadwal: 'Jadwal', Piket: 'Piket', Perkembangan: 'Perkembangan', Notulensi: 'Notulensi' };
    return '<div class="banner ' + (d.dryRun ? 'info' : 'ok') + ' mt">' + ic(d.dryRun ? 'search' : 'check-circle') + '<div><b>' + (d.dryRun ? 'Hasil pindai (belum ada data yang ditulis)' : 'Impor selesai') + '</b>' +
      (d.sumber ? '<div class="small">Sumber: ' + esc(d.sumber.nama) + (d.sumber.sheet ? ' › ' + esc(d.sumber.sheet) : '') + ' · Mode: ' + (d.mode === 'our_class' ? 'database Our Class (upgrade)' : d.mode === 'csv' ? 'CSV' : 'daftar siswa') + '</div>' : '') + '</div></div>' +
      (d.kolom ? '<div class="small muted mt-sm">Kolom dikenali: ' + Object.keys(d.kolom).map(k => '<span class="badge b-outline">' + esc(k) + ' ← ' + esc(d.kolom[k]) + '</span>').join(' ') + '</div>' : '') +
      '<div class="table-wrap mt"><table class="table import-res"><thead><tr><th>Data</th><th class="c">Di sumber</th><th class="c">Ditambah</th><th class="c">Diperbarui</th><th class="c">Dilewati</th></tr></thead><tbody>' +
      Object.keys(d.laporan).map(k => { const x = d.laporan[k]; return '<tr><td><b>' + esc(nama[k] || k) + '</b></td><td class="c">' + x.sumber + '</td><td class="c t-green"><b>' + x.ditambah + '</b></td><td class="c t-primary">' + x.diperbarui + '</td><td class="c muted">' + x.dilewati + '</td></tr>'; }).join('') + '</tbody></table></div>' +
      (d.peringatan && d.peringatan.length ? '<div class="banner warn mt">' + ic('alert') + '<div><b>Peringatan</b><ul style="margin:6px 0 0;padding-left:18px">' + d.peringatan.slice(0, 15).map(p => '<li class="small">' + esc(p) + '</li>').join('') + '</ul></div></div>' : '');
  }
  function impor(box) {
    let csvRows = null;
    box.innerHTML = '<div class="stack" style="max-width:920px"><div class="banner info">' + ic('database') + '<div><b>Impor aman diulang.</b> Spreadsheet sumber hanya <u>dibaca</u>. Siswa dicocokkan berdasarkan NIS sehingga menjalankan impor dua kali tidak membuat data ganda. Selalu <b>Pindai</b> dulu sebelum menjalankan.</div></div>' +
      '<div class="card card-pad-lg"><div class="row mb"><span class="icon-chip">' + ic('database') + '</span><div><div class="card-title">Dari Google Sheets</div><div class="small muted">Daftar siswa lama, atau database Our Class versi sebelumnya (upgrade).</div></div></div>' +
      '<div class="form-stack"><div class="field"><label>URL atau ID spreadsheet sumber</label><input class="input" data-src placeholder="https://docs.google.com/spreadsheets/d/…"><span class="help">Spreadsheet harus milik/dibagikan ke akun Google pemilik aplikasi.</span></div>' +
      '<div class="form-grid"><div class="field"><label>Nama sheet (opsional)</label><input class="input" data-sheet placeholder="Kosongkan = sheet pertama"></div>' +
      '<label class="check" style="align-self:end;height:44px"><input type="checkbox" data-timpa>Timpa data siswa yang sudah ada</label></div>' +
      '<div class="row wrap" style="gap:10px"><button class="btn btn-outline" data-scan>' + ic('search') + 'Pindai (dry-run)</button><button class="btn btn-primary" data-run disabled>' + ic('upload') + 'Jalankan Impor</button></div><div data-hasil></div></div></div>' +
      '<div class="card card-pad-lg"><div class="row mb"><span class="icon-chip ic-green">' + ic('file') + '</span><div><div class="card-title">Dari berkas CSV</div><div class="small muted">Kolom minimal: NIS dan Nama. Kolom lain dikenali dari nama header.</div></div></div>' +
      '<div class="form-stack"><div class="dropzone">' + ic('upload') + '<b>Pilih berkas .csv</b><div class="small">Pemisah koma atau titik koma (ekspor Excel)</div><input type="file" accept=".csv,text/csv" data-csv></div><div data-csvinfo></div>' +
      '<div class="row wrap" style="gap:10px"><button class="btn btn-ghost" data-tpl>' + ic('download') + 'Unduh template CSV</button><label class="check"><input type="checkbox" data-ctimpa>Timpa yang sudah ada</label><span style="flex:1"></span><button class="btn btn-outline" data-cscan disabled>' + ic('search') + 'Pindai</button><button class="btn btn-primary" data-crun disabled>' + ic('upload') + 'Impor</button></div><div data-chasil></div></div></div>' +
      '<div class="banner slate small">' + ic('info') + '<div class="small">Yang tidak ikut diimpor (sengaja): akun pengguna, pengaturan, dan data periode. Foto dari database Our Class lama tetap terbaca bila memakai akun Google yang sama.</div></div></div>';
    const src = () => ({ sumber: $('[data-src]', box).value.trim(), sheet: $('[data-sheet]', box).value.trim(), timpa: $('[data-timpa]', box).checked });
    $('[data-src]', box).addEventListener('input', () => { $('[data-run]', box).disabled = true; });
    on(box, 'click', '[data-scan]', async (e, b) => {
      const p = src(); if (!p.sumber) return UI.toast('Tempel URL spreadsheet sumber.', 'warning');
      UI.setBusy(b, true, 'Memindai…'); const r = await API.api('import.scan', p); UI.setBusy(b, false);
      $('[data-hasil]', box).innerHTML = r.success ? hasilImpor(r.data) : App.errorBox(r.message);
      $('[data-run]', box).disabled = !r.success;
    });
    on(box, 'click', '[data-run]', async (e, b) => {
      if (!(await UI.confirmDlg({ title: 'Jalankan impor?', message: 'Data dari spreadsheet sumber akan ditulis ke database aplikasi. Proses aman diulang (tidak membuat data ganda).', okText: 'Jalankan' }))) return;
      UI.setBusy(b, true, 'Mengimpor…'); const r = await API.api('import.run', src()); UI.setBusy(b, false);
      $('[data-hasil]', box).innerHTML = r.success ? hasilImpor(r.data) : App.errorBox(r.message);
      if (r.success) UI.toast('Impor selesai.');
    });
    on(box, 'click', '[data-tpl]', () => {
      const csv = 'No Absen;NIS;Nama Lengkap;Nama Panggilan;Jenis Kelamin;Tanggal Lahir;Alamat;Nama Wali;Kontak Wali\n1;24251001;Contoh Siswa;Contoh;L;2008-11-09;Jl. Contoh No. 1;Bpk. Contoh;081234567890\n';
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv' })); a.download = 'template-siswa-our-class.csv'; a.click();
    });
    $('[data-csv]', box).addEventListener('change', async e => {
      const f = e.target.files[0]; csvRows = null; $('[data-cscan]', box).disabled = $('[data-crun]', box).disabled = true; $('[data-chasil]', box).innerHTML = '';
      if (!f) return;
      const text = await f.text(); csvRows = UI.parseCSV(text);
      $('[data-csvinfo]', box).innerHTML = '<div class="file-chip">' + ic('file') + '<b class="small">' + esc(f.name) + '</b><span class="small muted">' + csvRows.length + ' baris · kolom: ' + esc(csvRows[0] ? Object.keys(csvRows[0]).join(', ') : '-') + '</span></div>';
      $('[data-cscan]', box).disabled = !csvRows.length;
    });
    const csvRun = async (dry, b) => {
      UI.setBusy(b, true, dry ? 'Memindai…' : 'Mengimpor…');
      const r = await API.api(dry ? 'import.rows' : 'import.rows', { rows: csvRows, dryRun: dry, timpa: $('[data-ctimpa]', box).checked });
      UI.setBusy(b, false);
      $('[data-chasil]', box).innerHTML = r.success ? hasilImpor(r.data) : App.errorBox(r.message);
      if (dry) $('[data-crun]', box).disabled = !r.success; else if (r.success) UI.toast('Impor CSV selesai.');
    };
    on(box, 'click', '[data-cscan]', (e, b) => csvRun(true, b));
    on(box, 'click', '[data-crun]', async (e, b) => { if (await UI.confirmDlg({ message: 'Impor ' + csvRows.length + ' baris dari CSV?', okText: 'Impor' })) csvRun(false, b); });
  }

  // ---------------------------------------------------------------
  //  TAB: ARSIP
  // ---------------------------------------------------------------
  async function arsip(box) {
    box.innerHTML = UI.skeleton();
    const r = await API.api('arsip.list');
    if (!r.success) { box.innerHTML = App.errorBox(r.message); return; }
    const L = r.data.arsip, nama = { Siswa: 'Siswa', Kas_Transaksi: 'Kas', Jadwal: 'Jadwal', Piket: 'Piket', Perkembangan: 'Perkembangan', Notulensi: 'Notulensi', Haid: 'Periode' };
    box.innerHTML = '<div class="card flush" style="max-width:920px"><div class="card-head"><div><div class="card-title">Data diarsipkan</div><div class="sub">Pulihkan bila terhapus tidak sengaja. Hapus permanen tidak dapat dibatalkan.</div></div></div>' +
      (L.length ? '<div class="list" style="padding:0 20px 20px">' + L.map(a => '<div class="li"><span class="badge b-outline">' + esc(nama[a.sheet] || a.sheet) + '</span><div class="grow"><div class="ttl small">' + esc(a.label) + '</div><div class="sub">Diarsipkan ' + esc(fmt.waktu(a.updated_at)) + ' oleh ' + esc(a.updated_by) + '</div></div>' +
        '<button class="btn btn-outline btn-xs" data-restore="' + esc(a.sheet) + '|' + esc(a.id) + '">' + ic('restore', 'ic-sm') + 'Pulihkan</button><button class="btn btn-danger-ghost btn-xs" data-purge="' + esc(a.sheet) + '|' + esc(a.id) + '" title="Hapus permanen">' + ic('trash', 'ic-sm') + '</button></div>').join('') + '</div>' : '<div style="padding:0 20px 20px">' + UI.empty('Arsip kosong', 'Data yang diarsipkan akan muncul di sini.') + '</div>') + '</div>';
    on(box, 'click', '[data-restore]', async (e, b) => { const [sheet, id] = b.dataset.restore.split('|'); const x = await API.api('arsip.restore', { sheet, id }); UI.toast(x.message, x.success ? 'success' : 'error'); if (x.success) arsip(box); });
    on(box, 'click', '[data-purge]', async (e, b) => {
      const [sheet, id] = b.dataset.purge.split('|');
      if (!(await UI.confirmDlg({ title: 'Hapus permanen?', message: 'Data ini akan dihapus dari spreadsheet dan TIDAK dapat dipulihkan lagi.', okText: 'Hapus permanen', danger: true }))) return;
      const x = await API.api('arsip.purge', { sheet, id }); UI.toast(x.message, x.success ? 'success' : 'error'); if (x.success) arsip(box);
    });
  }

  async function render(view, r) {
    const wk = App.isWK();
    const tabs = [['identitas', 'Identitas Aplikasi', 'palette'], ['kelas', 'Data Kelas', 'school']].concat(wk ? [['impor', 'Impor Data', 'database'], ['arsip', 'Arsip', 'archive']] : []);
    let tab = tabs.some(t => t[0] === r.params[0]) ? r.params[0] : 'identitas';
    view.innerHTML = App.head('Pengaturan', 'Sesuaikan identitas aplikasi dan data kelas.', '', [['Pengaturan']]) +
      '<div class="stack"><div class="tabs">' + tabs.map(t => '<button data-tab="' + t[0] + '" class="' + (t[0] === tab ? 'on' : '') + '">' + ic(t[2], 'ic-sm') + t[1] + '</button>').join('') + '</div><div data-box>' + UI.skeleton() + '</div></div>';
    const box = $('[data-box]', view);
    let s = null;
    async function show() {
      if (tab === 'impor') return impor(box);
      if (tab === 'arsip') return arsip(box);
      if (!s) { const x = await API.api('set.get'); if (!x.success) { box.innerHTML = App.errorBox(x.message); return; } s = x.data; }
      if (tab === 'identitas') identitas(box, s); else dataKelas(box, s);
    }
    on(view, 'click', '[data-tab]', (e, b) => { tab = b.dataset.tab; $$('[data-tab]', view).forEach(x => x.classList.toggle('on', x === b)); history.replaceState(null, '', '#/pengaturan/' + tab); show(); });
    show();
  }
  Pages.pengaturan = { title: 'Pengaturan', render };
})();
