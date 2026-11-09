/** Laporan PDF otomatis. */
(function () {
  'use strict';
  const { esc, ic, fmt, $, $$, on } = UI;
  const JENIS = [
    ['absensi', 'Rekap Absensi Bulanan', 'Hadir/Izin/Sakit/Alpa per siswa + persentase', 'absensi', 'b-primary'],
    ['kas', 'Rekap Kas', 'Pemasukan, pengeluaran, saldo, dan tunggakan', 'wallet', 'b-green'],
    ['notulensi', 'Notulensi Rapat', 'Isi rapat, keputusan, dan tindak lanjut', 'notulensi', 'b-purple']
  ];

  /** Buat PDF lalu tampilkan pratinjau/unduh. Dipakai juga dari halaman lain. */
  async function buat(jenis, periode, btn) {
    if (btn) UI.setBusy(btn, true, 'Menyusun laporan…');
    else UI.toast('Menyusun laporan PDF…', 'info');
    const r = await API.api('laporan.buat', Object.assign({ jenis }, periode));
    if (btn) UI.setBusy(btn, false);
    if (!r.success) { UI.toast(r.message, r.code === 'EMPTY' ? 'warning' : 'error'); return null; }
    tampil(r.data);
    return r.data;
  }
  function tampil(d) {
    const url = URL.createObjectURL(UI.b64ToBlob(d.data, 'application/pdf')), mobile = window.innerWidth < 768;
    UI.modal({
      title: 'Laporan siap', sub: d.nama_file, size: 'xl',
      body: (mobile ? '<div class="file-chip">' + ic('file') + '<div style="flex:1"><b class="small">' + esc(d.nama_file) + '</b><div class="small muted">Tersimpan juga di folder Laporan_PDF (Google Drive).</div></div></div>' : '<iframe class="pdf-frame" src="' + url + '" title="Pratinjau laporan"></iframe>'),
      foot: '<a class="btn btn-outline" href="' + url + '" target="_blank" rel="noopener">' + ic('eye') + 'Buka</a><a class="btn btn-primary" href="' + url + '" download="' + esc(d.nama_file) + '">' + ic('download') + 'Unduh PDF</a>'
    });
  }

  async function render(view) {
    let jenis = 'absensi', mode = 'bulan';
    const now = UI.today();
    view.innerHTML = App.head('Laporan PDF', 'Pilih jenis dan periode, lalu cetak. PDF tersimpan otomatis di Google Drive.', '', [['Laporan']]) +
      '<div class="grid" style="grid-template-columns:minmax(0,1fr) minmax(0,1.1fr);align-items:start" data-grid>' +
      '<div class="card card-pad-lg"><div class="card-title mb">1. Jenis laporan</div><div class="list" data-jenis>' + JENIS.map(j => '<button type="button" class="rcard' + (j[0] === jenis ? ' on' : '') + '" data-v="' + j[0] + '"><span class="radio"></span><span class="icon-chip sm">' + ic(j[3]) + '</span><span style="flex:1"><b style="display:block">' + j[1] + '</b><span class="small muted">' + j[2] + '</span></span></button>').join('') + '</div>' +
      '<div class="divider"></div><div class="card-title mb">2. Periode</div><div class="seg mb" data-mode><button type="button" data-v="bulan" class="on">Per bulan</button><button type="button" data-v="rentang">Rentang tanggal</button></div>' +
      '<div data-pbulan><input class="input" type="month" data-bulan value="' + now.slice(0, 7) + '" max="' + now.slice(0, 7) + '" style="max-width:240px"></div>' +
      '<div data-prentang class="hidden"><div class="form-grid"><div class="field"><label>Dari</label><input class="input" type="date" data-dari value="' + now.slice(0, 8) + '01" max="' + now + '"></div><div class="field"><label>Sampai</label><input class="input" type="date" data-sampai value="' + now + '" max="' + now + '"></div></div></div>' +
      '<div class="banner info mt">' + ic('shield') + '<div class="small">Kop laporan memakai logo, nama sekolah, kelas, dan wali kelas dari menu Pengaturan. Data periode tidak pernah disertakan.</div></div>' +
      '<button class="btn btn-primary btn-block mt-lg" data-buat>' + ic('printer') + 'Cetak PDF</button></div>' +
      '<div class="card"><div class="card-head"><div class="card-title">Riwayat laporan</div><button class="btn btn-ghost btn-icon btn-sm" data-refresh aria-label="Segarkan">' + ic('refresh') + '</button></div><div data-list>' + UI.skeleton() + '</div></div></div>';
    if (window.innerWidth < 1024) $('[data-grid]', view).style.gridTemplateColumns = '1fr';
    on(view, 'click', '[data-jenis] .rcard', (e, b) => { jenis = b.dataset.v; $$('[data-jenis] .rcard', view).forEach(x => x.classList.toggle('on', x === b)); });
    on(view, 'click', '[data-mode] button', (e, b) => { mode = b.dataset.v; $$('[data-mode] button', view).forEach(x => x.classList.toggle('on', x === b)); $('[data-pbulan]', view).classList.toggle('hidden', mode !== 'bulan'); $('[data-prentang]', view).classList.toggle('hidden', mode === 'bulan'); });
    on(view, 'click', '[data-buat]', async (e, b) => {
      const p = mode === 'bulan' ? { bulan: $('[data-bulan]', view).value } : { dari: $('[data-dari]', view).value, sampai: $('[data-sampai]', view).value };
      if (mode === 'rentang' && p.dari > p.sampai) return UI.toast('Tanggal "dari" harus sebelum "sampai".', 'warning');
      const d = await buat(jenis, p, b); if (d) list();
    });
    on(view, 'click', '[data-refresh]', () => list());
    on(view, 'click', '[data-file]', (e, b) => UI.openFile(b.dataset.file, b.dataset.nama));
    async function list() {
      const r = await API.api('laporan.list');
      const el = $('[data-list]', view); if (!el) return;
      if (!r.success) { el.innerHTML = App.errorBox(r.message); return; }
      const L = r.data.laporan, J = {}; JENIS.forEach(j => { J[j[0]] = j; });
      el.innerHTML = L.length ? '<div class="list">' + L.map(x => '<div class="li"><span class="icon-chip sm ic-red">' + ic('file') + '</span><div class="grow"><div class="ttl small" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(x.nama_file) + '</div><div class="sub">' + esc(J[x.jenis] ? J[x.jenis][1] : x.jenis) + ' · ' + esc(x.periode) + ' · ' + esc(fmt.waktu(x.created_at)) + ' · ' + esc(x.dibuat_oleh) + '</div></div><button class="btn btn-outline btn-xs" data-file="' + esc(x.file_id) + '" data-nama="' + esc(x.nama_file) + '">' + ic('download', 'ic-sm') + 'Unduh</button></div>').join('') + '</div>'
        : UI.empty('Belum ada laporan', 'Laporan yang Anda cetak akan muncul di sini.');
    }
    list();
  }
  Pages.laporan = { title: 'Laporan', render, buat };
})();
