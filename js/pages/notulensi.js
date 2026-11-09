/** Notulensi rapat: daftar, detail, formulir. */
(function () {
  'use strict';
  const { esc, ic, fmt, $, $$, on } = UI;

  function tlStatus(n) {
    const tl = n.tindak_lanjut || [];
    if (!tl.length) return '<span class="badge b-slate">Tanpa tindak lanjut</span>';
    const done = tl.filter(t => t.selesai).length, telat = tl.some(t => !t.selesai && t.tenggat && t.tenggat < UI.today());
    if (done === tl.length) return '<span class="badge b-green">' + ic('check') + 'Selesai ' + done + '/' + tl.length + '</span>';
    return telat ? '<span class="badge b-red">' + ic('alert') + 'Terlambat · ' + done + '/' + tl.length + '</span>' : '<span class="badge b-primary">Berjalan · ' + done + '/' + tl.length + '</span>';
  }
  const dateBlock = t => '<div class="date-block"><b>' + (+t.slice(8)) + '</b><span>' + UI.BULAN[+t.slice(5, 7) - 1] + '</span></div>';

  // ---------------------------------------------------------------
  //  DAFTAR
  // ---------------------------------------------------------------
  async function daftar(view) {
    let q = '', dari = '', sampai = '';
    view.innerHTML = App.head('Notulensi Rapat', 'Memuat…', '', [['Notulensi']]) + UI.skeleton('list');
    const r = await API.load('notul.list', {}, { maxAge: 20000 });
    if (!r.success) { view.innerHTML = App.errorBox(r.message, true); $('[data-retry]', view).onclick = () => App.reload(); return; }
    const list = r.data.notulensi;
    function rows() {
      const qq = q.toLowerCase(), f = list.filter(n => (!dari || n.tanggal >= dari) && (!sampai || n.tanggal <= sampai) &&
        (!qq || [n.judul, n.peserta, n.agenda, n.pembahasan, n.keputusan].some(v => String(v || '').toLowerCase().indexOf(qq) > -1)));
      if (!f.length) return UI.empty(list.length ? 'Tidak ada notulensi yang cocok' : 'Belum ada notulensi', list.length ? 'Ubah kata kunci atau rentang tanggal.' : 'Simpan hasil rapat agar keputusan & tindak lanjut mudah dicari.', list.length ? '' : '<a class="btn btn-primary btn-sm" href="#/notulensi/baru">' + ic('plus') + 'Notulensi Baru</a>');
      return '<div class="list">' + f.map(n => {
        const peserta = String(n.peserta || '').split(',').map(s => s.trim()).filter(Boolean);
        return '<div class="li hoverable" style="align-items:flex-start;padding:16px">' + dateBlock(n.tanggal) + '<div class="grow"><a href="#/notulensi/' + esc(n.id) + '" class="ttl" style="color:var(--text);font-size:15px">' + esc(n.judul) + '</a>' +
          '<div class="sub row wrap" style="gap:10px;margin-top:4px"><span>' + esc(fmt.tglHari(n.tanggal)) + '</span>' + (peserta.length ? '<span class="row" style="gap:4px">' + ic('siswa', 'ic-sm') + peserta.length + ' peserta</span>' : '') + (n.file_pdf_id ? '<span class="row" style="gap:4px">' + ic('clip', 'ic-sm') + 'Lampiran</span>' : '') + '</div>' +
          '<div class="row wrap gap-sm mt-sm">' + tlStatus(n) + (peserta.length ? '<span class="av-stack hide-m">' + peserta.slice(0, 4).map(p => UI.avatar(p, '', 'sm')).join('') + '</span>' : '') + '</div></div>' +
          '<div class="row" style="gap:6px"><a class="btn btn-outline btn-xs hide-m" href="#/notulensi/' + esc(n.id) + '">Lihat</a><button class="btn btn-ghost btn-icon btn-xs" data-more="' + esc(n.id) + '" aria-label="Lainnya">' + ic('more', 'ic-sm') + '</button></div></div>';
      }).join('') + '</div>';
    }
    view.innerHTML = App.head('Notulensi Rapat', list.length + ' rapat tercatat · keputusan & tindak lanjut mudah dicari', '<a class="btn btn-primary" href="#/notulensi/baru">' + ic('plus') + 'Notulensi Baru</a>', [['Notulensi']]) +
      '<div class="stack"><div class="card"><div class="toolbar"><div class="input-wrap">' + ic('search') + '<input class="input" type="search" data-q placeholder="Cari judul, peserta, keputusan…"></div>' +
      '<div class="date-range"><input class="input" type="date" data-dari aria-label="Dari tanggal"><span class="muted">–</span><input class="input" type="date" data-sampai aria-label="Sampai tanggal"></div></div></div>' +
      '<div class="card" data-rows>' + rows() + '</div></div>';
    const upd = () => { $('[data-rows]', view).innerHTML = rows(); };
    $('[data-q]', view).addEventListener('input', UI.debounce(e => { q = e.target.value; upd(); }, 150));
    $('[data-dari]', view).addEventListener('change', e => { dari = e.target.value; upd(); });
    $('[data-sampai]', view).addEventListener('change', e => { sampai = e.target.value; upd(); });
    on(view, 'click', '[data-more]', (e, b) => {
      const n = list.find(x => x.id === b.dataset.more);
      UI.popover(b, UI.menuItems([{ v: 'lihat', label: 'Lihat detail', icon: 'eye' }, { v: 'ubah', label: 'Ubah', icon: 'pencil' }, { v: 'pdf', label: 'Cetak PDF', icon: 'printer' }].concat(n.file_pdf_id ? [{ v: 'lamp', label: 'Buka lampiran', icon: 'clip' }] : []).concat(['-', { v: 'arsip', label: 'Arsipkan', icon: 'archive', danger: true }])), {
        onPick: async v => {
          if (v === 'lihat') App.go('notulensi/' + n.id);
          else if (v === 'ubah') App.go('notulensi/' + n.id + '/ubah');
          else if (v === 'pdf') Pages.laporan.buat('notulensi', { dari: n.tanggal, sampai: n.tanggal }, b);
          else if (v === 'lamp') UI.openFile(n.file_pdf_id, 'Lampiran notulensi');
          else if (await UI.confirmDlg({ message: 'Arsipkan notulensi "' + n.judul + '"?', okText: 'Arsipkan', danger: true })) { const x = await API.api('notul.archive', { id: n.id }); UI.toast(x.message, x.success ? 'success' : 'error'); if (x.success) App.reload(); }
        }
      });
    });
  }

  // ---------------------------------------------------------------
  //  DETAIL
  // ---------------------------------------------------------------
  async function detail(view, id) {
    const r = await API.load('notul.list', {}, { maxAge: 20000 });
    const n = r.success ? r.data.notulensi.find(x => x.id === id) : null;
    if (!n) { view.innerHTML = '<a class="back-link" href="#/notulensi">' + ic('arrow-l', 'ic-sm') + 'Kembali</a>' + App.errorBox(r.success ? 'Notulensi tidak ditemukan.' : r.message); return; }
    const box = (t, isi) => '<div class="card"><div class="t-over mb">' + t + '</div><div style="white-space:pre-wrap;line-height:22px">' + (isi ? esc(isi) : '<span class="subtle">–</span>') + '</div></div>';
    view.innerHTML = '<a class="back-link" href="#/notulensi">' + ic('arrow-l', 'ic-sm') + 'Kembali ke Notulensi</a>' +
      App.head(esc(n.judul), esc(fmt.tglPanjang(n.tanggal)) + ' · dibuat oleh ' + esc(n.dibuat_oleh || '-'),
        (n.file_pdf_id ? '<button class="btn btn-outline" data-lamp>' + ic('clip') + 'Lampiran</button>' : '') + '<button class="btn btn-outline" data-pdf>' + ic('printer') + 'Cetak PDF</button><a class="btn btn-primary" href="#/notulensi/' + esc(n.id) + '/ubah">' + ic('pencil') + 'Ubah</a>') +
      '<div class="grid" style="grid-template-columns:minmax(0,1fr) 340px;align-items:start" data-grid><div class="stack">' +
      '<div class="card"><div class="t-over mb">Peserta</div><div class="chips">' + (String(n.peserta || '').split(',').map(s => s.trim()).filter(Boolean).map(p => '<span class="badge b-primary badge-lg">' + esc(p) + '</span>').join('') || '<span class="subtle">–</span>') + '</div></div>' +
      box('Agenda', n.agenda) + box('Pembahasan', n.pembahasan) + box('Keputusan', n.keputusan) + '</div>' +
      '<div class="card"><div class="card-head"><div class="card-title">Tindak Lanjut</div>' + tlStatus(n) + '</div>' +
      ((n.tindak_lanjut || []).length ? '<div class="list" data-tl>' + n.tindak_lanjut.map((t, i) => '<label class="li" style="align-items:flex-start;cursor:pointer"><input type="checkbox" data-i="' + i + '"' + (t.selesai ? ' checked' : '') + ' style="width:20px;height:20px;accent-color:var(--primary);margin-top:2px"><div class="grow"><div class="ttl" style="' + (t.selesai ? 'text-decoration:line-through;color:var(--text-subtle)' : '') + '">' + esc(t.ket || '-') + '</div><div class="sub">' + esc(t.pj || '-') + (t.tenggat ? ' · tenggat ' + esc(fmt.tgl(t.tenggat)) : '') + (!t.selesai && t.tenggat && t.tenggat < UI.today() ? ' · <span class="t-red">terlambat</span>' : '') + '</div></div></label>').join('') + '</div><p class="help mt-sm">Centang untuk menandai selesai (tersimpan otomatis).</p>' : '<span class="small muted">Tidak ada tindak lanjut.</span>') + '</div></div>';
    if (window.innerWidth < 1024) $('[data-grid]', view).style.gridTemplateColumns = '1fr';
    on(view, 'click', '[data-pdf]', (e, b) => Pages.laporan.buat('notulensi', { dari: n.tanggal, sampai: n.tanggal }, b));
    on(view, 'click', '[data-lamp]', () => UI.openFile(n.file_pdf_id, 'Lampiran notulensi'));
    on(view, 'change', '[data-i]', async (e, cb) => {
      const tl = n.tindak_lanjut.map(x => Object.assign({}, x)); tl[+cb.dataset.i].selesai = cb.checked;
      const x = await API.api('notul.save', { notul: Object.assign({}, n, { tindak_lanjut: tl }) });
      if (!x.success) { cb.checked = !cb.checked; return UI.toast(x.message, 'error'); }
      UI.toast(cb.checked ? 'Tindak lanjut ditandai selesai.' : 'Tindak lanjut dibuka kembali.'); App.reload();
    });
  }

  // ---------------------------------------------------------------
  //  FORM
  // ---------------------------------------------------------------
  async function form(view, id) {
    let n = { tanggal: UI.today(), tindak_lanjut: [] };
    if (id) { const r = await API.load('notul.list', {}, { maxAge: 20000 }); const x = r.success ? r.data.notulensi.find(z => z.id === id) : null; if (!x) { view.innerHTML = App.errorBox('Notulensi tidak ditemukan.'); return; } n = JSON.parse(JSON.stringify(x)); }
    let lampiran = null, hapusLampiran = false;
    const idem = API.newIdem();
    const tlRow = t => '<div class="tl-row" data-tlrow><div class="field"><label class="small">Tindak lanjut</label><input class="input" data-k="ket" value="' + esc(t.ket || '') + '" maxlength="300" placeholder="mis. Tagih iuran yang tertunggak"></div>' +
      '<div class="field"><label class="small">Penanggung jawab</label><input class="input" data-k="pj" value="' + esc(t.pj || '') + '" maxlength="80"></div><div class="field"><label class="small">Tenggat</label><input class="input" type="date" data-k="tenggat" value="' + esc(t.tenggat || '') + '"></div>' +
      '<button type="button" class="btn btn-ghost btn-icon" data-rm aria-label="Hapus baris">' + ic('trash') + '</button><input type="hidden" data-k="selesai" value="' + (t.selesai ? '1' : '') + '"></div>';
    view.innerHTML = '<a class="back-link" href="#/notulensi' + (id ? '/' + esc(id) : '') + '">' + ic('arrow-l', 'ic-sm') + 'Kembali</a>' + App.head(id ? 'Ubah Notulensi' : 'Notulensi Baru', 'Isi ringkas hasil rapat. Kolom bertanda * wajib diisi.') +
      '<form class="stack" data-f novalidate style="max-width:880px">' +
      '<div class="card"><div class="card-title mb">' + ic('info', 'ic-sm') + ' Info Rapat</div><div class="form-grid"><div class="field"><label>Tanggal<span class="req">*</span></label><input class="input" type="date" name="tanggal" value="' + esc(n.tanggal) + '"></div>' +
      '<div class="field"><label>Judul rapat<span class="req">*</span></label><input class="input" name="judul" value="' + esc(n.judul || '') + '" maxlength="150" placeholder="mis. Rapat pengurus kelas"></div>' +
      '<div class="field full"><label>Peserta</label><input class="input" name="peserta" value="' + esc(n.peserta || '') + '" maxlength="500" placeholder="Pisahkan dengan koma, mis. Wali kelas, Ketua kelas, Sekretaris"></div></div></div>' +
      '<div class="card"><div class="card-title mb">' + ic('notulensi', 'ic-sm') + ' Isi Rapat</div><div class="form-stack">' +
      '<div class="field"><label>Agenda</label><textarea class="textarea" name="agenda" maxlength="5000">' + esc(n.agenda || '') + '</textarea></div>' +
      '<div class="field"><label>Pembahasan</label><textarea class="textarea" name="pembahasan" maxlength="5000" style="min-height:130px">' + esc(n.pembahasan || '') + '</textarea></div>' +
      '<div class="field"><label>Keputusan</label><textarea class="textarea" name="keputusan" maxlength="5000">' + esc(n.keputusan || '') + '</textarea></div></div></div>' +
      '<div class="card"><div class="card-head"><div class="card-title">' + ic('list', 'ic-sm') + ' Tindak Lanjut</div><button type="button" class="btn btn-soft btn-sm" data-addtl>' + ic('plus') + 'Tambah</button></div><div class="list" data-tls>' + (n.tindak_lanjut.length ? n.tindak_lanjut : [{}]).map(tlRow).join('') + '</div></div>' +
      '<div class="card"><div class="card-title mb">' + ic('clip', 'ic-sm') + ' Lampiran PDF (opsional)</div>' +
      (n.file_pdf_id ? '<div class="file-chip mb" data-cur>' + ic('file') + '<div class="grow" style="flex:1">Lampiran tersimpan</div><button type="button" class="btn btn-outline btn-xs" data-lihat>Lihat</button><button type="button" class="btn btn-danger-ghost btn-xs" data-hapus>Hapus</button></div>' : '') +
      '<div class="dropzone">' + ic('upload') + '<b>Unggah PDF notulensi</b><div class="small">Maksimal 10 MB</div><input type="file" accept="application/pdf" data-pdf></div><div data-pdfinfo></div></div>' +
      '<div data-err></div></form>' +
      '<div class="sticky-bar"><div class="grow small muted hide-m">Notulensi tersimpan di Google Sheets; lampiran di Google Drive (privat).</div><a class="btn btn-outline" href="#/notulensi' + (id ? '/' + esc(id) : '') + '">Batal</a><button class="btn btn-outline hide-m" data-save="0">Simpan</button><button class="btn btn-primary" data-save="1">' + ic('printer') + 'Simpan &amp; Cetak PDF</button></div>';
    document.body.classList.add('has-sticky');
    const f = $('[data-f]', view);
    f.addEventListener('input', () => App.setDirty(true));
    on(view, 'click', '[data-addtl]', () => { $('[data-tls]', view).insertAdjacentHTML('beforeend', tlRow({})); });
    on(view, 'click', '[data-rm]', (e, b) => { b.closest('[data-tlrow]').remove(); App.setDirty(true); });
    on(view, 'click', '[data-lihat]', () => UI.openFile(n.file_pdf_id, 'Lampiran notulensi'));
    on(view, 'click', '[data-hapus]', () => { hapusLampiran = true; $('[data-cur]', view).remove(); App.setDirty(true); });
    $('[data-pdf]', view).addEventListener('change', async e => {
      const file = e.target.files[0]; lampiran = null; $('[data-pdfinfo]', view).innerHTML = '';
      if (!file) return;
      if (file.type !== 'application/pdf') return UI.toast('Lampiran harus berupa PDF.', 'error');
      if (file.size > 10 * 1048576) return UI.toast('PDF maksimal 10 MB.', 'error');
      lampiran = { data: await UI.readAsDataURL(file) };
      $('[data-pdfinfo]', view).innerHTML = '<div class="file-chip mt-sm">' + ic('file') + '<b class="small">' + esc(file.name) + '</b><span class="small muted">' + Math.round(file.size / 1024) + ' KB</span></div>';
      App.setDirty(true);
    });
    on(view, 'click', '[data-save]', async (e, b) => {
      const d = UI.formData(f);
      if (!d.tanggal) return UI.fieldError(f, 'tanggal', 'Isi tanggal rapat.');
      if (!d.judul) return UI.fieldError(f, 'judul', 'Judul wajib diisi.');
      UI.fieldError(f);
      const tl = $$('[data-tlrow]', view).map(row => { const o = {}; $$('[data-k]', row).forEach(i => { o[i.dataset.k] = i.value.trim(); }); o.selesai = !!o.selesai; return o; }).filter(t => t.ket || t.pj);
      UI.setBusy(b, true);
      const r = await API.api('notul.save', { notul: Object.assign(d, { id: n.id, tindak_lanjut: tl }), lampiran, hapusLampiran, _idem: idem });
      UI.setBusy(b, false);
      if (!r.success) { $('[data-err]', view).innerHTML = '<div class="banner danger">' + ic('alert-circle') + '<div>' + esc(r.message) + '</div></div>'; return; }
      App.setDirty(false); UI.toast(r.message);
      const saved = r.data.notul;
      if (b.dataset.save === '1') await Pages.laporan.buat('notulensi', { dari: saved.tanggal, sampai: saved.tanggal });
      App.go('notulensi/' + saved.id);
    });
  }

  Pages.notulensi = {
    title: 'Notulensi',
    render(view, r) {
      const p = r.params;
      if (p[0] === 'baru') return form(view, null);
      if (p[0] && p[1] === 'ubah') return form(view, p[0]);
      if (p[0]) return detail(view, p[0]);
      return daftar(view);
    },
    leave() { document.body.classList.remove('has-sticky'); }
  };
})();
