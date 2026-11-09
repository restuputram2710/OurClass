/**
 * Periode (data sensitif). Hanya peran berwenang. Tidak pernah disimpan di browser.
 * Setiap akses dicatat di server. Tidak ada kolom teks bebas.
 */
(function () {
  'use strict';
  const { esc, ic, fmt, $, $$, on } = UI;

  function calendar(ym, ranges) {
    const y = +ym.slice(0, 4), m = +ym.slice(5, 7), first = ym + '-01', start = UI.addDays(first, 1 - UI.dow(first)), today = UI.today();
    const inRange = d => ranges.some(r => d >= r.tanggal_mulai && d <= r.tanggal_selesai);
    let h = '<div class="cal">' + ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map(x => '<div class="dh">' + x + '</div>').join('');
    for (let i = 0; i < 42; i++) {
      const d = UI.addDays(start, i);
      if (i >= 35 && d.slice(5, 7) !== UI.pad(m)) break;
      h += '<div class="dc' + (d.slice(5, 7) !== UI.pad(m) ? ' out' : '') + (inRange(d) ? ' mark' : '') + (d === today ? ' today' : '') + '">' + (+d.slice(8)) + '</div>';
    }
    void y;
    return h + '</div>';
  }

  async function render(view, r) {
    if (!App.me.canPeriode) { view.innerHTML = App.denied(); return; }
    let idSiswa = r.query.get('siswi') || '', bulan = UI.today().slice(0, 7);
    view.innerHTML = App.head('Periode <span class="badge b-slate badge-lg">' + ic('lock') + 'Akses terbatas</span>', 'Memuat…') + UI.skeleton();
    async function load() {
      const res = await API.api('periode.list', { id_siswa: idSiswa });
      if (!res.success) { view.innerHTML = res.code === 'FORBIDDEN' ? App.denied() : App.errorBox(res.message); return; }
      const d = res.data, siswi = d.siswi.find(s => s.id === d.id_siswa);
      view.innerHTML = App.head('Periode <span class="badge b-slate badge-lg">' + ic('lock') + 'Akses terbatas</span>', 'Hanya untuk peran yang ditunjuk wali kelas. Setiap akses tercatat.', siswi ? '<button class="btn btn-primary" data-add>' + ic('plus') + 'Catat Periode</button>' : '') +
        '<div class="stack"><div class="banner slate">' + ic('shield') + '<div class="small">Data ini tidak muncul di dashboard, profil siswa, maupun laporan PDF, dan disimpan di spreadsheet terpisah. Gunakan hanya untuk keperluan perhatian dan kebijakan kelas.</div></div>' +
        '<div class="card"><div class="field" style="max-width:420px"><label>Pilih siswi</label><select class="select" data-siswi>' + UI.siswaOptions(d.siswi, d.id_siswa, d.siswi.length ? 'Pilih siswi…' : 'Belum ada siswi aktif') + '</select></div></div>' +
        (siswi ? '<div class="grid" style="grid-template-columns:minmax(0,1fr) minmax(0,1fr);align-items:start" data-grid>' +
          '<div class="card"><div class="card-head"><div class="card-title">' + esc(fmt.bulan(bulan)) + '</div><div class="row gap-sm"><button class="btn btn-outline btn-icon btn-sm" data-m="-1" aria-label="Bulan sebelumnya">' + ic('chev-l') + '</button><button class="btn btn-outline btn-icon btn-sm" data-m="1" aria-label="Bulan berikutnya">' + ic('chev-r') + '</button></div></div>' + calendar(bulan, d.catatan) +
          '<div class="legend mt"><span><i style="background:var(--rose-bg);border:1px solid #FBCFE8"></i>Periode tercatat</span><span><i style="background:#fff;box-shadow:0 0 0 2px var(--primary)"></i>Hari ini</span></div></div>' +
          '<div class="card flush"><div class="card-head"><div class="card-title">Riwayat · ' + esc(siswi.nama_lengkap) + '</div></div>' +
          (d.catatan.length ? '<div class="table-wrap"><table class="table"><thead><tr><th>Mulai</th><th>Selesai</th><th class="c">Durasi</th><th></th></tr></thead><tbody>' + d.catatan.map(c => '<tr><td>' + esc(fmt.tgl(c.tanggal_mulai)) + '</td><td>' + esc(fmt.tgl(c.tanggal_selesai)) + '</td><td class="c">' + c.durasi + ' hari</td><td class="r"><button class="btn btn-ghost btn-icon btn-xs" data-arsip="' + esc(c.id) + '" aria-label="Arsipkan">' + ic('archive', 'ic-sm') + '</button></td></tr>').join('') + '</tbody></table></div>' : '<div style="padding:0 20px 20px">' + UI.empty('Belum ada catatan', '') + '</div>') + '</div></div>'
          : '<div class="card">' + UI.empty('Pilih siswi', 'Kalender dan riwayat akan tampil setelah memilih siswi.') + '</div>') + '</div>';
      const g = $('[data-grid]', view); if (g && window.innerWidth < 1024) g.style.gridTemplateColumns = '1fr';
      $('[data-siswi]', view).addEventListener('change', e => { idSiswa = e.target.value; load(); });
      on(view, 'click', '[data-m]', (e, b) => { const [yy, mm] = bulan.split('-').map(Number); const t = new Date(Date.UTC(yy, mm - 1 + +b.dataset.m, 1)); bulan = t.toISOString().slice(0, 7); const c = b.closest('.card'); c.querySelector('.card-title').textContent = fmt.bulan(bulan); c.querySelector('.cal').outerHTML = calendar(bulan, d.catatan); });
      on(view, 'click', '[data-add]', () => form(siswi));
      on(view, 'click', '[data-arsip]', async (e, b) => {
        if (!(await UI.confirmDlg({ message: 'Arsipkan catatan ini?', okText: 'Arsipkan', danger: true }))) return;
        const x = await API.api('periode.archive', { id: b.dataset.arsip }); UI.toast(x.message, x.success ? 'success' : 'error'); if (x.success) load();
      });
    }
    function form(siswi) {
      const m = UI.modal({
        title: 'Catat Periode', sub: siswi.nama_lengkap, size: 'sm',
        body: '<form class="form-stack" data-f><div class="field"><label>Tanggal mulai</label><input class="input" type="date" name="tanggal_mulai" max="' + UI.today() + '" value="' + UI.today() + '"></div><div class="field"><label>Tanggal selesai</label><input class="input" type="date" name="tanggal_selesai" value="' + UI.today() + '"></div><div data-err></div></form>',
        foot: '<button class="btn btn-outline" data-close>Batal</button><button class="btn btn-primary" data-save>Simpan</button>'
      });
      m.$('[data-save]').addEventListener('click', async e => {
        const d = UI.formData(m.$('[data-f]'));
        UI.setBusy(e.currentTarget, true);
        const x = await API.api('periode.save', { periode: { id_siswa: siswi.id, tanggal_mulai: d.tanggal_mulai, tanggal_selesai: d.tanggal_selesai } });
        UI.setBusy(e.currentTarget, false);
        if (!x.success) { m.$('[data-err]').innerHTML = '<div class="banner danger">' + ic('alert-circle') + '<div>' + esc(x.message) + '</div></div>'; return; }
        m.close(); UI.toast(x.message); load();
      });
    }
    load();
  }
  Pages.periode = { title: 'Periode', allow: me => !!me.canPeriode, render };
})();
