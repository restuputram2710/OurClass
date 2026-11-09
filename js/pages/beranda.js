/** Beranda (dashboard) — mengikuti desain Stitch "Dashboard Utama". */
(function () {
  'use strict';
  const { esc, ic, fmt, $, $$, on } = UI;

  function statusPelajaran(j, today, tanggal) {
    if (tanggal !== today) return 'nanti';
    const now = UI.nowParts().hm;
    if (now >= j.jam_selesai) return 'selesai';
    if (now >= j.jam_mulai) return 'berlangsung';
    return 'nanti';
  }
  function ucapan(u) {
    const c = App.config || {};
    return 'Selamat ulang tahun ke-' + u.usia + ', ' + (u.panggilan || u.nama.split(' ')[0]) + '! Semoga sehat selalu, makin semangat belajar, dan terus berprestasi bersama ' + (c.nama_kelas || 'kelas kita') + '.';
  }

  function render(view, d) {
    const me = App.me, c = App.config || {}, today = UI.today(), k = d.kehadiran;
    const sekolah = !d.libur && UI.dow(d.tanggal) <= 6 && (d.jadwal.length || UI.dow(d.tanggal) <= 5);
    const nama = me.nama;
    let status, cta;
    if (d.libur) { status = '<span class="pill slate">' + ic('calendar', 'ic-sm') + 'Hari ini libur: ' + esc(d.libur) + '</span>'; cta = '<a class="btn btn-outline" href="#/absensi">' + ic('absensi') + 'Buka Absensi</a>'; }
    else if (k.sudah_diisi) { status = '<span class="pill ok"><span class="dot"></span>Absensi hari ini: Sudah diisi</span>'; cta = '<a class="btn btn-primary" href="#/absensi">Lihat Absensi Hari Ini' + ic('arrow-r') + '</a>'; }
    else if (sekolah) { status = '<span class="pill warn"><span class="dot"></span>Absensi hari ini: Belum diisi</span>'; cta = '<a class="btn btn-primary" href="#/absensi">Lanjutkan Absensi Hari Ini' + ic('arrow-r') + '</a>'; }
    else { status = '<span class="pill slate">Tidak ada jadwal hari ini</span>'; cta = '<a class="btn btn-outline" href="#/absensi">' + ic('absensi') + 'Buka Absensi</a>'; }
    const nMapel = d.jadwal.length;
    const lead = d.libur ? 'Selamat beristirahat. Data kelas tetap bisa Anda tinjau kapan saja.'
      : nMapel ? 'Kelas ' + esc(c.nama_kelas) + ' memulai hari dengan ' + nMapel + ' mata pelajaran.' + (k.sudah_diisi ? ' Kehadiran sudah tercatat.' : ' Pastikan absensi jam pertama tersimpan.')
        : 'Kelas ' + esc(c.nama_kelas) + ' — ' + d.siswa.total + ' siswa aktif.';

    const hero = '<section class="hero"><div class="hero-body">' +
      '<div class="row wrap gap-sm"><span class="pill">' + ic('clock', 'ic-sm') + esc(fmt.tglHari(d.tanggal)) + ' · <span data-clock>' + UI.nowParts().hm + '</span> WIB</span>' + status + '</div>' +
      '<h1>' + esc(UI.salam()) + ', <em>' + esc(nama) + '!</em></h1><p>' + lead + '</p>' +
      '<div class="row wrap">' + cta + '<a class="btn btn-outline" href="#/absensi/rekap">' + ic('eye') + 'Lihat Rekap</a></div></div>' + UI.illus('hero') + '</section>';

    const piketHari = d.piket.length;
    const tiles = '<section><div class="row between mb"><h2 class="t-h3">Akses Cepat</h2><span class="small muted hide-m">Aksi harian ' + esc(App.roleLabel(me.role).toLowerCase()) + '</span></div><div class="tiles stagger">' +
      '<a class="tile blue" href="#/absensi"><span class="tic">' + ic('clipboard', 'ic-lg') + '</span><b>Input Absensi</b><span>' + (k.sudah_diisi ? 'Sudah diisi' : 'Sesi hari ini') + '</span></a>' +
      '<a class="tile green" href="#/kas?aksi=bayar"><span class="tic">' + ic('wallet', 'ic-lg') + '</span><b>Catat Kas</b><span>' + fmt.rp(d.kas.nominal) + '/' + (d.kas.periode === 'bulanan' ? 'bulan' : 'pekan') + '</span></a>' +
      '<a class="tile amber" href="#/jadwal"><span class="tic">' + ic('jadwal', 'ic-lg') + '</span><b>Jadwal &amp; Piket</b><span>' + piketHari + ' petugas hari ini</span></a>' +
      '<a class="tile purple" href="#/laporan"><span class="tic">' + ic('printer', 'ic-lg') + '</span><b>Unduh PDF</b><span>Laporan bulanan</span></a></div></section>';

    const stats = '<section class="grid g3 stagger">' +
      '<a class="card stat hoverable" href="#/kas" style="--deco:var(--success-soft);color:inherit;text-decoration:none"><div class="row between"><span class="t-label">Saldo Kas Kelas</span><span class="icon-chip sm ic-green">' + ic('wallet') + '</span></div><div class="val"><span class="t-metric" data-count="' + d.kas.saldo + '" data-fmt="rp">' + fmt.rp(d.kas.saldo) + '</span></div><div class="foot t-green">' + ic('insight', 'ic-sm') + '+' + fmt.rp(d.kas.masuk_minggu_ini) + ' pekan ini</div></a>' +
      '<a class="card stat hoverable" href="#/kas" style="--deco:var(--danger-soft);color:inherit;text-decoration:none"><div class="row between"><span class="t-label">Tunggakan Kas</span><span class="icon-chip sm ic-red">' + ic('alert') + '</span></div><div class="val"><span class="t-metric t-red" data-count="' + d.kas.total_tunggakan + '" data-fmt="rp">' + fmt.rp(d.kas.total_tunggakan) + '</span></div><div class="foot"><span class="dot t-red"></span>' + d.kas.siswa_menunggak + ' siswa belum lunas</div></a>' +
      '<a class="card stat hoverable" href="#/notulensi" style="--deco:var(--primary-soft);color:inherit;text-decoration:none"><div class="row between"><span class="t-label">Notulensi Rapat</span><span class="icon-chip sm">' + ic('notulensi') + '</span></div><div class="val"><span class="t-metric" data-count="' + d.notulensi.total + '">' + d.notulensi.total + '</span><small>Notulensi</small></div><div class="foot t-primary">' + ic('check-circle', 'ic-sm') + (d.notulensi.terakhir ? 'Terakhir: ' + esc(d.notulensi.terakhir.judul) + ' · ' + fmt.tglPendek(d.notulensi.terakhir.tanggal) : 'Belum ada rapat tercatat') + '</div></a></section>';

    const jadwal = '<section class="card"><div class="card-head"><div><div class="card-title">Jadwal Hari Ini</div><div class="sub">' + esc(d.hari) + ', ' + nMapel + ' sesi mata pelajaran</div></div><a class="icon-btn" href="#/jadwal" aria-label="Lihat jadwal" style="width:38px;height:38px">' + ic('jadwal') + '</a></div>' +
      (nMapel ? '<div class="list">' + d.jadwal.map((j, i) => {
        const st = statusPelajaran(j, today, d.tanggal);
        const chip = st === 'berlangsung' ? '<span class="badge b-primary"><span class="dot"></span>Berlangsung</span>' : st === 'selesai' ? '<span class="badge b-outline">Selesai</span>' : '<span class="badge b-outline">Nanti</span>';
        return '<div class="lesson ' + (st === 'berlangsung' ? 'now' : '') + '"><span class="no">' + UI.pad(i + 1) + '</span><div class="grow" style="flex:1;min-width:0"><div class="ttl">' + esc(j.mata_pelajaran) + '</div><div class="sub">' + esc([j.guru, j.jam_mulai + ' – ' + j.jam_selesai].filter(Boolean).join(' · ')) + '</div></div>' + chip + '</div>';
      }).join('') + '</div>' : UI.empty('Tidak ada jadwal hari ini', d.libur ? 'Hari libur.' : 'Atur jadwal pelajaran di menu Jadwal & Piket.', '<a class="btn btn-soft btn-sm" href="#/jadwal">Atur jadwal</a>')) +
      '<div class="divider"></div><div class="row wrap small">' + ic('brush', 'ic-sm') + '<span class="muted">Piket hari ini:</span><b>' + (d.piket.length ? esc(d.piket.map(p => p.nama.split(' ')[0]).join(', ')) : '–') + '</b></div></section>';

    // Tren = 5 hari sekolah terakhir yang tercatat (backend baru); cadangan: pekan ini (backend lama)
    const pakaiTren = Array.isArray(d.tren) && d.tren.length > 0;
    const days = pakaiTren
      ? d.tren.map(m => ({ label: m.hari + ' ' + (+m.tanggal.slice(8)), value: m.persen, hi: m.tanggal === today, title: fmt.pct(m.persen) }))
      : d.minggu.map(m => ({ label: m.hari, value: m.persen || 0, hi: m.tanggal === today, empty: m.persen === null, title: m.persen === null ? (m.status === 'libur' ? 'Libur' : 'Belum ada data') : fmt.pct(m.persen) }));
    const rata = pakaiTren ? d.rata_tren : d.rata_minggu;
    const subTren = pakaiTren ? d.tren.length + ' hari sekolah terakhir (' + fmt.tglPendek(d.tren[0].tanggal) + ' – ' + fmt.tglPendek(d.tren[d.tren.length - 1].tanggal) + ')'
      : 'Pekan ini (' + fmt.tglPendek(d.minggu[0].tanggal) + ' – ' + fmt.tglPendek(d.minggu[4].tanggal) + ')';
    const tren = '<section class="card"><div class="card-head"><div><div class="card-title">Tren Kehadiran</div><div class="sub">' + esc(subTren) + '</div></div>' + (rata !== null && rata !== undefined ? '<span class="badge b-green badge-lg">Rata-rata ' + fmt.pct(rata) + '</span>' : '') + '</div>' +
      UI.barChart(days, { width: 360, max: 100, target: 95, targetText: false, suffix: '%', fmt: v => Math.round(v) + '%', axis: v => Math.round(v) + '%', label: 'Persentase kehadiran per hari sekolah terakhir' }) +
      '<div class="legend mt-sm"><span><i style="background:var(--primary)"></i>Di atas target</span><span><i style="background:var(--primary-soft-hover)"></i>Perlu dorongan</span><span><i style="width:16px;height:0;border-radius:0;border-top:2px dashed var(--primary)"></i>Target 95%</span></div></section>';

    const attn = '<section class="card"><div class="card-head"><div class="row"><span class="icon-chip sm ic-red">' + ic('alert') + '</span><div><div class="card-title">Perlu Perhatian</div><div class="sub">Catatan otomatis untuk tindak lanjut wali kelas</div></div></div><a href="#/insight" class="link-btn">Tinjau semua</a></div>' +
      (d.perhatian.length ? '<div class="grid g2">' + d.perhatian.map(p => {
        const b = p.tipe === 'alpa' ? 'b-red' : p.tipe === 'tunggakan' ? 'b-amber' : 'b-purple';
        return '<div class="attn">' + UI.avatar(p.nama, '', 'sm') + '<div class="grow"><div class="row between" style="align-items:flex-start;gap:8px"><b>' + esc(p.nama) + '</b><span class="badge ' + b + '">' + esc(p.label) + '</span></div><p>' + esc(p.detail) + '</p><a class="btn btn-outline btn-xs mt-sm" href="#/siswa/' + esc(p.id_siswa) + '">Lihat profil</a></div></div>';
      }).join('') + '</div>' : '<div class="banner ok">' + ic('check-circle') + '<div>Tidak ada siswa yang perlu perhatian khusus saat ini.</div></div>') + '</section>';

    // ---- Rail kanan ----
    const pct = k.persen === null ? 0 : k.persen;
    const sisa = k.total - k.terisi;
    const ringCard = '<section class="card"><div class="card-head" style="margin-bottom:6px"><div class="card-title">Kehadiran Hari Ini</div><span class="small muted">Target 95%</span></div>' +
      '<div class="ring-wrap">' + UI.ring(pct) + '<div class="ring-center"><div><b>' + (k.persen === null ? '–' : '<span data-count="' + pct + '" data-fmt="pct">' + fmt.pct(pct) + '</span>') + '</b><span>' + k.H + ' / ' + k.total + ' Siswa</span></div></div></div>' +
      '<p class="muted" style="text-align:center;margin:10px 0 14px">' + (d.libur ? 'Hari libur' : !k.sudah_diisi ? 'Absensi belum diisi' : sisa > 0 ? sisa + ' siswa belum tercatat' : (k.I + k.S + k.A) + ' siswa berhalangan hadir') + '</p>' +
      '<div class="week"><div class="small muted" style="text-align:center;font-weight:600">Status Rekap Mingguan</div><div class="week-row">' +
      d.minggu.map((m, i) => '<a class="wd ' + m.status + '" href="#/absensi/' + m.tanggal + '" style="text-decoration:none" title="' + esc(fmt.tglHari(m.tanggal)) + '"><i>' + (m.status === 'terisi' ? ic('check', 'ic-sm') : m.status === 'hari_ini' ? ic('pencil', 'ic-sm') : m.status === 'libur' ? '–' : (+m.tanggal.slice(8))) + '</i>' + esc(m.hari) + '</a>').join('') +
      '</div></div><div class="hisa mt">' + ['H', 'I', 'S', 'A'].map(s => '<div class="' + s + '"><b data-count="' + k[s] + '">' + k[s] + '</b><span>' + UI.STATUS[s][0] + '</span></div>').join('') + '</div></section>';

    const today_ = d.ultah.filter(u => u.hari_ini), nanti = d.ultah.filter(u => !u.hari_ini && u.sisa_hari > 0), lewat = d.ultah.filter(u => u.sisa_hari < 0);
    const bday = '<section class="card"><div class="card-head"><div class="row"><span class="icon-chip sm ic-amber">' + ic('cake') + '</span><div class="card-title">Ulang Tahun ' + esc(UI.BULAN[+d.tanggal.slice(5, 7) - 1]) + '</div></div><span class="badge b-amber">' + d.ultah.length + ' Siswa</span></div>' +
      (d.ultah.length ? '<div class="list">' +
        today_.map(u => '<div class="bday-today"><div class="row">' + UI.avatar(u.nama, '', '', 'c3') + '<div style="flex:1;min-width:0"><b>' + esc(u.nama) + '</b><div><span class="badge b-solid-amber badge-pulse">' + ic('party') + 'HARI INI · ke-' + u.usia + '</span></div></div><button class="btn btn-outline btn-xs" data-ucapan="' + esc(u.id) + '">' + ic('copy') + 'Ucapan</button></div>' +
          '<div class="quote-box mt-sm">"' + esc(ucapan(u)) + '"</div></div>').join('') +
        nanti.concat(lewat).slice(0, 5).map(u => '<div class="li soft">' + UI.avatar(u.nama, '', 'sm') + '<div class="grow"><div class="ttl">' + esc(u.nama) + '</div><div class="sub">' + esc(fmt.tglPendek(u.tanggal)) + (u.sisa_hari > 0 ? ' · ' + u.sisa_hari + ' hari lagi' : ' · sudah lewat') + '</div></div><span class="badge b-outline">' + u.usia + ' th</span></div>').join('') +
        '</div>' : '<div class="small muted">Tidak ada siswa yang berulang tahun bulan ini.</div>') + '</section>';

    view.innerHTML = '<div class="dash"><div class="dash-main">' + hero + '<div class="show-m">' + ringCard + '</div>' + tiles + stats + '<div class="grid g2">' + jadwal + tren + '</div>' + attn + '</div>' +
      '<div class="dash-rail"><div class="hide-m">' + ringCard + '</div>' + bday + '</div></div>';
    UI.animate(view);
    on(view, 'click', '[data-ucapan]', (e, b) => { const u = d.ultah.find(x => x.id === b.dataset.ucapan); if (u) UI.copyText(ucapan(u), 'Ucapan disalin. Tempel di grup kelas.'); });
    App.updateBell(d);
  }

  let clockTimer = null;
  Pages.beranda = {
    title: 'Beranda',
    async render(view) {
      view.innerHTML = UI.skeleton('dash');
      let shown = false;
      const r = await API.load('dashboard.get', {}, { maxAge: 30000, onData: d => { shown = true; render(view, d); } });
      if (!r.success && !shown) { view.innerHTML = App.errorBox(r.message, true); const b = $('[data-retry]', view); if (b) b.onclick = () => App.reload(); }
      clearInterval(clockTimer);
      clockTimer = setInterval(() => { const el = $('[data-clock]'); if (el) el.textContent = UI.nowParts().hm; else clearInterval(clockTimer); }, 30000);
    },
    leave() { clearInterval(clockTimer); }
  };
})();
