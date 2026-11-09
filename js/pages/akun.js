/** Kelola akun sekretaris, akses modul Periode, dan log aktivitas (khusus wali kelas). */
(function () {
  'use strict';
  const { esc, ic, fmt, $, $$, on } = UI;

  function tampilSandi(judul, username, sandi) {
    const m = UI.modal({
      title: judul, size: 'sm', lock: true,
      body: '<p class="muted">Berikan kata sandi sementara ini kepada <b>@' + esc(username) + '</b>. Kata sandi <b>hanya tampil sekali</b> dan wajib diganti saat login pertama.</p><div class="temp-pass mt">' + esc(sandi) + '</div>',
      foot: '<button class="btn btn-outline" data-copy>' + ic('copy') + 'Salin</button><button class="btn btn-primary" data-close>Sudah dicatat</button>'
    });
    m.$('[data-copy]').addEventListener('click', () => UI.copyText('Username: ' + username + '\nKata sandi sementara: ' + sandi, 'Username & sandi disalin.'));
  }
  function formAkun(a, done) {
    a = a || {};
    let auto = true;
    const m = UI.modal({
      title: a.id ? 'Ubah Akun' : 'Tambah Akun Sekretaris', sub: a.id ? '' : 'Sekretaris dapat mengelola data harian bersama wali kelas.',
      body: '<form class="form-stack" data-f novalidate><div class="field"><label>Nama lengkap<span class="req">*</span></label><input class="input" name="nama" value="' + esc(a.nama || '') + '" maxlength="60"></div>' +
        '<div class="field"><label>Username<span class="req">*</span></label><div class="input-wrap"><span class="input-prefix">@</span><input class="input" name="username" value="' + esc(a.username || '') + '" maxlength="30" autocapitalize="none" spellcheck="false"></div><span class="help">3–30 karakter: huruf kecil, angka, titik, atau garis bawah.</span></div>' +
        (a.id ? '' : '<div class="field"><label class="check"><input type="checkbox" data-auto checked>Buat kata sandi sementara otomatis</label><input class="input hidden" name="sandi" type="text" placeholder="Kata sandi sementara (min. 8, huruf + angka)" autocomplete="off"></div>') + '<div data-err></div></form>',
      foot: '<button class="btn btn-outline" data-close>Batal</button><button class="btn btn-primary" data-save>' + ic('check') + 'Simpan</button>'
    });
    const ac = m.$('[data-auto]'); if (ac) ac.addEventListener('change', () => { auto = ac.checked; m.$('[name=sandi]').classList.toggle('hidden', auto); });
    m.$('[data-save]').addEventListener('click', async e => {
      const d = UI.formData(m.$('[data-f]'));
      if (!d.nama) return UI.fieldError(m.el, 'nama', 'Nama wajib diisi.');
      if (!/^[a-z0-9._]{3,30}$/.test(String(d.username).toLowerCase())) return UI.fieldError(m.el, 'username', 'Username tidak valid.');
      UI.setBusy(e.currentTarget, true);
      const r = await API.api('akun.save', { akun: { id: a.id, nama: d.nama, username: d.username.toLowerCase(), sandi: auto ? '' : d.sandi } });
      UI.setBusy(e.currentTarget, false);
      if (!r.success) { m.$('[data-err]').innerHTML = '<div class="banner danger">' + ic('alert-circle') + '<div>' + esc(r.message) + '</div></div>'; return; }
      m.close(); UI.toast(r.message);
      if (r.data && r.data.sandi_sementara) tampilSandi('Akun dibuat', r.data.username, r.data.sandi_sementara);
      done();
    });
  }

  async function render(view, r) {
    const tabs = [['akun', 'Akun', 'siswa'], ['periode', 'Akses Periode', 'lock'], ['log', 'Log Aktivitas', 'history']];
    let tab = tabs.some(t => t[0] === r.params[0]) ? r.params[0] : 'akun';
    view.innerHTML = App.head('Kelola Akun &amp; Peran', 'Hanya wali kelas yang dapat menunjuk, menonaktifkan, dan mereset sandi sekretaris.', '<button class="btn btn-primary" data-add>' + ic('plus') + 'Tambah Sekretaris</button>', [['Kelola Akun']]) +
      '<div class="stack"><div class="tabs">' + tabs.map(t => '<button data-tab="' + t[0] + '" class="' + (t[0] === tab ? 'on' : '') + '">' + ic(t[2], 'ic-sm') + t[1] + '</button>').join('') + '</div><div data-box></div></div>';
    const box = $('[data-box]', view);
    let data = null;
    async function load() { const x = await API.api('akun.list'); if (!x.success) { box.innerHTML = App.errorBox(x.message); return null; } data = x.data; return data; }
    async function show() {
      box.innerHTML = UI.skeleton();
      if (tab === 'log') return logView();
      if (!(await load())) return;
      if (tab === 'akun') akunView(); else aksesView();
    }
    function akunView() {
      box.innerHTML = '<div class="card flush"><div class="table-wrap hide-m"><table class="table"><thead><tr><th>Pengguna</th><th>Peran</th><th>Status</th><th>Login terakhir</th><th class="r">Aksi</th></tr></thead><tbody>' +
        data.akun.map(a => '<tr><td><div class="person">' + UI.avatar(a.nama) + '<div><div class="nm">' + esc(a.nama) + (a.id === App.me.id ? ' <span class="badge b-outline">Anda</span>' : '') + '</div><div class="meta">@' + esc(a.username) + (a.wajib_ganti_sandi ? ' · <span class="t-amber">menunggu ganti sandi</span>' : '') + '</div></div></div></td>' +
          '<td><span class="badge ' + (a.role === 'walikelas' ? 'b-primary' : 'b-slate') + '">' + esc(App.roleLabel(a.role)) + '</span></td><td><span class="badge ' + (a.status === 'aktif' ? 'b-green' : 'b-slate') + '"><span class="dot"></span>' + (a.status === 'aktif' ? 'Aktif' : 'Nonaktif') + '</span></td>' +
          '<td class="small muted">' + esc(fmt.rel(a.last_login)) + '</td><td><div class="row" style="justify-content:flex-end;gap:6px"><button class="btn btn-ghost btn-xs" data-edit="' + esc(a.id) + '">' + ic('pencil', 'ic-sm') + 'Ubah</button>' +
          (a.role !== 'walikelas' ? '<button class="btn btn-ghost btn-xs" data-reset="' + esc(a.id) + '">' + ic('key', 'ic-sm') + 'Reset Sandi</button><button class="btn ' + (a.status === 'aktif' ? 'btn-danger-ghost' : 'btn-outline') + ' btn-xs" data-status="' + esc(a.id) + '">' + (a.status === 'aktif' ? 'Nonaktifkan' : 'Aktifkan') + '</button>' : '') + '</div></td></tr>').join('') + '</tbody></table></div>' +
        '<div class="list show-m" style="padding:12px">' + data.akun.map(a => '<div class="li" style="flex-direction:column;align-items:stretch;gap:10px"><div class="person">' + UI.avatar(a.nama) + '<div style="flex:1;min-width:0"><div class="nm">' + esc(a.nama) + '</div><div class="meta">@' + esc(a.username) + ' · ' + esc(fmt.rel(a.last_login)) + '</div></div><span class="badge ' + (a.status === 'aktif' ? 'b-green' : 'b-slate') + '">' + (a.status === 'aktif' ? 'Aktif' : 'Nonaktif') + '</span></div>' +
          '<div class="row wrap gap-sm"><span class="badge ' + (a.role === 'walikelas' ? 'b-primary' : 'b-slate') + '">' + esc(App.roleLabel(a.role)) + '</span><span style="flex:1"></span><button class="btn btn-outline btn-xs" data-edit="' + esc(a.id) + '">Ubah</button>' + (a.role !== 'walikelas' ? '<button class="btn btn-outline btn-xs" data-reset="' + esc(a.id) + '">Reset Sandi</button><button class="btn btn-outline btn-xs" data-status="' + esc(a.id) + '">' + (a.status === 'aktif' ? 'Nonaktifkan' : 'Aktifkan') + '</button>' : '') + '</div></div>').join('') + '</div>' +
        (data.akun.length < 2 ? '<div style="padding:0 20px 20px">' + UI.empty('Belum ada sekretaris', 'Tunjuk siswa sebagai sekretaris agar dapat membantu mengelola data.', '<button class="btn btn-primary btn-sm" data-add>' + ic('plus') + 'Tambah Sekretaris</button>') + '</div>' : '') + '</div>';
    }
    function aksesView() {
      const sek = data.akun.filter(a => a.role === 'sekretaris');
      let mode = data.akses_periode, pilih = data.akses_periode_users.slice();
      const opt = (v, t, d, rec) => '<button type="button" class="rcard' + (mode === v ? ' on' : '') + '" data-mode="' + v + '"><span class="radio"></span><span style="flex:1"><b>' + t + '</b>' + (rec ? ' <span class="badge b-green">Disarankan</span>' : '') + '<div class="small muted mt-sm">' + d + '</div></span></button>';
      box.innerHTML = '<div class="card card-pad-lg" style="max-width:760px"><div class="card-title">Siapa yang boleh membuka modul Periode?</div><p class="muted mt-sm" style="line-height:22px">Data periode haid adalah data kesehatan milik siswi (anak). Sekretaris juga siswa/teman sekelas, sehingga aksesnya sebaiknya dibatasi.</p>' +
        '<div class="list mt">' + opt('walikelas', 'Hanya wali kelas', 'Paling aman. Sekretaris tidak melihat menu Periode.', true) + opt('pilihan', 'Wali kelas + akun yang dipilih', 'Mis. sekretaris putri yang ditunjuk.') + opt('semua', 'Seluruh admin (wali kelas & semua sekretaris)', 'Sesuai keputusan awal PRD.') + '</div>' +
        '<div class="mt' + (mode === 'pilihan' ? '' : ' hidden') + '" data-pilih><div class="t-label mb">Pilih akun sekretaris</div>' + (sek.length ? sek.map(a => '<label class="check" style="display:flex;margin:8px 0"><input type="checkbox" value="' + esc(a.id) + '"' + (pilih.indexOf(a.id) > -1 ? ' checked' : '') + '>' + esc(a.nama) + ' <span class="muted small">@' + esc(a.username) + '</span></label>').join('') : '<span class="small muted">Belum ada akun sekretaris.</span>') + '</div>' +
        '<div class="banner info mt">' + ic('shield') + '<div class="small">Setiap kali modul Periode dibuka atau ditolak, kejadiannya tercatat di Log Aktivitas (tanpa isi data).</div></div>' +
        '<button class="btn btn-primary mt-lg" data-simpan-akses>' + ic('check') + 'Simpan Pengaturan Akses</button></div>';
      on(box, 'click', '[data-mode]', (e, b) => { mode = b.dataset.mode; $$('[data-mode]', box).forEach(x => x.classList.toggle('on', x === b)); $('[data-pilih]', box).classList.toggle('hidden', mode !== 'pilihan'); });
      on(box, 'click', '[data-simpan-akses]', async (e, b) => {
        pilih = $$('[data-pilih] input:checked', box).map(i => i.value);
        UI.setBusy(b, true); const x = await API.api('akses.periode', { mode, users: pilih }); UI.setBusy(b, false);
        UI.toast(x.message, x.success ? 'success' : 'error');
      });
    }
    async function logView() {
      const x = await API.api('log.list', { limit: 300 });
      if (!x.success) { box.innerHTML = App.errorBox(x.message); return; }
      let mf = 'semua';
      const mods = Array.from(new Set(x.data.map(l => l.modul))).sort();
      const paint = () => {
        const L = x.data.filter(l => mf === 'semua' || l.modul === mf);
        $('[data-rows]', box).innerHTML = L.length ? L.map(l => '<tr><td class="small muted" style="white-space:nowrap">' + esc(fmt.waktu(l.timestamp)) + '</td><td>' + esc(l.nama) + '</td><td><span class="badge ' + (/GAGAL|DITOLAK|HAPUS/.test(l.aksi) ? 'b-red' : /ARSIP|RESET|NONAKTIF/.test(l.aksi) ? 'b-amber' : 'b-slate') + '">' + esc(l.aksi) + '</span></td><td>' + esc(l.modul) + '</td><td class="small muted">' + esc(l.detail || '') + '</td></tr>').join('') : '<tr><td colspan="5">' + UI.empty('Belum ada aktivitas', '') + '</td></tr>';
      };
      box.innerHTML = '<div class="card flush"><div class="card-head"><div><div class="card-title">Log Aktivitas</div><div class="sub">300 aktivitas terakhir · hanya ditambah, tidak dapat diubah</div></div><select class="select" data-mf style="width:200px"><option value="semua">Semua modul</option>' + mods.map(mm => '<option>' + esc(mm) + '</option>').join('') + '</select></div>' +
        '<div class="table-wrap"><table class="table"><thead><tr><th>Waktu</th><th>Pengguna</th><th>Aksi</th><th>Modul</th><th>Detail</th></tr></thead><tbody data-rows></tbody></table></div></div>';
      paint();
      $('[data-mf]', box).addEventListener('change', e => { mf = e.target.value; paint(); });
    }
    on(view, 'click', '[data-tab]', (e, b) => { tab = b.dataset.tab; $$('[data-tab]', view).forEach(x => x.classList.toggle('on', x === b)); history.replaceState(null, '', '#/akun/' + tab); show(); });
    on(view, 'click', '[data-add]', () => formAkun(null, () => { tab = 'akun'; $$('[data-tab]', view).forEach(x => x.classList.toggle('on', x.dataset.tab === 'akun')); show(); }));
    on(view, 'click', '[data-edit]', (e, b) => formAkun(data.akun.find(a => a.id === b.dataset.edit), show));
    on(view, 'click', '[data-reset]', async (e, b) => {
      const a = data.akun.find(x => x.id === b.dataset.reset);
      if (!(await UI.confirmDlg({ title: 'Reset kata sandi?', message: 'Kata sandi @' + a.username + ' akan diganti dengan sandi sementara baru. Semua sesi login akun ini akan berakhir.', okText: 'Reset Sandi' }))) return;
      const x = await API.api('akun.resetPass', { id: a.id });
      if (!x.success) return UI.toast(x.message, 'error');
      tampilSandi('Sandi sementara baru', x.data.username, x.data.sandi_sementara); show();
    });
    on(view, 'click', '[data-status]', async (e, b) => {
      const a = data.akun.find(x => x.id === b.dataset.status), aktif = a.status === 'aktif';
      if (!(await UI.confirmDlg({ title: aktif ? 'Nonaktifkan akun?' : 'Aktifkan akun?', message: aktif ? '@' + a.username + ' tidak akan bisa masuk dan sesi yang sedang berjalan langsung berakhir.' : '@' + a.username + ' dapat masuk kembali.', okText: aktif ? 'Nonaktifkan' : 'Aktifkan', danger: aktif }))) return;
      const x = await API.api('akun.status', { id: a.id, status: aktif ? 'nonaktif' : 'aktif' }); UI.toast(x.message, x.success ? 'success' : 'error'); if (x.success) show();
    });
    show();
  }
  Pages.akun = { title: 'Kelola Akun', allow: me => me.role === 'walikelas', render };
})();
