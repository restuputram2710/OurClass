/**
 * Lapisan komunikasi ke GAS REST API.
 * - POST text/plain (menghindari preflight CORS), token di body.
 * - Dedupe permintaan baca identik + epoch tulis (data tidak basi setelah simpan).
 * - Batcher: panggilan baca di tik yang sama digabung jadi 1 eksekusi server.
 * - SWR: tampil instan dari sessionStorage, lalu segarkan di latar.
 * - Perf.table() / Perf.summary() di console untuk mengukur kecepatan.
 */
(function () {
  'use strict';
  const C = window.APP_CONFIG || {};
  const URL_ = String(C.GAS_URL || '');
  const TOKEN_KEY = 'oc_token';
  const READ = /^(ping|public\.config|auth\.me|batch|dashboard\.get|siswa\.(list|get)|absensi\.(day|rekap)|kas\.get|jadwal\.get|insight\.get|notul\.list|periode\.list|laporan\.list|file\.get|set\.get|akun\.list|log\.list|arsip\.list|import\.scan)$/;
  // Data yang TIDAK pernah disimpan di browser (sensitif / berukuran besar / selalu segar)
  const NO_STORE = /^(periode\.|file\.get|auth\.|log\.list|arsip\.list|akun\.list|import\.)/;

  const Store = {
    get(k) { try { return JSON.parse(sessionStorage.getItem(k)); } catch (e) { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* penuh / mode privat */ } },
    del(k) { try { sessionStorage.removeItem(k); } catch (e) { } },
    clear(prefix) { try { Object.keys(sessionStorage).forEach(k => { if (!prefix || k.indexOf(prefix) === 0) sessionStorage.removeItem(k); }); } catch (e) { } }
  };
  const Token = {
    get() { try { return localStorage.getItem(TOKEN_KEY) || ''; } catch (e) { return ''; } },
    set(t) { try { localStorage.setItem(TOKEN_KEY, t); } catch (e) { } },
    clear() { try { localStorage.removeItem(TOKEN_KEY); } catch (e) { } }
  };
  const Perf = {
    log: [],
    add(e) { this.log.push(Object.assign({ at: new Date().toLocaleTimeString('id-ID') }, e)); if (this.log.length > 300) this.log.shift(); },
    table() { console.table(this.log.slice(-40)); },
    summary() {
      const g = {};
      this.log.forEach(e => { const x = g[e.action] = g[e.action] || { n: 0, total: 0, server: 0, cached: 0 }; x.n++; x.total += e.total; x.server += e.server || 0; if (e.cached) x.cached++; });
      console.table(Object.keys(g).map(k => ({ aksi: k, jumlah: g[k].n, 'rata total ms': Math.round(g[k].total / g[k].n), 'rata server ms': Math.round(g[k].server / g[k].n), 'cache server': g[k].cached })));
    }
  };
  window.Perf = Perf;

  let onAuthFail = null, onMustChange = null, epoch = 0;
  const inflight = {};

  function configured() { return /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(URL_) && !/GANTI|XXXX/.test(URL_) || /^http:\/\/(localhost|127\.0\.0\.1)/.test(URL_); }
  function newIdem() { return (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2); }

  function handleCodes(action, res) {
    if (!res || res.success) return;
    if (res.code === 'AUTH' && action !== 'auth.login' && onAuthFail) onAuthFail(res.message);
    else if (res.code === 'MUST_CHANGE' && onMustChange) onMustChange();
  }

  async function raw(action, data, opts) {
    opts = opts || {};
    const t0 = performance.now();
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), opts.timeout || 90000);
    let res;
    try {
      const r = await fetch(URL_, {
        method: 'POST', redirect: 'follow', signal: ctrl.signal,
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action, token: Token.get(), data: data || {} })
      });
      const txt = await r.text();
      try { res = JSON.parse(txt); }
      catch (e) { res = { success: false, message: 'Respons server tidak valid. Pastikan URL Web App benar dan sudah di-deploy dengan akses "Anyone".' }; }
    } catch (e) {
      res = { success: false, network: true, message: e.name === 'AbortError' ? 'Server terlalu lama merespons. Coba lagi sebentar.' : 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.' };
    } finally { clearTimeout(timer); }
    Perf.add({ action, total: Math.round(performance.now() - t0), server: res.ms, cached: !!res.cached, ok: !!res.success });
    handleCodes(action, res);
    return res;
  }

  function api(action, data, opts) {
    if (!READ.test(action)) {
      epoch++;
      return raw(action, data, opts).then(r => { if (r.success) invalidate(); return r; });
    }
    const k = epoch + '|' + action + '|' + JSON.stringify(data || {});
    if (inflight[k]) return inflight[k];
    const p = raw(action, data, opts);
    inflight[k] = p;
    p.finally(() => { delete inflight[k]; });
    return p;
  }

  // ---- Batcher: gabungkan panggilan baca dalam satu tik ----
  const Batcher = {
    q: null,
    add(action, data) {
      return new Promise(resolve => {
        if (!this.q) { this.q = []; setTimeout(() => this.flush(), 0); }
        this.q.push({ action, data: data || {}, resolve });
      });
    },
    async flush() {
      const q = this.q; this.q = null;
      const uniq = [], map = {};
      q.forEach(it => {
        const k = it.action + '|' + JSON.stringify(it.data);
        if (!map[k]) { map[k] = { action: it.action, data: it.data, res: [] }; uniq.push(map[k]); }
        map[k].res.push(it.resolve);
      });
      if (uniq.length === 1) { const r = await api(uniq[0].action, uniq[0].data); uniq[0].res.forEach(f => f(r)); return; }
      for (let i = 0; i < uniq.length; i += 10) {
        const chunk = uniq.slice(i, i + 10);
        const r = await api('batch', { calls: chunk.map(c => ({ action: c.action, data: c.data })) });
        chunk.forEach((c, j) => {
          const rr = r.success && r.data && r.data.results ? r.data.results[j] : r;
          if (rr) handleCodes(c.action, rr);
          c.res.forEach(f => f(rr || { success: false, message: 'Gagal memuat.' }));
        });
      }
    }
  };
  function apiQ(action, data) { return READ.test(action) ? Batcher.add(action, data) : api(action, data); }

  // ---- SWR ----
  function key(action, data) { return 'oc_c_' + action + '|' + JSON.stringify(data || {}); }
  /**
   * load(action, data, { maxAge, onData(data, meta), onError(res), fresh })
   * onData dipanggil maks. 2× (cache lalu server, hanya bila berubah).
   */
  async function load(action, data, opts) {
    opts = opts || {};
    const k = key(action, data), canStore = !NO_STORE.test(action);
    const hit = canStore && !opts.fresh ? Store.get(k) : null;
    if (hit && opts.onData) opts.onData(hit.d, { cached: true, age: Date.now() - hit.t });
    if (hit && Date.now() - hit.t < (opts.maxAge || 20000)) return { success: true, data: hit.d, fromCache: true };
    const payload = opts.fresh ? Object.assign({}, data || {}, { _fresh: true }) : (data || {});
    const res = await apiQ(action, payload);
    if (res.success) {
      if (canStore) Store.set(k, { t: Date.now(), d: res.data });
      if (opts.onData && (!hit || JSON.stringify(hit.d) !== JSON.stringify(res.data))) opts.onData(res.data, { cached: false });
    } else if (opts.onError) opts.onError(res);
    return res;
  }
  function invalidate() { Store.clear('oc_c_'); }

  // ---- Warmup server (no-cors, maks 1×/4 menit per lingkup) ----
  function warm(scope) {
    if (!configured()) return;
    const k = 'oc_w_' + scope, last = Number(Store.get(k) || 0);
    if (Date.now() - last < 240000) return;
    Store.set(k, Date.now());
    try { fetch(URL_ + (URL_.indexOf('?') > -1 ? '&' : '?') + 'w=' + scope, { mode: 'no-cors' }).catch(() => { }); } catch (e) { }
  }

  window.API = {
    api, apiQ, load, invalidate, warm, configured, newIdem, Token, Store, Perf,
    set onAuthFail(fn) { onAuthFail = fn; }, set onMustChange(fn) { onMustChange = fn; },
    get url() { return URL_; }
  };
})();
