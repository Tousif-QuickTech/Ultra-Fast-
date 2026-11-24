/* Phase 12 & Requirement 6:
   - Complete History / Audit Trail
   - Activity ID, User/Role, Module, Action, Record Type, Record ID
   - Before/After values, reasons, and counter-entry audit links
   - Multi-criteria filters: User, Module, Action Type, Date Range, Record ID / Reference
   - UTF-8 BOM CSV Export with Export Action Logging
*/
(()=>{
const U=window.UI,{opts,sum,$,ACT,IN}=U,P=window.PAGES,F=()=>U.F();

const G = {
  u: 'all',
  m: 'all',
  t: 'all',
  range: 'all',
  q: ''
};

const CL = {
  auth: 'info',
  save: 'paid',
  delete: 'due',
  export: 'partial',
  edit: 'warn',
  reverse: 'due',
  adjust: 'partial'
};

const who = x => {
  const f = F();
  const u = x.uid && typeof AUTH !== 'undefined' && AUTH.data && AUTH.data.users && AUTH.data.users.find(y => y.id === x.uid);
  return u ? (u.n[f.S.lang] || u.n.bn) : x.u;
};

const mod = x => {
  const t = F().t;
  if (x.m === 'login') return t('lt_auth');
  return t('nav_' + x.m) || x.m;
};

function matchLogDate(item) {
  if (G.range === 'all') return true;
  const ts = item.ts;
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yestStart = todayStart - 86400000;
  const weekStart = todayStart - 7 * 86400000;
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  if (G.range === 'today') return ts >= todayStart;
  if (G.range === 'yesterday') return ts >= yestStart && ts < todayStart;
  if (G.range === 'last7d') return ts >= weekStart;
  if (G.range === 'this_month') return ts >= monthStart;
  return true;
}

const rows = () => {
  const q = G.q.toLowerCase().trim();
  return LOG.items.filter(x => {
    if (G.u !== 'all' && who(x) !== G.u) return false;
    if (G.m !== 'all' && x.m !== G.m) return false;
    if (G.t !== 'all' && x.t !== G.t) return false;
    if (!matchLogDate(x)) return false;
    if (q) {
      const matchTxt = `${x.id || ''} ${x.msg || ''} ${who(x)} ${mod(x)} ${x.recordType || ''} ${x.recordId || ''} ${x.reason || ''}`.toLowerCase();
      if (!matchTxt.includes(q)) return false;
    }
    return true;
  });
};

function table() {
  const f = F(), { t, S } = f, loc = S.lang === 'bn' ? 'bn-BD' : 'en-IN';
  const r = rows().slice(0, 200);

  return `
    <div class="tw">
      <table class="tbl mb-0" id="log-tbl">
        <thead>
          <tr>
            <th>${t('record_id')}</th>
            <th>${t('log_time')}</th>
            <th>${t('log_user')}</th>
            <th>${t('log_mod')}</th>
            <th>${t('log_type')}</th>
            <th>${t('record_type')} / ID</th>
            <th>${t('log_desc')}</th>
            <th class="r">${t('actions')}</th>
          </tr>
        </thead>
        <tbody>
          ${r.length ? r.map((x, idx) => `
            <tr>
              <td><code>${x.id || ('ACT-' + (x.seq || idx))}</code></td>
              <td class="text-nowrap small text-secondary">
                ${new Date(x.ts).toLocaleString(loc, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </td>
              <td>
                <b>${who(x)}</b>
                <br><small class="text-secondary">${f.RN(x.r)}</small>
              </td>
              <td>${mod(x)}</td>
              <td>${U.bd(CL[x.t] || 'info', 'lt_' + x.t)}</td>
              <td>
                ${x.recordType ? `<span class="badge bg-secondary-subtle text-secondary border">${x.recordType}</span>` : '—'}
                ${x.recordId ? `<br><code>${x.recordId}</code>` : ''}
              </td>
              <td>
                ${x.msg}
                ${x.reason ? `<br><small class="text-danger"><b>${t('rev_reason')}:</b> ${x.reason}</small>` : ''}
              </td>
              <td class="r text-nowrap">
                <button class="btn btn-sm btn-outline-secondary py-0 px-2" data-act="logdetail" data-id="${x.id || idx}">
                  <i class="bi bi-eye"></i>
                </button>
              </td>
            </tr>`).join('') : `<tr><td colspan="8" class="text-center text-secondary py-4">${t('empty')}</td></tr>`}
        </tbody>
      </table>
    </div>`;
}

function logs() {
  const f = F(), { t, panel } = f;
  if (!f.can('logs')) {
    $('#view').innerHTML = `<div class="lock"><i class="bi bi-lock"></i>${t('no_access')}</div>`;
    return;
  }

  const all = LOG.items;
  const today = all.filter(x => Date.now() - x.ts < 864e5);
  const users = [...new Set(all.map(who))];
  const mods = [...new Set(all.map(x => x.m))];
  const types = [...new Set(all.map(x => x.t))];
  const s = (l, v) => `<div><span>${t(l)}</span><b>${v}</b></div>`;

  $('#view').innerHTML = `
    <div class="enter">
      <div class="page-h">
        <div>
          <h2>${t('nav_logs')}</h2>
          <p>${t('audit_sub')}</p>
        </div>
        <button class="btn btn-sm btn-outline-primary" data-act="logx">
          <i class="bi bi-download me-1"></i>${t('export')}
        </button>
      </div>
      ${panel('', `
        <div class="strip mb-3">
          ${s('log_events', f.n(today.length))}
          ${s('log_users', f.n(new Set(today.map(who)).size))}
          ${s('lt_save', f.n(today.filter(x => x.t === 'save').length))}
          ${s('lt_delete', f.n(today.filter(x => x.t === 'delete' || x.t === 'reverse').length))}
        </div>
        <div class="card mb-3 border shadow-sm">
          <div class="card-body p-3">
            <div class="row g-2 align-items-center">
              <div class="col-md-2 col-sm-6">
                <label class="form-label small fw-semibold text-secondary mb-1">${t('audit_filter_user')}</label>
                <select class="form-select form-select-sm" data-in="lgu">
                  ${opts([['all', t('log_all')], ...users.map(u => [u, u])], G.u)}
                </select>
              </div>
              <div class="col-md-2 col-sm-6">
                <label class="form-label small fw-semibold text-secondary mb-1">${t('audit_filter_module')}</label>
                <select class="form-select form-select-sm" data-in="lgm">
                  ${opts([['all', t('log_all')], ...mods.map(m => [m, m === 'login' ? t('lt_auth') : t('nav_' + m)])], G.m)}
                </select>
              </div>
              <div class="col-md-2 col-sm-6">
                <label class="form-label small fw-semibold text-secondary mb-1">${t('audit_filter_action')}</label>
                <select class="form-select form-select-sm" data-in="lgt">
                  ${opts([['all', t('log_all')], ...types.map(k => [k, t('lt_' + k) || k])], G.t)}
                </select>
              </div>
              <div class="col-md-3 col-sm-6">
                <label class="form-label small fw-semibold text-secondary mb-1">${t('date')}</label>
                <select class="form-select form-select-sm" data-in="lgrange">
                  ${opts([
                    ['all', t('all')],
                    ['today', t('today')],
                    ['yesterday', t('yesterday')],
                    ['last7d', t('last7d')],
                    ['this_month', t('this_month')]
                  ], G.range)}
                </select>
              </div>
              <div class="col-md-3 col-sm-12">
                <label class="form-label small fw-semibold text-secondary mb-1">${t('search')}</label>
                <div class="input-group input-group-sm">
                  <input type="text" class="form-control" data-in="lgq" value="${G.q}" placeholder="${t('search')}..." aria-label="Search logs">
                  ${(G.u !== 'all' || G.m !== 'all' || G.t !== 'all' || G.range !== 'all' || G.q) ? `
                    <button class="btn btn-outline-secondary" data-act="lgreset" title="${t('reset_filter')}"><i class="bi bi-arrow-counterclockwise"></i></button>` : ''}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div id="lgwrap">${table()}</div>
      `)}
    </div>`;
}

P.logs = f => {
  U.boot(f);
  U.init2(f);
  U.init3(f);
  logs();
};

IN.lgu = x => { G.u = x.value; logs(); };
IN.lgm = x => { G.m = x.value; logs(); };
IN.lgt = x => { G.t = x.value; logs(); };
IN.lgrange = x => { G.range = x.value; logs(); };
IN.lgq = x => { G.q = x.value; $('#lgwrap').innerHTML = table(); };
ACT.lgreset = () => {
  G.u = 'all';
  G.m = 'all';
  G.t = 'all';
  G.range = 'all';
  G.q = '';
  logs();
};

// Audit Log Details Modal (Requirement 6: before/after values, reasons)
ACT.logdetail = x => {
  const f = F();
  const { t, S } = f;
  const id = x.dataset.id;
  const entry = LOG.items.find(item => String(item.id) === String(id) || String(item.seq) === String(id));
  if (!entry) return;

  const loc = S.lang === 'bn' ? 'bn-BD' : 'en-IN';
  const detailHtml = `
    <div class="p-3 mb-3 border rounded bg-light">
      <div class="row g-2">
        <div class="col-sm-6">
          <small class="text-secondary d-block">${t('record_id')}</small>
          <b class="fs-5 text-primary">${entry.id || 'ACT-' + (entry.seq || '')}</b>
        </div>
        <div class="col-sm-6 text-sm-end">
          <small class="text-secondary d-block">${t('log_time')}</small>
          <b>${new Date(entry.ts).toLocaleString(loc, { dateStyle: 'medium', timeStyle: 'medium' })}</b>
        </div>
      </div>
      <hr class="my-2">
      <div class="row g-2">
        <div class="col-sm-4">
          <small class="text-secondary d-block">${t('log_user')}</small>
          <b>${who(entry)}</b> (${f.RN(entry.r)})
        </div>
        <div class="col-sm-4">
          <small class="text-secondary d-block">${t('log_mod')}</small>
          <b>${mod(entry)}</b>
        </div>
        <div class="col-sm-4">
          <small class="text-secondary d-block">${t('log_type')}</small>
          <b>${U.bd(CL[entry.t] || 'info', 'lt_' + entry.t)}</b>
        </div>
      </div>
    </div>

    <div class="card mb-3 border">
      <div class="card-body p-3">
        <h6 class="fw-bold mb-1"><i class="bi bi-info-circle me-1"></i>${t('log_desc')}</h6>
        <p class="mb-2 fs-6">${entry.msg}</p>
        ${entry.recordType ? `<span class="badge bg-secondary me-2">Type: ${entry.recordType}</span>` : ''}
        ${entry.recordId ? `<code>ID: ${entry.recordId}</code>` : ''}
        ${entry.reason ? `
          <div class="alert alert-warning mt-2 mb-0 py-2">
            <b>${t('rev_reason')}:</b> ${entry.reason}
          </div>` : ''}
      </div>
    </div>

    ${entry.changes ? `
      <div class="card border">
        <div class="card-header bg-light py-2 fw-bold">
          <i class="bi bi-arrow-left-right me-1"></i>${t('changes')}
        </div>
        <div class="card-body p-3">
          <div class="row g-2">
            <div class="col-6">
              <span class="text-secondary d-block small">${t('before_val')}</span>
              <pre class="p-2 rounded bg-light border mb-0">${typeof entry.changes.before === 'object' ? JSON.stringify(entry.changes.before, null, 2) : String(entry.changes.before)}</pre>
            </div>
            <div class="col-6">
              <span class="text-secondary d-block small">${t('after_val')}</span>
              <pre class="p-2 rounded bg-light border mb-0 text-success">${typeof entry.changes.after === 'object' ? JSON.stringify(entry.changes.after, null, 2) : String(entry.changes.after)}</pre>
            </div>
          </div>
        </div>
      </div>` : ''}
  `;

  U.showDoc(`${t('audit_trail')} – ${entry.id || ''}`, detailHtml, null);
};

// Export CSV with UTF-8 BOM & Log the export action itself (Requirement 6)
ACT.logx = () => {
  const f = F();
  const r = rows().map(x => [
    x.id || ('ACT-' + (x.seq || '')),
    new Date(x.ts).toISOString(),
    who(x),
    f.RN(x.r),
    mod(x),
    f.t('lt_' + x.t) || x.t,
    x.recordType || '',
    x.recordId || '',
    x.reason || '',
    x.changes ? JSON.stringify(x.changes) : '',
    x.msg
  ]);

  const headers = ['Activity ID', 'Timestamp', 'User', 'Role', 'Module', 'Action Type', 'Record Type', 'Record ID', 'Reason', 'Changes', 'Description'];
  const b = new Blob(['\ufeff' + [headers, ...r].map(a => a.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\n')], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(b);
  a.download = 'activity-audit-trail.csv';
  a.click();

  // Log the export action itself (Requirement 6)
  LOG.add({
    uid: f.S.user?.id,
    u: f.S.user?.n?.bn,
    r: f.S.role,
    m: 'logs',
    t: 'export',
    recordType: 'audit_export',
    recordId: 'activity-audit-trail.csv',
    msg: `অডিট লগ CSV এক্সপোর্ট সম্পন্ন হয়েছে (${r.length} ইভেন্ট)`
  });

  f.toast(f.t('csv_done'), 'download');
};

})();
