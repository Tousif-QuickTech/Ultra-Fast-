/* Dedicated Modules:
   1. Customer & Supplier Due Management (One module with 2 tabs: Customer Due & Supplier Due)
      + Dedicated Customer Financial Details Page & Running Balance Statement
      + Dedicated Supplier Financial Details Page & Running Balance Statement
   2. Independent Purchase Reports Module (migrated out of General Reports)
*/
(() => {
  const U = window.UI, { modal, field, bad, opts, bd, sum, $, ACT, IN } = U, P = window.PAGES;
  let F;

  const DS = {
    tab: 'customer',      // 'customer' | 'supplier'
    q: '',
    range: 'all',         // 'all' | 'today' | 'this_month' | 'custom'
    df: '',
    dt: '',
    amtFilter: 'due',     // 'due' (default!) | 'all' | 'gt10k' | 'gt100k' | 'settled'
    sortBy: 'due_desc',   // 'due_desc' | 'due_asc' | 'date_desc' | 'name_asc'
    detailKind: null,     // null | 'customer' | 'supplier'
    detailIdx: null,
    returnTo: null,
    // Statement filter state
    stRange: 'all',
    stDf: '',
    stDt: '',
    stType: 'all',
    stQ: ''
  };

  const PR = {
    q: '',
    sup: 'all',
    status: 'all',        // 'all' | 'paid' | 'partial' | 'due'
    kind: 'all',          // 'all' | 'local' | 'import'
    dueOnly: false,
    range: 'all',
    df: '',
    dt: ''
  };

  function getF() {
    return F || (window.UI && window.UI.F && window.UI.F()) || window.FMSAPP;
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function dlCsv(filename, rows) {
    const line = r => r.map(c => `"${String(c == null ? '' : c).replace(/"/g, '""')}"`).join(',');
    const csv = '\uFEFF' + rows.map(line).join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  function rangeBounds(range, df, dt) {
    if (range === 'all') return { start: 0, end: Number.MAX_SAFE_INTEGER };
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const todayEnd = todayStart + 86400000 - 1;
    if (range === 'today') return { start: todayStart, end: todayEnd };
    if (range === 'last7d') return { start: todayStart - 7 * 86400000, end: todayEnd };
    if (range === 'this_month') return { start: new Date(now.getFullYear(), now.getMonth(), 1).getTime(), end: todayEnd };
    if (range === 'custom') {
      const s = df ? new Date(df).setHours(0, 0, 0, 0) : 0;
      const e = dt ? new Date(dt).setHours(23, 59, 59, 999) : Number.MAX_SAFE_INTEGER;
      return { start: s, end: e };
    }
    return { start: 0, end: Number.MAX_SAFE_INTEGER };
  }

  function txBadge(type, f) {
    const { t } = f;
    const map = {
      opening: ['bg-secondary-subtle text-body border', t('st_opening') || 'Opening'],
      invoice: ['bg-primary-subtle text-primary border', t('st_invoice') || 'Invoice'],
      purchase: ['bg-info-subtle text-info-emphasis border', t('st_purchase') || 'Purchase'],
      payment: ['bg-success-subtle text-success border', t('st_payment') || 'Payment'],
      sales_return: ['bg-warning-subtle text-warning-emphasis border', t('st_sales_return') || 'Sales Return'],
      purchase_return: ['bg-warning-subtle text-warning-emphasis border', t('st_purch_return') || 'Purchase Return'],
      discount: ['bg-purple-subtle text-body border', t('st_discount') || 'Discount'],
      adjustment: ['bg-secondary-subtle text-body border', t('st_adjustment') || 'Adjustment']
    };
    const m = map[type] || ['bg-secondary-subtle text-body border', type || 'Entry'];
    return `<span class="badge ${m[0]}">${m[1]}</span>`;
  }

  /* ============================================================================
     1. CUSTOMER & SUPPLIER DUE MANAGEMENT MODULE (One Module, Two Tabs)
     ============================================================================ */
  function renderDuesModule(f) {
    F = f;
    if (window.FIN) window.FIN.boot(f);
    const { t, L, D, tk, short, n, A } = f;

    if (!f.can('dues') && !f.can('customers')) {
      $('#view').innerHTML = `<div class="lock"><i class="bi bi-lock"></i>${t('no_access') || t('admin_only')}</div>`;
      return;
    }

    if (DS.detailKind === 'customer' && DS.detailIdx !== null) {
      renderCustomerDetailPage(f, DS.detailIdx);
      return;
    }
    if (DS.detailKind === 'supplier' && DS.detailIdx !== null) {
      renderSupplierDetailPage(f, DS.detailIdx);
      return;
    }

    const canSeeSupplier = A() || f.can('suppliers');
    if (DS.tab === 'supplier' && !A()) {
      // Respect Manager role rule: Supplier dues & cost pricing hidden unless Admin
      DS.tab = 'customer';
    }

    const headerTabs = `
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <div class="seg" role="tablist">
          <button type="button" class="${DS.tab === 'customer' ? 'on' : ''}" data-act="duestab" data-k="customer">
            <i class="bi bi-people me-1"></i>${t('tab_cust_due') || 'Customer Due'}
          </button>
          ${A() ? `
            <button type="button" class="${DS.tab === 'supplier' ? 'on' : ''}" data-act="duestab" data-k="supplier">
              <i class="bi bi-building me-1"></i>${t('tab_sup_due') || 'Supplier Due'}
            </button>` : ''}
        </div>
        <div class="d-flex gap-2 flex-wrap">
          <button type="button" class="btn-o btn-sm" data-act="duescsv"><i class="bi bi-file-earmark-spreadsheet me-1"></i>Excel / CSV</button>
          <button type="button" class="btn-o btn-sm" data-act="duesprint"><i class="bi bi-printer me-1"></i>${t('print')}</button>
        </div>
      </div>`;

    const body = DS.tab === 'supplier' ? renderSupplierDueTab(f) : renderCustomerDueTab(f);

    $('#view').innerHTML = `
      <div class="enter">
        <div class="page-h flex-column flex-sm-row gap-2 align-items-start align-items-sm-center justify-content-between">
          <div>
            <h2><i class="bi bi-wallet2 me-2"></i>${t('nav_dues') || 'Customer & Supplier Due Management'}</h2>
            <p class="mb-0">${t('dues_sub') || 'Centralized receivables, payables, and chronological financial statements'}</p>
          </div>
          <div class="d-flex gap-2 flex-wrap">
            ${DS.tab === 'customer' ? `<button class="btn-a btn-sm" data-act="inew"><i class="bi bi-plus-lg me-1"></i>${t('new_invoice')}</button>` : ''}
          </div>
        </div>
        ${headerTabs}
        ${body}
      </div>`;
  }

  function renderCustomerDueTab(f) {
    const { t, L, D, tk, short, n, panel } = f;
    const { start, end } = rangeBounds(DS.range, DS.df, DS.dt);
    const hasDateFilter = DS.range !== 'all';

    const rows = (D.customers || []).map((c, idx) => {
      const ledger = window.FIN ? window.FIN.getCustomerTransactions(idx, f) : { entries: [], lastTxDate: '—', lastTxTs: 0, lastPayDate: '—', totals: { sales: 0, payments: 0, closing: c.due } };
      const periodEntries = hasDateFilter ? ledger.entries.filter(e => e.ts >= start && e.ts <= end) : ledger.entries;
      const periodSales = sum(periodEntries.filter(e => e.type === 'invoice').map(e => e.debit));
      const periodPaid = sum(periodEntries.filter(e => e.type === 'payment').map(e => e.credit));
      return {
        idx,
        c,
        code: c.code || ('CUST-' + (101 + idx)),
        name: L(c),
        phone: c.phone || '—',
        status: c.status || 'active',
        totalSales: ledger.totals.sales,
        totalPaid: ledger.totals.payments,
        periodSales,
        periodPaid,
        due: c.due || 0,
        lastTxDate: ledger.lastTxDate,
        lastTxTs: ledger.lastTxTs,
        lastPayDate: ledger.lastPayDate
      };
    });

    const totalOutstandingAll = sum(rows.map(r => r.due));
    const customersWithDue = rows.filter(r => r.due > 0).length;
    const periodReceivables = sum(rows.map(r => hasDateFilter ? Math.max(0, r.periodSales - r.periodPaid) : r.totalSales));

    let filtered = rows.filter(r => {
      if (DS.amtFilter === 'due' && !(r.due > 0)) return false;
      if (DS.amtFilter === 'gt10k' && !(r.due > 10000)) return false;
      if (DS.amtFilter === 'gt100k' && !(r.due > 100000)) return false;
      if (DS.amtFilter === 'settled' && r.due > 0) return false;
      if (hasDateFilter && r.lastTxTs && (r.lastTxTs < start || r.lastTxTs > end)) {
        // Include only if transactions occurred inside selected range
        return r.periodSales > 0 || r.periodPaid > 0;
      }
      if (DS.q) {
        const q = DS.q.toLowerCase().trim();
        const hay = `${r.name} ${r.c.bn || ''} ${r.c.en || ''} ${r.code} ${r.phone}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    if (DS.sortBy === 'due_desc') filtered.sort((a, b) => b.due - a.due);
    else if (DS.sortBy === 'due_asc') filtered.sort((a, b) => a.due - b.due);
    else if (DS.sortBy === 'date_desc') filtered.sort((a, b) => (b.lastTxTs || 0) - (a.lastTxTs || 0));
    else if (DS.sortBy === 'name_asc') filtered.sort((a, b) => a.name.localeCompare(b.name));

    const summaryStrip = `
      <div class="strip strip-4 mb-3">
        <div><span>${t('tot_cust_due') || 'Total Customer Due'}</span><b class="dn">${short(totalOutstandingAll)}</b></div>
        <div><span>${t('cust_with_due') || 'Customers With Due'}</span><b class="text-primary">${n(customersWithDue)} / ${n(rows.length)}</b></div>
        <div><span>${hasDateFilter ? (t('period_recv') || 'Period Net Receivables') : (t('total_sales') || 'Total Billed Sales')}</span><b>${short(periodReceivables)}</b></div>
        <div><span>${t('showing') || 'Showing Records'}</span><b>${n(filtered.length)}</b></div>
      </div>`;

    const filters = renderDueFilters(f, 'customer');

    const mobileCards = `
      <div class="d-md-none p-2">
        ${filtered.length ? filtered.map(r => `
          <div class="mob-tx-card mb-2 p-3">
            <div class="d-flex justify-content-between align-items-start gap-2 mb-2">
              <div>
                <a href="javascript:void(0)" class="fw-bold text-primary text-decoration-none fs-6" data-act="cstmtview" data-i="${r.idx}">${esc(r.name)}</a>
                <div class="small text-secondary"><span class="badge bg-secondary-subtle text-body border me-1">${r.code}</span><i class="bi bi-telephone me-1"></i>${esc(r.phone)}</div>
              </div>
              <div class="text-end">
                <b class="${r.due > 0 ? 'dn' : 'up'} fs-6">${tk(r.due)}</b>
                <div>${bd(r.status === 'active' ? 'paid' : 'due', r.status === 'active' ? 'status_active' : 'status_inactive')}</div>
              </div>
            </div>
            <div class="row g-1 text-center p-2 rounded border mb-2" style="background:var(--surface-2)">
              <div class="col-4"><small class="text-secondary d-block">${t('total_sales') || 'Sales'}</small><b>${tk(r.totalSales)}</b></div>
              <div class="col-4"><small class="text-secondary d-block">${t('paid')}</small><b class="up">${tk(r.totalPaid)}</b></div>
              <div class="col-4"><small class="text-secondary d-block">${t('last_tx') || 'Last Tx'}</small><small class="fw-semibold">${r.lastTxDate}</small></div>
            </div>
            <div class="d-flex gap-1 pt-2 border-top">
              <button class="btn btn-sm btn-outline-primary flex-fill" data-act="cstmtview" data-i="${r.idx}"><i class="bi bi-journal-text me-1"></i>${t('financial_history') || 'Ledger'}</button>
              ${r.due > 0 ? `<button class="btn btn-sm btn-success flex-fill" data-act="collect" data-i="${r.idx}"><i class="bi bi-cash-coin me-1"></i>${t('collect')}</button>` : ''}
            </div>
          </div>`).join('') : `<div class="text-center text-secondary py-4">${t('empty')}</div>`}
      </div>`;

    const desktopTable = `
      <div class="d-none d-md-block tw">
        <table class="tbl" id="dues-tbl">
          <thead>
            <tr>
              <th>${t('customer')} / ID</th>
              <th>${t('phone')}</th>
              <th class="r">${t('total_sales') || 'Total Sales'}</th>
              <th class="r">${t('total_paid') || 'Payments Received'}</th>
              <th class="r">${t('due_amt') || 'Outstanding Due'}</th>
              <th>${t('last_tx') || 'Last Tx'}</th>
              <th>${t('last_pay') || 'Last Payment'}</th>
              <th>${t('status')}</th>
              <th class="r">${t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.length ? filtered.map(r => `
              <tr>
                <td>
                  <a href="javascript:void(0)" class="fw-bold text-decoration-none text-primary" data-act="cstmtview" data-i="${r.idx}">${esc(r.name)}</a>
                  <br><small class="text-secondary"><code>${r.code}</code></small>
                </td>
                <td>${esc(r.phone)}</td>
                <td class="r">${tk(r.totalSales)}</td>
                <td class="r up">${tk(r.totalPaid)}</td>
                <td class="r fw-bold ${r.due > 0 ? 'dn' : 'up'}">${tk(r.due)}</td>
                <td><small>${r.lastTxDate}</small></td>
                <td><small>${r.lastPayDate}</small></td>
                <td>${bd(r.status === 'active' ? 'paid' : 'due', r.status === 'active' ? 'status_active' : 'status_inactive')}</td>
                <td class="r text-nowrap">
                  <button class="btn btn-sm btn-outline-primary py-1 px-2" data-act="cstmtview" data-i="${r.idx}"><i class="bi bi-journal-text me-1"></i>${t('statement') || 'Statement'}</button>
                  ${r.due > 0 ? `<button class="btn btn-sm btn-success py-1 px-2 ms-1" data-act="collect" data-i="${r.idx}"><i class="bi bi-cash-coin me-1"></i>${t('collect')}</button>` : ''}
                </td>
              </tr>`).join('') : `<tr><td colspan="9" class="text-center text-secondary py-4">${t('empty')}</td></tr>`}
          </tbody>
        </table>
      </div>`;

    return summaryStrip + filters + panel(t('tab_cust_due') || 'Customer Due', mobileCards + desktopTable, `<span class="badge bg-primary-subtle text-primary border">${n(filtered.length)} ${t('items')}</span>`);
  }

  function renderSupplierDueTab(f) {
    const { t, L, D, tk, short, n, panel } = f;
    const { start, end } = rangeBounds(DS.range, DS.df, DS.dt);
    const hasDateFilter = DS.range !== 'all';

    const rows = (D.suppliers || []).map((s, idx) => {
      const ledger = window.FIN ? window.FIN.getSupplierTransactions(idx, f) : { entries: [], lastTxDate: '—', lastTxTs: 0, lastPayDate: '—', totals: { purchases: 0, payments: 0, closing: s.payable } };
      const periodEntries = hasDateFilter ? ledger.entries.filter(e => e.ts >= start && e.ts <= end) : ledger.entries;
      const periodPurch = sum(periodEntries.filter(e => e.type === 'purchase').map(e => e.credit));
      const periodPaid = sum(periodEntries.filter(e => e.type === 'payment').map(e => e.debit));
      return {
        idx,
        s,
        code: s.code || ('SUP-' + (101 + idx)),
        name: L(s),
        phone: s.phone || '—',
        status: s.status || 'active',
        totalPurch: ledger.totals.purchases,
        totalPaid: ledger.totals.payments,
        periodPurch,
        periodPaid,
        due: s.payable || 0,
        lastTxDate: ledger.lastTxDate,
        lastTxTs: ledger.lastTxTs,
        lastPayDate: ledger.lastPayDate
      };
    });

    const totalPayableAll = sum(rows.map(r => r.due));
    const supsWithDue = rows.filter(r => r.due > 0).length;
    const periodPayable = sum(rows.map(r => hasDateFilter ? Math.max(0, r.periodPurch - r.periodPaid) : r.totalPurch));

    let filtered = rows.filter(r => {
      if (DS.amtFilter === 'due' && !(r.due > 0)) return false;
      if (DS.amtFilter === 'gt10k' && !(r.due > 10000)) return false;
      if (DS.amtFilter === 'gt100k' && !(r.due > 100000)) return false;
      if (DS.amtFilter === 'settled' && r.due > 0) return false;
      if (hasDateFilter && r.lastTxTs && (r.lastTxTs < start || r.lastTxTs > end)) {
        return r.periodPurch > 0 || r.periodPaid > 0;
      }
      if (DS.q) {
        const q = DS.q.toLowerCase().trim();
        const hay = `${r.name} ${r.s.bn || ''} ${r.s.en || ''} ${r.code} ${r.phone}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    if (DS.sortBy === 'due_desc') filtered.sort((a, b) => b.due - a.due);
    else if (DS.sortBy === 'due_asc') filtered.sort((a, b) => a.due - b.due);
    else if (DS.sortBy === 'date_desc') filtered.sort((a, b) => (b.lastTxTs || 0) - (a.lastTxTs || 0));
    else if (DS.sortBy === 'name_asc') filtered.sort((a, b) => a.name.localeCompare(b.name));

    const summaryStrip = `
      <div class="strip strip-4 mb-3">
        <div><span>${t('tot_sup_due') || 'Total Supplier Due'}</span><b class="dn">${short(totalPayableAll)}</b></div>
        <div><span>${t('sup_with_due') || 'Suppliers With Payable'}</span><b class="text-primary">${n(supsWithDue)} / ${n(rows.length)}</b></div>
        <div><span>${hasDateFilter ? (t('period_pay') || 'Period Net Payable') : (t('pu_tot_amount') || 'Total Purchases')}</span><b>${short(periodPayable)}</b></div>
        <div><span>${t('showing') || 'Showing Records'}</span><b>${n(filtered.length)}</b></div>
      </div>`;

    const filters = renderDueFilters(f, 'supplier');

    const mobileCards = `
      <div class="d-md-none p-2">
        ${filtered.length ? filtered.map(r => `
          <div class="mob-tx-card mb-2 p-3">
            <div class="d-flex justify-content-between align-items-start gap-2 mb-2">
              <div>
                <a href="javascript:void(0)" class="fw-bold text-primary text-decoration-none fs-6" data-act="sstmtview" data-i="${r.idx}">${esc(r.name)}</a>
                <div class="small text-secondary"><span class="badge bg-secondary-subtle text-body border me-1">${r.code}</span><i class="bi bi-telephone me-1"></i>${esc(r.phone)}</div>
              </div>
              <div class="text-end">
                <b class="${r.due > 0 ? 'dn' : 'up'} fs-6">${tk(r.due)}</b>
                <div>${bd(r.s.type === 'overseas' ? 'info' : 'paid', r.s.type)}</div>
              </div>
            </div>
            <div class="row g-1 text-center p-2 rounded border mb-2" style="background:var(--surface-2)">
              <div class="col-4"><small class="text-secondary d-block">${t('purchases') || 'Purchases'}</small><b>${tk(r.totalPurch)}</b></div>
              <div class="col-4"><small class="text-secondary d-block">${t('paid')}</small><b class="up">${tk(r.totalPaid)}</b></div>
              <div class="col-4"><small class="text-secondary d-block">${t('last_tx') || 'Last Tx'}</small><small class="fw-semibold">${r.lastTxDate}</small></div>
            </div>
            <div class="d-flex gap-1 pt-2 border-top">
              <button class="btn btn-sm btn-outline-primary flex-fill" data-act="sstmtview" data-i="${r.idx}"><i class="bi bi-journal-text me-1"></i>${t('financial_history') || 'Ledger'}</button>
              ${r.due > 0 ? `<button class="btn btn-sm btn-primary flex-fill" data-act="spay" data-i="${r.idx}"><i class="bi bi-wallet2 me-1"></i>${t('pay')}</button>` : ''}
            </div>
          </div>`).join('') : `<div class="text-center text-secondary py-4">${t('empty')}</div>`}
      </div>`;

    const desktopTable = `
      <div class="d-none d-md-block tw">
        <table class="tbl" id="dues-tbl">
          <thead>
            <tr>
              <th>${t('supplier')} / ID</th>
              <th>${t('phone')}</th>
              <th class="r">${t('pu_tot_amount') || 'Total Purchases'}</th>
              <th class="r">${t('pu_paid_amt') || 'Payments Made'}</th>
              <th class="r">${t('payable') || 'Outstanding Payable'}</th>
              <th>${t('last_purch') || 'Last Purchase'}</th>
              <th>${t('last_pay') || 'Last Payment'}</th>
              <th>${t('status')}</th>
              <th class="r">${t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.length ? filtered.map(r => `
              <tr>
                <td>
                  <a href="javascript:void(0)" class="fw-bold text-decoration-none text-primary" data-act="sstmtview" data-i="${r.idx}">${esc(r.name)}</a>
                  <br><small class="text-secondary"><code>${r.code}</code> · ${t(r.s.type)}</small>
                </td>
                <td>${esc(r.phone)}</td>
                <td class="r">${tk(r.totalPurch)}</td>
                <td class="r up">${tk(r.totalPaid)}</td>
                <td class="r fw-bold ${r.due > 0 ? 'dn' : 'up'}">${tk(r.due)}</td>
                <td><small>${r.lastTxDate}</small></td>
                <td><small>${r.lastPayDate}</small></td>
                <td>${bd(r.status === 'active' ? 'paid' : 'due', r.status === 'active' ? 'status_active' : 'status_inactive')}</td>
                <td class="r text-nowrap">
                  <button class="btn btn-sm btn-outline-primary py-1 px-2" data-act="sstmtview" data-i="${r.idx}"><i class="bi bi-journal-text me-1"></i>${t('statement') || 'Statement'}</button>
                  ${r.due > 0 ? `<button class="btn btn-sm btn-primary py-1 px-2 ms-1" data-act="spay" data-i="${r.idx}"><i class="bi bi-wallet2 me-1"></i>${t('pay')}</button>` : ''}
                </td>
              </tr>`).join('') : `<tr><td colspan="9" class="text-center text-secondary py-4">${t('empty')}</td></tr>`}
          </tbody>
        </table>
      </div>`;

    return summaryStrip + filters + panel(t('tab_sup_due') || 'Supplier Due', mobileCards + desktopTable, `<span class="badge bg-primary-subtle text-primary border">${n(filtered.length)} ${t('items')}</span>`);
  }

  function renderDueFilters(f, kind) {
    const { t } = f;
    const isAllShown = DS.amtFilter === 'all';
    return `
      <div class="card mb-3 border shadow-sm" style="background:var(--surface)">
        <div class="card-body p-3">
          <div class="row g-2 align-items-end">
            <div class="col-md-3 col-sm-6">
              <label class="form-label small fw-semibold text-secondary mb-1">${t('search')}</label>
              <div class="input-group input-group-sm">
                <span class="input-group-text"><i class="bi bi-search"></i></span>
                <input type="text" class="form-control" data-in="duesq" value="${esc(DS.q)}" placeholder="${kind === 'customer' ? (t('search_cust_due') || 'Name, ID, Phone...') : (t('search_sup_due') || 'Supplier, ID, Phone...')}">
              </div>
            </div>
            <div class="col-md-2 col-sm-6">
              <label class="form-label small fw-semibold text-secondary mb-1">${t('balance_filter') || 'Outstanding Filter'}</label>
              <select class="form-select form-select-sm" data-in="duesamt">
                ${opts([
                  ['due', t('only_due') || 'Due > ৳0 (Default)'],
                  ['all', t('view_all') || 'View All'],
                  ['gt10k', '> ৳10,000'],
                  ['gt100k', '> ৳1,00,000'],
                  ['settled', t('settled_zero') || 'Settled (৳0)']
                ], DS.amtFilter)}
              </select>
            </div>
            <div class="col-md-2 col-sm-6">
              <label class="form-label small fw-semibold text-secondary mb-1">${t('date')}</label>
              <select class="form-select form-select-sm" data-in="duesrange">
                ${opts([
                  ['all', t('all')],
                  ['today', t('today')],
                  ['last7d', t('last7d')],
                  ['this_month', t('this_month')],
                  ['custom', t('custom_range')]
                ], DS.range)}
              </select>
            </div>
            <div class="col-md-2 col-sm-6">
              <label class="form-label small fw-semibold text-secondary mb-1">${t('sort_by') || 'Sort By'}</label>
              <select class="form-select form-select-sm" data-in="duessort">
                ${opts([
                  ['due_desc', t('sort_due_desc') || 'Highest Due First'],
                  ['due_asc', t('sort_due_asc') || 'Lowest Due First'],
                  ['date_desc', t('sort_date_desc') || 'Recent Transaction'],
                  ['name_asc', t('sort_name_asc') || 'Name (A–Z)']
                ], DS.sortBy)}
              </select>
            </div>
            <div class="col-md-3 col-sm-12 d-flex gap-2">
              <button type="button" class="btn btn-sm ${isAllShown ? 'btn-primary' : 'btn-outline-primary'} flex-fill" data-act="duestoggleall">
                <i class="bi bi-people me-1"></i>${isAllShown ? (t('only_due') || 'Due Only') : (kind === 'customer' ? (t('view_all_cust') || 'View All Customers') : (t('view_all_sup') || 'View All Suppliers'))}
              </button>
              ${(DS.q || DS.range !== 'all' || DS.amtFilter !== 'due') ? `<button type="button" class="btn btn-sm btn-outline-secondary" data-act="duesreset" title="${t('reset_filter')}"><i class="bi bi-arrow-counterclockwise"></i></button>` : ''}
            </div>
            ${DS.range === 'custom' ? `
              <div class="col-12 pt-2 border-top d-flex flex-wrap align-items-center gap-2">
                <span class="small fw-semibold text-secondary">${t('custom_range')}:</span>
                <input type="date" class="form-control form-control-sm w-auto" data-in="duesdf" value="${DS.df}">
                <span>—</span>
                <input type="date" class="form-control form-control-sm w-auto" data-in="duesdt" value="${DS.dt}">
              </div>` : ''}
          </div>
        </div>
      </div>`;
  }

  /* ============================================================================
     2. CUSTOMER FINANCIAL DETAILS & STATEMENT PAGE
     ============================================================================ */
  function filterStatementEntries(entries) {
    const { start, end } = rangeBounds(DS.stRange, DS.stDf, DS.stDt);
    const q = (DS.stQ || '').toLowerCase().trim();
    return entries.filter(e => {
      if (DS.stRange !== 'all' && e.type !== 'opening' && (e.ts < start || e.ts > end)) return false;
      if (DS.stType !== 'all' && e.type !== DS.stType) return false;
      if (q) {
        const hay = `${e.id || ''} ${e.ref || ''} ${e.relatedRef || ''} ${e.desc || ''} ${e.notes || ''} ${e.typeLabel || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }

  function renderStmtMobileCards(f, rows, totals, closingVal, kind) {
    const { t, tk, n } = f;
    const isCust = kind === 'customer';
    return `
      <div class="d-md-none p-2">
        ${rows.length ? rows.map(e => {
          const refHtml = e.invIdx !== undefined
            ? `<a href="javascript:void(0)" class="fw-bold text-primary text-decoration-none" data-act="idetail" data-i="${e.invIdx}"><code>${esc(e.ref)}</code></a>`
            : e.purchRef
            ? `<a href="javascript:void(0)" class="fw-bold text-primary text-decoration-none" data-act="openpu" data-ref="${esc(e.purchRef)}"><code>${esc(e.ref)}</code></a>`
            : `<code>${esc(e.ref)}</code>`;
          return `
            <div class="mob-tx-card mb-2 p-3">
              <div class="d-flex justify-content-between align-items-start gap-2 mb-1">
                <div>${txBadge(e.type, f)} <small class="text-secondary ms-1">${e.dateStr}</small></div>
                <b class="${e.balance > 0 ? 'dn' : 'up'}">${tk(e.balance)}</b>
              </div>
              <div class="fw-semibold small mb-1">${refHtml} · ${esc(e.desc)}</div>
              ${e.notes ? `<div class="small text-secondary mb-2">${esc(e.notes)}</div>` : ''}
              <div class="d-flex justify-content-between pt-2 border-top small">
                <span>${t('debit')}: <b class="${e.debit > 0 ? (isCust ? 'dn' : 'up') : ''}">${e.debit > 0 ? tk(e.debit) : '—'}</b></span>
                <span>${t('credit')}: <b class="${e.credit > 0 ? (isCust ? 'up' : 'dn') : ''}">${e.credit > 0 ? tk(e.credit) : '—'}</b></span>
              </div>
            </div>`;
        }).join('') : `<div class="text-center text-secondary py-3">${t('empty')}</div>`}
        <div class="p-3 rounded border fw-bold d-flex justify-content-between align-items-center" style="background:var(--surface-2)">
          <span>${t('closing_bal') || 'Closing'} (${n(rows.length)})</span>
          <span class="${closingVal > 0 ? 'dn' : 'up'} fs-6">${tk(closingVal)}</span>
        </div>
      </div>`;
  }

  function renderCustomerDetailPage(f, idx) {
    const { t, L, D, tk, n, panel } = f;
    const ledger = window.FIN.getCustomerTransactions(idx, f);
    const c = ledger.customer;
    if (!c) { DS.detailKind = null; renderDuesModule(f); return; }

    const invRows = (D.invoices || []).map((v, invIdx) => ({ v, invIdx })).filter(x => x.v[1] === idx);
    const payEntries = ledger.entries.filter(e => e.type === 'payment');
    const otherEntries = ledger.entries.filter(e => ['opening', 'sales_return', 'adjustment', 'discount'].includes(e.type));
    const filteredStmt = filterStatementEntries(ledger.entries);

    const stmtFilters = `
      <div class="row g-2 align-items-end mb-3">
        <div class="col-md-3 col-sm-6">
          <label class="form-label small text-secondary mb-1">${t('search')}</label>
          <input type="text" class="form-control form-control-sm" data-in="stq" value="${esc(DS.stQ)}" placeholder="Ref, Invoice, Notes...">
        </div>
        <div class="col-md-3 col-sm-6">
          <label class="form-label small text-secondary mb-1">${t('type')}</label>
          <select class="form-select form-select-sm" data-in="sttype">
            ${opts([
              ['all', t('all')],
              ['invoice', t('st_invoice') || 'Invoices'],
              ['payment', t('st_payment') || 'Payments'],
              ['sales_return', t('st_sales_return') || 'Sales Returns'],
              ['discount', t('st_discount') || 'Discounts'],
              ['adjustment', t('st_adjustment') || 'Adjustments'],
              ['opening', t('st_opening') || 'Opening Balance']
            ], DS.stType)}
          </select>
        </div>
        <div class="col-md-3 col-sm-6">
          <label class="form-label small text-secondary mb-1">${t('date')}</label>
          <select class="form-select form-select-sm" data-in="strange">
            ${opts([['all', t('all')], ['today', t('today')], ['last7d', t('last7d')], ['this_month', t('this_month')], ['custom', t('custom_range')]], DS.stRange)}
          </select>
        </div>
        <div class="col-md-3 col-sm-6 d-flex gap-1 flex-wrap">
          <button class="btn btn-sm btn-outline-secondary flex-fill" data-act="stmtprint"><i class="bi bi-printer me-1"></i>${t('print')}</button>
          <button class="btn btn-sm btn-outline-danger flex-fill" data-act="stmtpdf"><i class="bi bi-file-earmark-pdf me-1"></i>PDF</button>
          <button class="btn btn-sm btn-outline-primary flex-fill" data-act="stmtcsv"><i class="bi bi-file-earmark-excel me-1"></i>Excel</button>
        </div>
        ${DS.stRange === 'custom' ? `
          <div class="col-12 d-flex gap-2 align-items-center pt-1">
            <input type="date" class="form-control form-control-sm w-auto" data-in="stdf" value="${DS.stDf}">
            <span>—</span>
            <input type="date" class="form-control form-control-sm w-auto" data-in="stdt" value="${DS.stDt}">
          </div>` : ''}
      </div>`;

    const stmtRowsHtml = filteredStmt.length ? filteredStmt.map(e => `
      <tr>
        <td class="text-nowrap"><small>${e.dateStr}</small></td>
        <td>${txBadge(e.type, f)}</td>
        <td>
          ${e.invIdx !== undefined ? `<a href="javascript:void(0)" class="fw-bold text-primary text-decoration-none" data-act="idetail" data-i="${e.invIdx}"><code>${esc(e.ref)}</code></a>` : `<code>${esc(e.ref)}</code>`}
        </td>
        <td>
          <div class="fw-semibold">${esc(e.desc)}</div>
          ${e.notes ? `<small class="text-secondary">${esc(e.notes)}</small>` : ''}
        </td>
        <td><small>${e.method && e.method.startsWith('m_') ? t(e.method) : (e.method || '—')}</small></td>
        <td class="r ${e.debit > 0 ? 'dn fw-semibold' : ''}">${e.debit > 0 ? tk(e.debit) : '—'}</td>
        <td class="r ${e.credit > 0 ? 'up fw-semibold' : ''}">${e.credit > 0 ? tk(e.credit) : '—'}</td>
        <td class="r fw-bold ${e.balance > 0 ? 'dn' : 'up'}">${tk(e.balance)}</td>
      </tr>`).join('') : `<tr><td colspan="8" class="text-center text-secondary py-4">${t('empty')}</td></tr>`;

    $('#view').innerHTML = `
      <div class="enter" data-cdetail-idx="${idx}">
        <div class="page-h d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div class="d-flex align-items-center gap-2 flex-wrap">
            <button class="btn-o" data-act="duesback"><i class="bi bi-arrow-left me-1"></i>${t('back') || 'Back'}</button>
            <div>
              <h2 class="mb-0">${esc(L(c))}</h2>
              <p class="mb-0 text-secondary"><code>${c.code || ('CUST-' + (101 + idx))}</code> · <i class="bi bi-telephone me-1"></i>${esc(c.phone || '—')} · <i class="bi bi-geo-alt me-1"></i>${esc(c.address || '—')}</p>
            </div>
          </div>
          <div class="d-flex gap-2 flex-wrap">
            ${c.due > 0 ? `<button class="btn-a" data-act="collect" data-i="${idx}"><i class="bi bi-cash-coin me-1"></i>${t('collect')}</button>` : ''}
            <button class="btn-o" data-act="cadj" data-i="${idx}"><i class="bi bi-sliders me-1"></i>${t('add_adj_ret') || '+ Return / Adjustment'}</button>
            <button class="btn-o" data-act="cedit" data-i="${idx}"><i class="bi bi-pencil me-1"></i>${t('edit')}</button>
          </div>
        </div>

        <div class="strip strip-4 mb-3">
          <div><span>${t('cur_outstanding') || 'Outstanding Balance'}</span><b class="${c.due > 0 ? 'dn' : 'up'}">${tk(c.due)}</b></div>
          <div><span>${t('total_sales') || 'Total Sales'}</span><b class="text-primary">${tk(ledger.totals.sales)}</b></div>
          <div><span>${t('total_paid') || 'Total Payments'}</span><b class="up">${tk(ledger.totals.payments)}</b></div>
          <div><span>${t('returns_adj') || 'Returns & Adjustments'}</span><b>${tk(ledger.totals.returns + Math.abs(ledger.totals.adjustments))}</b></div>
        </div>

        ${panel(t('fin_statement_title') || 'Chronological Financial Statement (Running Balance)', `
          <div class="panel-b pb-0">${stmtFilters}</div>
          ${renderStmtMobileCards(f, filteredStmt, ledger.totals, c.due, 'customer')}
          <div class="d-none d-md-block tw">
            <table class="tbl mb-0" id="stmt-tbl">
              <thead>
                <tr>
                  <th>${t('date')}</th>
                  <th>${t('type')}</th>
                  <th>${t('ref') || 'Ref'}</th>
                  <th>${t('description')}</th>
                  <th>${t('method')}</th>
                  <th class="r">${t('debit')} (+)</th>
                  <th class="r">${t('credit')} (−)</th>
                  <th class="r">${t('running_bal') || t('balance')}</th>
                </tr>
              </thead>
              <tbody>${stmtRowsHtml}</tbody>
              <tfoot>
                <tr class="fw-bold ft">
                  <td colspan="5">${t('closing_bal') || 'Closing Balance'} (${n(filteredStmt.length)} ${t('items')})</td>
                  <td class="r">${tk(ledger.totals.debit)}</td>
                  <td class="r up">${tk(ledger.totals.credit)}</td>
                  <td class="r ${c.due > 0 ? 'dn' : 'up'}">${tk(c.due)}</td>
                </tr>
              </tfoot>
            </table>
          </div>`)}

        <div class="row g-3 mt-1">
          <div class="col-lg-6">
            ${panel(t('sales_history') || 'Sales History', `
              <div class="tw">
                <table class="tbl mb-0">
                  <thead><tr><th>${t('inv_no')}</th><th>${t('date')}</th><th class="r">${t('amount')}</th><th class="r">${t('paid')}</th><th class="r">${t('due_amt')}</th><th>${t('status')}</th></tr></thead>
                  <tbody>
                    ${invRows.length ? invRows.map(({ v, invIdx }) => `
                      <tr>
                        <td><a href="javascript:void(0)" class="fw-bold text-primary text-decoration-none" data-act="idetail" data-i="${invIdx}">${v[0]}</a></td>
                        <td><small>${v.dateStr || '—'}</small></td>
                        <td class="r">${tk(v[2])}</td>
                        <td class="r up">${tk(v[3])}</td>
                        <td class="r ${v[2]-v[3]>0?'dn fw-bold':''}">${tk(Math.max(0, v[2] - v[3]))}</td>
                        <td>${bd(v[4], 'inv_status_' + v[4])}</td>
                      </tr>`).join('') : `<tr><td colspan="6" class="text-center text-secondary py-3">${t('empty')}</td></tr>`}
                  </tbody>
                </table>
              </div>`)}
          </div>
          <div class="col-lg-6">
            ${panel(t('pay_history') || 'Payment History', `
              <div class="tw">
                <table class="tbl mb-0">
                  <thead><tr><th>${t('date')}</th><th class="r">${t('amount')}</th><th>${t('method')}</th><th>${t('ref') || 'Ref'}</th><th>${t('related_inv') || 'Invoice'}</th><th>${t('notes')}</th></tr></thead>
                  <tbody>
                    ${payEntries.length ? payEntries.map(p => `
                      <tr>
                        <td><small>${p.dateStr}</small></td>
                        <td class="r up fw-bold">${tk(p.credit)}</td>
                        <td><small>${p.method && p.method.startsWith('m_') ? t(p.method) : (p.method || '—')}</small></td>
                        <td><code>${esc(p.ref)}</code></td>
                        <td>${p.invIdx !== undefined ? `<a href="javascript:void(0)" class="text-primary text-decoration-none" data-act="idetail" data-i="${p.invIdx}">${esc(p.relatedRef || '—')}</a>` : esc(p.relatedRef || '—')}</td>
                        <td><small>${esc(p.notes || '—')}</small></td>
                      </tr>`).join('') : `<tr><td colspan="6" class="text-center text-secondary py-3">${t('empty')}</td></tr>`}
                  </tbody>
                </table>
              </div>`)}
          </div>
          <div class="col-12">
            ${panel(t('other_transactions') || 'Other Transactions (Opening, Returns, Discounts & Adjustments)', `
              <div class="tw">
                <table class="tbl mb-0">
                  <thead><tr><th>${t('date')}</th><th>${t('type')}</th><th>${t('ref') || 'Ref'}</th><th>${t('description')}</th><th class="r">${t('debit')}</th><th class="r">${t('credit')}</th></tr></thead>
                  <tbody>
                    ${otherEntries.length ? otherEntries.map(o => `
                      <tr>
                        <td><small>${o.dateStr}</small></td>
                        <td>${txBadge(o.type, f)}</td>
                        <td><code>${esc(o.ref)}</code></td>
                        <td>${esc(o.desc)}${o.notes ? ` <small class="text-secondary">(${esc(o.notes)})</small>` : ''}</td>
                        <td class="r ${o.debit>0?'dn':''}">${o.debit > 0 ? tk(o.debit) : '—'}</td>
                        <td class="r ${o.credit>0?'up':''}">${o.credit > 0 ? tk(o.credit) : '—'}</td>
                      </tr>`).join('') : `<tr><td colspan="6" class="text-center text-secondary py-3">${t('empty')}</td></tr>`}
                  </tbody>
                </table>
              </div>`, `<button class="btn-o btn-sm" data-act="cadj" data-i="${idx}"><i class="bi bi-plus-lg me-1"></i>${t('add_adj_ret') || 'Add Return / Adjustment'}</button>`)}
          </div>
        </div>
      </div>`;
  }

  /* ============================================================================
     3. SUPPLIER FINANCIAL DETAILS & STATEMENT PAGE
     ============================================================================ */
  function renderSupplierDetailPage(f, idx) {
    const { t, L, D, tk, n, panel } = f;
    const ledger = window.FIN.getSupplierTransactions(idx, f);
    const s = ledger.supplier;
    if (!s) { DS.detailKind = null; renderDuesModule(f); return; }

    const purchList = ledger.purchases || [];
    const payEntries = ledger.entries.filter(e => e.type === 'payment');
    const otherEntries = ledger.entries.filter(e => ['opening', 'purchase_return', 'adjustment', 'discount'].includes(e.type));
    const filteredStmt = filterStatementEntries(ledger.entries);

    const stmtFilters = `
      <div class="row g-2 align-items-end mb-3">
        <div class="col-md-3 col-sm-6">
          <label class="form-label small text-secondary mb-1">${t('search')}</label>
          <input type="text" class="form-control form-control-sm" data-in="stq" value="${esc(DS.stQ)}" placeholder="PO, Shipment, Ref...">
        </div>
        <div class="col-md-3 col-sm-6">
          <label class="form-label small text-secondary mb-1">${t('type')}</label>
          <select class="form-select form-select-sm" data-in="sttype">
            ${opts([
              ['all', t('all')],
              ['purchase', t('st_purchase') || 'Purchases'],
              ['payment', t('st_payment') || 'Payments'],
              ['purchase_return', t('st_purch_return') || 'Purchase Returns'],
              ['discount', t('st_discount') || 'Discounts'],
              ['adjustment', t('st_adjustment') || 'Adjustments'],
              ['opening', t('st_opening') || 'Opening Balance']
            ], DS.stType)}
          </select>
        </div>
        <div class="col-md-3 col-sm-6">
          <label class="form-label small text-secondary mb-1">${t('date')}</label>
          <select class="form-select form-select-sm" data-in="strange">
            ${opts([['all', t('all')], ['today', t('today')], ['last7d', t('last7d')], ['this_month', t('this_month')], ['custom', t('custom_range')]], DS.stRange)}
          </select>
        </div>
        <div class="col-md-3 col-sm-6 d-flex gap-1 flex-wrap">
          <button class="btn btn-sm btn-outline-secondary flex-fill" data-act="stmtprint"><i class="bi bi-printer me-1"></i>${t('print')}</button>
          <button class="btn btn-sm btn-outline-danger flex-fill" data-act="stmtpdf"><i class="bi bi-file-earmark-pdf me-1"></i>PDF</button>
          <button class="btn btn-sm btn-outline-primary flex-fill" data-act="stmtcsv"><i class="bi bi-file-earmark-excel me-1"></i>Excel</button>
        </div>
        ${DS.stRange === 'custom' ? `
          <div class="col-12 d-flex gap-2 align-items-center pt-1">
            <input type="date" class="form-control form-control-sm w-auto" data-in="stdf" value="${DS.stDf}">
            <span>—</span>
            <input type="date" class="form-control form-control-sm w-auto" data-in="stdt" value="${DS.stDt}">
          </div>` : ''}
      </div>`;

    const stmtRowsHtml = filteredStmt.length ? filteredStmt.map(e => `
      <tr>
        <td class="text-nowrap"><small>${e.dateStr}</small></td>
        <td>${txBadge(e.type, f)}</td>
        <td>
          ${e.purchRef ? `<a href="javascript:void(0)" class="fw-bold text-primary text-decoration-none" data-act="openpu" data-ref="${esc(e.purchRef)}"><code>${esc(e.ref)}</code></a>` : `<code>${esc(e.ref)}</code>`}
        </td>
        <td>
          <div class="fw-semibold">${esc(e.desc)}</div>
          ${e.notes ? `<small class="text-secondary">${esc(e.notes)}</small>` : ''}
        </td>
        <td><small>${e.method && e.method.startsWith('m_') ? t(e.method) : (e.method || '—')}</small></td>
        <td class="r ${e.debit > 0 ? 'up fw-semibold' : ''}">${e.debit > 0 ? tk(e.debit) : '—'}</td>
        <td class="r ${e.credit > 0 ? 'dn fw-semibold' : ''}">${e.credit > 0 ? tk(e.credit) : '—'}</td>
        <td class="r fw-bold ${e.balance > 0 ? 'dn' : 'up'}">${tk(e.balance)}</td>
      </tr>`).join('') : `<tr><td colspan="8" class="text-center text-secondary py-4">${t('empty')}</td></tr>`;

    $('#view').innerHTML = `
      <div class="enter" data-sdetail-idx="${idx}">
        <div class="page-h d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div class="d-flex align-items-center gap-2 flex-wrap">
            <button class="btn-o" data-act="duesback"><i class="bi bi-arrow-left me-1"></i>${t('back') || 'Back'}</button>
            <div>
              <h2 class="mb-0">${esc(L(s))}</h2>
              <p class="mb-0 text-secondary"><code>${s.code || ('SUP-' + (101 + idx))}</code> · <i class="bi bi-telephone me-1"></i>${esc(s.phone || '—')} · <i class="bi bi-geo-alt me-1"></i>${esc(s.address || '—')}</p>
            </div>
          </div>
          <div class="d-flex gap-2 flex-wrap">
            ${s.payable > 0 ? `<button class="btn-a" data-act="spaydue" data-i="${idx}"><i class="bi bi-wallet2 me-1"></i>${t('pay')}</button>` : ''}
            <button class="btn-o" data-act="sadj" data-i="${idx}"><i class="bi bi-sliders me-1"></i>${t('add_adj_ret') || '+ Return / Adjustment'}</button>
            <button class="btn-o" data-act="sedit" data-i="${idx}"><i class="bi bi-pencil me-1"></i>${t('edit')}</button>
          </div>
        </div>

        <div class="strip strip-4 mb-3">
          <div><span>${t('cur_payable') || 'Outstanding Payable'}</span><b class="${s.payable > 0 ? 'dn' : 'up'}">${tk(s.payable)}</b></div>
          <div><span>${t('pu_tot_amount') || 'Total Purchases'}</span><b class="text-primary">${tk(ledger.totals.purchases)}</b></div>
          <div><span>${t('pu_paid_amt') || 'Total Payments'}</span><b class="up">${tk(ledger.totals.payments)}</b></div>
          <div><span>${t('returns_adj') || 'Returns & Adjustments'}</span><b>${tk(ledger.totals.returns + Math.abs(ledger.totals.adjustments))}</b></div>
        </div>

        ${panel(t('fin_statement_title') || 'Chronological Financial Statement (Running Balance)', `
          <div class="panel-b pb-0">${stmtFilters}</div>
          ${renderStmtMobileCards(f, filteredStmt, ledger.totals, s.payable, 'supplier')}
          <div class="d-none d-md-block tw">
            <table class="tbl mb-0" id="stmt-tbl">
              <thead>
                <tr>
                  <th>${t('date')}</th>
                  <th>${t('type')}</th>
                  <th>${t('ref') || 'Ref'}</th>
                  <th>${t('description')}</th>
                  <th>${t('method')}</th>
                  <th class="r">${t('debit')} (−)</th>
                  <th class="r">${t('credit')} (+)</th>
                  <th class="r">${t('running_bal') || t('balance')}</th>
                </tr>
              </thead>
              <tbody>${stmtRowsHtml}</tbody>
              <tfoot>
                <tr class="fw-bold ft">
                  <td colspan="5">${t('closing_bal') || 'Closing Payable'} (${n(filteredStmt.length)} ${t('items')})</td>
                  <td class="r up">${tk(ledger.totals.debit)}</td>
                  <td class="r dn">${tk(ledger.totals.credit)}</td>
                  <td class="r ${s.payable > 0 ? 'dn' : 'up'}">${tk(s.payable)}</td>
                </tr>
              </tfoot>
            </table>
          </div>`)}

        <div class="row g-3 mt-1">
          <div class="col-lg-6">
            ${panel(t('purch_history') || 'Purchase History', `
              <div class="tw">
                <table class="tbl mb-0">
                  <thead><tr><th>${t('ref') || 'Ref'}</th><th>${t('date')}</th><th class="r">${t('amount')}</th><th class="r">${t('paid')}</th><th class="r">${t('due')}</th><th>${t('status')}</th></tr></thead>
                  <tbody>
                    ${purchList.length ? purchList.map(p => `
                      <tr>
                        <td><a href="javascript:void(0)" class="fw-bold text-primary text-decoration-none" data-act="openpu" data-uid="${esc(p.uid)}">${esc(p.ref)}</a></td>
                        <td><small>${p.dateStr}</small></td>
                        <td class="r">${tk(p.total)}</td>
                        <td class="r up">${tk(p.paid)}</td>
                        <td class="r ${p.due>0?'dn fw-bold':''}">${tk(p.due)}</td>
                        <td>${bd(p.payStatus, 'inv_status_' + p.payStatus)}</td>
                      </tr>`).join('') : `<tr><td colspan="6" class="text-center text-secondary py-3">${t('empty')}</td></tr>`}
                  </tbody>
                </table>
              </div>`)}
          </div>
          <div class="col-lg-6">
            ${panel(t('sup_pay_history') || 'Supplier Payment History', `
              <div class="tw">
                <table class="tbl mb-0">
                  <thead><tr><th>${t('date')}</th><th class="r">${t('amount')}</th><th>${t('method')}</th><th>${t('ref') || 'Ref'}</th><th>${t('related_purch') || 'Purchase'}</th><th>${t('notes')}</th></tr></thead>
                  <tbody>
                    ${payEntries.length ? payEntries.map(p => `
                      <tr>
                        <td><small>${p.dateStr}</small></td>
                        <td class="r up fw-bold">${tk(p.debit)}</td>
                        <td><small>${p.method && p.method.startsWith('m_') ? t(p.method) : (p.method || '—')}</small></td>
                        <td><code>${esc(p.ref)}</code></td>
                        <td>${p.purchRef ? `<a href="javascript:void(0)" class="text-primary text-decoration-none" data-act="openpu" data-ref="${esc(p.purchRef)}">${esc(p.purchRef)}</a>` : '—'}</td>
                        <td><small>${esc(p.notes || '—')}</small></td>
                      </tr>`).join('') : `<tr><td colspan="6" class="text-center text-secondary py-3">${t('empty')}</td></tr>`}
                  </tbody>
                </table>
              </div>`)}
          </div>
          <div class="col-12">
            ${panel(t('other_transactions') || 'Other Transactions (Opening, Returns, Discounts & Adjustments)', `
              <div class="tw">
                <table class="tbl mb-0">
                  <thead><tr><th>${t('date')}</th><th>${t('type')}</th><th>${t('ref') || 'Ref'}</th><th>${t('description')}</th><th class="r">${t('debit')} (−)</th><th class="r">${t('credit')} (+)</th></tr></thead>
                  <tbody>
                    ${otherEntries.length ? otherEntries.map(o => `
                      <tr>
                        <td><small>${o.dateStr}</small></td>
                        <td>${txBadge(o.type, f)}</td>
                        <td><code>${esc(o.ref)}</code></td>
                        <td>${esc(o.desc)}${o.notes ? ` <small class="text-secondary">(${esc(o.notes)})</small>` : ''}</td>
                        <td class="r ${o.debit>0?'up':''}">${o.debit > 0 ? tk(o.debit) : '—'}</td>
                        <td class="r ${o.credit>0?'dn':''}">${o.credit > 0 ? tk(o.credit) : '—'}</td>
                      </tr>`).join('') : `<tr><td colspan="6" class="text-center text-secondary py-3">${t('empty')}</td></tr>`}
                  </tbody>
                </table>
              </div>`, `<button class="btn-o btn-sm" data-act="sadj" data-i="${idx}"><i class="bi bi-plus-lg me-1"></i>${t('add_adj_ret') || 'Add Return / Adjustment'}</button>`)}
          </div>
        </div>
      </div>`;
  }

  function statementPrintableHtml(f) {
    const isCust = DS.detailKind === 'customer';
    const ledger = isCust ? window.FIN.getCustomerTransactions(DS.detailIdx, f) : window.FIN.getSupplierTransactions(DS.detailIdx, f);
    const party = isCust ? ledger.customer : ledger.supplier;
    const rows = filterStatementEntries(ledger.entries);
    const { L, tk, t } = f;
    const co = (U.ST && U.ST.co) || window.BRAND || {};
    return `
      <div class="inv2">
        <div class="i2-head">
          <div class="i2-co"><div><b>${co.name || 'Ultra Fast'}</b><span>${co.addr || ''} · ${co.ph || ''}</span></div></div>
          <div class="i2-meta">
            <div class="i2-title">${isCust ? (t('cust_statement') || 'CUSTOMER STATEMENT') : (t('sup_statement') || 'SUPPLIER STATEMENT')}</div>
            <div><b>${esc(L(party))}</b> (${esc(party.code || '')})</div>
            <small>${esc(party.phone || '')} · ${esc(party.address || '')}</small>
          </div>
        </div>
        <table class="i2-t mt-3">
          <thead><tr><th>${t('date')}</th><th>${t('type')}</th><th>${t('ref')}</th><th>${t('description')}</th><th class="r">${t('debit')}</th><th class="r">${t('credit')}</th><th class="r">${t('balance')}</th></tr></thead>
          <tbody>
            ${rows.map(r => `<tr><td>${r.dateStr}</td><td>${esc(r.typeLabel)}</td><td>${esc(r.ref)}</td><td>${esc(r.desc)}</td><td class="r">${r.debit ? tk(r.debit) : '—'}</td><td class="r">${r.credit ? tk(r.credit) : '—'}</td><td class="r fw-bold">${tk(r.balance)}</td></tr>`).join('')}
          </tbody>
        </table>
        <div class="d-flex justify-content-end mt-3 fw-bold fs-5">${t('closing_bal') || 'Closing Balance'}: ${tk(isCust ? party.due : party.payable)}</div>
      </div>`;
  }

  /* ============================================================================
     4. DEDICATED PURCHASE REPORTS MODULE (Independent Top-Level Module)
     ============================================================================ */
  function renderPurchaseReports(f) {
    F = f;
    if (window.FIN) window.FIN.boot(f);
    const { t, L, D, tk, kg, short, n, panel, A } = f;
    if (!A() && !f.can('purchase-reports')) {
      $('#view').innerHTML = `<div class="lock"><i class="bi bi-lock"></i>${t('admin_only')}</div>`;
      return;
    }

    const all = window.FIN ? window.FIN.getAllPurchases(f) : [];
    const { start, end } = rangeBounds(PR.range, PR.df, PR.dt);

    const filtered = all.filter(p => {
      if (PR.sup !== 'all' && p.supIdx !== +PR.sup) return false;
      if (PR.status !== 'all' && p.payStatus !== PR.status) return false;
      if (PR.kind !== 'all' && p.kind !== PR.kind) return false;
      if (PR.dueOnly && !(p.due > 0)) return false;
      if (PR.range !== 'all' && (p.ts < start || p.ts > end)) return false;
      if (PR.q) {
        const sup = D.suppliers[p.supIdx];
        const prod = D.products[p.prodIdx];
        const hay = `${p.ref} ${sup ? L(sup) : ''} ${prod ? L(prod.n) : ''}`.toLowerCase();
        if (!hay.includes(PR.q.toLowerCase().trim())) return false;
      }
      return true;
    });

    const totAmt = sum(filtered.map(x => x.total));
    const totPaid = sum(filtered.map(x => x.paid));
    const totDue = sum(filtered.map(x => x.due));
    const totQty = sum(filtered.map(x => x.kg));
    const uniqSups = new Set(filtered.map(x => x.supIdx)).size;

    const overviewKpis = `
      <div class="strip mb-3" style="grid-template-columns:repeat(auto-fit,minmax(145px,1fr))">
        <div><span>${t('pu_tot_amount') || 'Total Purchase Amount'}</span><b class="text-primary">${short(totAmt)}</b></div>
        <div><span>${t('pu_paid_amt') || 'Total Paid'}</span><b class="up">${short(totPaid)}</b></div>
        <div><span>${t('pu_due_amt') || 'Total Outstanding Due'}</span><b class="${totDue > 0 ? 'dn' : 'up'}">${short(totDue)}</b></div>
        <div><span>${t('total_purchases') || 'Total Purchases'}</span><b>${n(filtered.length)}</b> <small class="text-secondary">(${kg(totQty)})</small></div>
        <div><span>${t('total_suppliers') || 'Total Suppliers'}</span><b>${n(uniqSups)}</b></div>
      </div>`;

    const supOpts = [['all', t('all')], ...(D.suppliers || []).map((s, i) => [i, L(s)])];
    const filterBar = `
      <div class="card mb-3 border shadow-sm" style="background:var(--surface)">
        <div class="card-body p-3">
          <div class="row g-2 align-items-end">
            <div class="col-md-3 col-sm-6">
              <label class="form-label small fw-semibold text-secondary mb-1">${t('search')}</label>
              <input type="text" class="form-control form-control-sm" data-in="prq" value="${esc(PR.q)}" placeholder="PO No, Shipment, Product...">
            </div>
            <div class="col-md-2 col-sm-6">
              <label class="form-label small fw-semibold text-secondary mb-1">${t('supplier')}</label>
              <select class="form-select form-select-sm" data-in="prsup">${opts(supOpts, PR.sup)}</select>
            </div>
            <div class="col-md-2 col-sm-4">
              <label class="form-label small fw-semibold text-secondary mb-1">${t('status')}</label>
              <select class="form-select form-select-sm" data-in="prstatus">
                ${opts([['all', t('all')], ['paid', t('paid')], ['partial', t('partial')], ['due', t('due')]], PR.status)}
              </select>
            </div>
            <div class="col-md-2 col-sm-4">
              <label class="form-label small fw-semibold text-secondary mb-1">${t('type')}</label>
              <select class="form-select form-select-sm" data-in="prkind">
                ${opts([['all', t('all')], ['local', t('local') || 'Local Purchase'], ['import', t('overseas') || 'Import']], PR.kind)}
              </select>
            </div>
            <div class="col-md-3 col-sm-4 d-flex gap-2 align-items-center">
              <select class="form-select form-select-sm" data-in="prrange">
                ${opts([['all', t('all')], ['today', t('today')], ['last7d', t('last7d')], ['this_month', t('this_month')], ['custom', t('custom_range')]], PR.range)}
              </select>
              <button type="button" class="btn btn-sm ${PR.dueOnly ? 'btn-danger' : 'btn-outline-secondary'} text-nowrap" data-act="prdueonly">${t('only_due') || 'Due Only'}</button>
            </div>
            ${PR.range === 'custom' ? `
              <div class="col-12 d-flex gap-2 align-items-center pt-1">
                <input type="date" class="form-control form-control-sm w-auto" data-in="prdf" value="${PR.df}">
                <span>—</span>
                <input type="date" class="form-control form-control-sm w-auto" data-in="prdt" value="${PR.dt}">
              </div>` : ''}
          </div>
        </div>
      </div>`;

    const mobileCards = `
      <div class="d-md-none p-2">
        ${filtered.length ? filtered.map(p => {
          const sup = D.suppliers[p.supIdx] || { bn: '—', en: '—' };
          const prod = D.products[p.prodIdx] || { n: { bn: '—', en: '—' } };
          return `
            <div class="mob-tx-card mb-2 p-3" data-act="prdetail" data-uid="${esc(p.uid)}" style="cursor:pointer">
              <div class="d-flex justify-content-between align-items-start mb-1">
                <div><b class="text-primary">${esc(p.ref)}</b> <small class="text-secondary">· ${p.dateStr}</small></div>
                <div>${bd(p.payStatus, 'inv_status_' + p.payStatus)}</div>
              </div>
              <div class="fw-semibold">${esc(L(sup))}</div>
              <div class="small text-secondary mb-2">${esc(L(prod.n))} · ${kg(p.kg)} @ ${tk(p.rate)}</div>
              <div class="d-flex justify-content-between p-2 rounded border text-center" style="background:var(--surface-2)">
                <div class="flex-fill"><small class="text-secondary d-block">${t('total')}</small><b>${tk(p.total)}</b></div>
                <div class="flex-fill"><small class="text-secondary d-block">${t('paid')}</small><b class="up">${tk(p.paid)}</b></div>
                <div class="flex-fill"><small class="text-secondary d-block">${t('due')}</small><b class="${p.due > 0 ? 'dn' : 'up'}">${tk(p.due)}</b></div>
              </div>
            </div>`;
        }).join('') : `<div class="text-center text-secondary py-4">${t('empty')}</div>`}
      </div>`;

    const desktopTable = `
      <div class="d-none d-md-block tw">
        <table class="tbl" id="pr-tbl">
          <thead>
            <tr>
              <th>${t('ref') || 'Reference'} / ${t('date')}</th>
              <th>${t('supplier')}</th>
              <th>${t('product')}</th>
              <th class="r">${t('qty_kg')}</th>
              <th class="r">${t('rate')}</th>
              <th class="r">${t('total')}</th>
              <th class="r">${t('paid')}</th>
              <th class="r">${t('due')}</th>
              <th>${t('status')}</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.length ? filtered.map(p => {
              const sup = D.suppliers[p.supIdx] || { bn: '—', en: '—' };
              const prod = D.products[p.prodIdx] || { n: { bn: '—', en: '—' } };
              return `
                <tr class="comp-row" data-act="prdetail" data-uid="${esc(p.uid)}">
                  <td><b class="text-primary">${esc(p.ref)}</b> ${bd(p.kind === 'import' ? 'info' : 'paid', p.kind === 'import' ? 'overseas' : 'local')}<br><small class="text-secondary">${p.dateStr}</small></td>
                  <td><b>${esc(L(sup))}</b></td>
                  <td>${esc(L(prod.n))}</td>
                  <td class="r">${kg(p.kg)}</td>
                  <td class="r">${tk(p.rate)}</td>
                  <td class="r fw-bold">${tk(p.total)}</td>
                  <td class="r up">${tk(p.paid)}</td>
                  <td class="r fw-bold ${p.due > 0 ? 'dn' : 'up'}">${tk(p.due)}</td>
                  <td>${bd(p.payStatus, 'inv_status_' + p.payStatus)}</td>
                </tr>`;
            }).join('') : `<tr><td colspan="9" class="text-center text-secondary py-4">${t('empty')}</td></tr>`}
          </tbody>
          ${filtered.length ? `
            <tfoot>
              <tr class="fw-bold ft">
                <td colspan="3">${t('tot')} (${n(filtered.length)} ${t('items')})</td>
                <td class="r">${kg(totQty)}</td>
                <td></td>
                <td class="r">${tk(totAmt)}</td>
                <td class="r up">${tk(totPaid)}</td>
                <td class="r dn">${tk(totDue)}</td>
                <td></td>
              </tr>
            </tfoot>` : ''}
        </table>
      </div>`;

    $('#view').innerHTML = `
      <div class="enter">
        <div class="page-h flex-column flex-sm-row gap-2 align-items-start align-items-sm-center justify-content-between">
          <div>
            <h2><i class="bi bi-file-earmark-spreadsheet me-2"></i>${t('nav_purchase-reports') || 'Purchase Reports'}</h2>
            <p class="mb-0">${t('pr_sub') || 'Complete analytics for local purchases & overseas imports (click any record for full details)'}</p>
          </div>
          <div class="d-flex gap-2 flex-wrap">
            <button class="btn-o btn-sm" data-act="prprint"><i class="bi bi-printer me-1"></i>${t('print')}</button>
            <button class="btn-o btn-sm" data-act="prpdf"><i class="bi bi-file-earmark-pdf me-1"></i>PDF</button>
            <button class="btn-o btn-sm" data-act="prcsv"><i class="bi bi-file-earmark-excel me-1"></i>Excel / CSV</button>
            <button class="btn-a btn-sm" data-go="purchase"><i class="bi bi-cart3 me-1"></i>${t('nav_purchase')}</button>
          </div>
        </div>
        ${overviewKpis}
        ${filterBar}
        ${panel(t('purchase_records') || 'Purchase Records', mobileCards + desktopTable, `<span class="badge bg-primary-subtle text-primary border">${n(filtered.length)} ${t('items')}</span>`)}
      </div>`;
  }

  /* ============================================================================
     5. PAGE REGISTRATIONS & INTERACTION HANDLERS
     ============================================================================ */
  P.dues = renderDuesModule;
  P['purchase-reports'] = renderPurchaseReports;

  window.UI.openCustomerStatement = (custIdx, returnTo) => {
    DS.tab = 'customer';
    DS.detailKind = 'customer';
    DS.detailIdx = +custIdx;
    DS.returnTo = returnTo || null;
    DS.stRange = 'all'; DS.stType = 'all'; DS.stQ = '';
    if (location.hash === '#/dues' && getF()) renderDuesModule(getF());
    else location.hash = '#/dues';
  };

  window.UI.openSupplierStatement = (supIdx, returnTo) => {
    DS.tab = 'supplier';
    DS.detailKind = 'supplier';
    DS.detailIdx = +supIdx;
    DS.returnTo = returnTo || null;
    DS.stRange = 'all'; DS.stType = 'all'; DS.stQ = '';
    if (location.hash === '#/dues' && getF()) renderDuesModule(getF());
    else location.hash = '#/dues';
  };

  addEventListener('hashchange', () => {
    if (!location.hash.startsWith('#/dues')) {
      DS.detailKind = null;
      DS.detailIdx = null;
      DS.returnTo = null;
    }
  });

  // Due Management Actions & Filters
  ACT.duestab = x => { DS.tab = x.dataset.k; DS.detailKind = null; renderDuesModule(getF()); };
  ACT.cstmtview = x => window.UI.openCustomerStatement(+x.dataset.i);
  ACT.sstmtview = x => window.UI.openSupplierStatement(+x.dataset.i);
  ACT.duesback = () => {
    const rt = DS.returnTo;
    DS.detailKind = null; DS.detailIdx = null; DS.returnTo = null;
    if (rt && rt !== 'dues') { location.hash = '#/' + rt; return; }
    renderDuesModule(getF());
  };
  ACT.duestoggleall = () => { DS.amtFilter = DS.amtFilter === 'all' ? 'due' : 'all'; renderDuesModule(getF()); };
  ACT.duesreset = () => { DS.q = ''; DS.range = 'all'; DS.amtFilter = 'due'; DS.df = ''; DS.dt = ''; renderDuesModule(getF()); };
  ACT.duesprint = () => window.print();
  ACT.duescsv = () => {
    const rows = [...document.querySelectorAll('#dues-tbl tr')].map(tr => [...tr.children].slice(0, -1).map(td => td.textContent.trim()));
    if (!rows.length) return;
    dlCsv(`due-summary-${DS.tab}.csv`, rows);
    getF()?.toast(getF().t('csv_done'), 'download');
  };

  IN.duesq = x => { DS.q = x.value; renderDuesModule(getF()); $('#view input[data-in="duesq"]')?.focus(); };
  IN.duesamt = x => { DS.amtFilter = x.value; renderDuesModule(getF()); };
  IN.duesrange = x => { DS.range = x.value; renderDuesModule(getF()); };
  IN.duessort = x => { DS.sortBy = x.value; renderDuesModule(getF()); };
  IN.duesdf = x => { DS.df = x.value; renderDuesModule(getF()); };
  IN.duesdt = x => { DS.dt = x.value; renderDuesModule(getF()); };

  // Statement Filters & Exports
  IN.stq = x => { DS.stQ = x.value; renderDuesModule(getF()); $('#view input[data-in="stq"]')?.focus(); };
  IN.sttype = x => { DS.stType = x.value; renderDuesModule(getF()); };
  IN.strange = x => { DS.stRange = x.value; renderDuesModule(getF()); };
  IN.stdf = x => { DS.stDf = x.value; renderDuesModule(getF()); };
  IN.stdt = x => { DS.stDt = x.value; renderDuesModule(getF()); };

  ACT.stmtprint = () => {
    const f = getF(); if (!f) return;
    if (window.UI.printDoc) window.UI.printDoc(statementPrintableHtml(f), 'Financial Statement');
    else window.print();
  };
  ACT.stmtpdf = () => {
    const f = getF(); if (!f) return;
    if (window.UI.showDoc) window.UI.showDoc(f.t('fin_statement_title') || 'Financial Statement (PDF)', statementPrintableHtml(f), statementPrintableHtml(f), false);
    else ACT.stmtprint();
  };
  ACT.stmtcsv = () => {
    const f = getF(); if (!f) return;
    const isCust = DS.detailKind === 'customer';
    const ledger = isCust ? window.FIN.getCustomerTransactions(DS.detailIdx, f) : window.FIN.getSupplierTransactions(DS.detailIdx, f);
    const rows = filterStatementEntries(ledger.entries);
    const out = [['Date', 'Type', 'Reference', 'Description', 'Method', 'Debit', 'Credit', 'Running Balance']];
    rows.forEach(r => out.push([r.dateStr, r.typeLabel, r.ref, r.desc, r.method, r.debit, r.credit, r.balance]));
    dlCsv(`${DS.detailKind}-statement-${DS.detailIdx + 1}.csv`, out);
    f.toast(f.t('csv_done'), 'download');
  };

  // Customer & Supplier Adjustments / Returns / Discounts Modals
  ACT.cadj = x => {
    const f = getF(); if (!f) return;
    const { t, L, D, toast } = f;
    const custIdx = +x.dataset.i;
    const c = D.customers[custIdx];
    if (!c) return;
    const body = `
      ${field('ca_type', t('type'), `<select id="ca_type" class="form-select">${opts([
        ['sales_return', t('st_sales_return') || 'Sales Return (−Due)'],
        ['discount', t('st_discount') || 'Account Discount (−Due)'],
        ['credit_adj', 'Credit Adjustment (−Due)'],
        ['debit_adj', 'Debit Adjustment (+Due)']
      ])}</select>`)}
      ${field('ca_amt', t('amount') + ' (৳)', '<input id="ca_amt" type="number" min="1" class="form-control">')}
      ${field('ca_ref', t('ref') || 'Reference / Invoice', '<input id="ca_ref" class="form-control" placeholder="e.g. RET-001 or INV-2026-...">')}
      ${field('ca_notes', t('notes') || 'Notes', '<input id="ca_notes" class="form-control" placeholder="Reason or notes...">')}`;
    modal((t('add_adj_ret') || 'Return / Adjustment') + ' – ' + L(c), body, () => {
      const amt = +$('#ca_amt').value;
      if (!(amt > 0)) { bad('ca_amt', t('pos_qty')); return false; }
      const ok = window.FIN.addCustomerAdjustment(f, {
        custIdx,
        type: $('#ca_type').value,
        amt,
        ref: ($('#ca_ref').value || '').trim(),
        notes: ($('#ca_notes').value || '').trim()
      });
      if (ok === false) return false;
      toast(t('saved'), 'check-circle');
      renderDuesModule(f);
    }, t('save'));
  };

  ACT.sadj = x => {
    const f = getF(); if (!f) return;
    const { t, L, D, toast } = f;
    const supIdx = +x.dataset.i;
    const s = D.suppliers[supIdx];
    if (!s) return;
    const body = `
      ${field('sa_type', t('type'), `<select id="sa_type" class="form-select">${opts([
        ['purchase_return', t('st_purch_return') || 'Purchase Return (−Payable)'],
        ['discount', t('st_discount') || 'Supplier Discount (−Payable)'],
        ['debit_adj', 'Debit Adjustment (−Payable)'],
        ['credit_adj', 'Credit Adjustment (+Payable)']
      ])}</select>`)}
      ${field('sa_amt', t('amount') + ' (৳)', '<input id="sa_amt" type="number" min="1" class="form-control">')}
      ${field('sa_ref', t('ref') || 'Reference / PO No', '<input id="sa_ref" class="form-control" placeholder="e.g. PO-2026-...">')}
      ${field('sa_notes', t('notes') || 'Notes', '<input id="sa_notes" class="form-control" placeholder="Reason or notes...">')}`;
    modal((t('add_adj_ret') || 'Return / Adjustment') + ' – ' + L(s), body, () => {
      const amt = +$('#sa_amt').value;
      if (!(amt > 0)) { bad('sa_amt', t('pos_qty')); return false; }
      const ok = window.FIN.addSupplierAdjustment(f, {
        supIdx,
        type: $('#sa_type').value,
        amt,
        ref: ($('#sa_ref').value || '').trim(),
        notes: ($('#sa_notes').value || '').trim()
      });
      if (ok === false) return false;
      toast(t('saved'), 'check-circle');
      renderDuesModule(f);
    }, t('save'));
  };

  ACT.spaydue = x => {
    const f = getF(); if (!f) return;
    const { t, L, D, tk, toast, lrow } = f;
    const supIdx = +x.dataset.i;
    const s = D.suppliers[supIdx];
    if (!s) return;
    modal(t('pay_title') + ' – ' + L(s),
      lrow(t('payable') || t('due_amt'), tk(s.payable), 'dn') +
      field('spd_a', t('pay_amt'), `<input id="spd_a" type="number" min="1" max="${s.payable}" class="form-control" value="${s.payable}">`) +
      field('spd_m', t('method'), `<select id="spd_m" class="form-select">${opts(['m_bank', 'm_cash', 'm_cheque', 'm_bkash'].map(k => [k, t(k)]))}</select>`) +
      field('spd_r', t('ref') || 'Reference', '<input id="spd_r" class="form-control" placeholder="TXN / Cheque No">') +
      field('spd_n', t('notes'), '<input id="spd_n" class="form-control">'), () => {
        const a = +$('#spd_a').value, m = $('#spd_m').value;
        if (!(a > 0) || a > s.payable) { bad('spd_a', a > s.payable ? t('max_due') : t('pos_qty')); return false; }
        if (m === 'm_cash' && a > D.cashBank.cash) { bad('spd_a', t('insuf')); return false; }
        const ok = window.FIN.addSupplierAdjustment(f, {
          supIdx, type: 'payment', amt: a, method: m,
          ref: ($('#spd_r').value || '').trim(),
          notes: ($('#spd_n').value || '').trim()
        });
        if (ok === false) return false;
        toast(t('pay_done'), 'check-circle');
        renderDuesModule(f);
      }, t('pay'));
  };

  ACT.openpu = x => {
    if (window.UI.openPurchaseDetail) window.UI.openPurchaseDetail(x.dataset.uid || x.dataset.ref, 'dues');
  };

  // Purchase Reports Actions & Filters
  IN.prq = x => { PR.q = x.value; renderPurchaseReports(getF()); $('#view input[data-in="prq"]')?.focus(); };
  IN.prsup = x => { PR.sup = x.value; renderPurchaseReports(getF()); };
  IN.prstatus = x => { PR.status = x.value; renderPurchaseReports(getF()); };
  IN.prkind = x => { PR.kind = x.value; renderPurchaseReports(getF()); };
  IN.prrange = x => { PR.range = x.value; renderPurchaseReports(getF()); };
  IN.prdf = x => { PR.df = x.value; renderPurchaseReports(getF()); };
  IN.prdt = x => { PR.dt = x.value; renderPurchaseReports(getF()); };
  ACT.prdueonly = () => { PR.dueOnly = !PR.dueOnly; renderPurchaseReports(getF()); };
  ACT.prdetail = x => {
    if (window.UI.openPurchaseDetail) window.UI.openPurchaseDetail(x.dataset.uid, 'purchase-reports');
  };
  ACT.prprint = () => window.print();
  ACT.prpdf = () => {
    const f = getF(); if (!f) return;
    const tblHtml = $('#pr-tbl')?.outerHTML || '';
    const html = `<div class="inv2"><h2>${f.t('nav_purchase-reports') || 'Purchase Report'}</h2><hr>${tblHtml}</div>`;
    if (window.UI.showDoc) window.UI.showDoc(f.t('nav_purchase-reports') || 'Purchase Report (PDF)', html, html, false);
    else window.print();
  };
  ACT.prcsv = () => {
    const rows = [...document.querySelectorAll('#pr-tbl tr')].map(tr => [...tr.children].map(td => td.textContent.trim()));
    if (!rows.length) return;
    dlCsv('purchase-report.csv', rows);
    getF()?.toast(getF().t('csv_done'), 'download');
  };
})();
