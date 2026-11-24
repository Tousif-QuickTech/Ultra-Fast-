/* Phase 14 / Part 2:
   - Bill Ledger Module (Req 4 - Exact Demo Replica)
   - Expense Report Module (Req 2)
   - Purchase Report Module (Req 3)
   - Daily Closing Report with Weight & TAKA per product (Req 5)
   - Supplier Ledger Module (Req 6)
   - Customer Ledger Module (Req 7)
   - Product Stock Ledger with embedded sales (Req 8)
   - Party-wise Product Rate History view (Req 11)
*/
(()=>{
const U = window.UI, { modal, field, bad, opts, bd, sum, $, ACT, IN } = U, P = window.PAGES;
let F;
const getF = () => {
  if (!F) F = window.FMSAPP || (window.UI && window.UI.F && window.UI.F());
  return F;
};

// Initialize mock dataset for Bill Ledgers
function initLedgerData(f) {
  if (f) F = f;
  const curF = getF();
  if (curF) {
    if (U.boot) U.boot(curF);
    if (U.init2) U.init2(curF);
    if (U.init3) U.init3(curF);
    if (U.init13) U.init13(curF);
  }
  const D = curF ? curF.D : MOCK;

  if (!D.billLedgers) {
    const ashuIdx = D.customers.findIndex(c => c.en.includes('Ashu') || c.bn.includes('আশু'));
    D.billLedgers = {};

    // Ashu Printings - EXACT DATA FROM THE USER'S UPLOADED SPREADSHEET IMAGE
    D.billLedgers[ashuIdx >= 0 ? ashuIdx : 5] = [
      // February 2026
      { dt: '14-02-26', bNo: '1', wt: '2997.4', r: '263', prev: 0, del: 735716, dep: 500000, m: 'DBBL', due: 235716, mo: 'Feb 2026' },
      { dt: '17-02-26', bNo: '2', wt: 'G-1085.8 M-485.8', r: '263 =300', prev: 235716, del: 431305, dep: 500000, m: 'DBBL', due: 167021, mo: 'Feb 2026' },
      { dt: '21-02-26', bNo: '3', wt: '1,879', r: '263', prev: 167021, del: 494177, dep: 0, m: '—', due: 661198, mo: 'Feb 2026' },
      { dt: '22-02-26', bNo: '3', wt: '—', r: '—', prev: 661198, del: 0, dep: 500000, m: 'DBBL', due: 161198, mo: 'Feb 2026' },
      { dt: '28-02-26', bNo: '4', wt: '1470.9', r: '263', prev: 161198, del: 386846, dep: 0, m: '—', due: 548044, mo: 'Feb 2026' },

      // March 2026
      { dt: '04.03.2026', bNo: '2', wt: '1386.5', r: '263', prev: 548044, del: 364649, dep: 521000, m: 'DBBL', due: 391693, mo: 'Mar 2026' },
      { dt: '07.03.2026', bNo: '3', wt: '199.6', r: '260', prev: 391693, del: 51896, dep: 0, m: '—', due: 443589, mo: 'Mar 2026' },
      { dt: '13.03.2026', bNo: '4', wt: '1625.9', r: '260', prev: 443589, del: 422734, dep: 0, m: '—', due: 866323, mo: 'Mar 2026' },

      // April 2026
      { dt: '02.04.2026', bNo: '4', wt: '—', r: '—', prev: 443589, del: 422734, dep: 247900, m: 'DBBL', due: 618423, mo: 'Apr 2026' },
      { dt: '09.04.2026', bNo: '4', wt: '—', r: '—', prev: 618423, del: 0, dep: 360000, m: 'DBBL', due: 258423, mo: 'Apr 2026' },
      { dt: '18.04.2026', bNo: '5', wt: '1177.5', r: '300', prev: 258423, del: 353250, dep: 0, m: '—', due: 611673, mo: 'Apr 2026' },
      { dt: '21.04.2026', bNo: '6', wt: '1614', r: '300', prev: 611673, del: 484200, dep: 0, m: '—', due: 1095873, mo: 'Apr 2026' },
      { dt: '26.04.2026', bNo: '7', wt: '672.15', r: '285', prev: 1095873, del: 191562, dep: 0, m: '—', due: 1287435, mo: 'Apr 2026' },
      { dt: '29.04.2026', bNo: '8', wt: '1458.48', r: '275', prev: 1287435, del: 401082, dep: 0, m: '—', due: 1688517, mo: 'Apr 2026' },
      { dt: '30.04.2026', bNo: '8', wt: '—', r: '—', prev: 1688517, del: 0, dep: 300000, m: 'DBBL', due: 1388517, mo: 'Apr 2026' },

      // May 2026
      { dt: '04.05.2026', bNo: '9', wt: '1224.13', r: '268', prev: 1388517, del: 328066, dep: 0, m: '—', due: 1716583, mo: 'May 2026' },
      { dt: '11.05.2026', bNo: '9', wt: '—', r: '—', prev: 1716583, del: 0, dep: 500000, m: 'DBBL', due: 1216583, mo: 'May 2026' }
    ];

    // Generate dynamic ledger for other customers
    D.customers.forEach((c, idx) => {
      if (idx !== (ashuIdx >= 0 ? ashuIdx : 5)) {
        const p1 = Math.round(c.due * 0.45);
        const p2 = Math.round(c.due * 0.55);
        D.billLedgers[idx] = [
          { dt: '05.10.2026', bNo: '101', wt: '1850.0', r: '112', prev: 0, del: 207200, dep: 100000, m: 'm_bank', due: 107200, mo: 'Oct 2026' },
          { dt: '12.10.2026', bNo: '102', wt: '2400.0', r: '112', prev: 107200, del: 268800, dep: 150000, m: 'm_cash', due: 226000, mo: 'Oct 2026' },
          { dt: '20.10.2026', bNo: '103', wt: '3100.0', r: '115', prev: 226000, del: 356500, dep: 200000, m: 'm_bank', due: 382500, mo: 'Oct 2026' },
          { dt: '28.10.2026', bNo: '104', wt: '4200.0', r: '115', prev: 382500, del: 483000, dep: 100000, m: 'm_bank', due: c.due, mo: 'Oct 2026' }
        ];
      }
    });
  }

  // Ensure JME Pack & R.K Printing exist in customers
  if (!D.customers.some(c => c.en === 'JME Pack')) {
    D.customers.push({
      bn: 'জেএমই প্যাক',
      en: 'JME Pack',
      v: 2450000,
      due: 1386540.65,
      days: 35,
      phone: '01712-349811',
      limit: 3500000
    });
  }
  if (!D.customers.some(c => c.en === 'R.K Printing')) {
    D.customers.push({
      bn: 'আর.কে প্রিন্টিং',
      en: 'R.K Printing',
      v: 1850000,
      due: 292666.40,
      days: 28,
      phone: '01811-998822',
      limit: 2000000
    });
  }

  // Initialize stockMovements with comprehensive in/out tracking
  const nowTs = Date.now();
  const dayMs = 86400000;
  if (!D.stockMovements || !D.stockMovements[0] || !D.stockMovements[0].challan) {
    D.stockMovements = [
      { id: 'MV-2026-001', p: 3, sku: 'PK-104', brand: 'Prime Film Co', ts: nowTs - 7200000, dt: '16-11-2026 12:30 PM', ty: 'Stock Out', in: 0, out: 212.14, prev: 3587.29, res: 3375.15, ref: 'INV-2026-1185', challan: 'CH-399', party: 'JME Pack', partyType: 'customer', u: 'আসির আহমেদ তৌসিফ', remarks: 'Delivered via transport TR-44 to JME Pack' },
      { id: 'MV-2026-002', p: 3, sku: 'PK-104', brand: 'Prime Film Co', ts: nowTs - 7200000, dt: '16-11-2026 12:30 PM', ty: 'Stock Out', in: 0, out: 94.50, prev: 3375.15, res: 3280.65, ref: 'INV-2026-1185', challan: 'CH-404', party: 'JME Pack', partyType: 'customer', u: 'আসির আহমেদ তৌসিফ', remarks: '2nd slot delivery Challan 404' },
      { id: 'MV-2026-003', p: 3, sku: 'PK-104', brand: 'Prime Film Co', ts: nowTs - 7200000, dt: '16-11-2026 12:30 PM', ty: 'Stock Out', in: 0, out: 80.65, prev: 3280.65, res: 3200.00, ref: 'INV-2026-1185', challan: 'CH-406', party: 'JME Pack', partyType: 'customer', u: 'আসির আহমেদ তৌসিফ', remarks: '3rd slot delivery Challan 406' },
      { id: 'MV-2026-004', p: 3, sku: 'PK-104', brand: 'Prime Film Co', ts: nowTs - 5400000, dt: '16-11-2026 12:48 PM', ty: 'Stock Out', in: 0, out: 47.77, prev: 3200.00, res: 3152.23, ref: 'INV-2026-1186', challan: 'CH-400', party: 'R.K Printing', partyType: 'customer', u: 'আসির আহমেদ তৌসিফ', remarks: 'Challan 400 delivery to R.K Printing' },
      { id: 'MV-2026-005', p: 0, sku: 'PK-101', brand: 'Global Kraft', ts: nowTs - dayMs * 1, dt: '15-11-2026 09:30 AM', ty: 'Stock In', in: 5000, out: 0, prev: 37500, res: 42500, ref: 'PO-2026-88', challan: 'CH-SUP-210', party: 'Dhaka Paper Mart', partyType: 'supplier', u: 'আসির আহমেদ তৌসিফ', remarks: 'Raw paper purchase shipment received at godown A' },
      { id: 'MV-2026-006', p: 0, sku: 'PK-101', brand: 'Global Kraft', ts: nowTs - dayMs * 3, dt: '13-11-2026 03:15 PM', ty: 'Stock Out', in: 0, out: 3500, prev: 41000, res: 37500, ref: 'INV-2026-1184', challan: 'CH-398', party: 'Rahman Packaging Ltd', partyType: 'customer', u: 'তানভীর হোসেন', remarks: 'Bulk kraft dispatch on truck TR-12' },
      { id: 'MV-2026-007', p: 1, sku: 'PK-102', brand: 'Eagle Board', ts: nowTs - dayMs * 5, dt: '11-11-2026 11:20 AM', ty: 'Stock Out', in: 0, out: 2500, prev: 9300, res: 6800, ref: 'INV-2026-1183', challan: 'CH-395', party: 'Meghna Carton Industries', partyType: 'customer', u: 'তানভীর হোসেন', remarks: 'Carton board delivery against PO' },
      { id: 'MV-2026-008', p: 3, sku: 'PK-104', brand: 'Prime Film Co', ts: nowTs - dayMs * 10, dt: '06-11-2026 02:40 PM', ty: 'Stock In', in: 3200, out: 0, prev: 387.29, res: 3587.29, ref: 'SH-0457', challan: 'CH-IMP-114', party: 'Chittagong Port Terminal', partyType: 'supplier', u: 'আসির আহমেদ তৌসিফ', remarks: 'Import shipment cleared through customs' },
      { id: 'MV-2026-009', p: 2, sku: 'PK-103', brand: 'Nordic Liner', ts: nowTs - dayMs * 18, dt: '29-10-2026 10:00 AM', ty: 'Stock In', in: 4000, out: 0, prev: 24900, res: 28900, ref: 'PO-2026-79', challan: 'CH-SUP-198', party: 'Karnaphuli Paper Mills', partyType: 'supplier', u: 'আসির আহমেদ তৌসিফ', remarks: 'High strength white liner roll stock intake' },
      { id: 'MV-2026-010', p: 4, sku: 'PK-105', brand: 'Apex Fluting', ts: nowTs - dayMs * 35, dt: '12-10-2026 04:30 PM', ty: 'Stock Out', in: 0, out: 4200, prev: 39400, res: 35200, ref: 'INV-2026-1181', challan: 'CH-388', party: 'New Dhaka Printing Press', partyType: 'customer', u: 'তানভীর হোসেন', remarks: 'Fluting medium delivery for 3-ply carton line' }
    ];
  }

  // Initialize dueCollections (Requirement 5.6)
  if (!D.dueCollections) {
    D.dueCollections = [
      { id: 'COLL-2026-01', custId: 0, custName: 'রহমান প্যাকেজিং লিমিটেড', invNo: 'INV-2026-1184', prevDue: 1590000, amt: 350000, remDue: 1240000, dtStr: '28-10-2026 10:42 AM', m: 'm_bank', ref: 'TXN-9941', by: 'তানভীর হোসেন', remarks: 'Bank collection' },
      { id: 'COLL-2026-02', custId: 2, custName: 'আলিফ প্লাস্টিক', invNo: 'INV-2026-1182', prevDue: 760000, amt: 120000, remDue: 640000, dtStr: '28-10-2026 09:55 AM', m: 'm_bkash', ref: 'TXN-9942', by: 'আসির আহমেদ তৌসিফ', remarks: 'bKash collection' },
      { id: 'COLL-2026-03', custId: 3, custName: 'নিউ ঢাকা প্রিন্টিং প্রেস', invNo: 'INV-2026-1181', prevDue: 1110000, amt: 200000, remDue: 910000, dtStr: '28-10-2026 09:10 AM', m: 'm_cheque', ref: 'CHQ-8812', by: 'তানভীর হোসেন', remarks: 'Cheque received' },
      { id: 'COLL-2026-04', custId: 1, custName: 'মেঘনা কার্টন ইন্ডাস্ট্রিজ', invNo: 'INV-2026-1183', prevDue: 2265000, amt: 85000, remDue: 2180000, dtStr: '28-10-2026 08:30 AM', m: 'm_cash', ref: 'TXN-9944', by: 'তানভীর হোসেন', remarks: 'Cash counter collection' }
    ];
  }
}

/* =========================================================
   4. BILL LEDGER PAGE (Req 4 - Exact Demo Replica)
   ========================================================= */
const BLS = { c: 5, userMode: null }; // default to Ashu Printings

if (!window._blResizeBound) {
  window._blResizeBound = true;
  let blRzTimer;
  window.addEventListener('resize', () => {
    clearTimeout(blRzTimer);
    blRzTimer = setTimeout(() => {
      if (typeof cur === 'function' && cur() === 'bill-ledger' && !BLS.userMode) {
        renderBillLedger();
      }
    }, 150);
  }, { passive: true });
}

function renderBillLedger() {
  const f = getF();
  if (!f) return;
  const { t, L, D, tk, n, panel } = f;
  initLedgerData(f);

  if (BLS.c >= D.customers.length) BLS.c = 0;
  const cust = D.customers[BLS.c];
  const entries = D.billLedgers[BLS.c] || [];

  const totDel = sum(entries.map(e => e.del));
  const totDep = sum(entries.map(e => e.dep));
  const currDue = entries.length ? entries[entries.length - 1].due : cust.due;

  const isMobile = window.innerWidth < 768;
  const currentView = BLS.userMode || (isMobile ? 'cards' : 'table');

  // Table rows HTML
  let prevMo = '';
  const rowsHtml = entries.map((r, i) => {
    let monthDiv = '';
    if (r.mo && r.mo !== prevMo) {
      prevMo = r.mo;
      monthDiv = `
        <tr class="bl-month-divider">
          <td colspan="9" class="py-2 px-3 fw-bold text-primary" style="background:var(--accent-soft);font-size:12px">
            <i class="bi bi-calendar-event me-2"></i>${r.mo}
          </td>
        </tr>`;
    }

    const delStyle = r.del > 0 ? 'background:#fef08a;font-weight:600' : '';
    const depStyle = r.dep > 0 ? 'background:#bbf7d0;font-weight:600' : '';
    const prevStyle = i === 0 || r.prev > 0 ? 'background:#fce7f3' : '';

    return monthDiv + `
      <tr class="bl-row">
        <td class="bl-date fw-semibold">${r.dt}</td>
        <td class="bl-bno text-center">${r.bNo}</td>
        <td class="bl-wt text-nowrap">${r.wt}</td>
        <td class="bl-rate text-nowrap">${r.r}</td>
        <td class="bl-prev text-end" style="${prevStyle}">${r.prev ? n(r.prev) : '—'}</td>
        <td class="bl-del text-end" style="${delStyle}">${r.del ? n(r.del) : '0'}</td>
        <td class="bl-dep text-end" style="${depStyle}">${r.dep ? n(r.dep) : '0'}</td>
        <td class="bl-mth text-center">${r.m || '—'}</td>
        <td class="bl-due text-end fw-bold">${n(r.due)}</td>
      </tr>`;
  }).join('');

  // Mobile Cards HTML
  let prevMoCard = '';
  const cardsHtml = entries.map((r, i) => {
    let monthDiv = '';
    if (r.mo && r.mo !== prevMoCard) {
      prevMoCard = r.mo;
      const countInMonth = entries.filter(e => e.mo === r.mo).length;
      monthDiv = `
        <div class="bl-month-banner">
          <div class="d-flex align-items-center gap-2">
            <i class="bi bi-calendar2-month text-primary"></i>
            <span>${r.mo}</span>
          </div>
          <span class="bl-month-chip">${countInMonth} ${t('items') || 'vouchers'}</span>
        </div>`;
    }

    const hasDel = r.del > 0;
    const hasDep = r.dep > 0;

    return monthDiv + `
      <div class="bl-card ${hasDel ? 'has-del' : ''} ${hasDep ? 'has-dep' : ''}">
        <div class="bl-card-top">
          <div class="bl-card-meta">
            <span class="bl-date"><i class="bi bi-calendar3 me-1 text-primary"></i>${r.dt}</span>
            <span class="bl-bno">#${r.bNo}</span>
          </div>
          <div class="bl-badges">
            ${hasDel ? `<span class="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle"><i class="bi bi-truck me-1"></i>${t('bl_rec_delivery') || 'Delivery'}</span>` : ''}
            ${hasDep ? `<span class="badge bg-success-subtle text-success border border-success-subtle"><i class="bi bi-cash-coin me-1"></i>${t('bl_rec_deposit') || 'Deposit'}</span>` : ''}
            ${r.m && r.m !== '—' ? `<span class="badge bg-secondary-subtle text-secondary border">${r.m.startsWith('m_') ? t(r.m) : r.m}</span>` : ''}
          </div>
        </div>

        <div class="bl-card-amounts-grid ${hasDel && hasDep ? 'dual-tx' : ''}">
          ${hasDel ? `
            <div class="bl-amount-tile bl-tile-del-box">
              <div class="bl-amt-hdr">
                <span class="bl-amt-lbl">${t('bl_today_del')}</span>
                <i class="bi bi-box-seam text-warning-emphasis"></i>
              </div>
              <div class="bl-amt-val text-warning-emphasis">+ ${tk(r.del)}</div>
              ${(r.wt && r.wt !== '—') || (r.r && r.r !== '—') ? `
                <div class="bl-amt-spec">
                  ${r.wt && r.wt !== '—' ? `<span>${t('bl_weight')}: <b>${r.wt} kg</b></span>` : ''}
                  ${r.wt && r.wt !== '—' && r.r && r.r !== '—' ? `<span class="bl-dot">•</span>` : ''}
                  ${r.r && r.r !== '—' ? `<span>${t('bl_rate')}: <b>৳${r.r}</b></span>` : ''}
                </div>
              ` : ''}
            </div>
          ` : ''}

          ${hasDep ? `
            <div class="bl-amount-tile bl-tile-dep-box">
              <div class="bl-amt-hdr">
                <span class="bl-amt-lbl">${t('bl_today_dep')}</span>
                <i class="bi bi-cash text-success"></i>
              </div>
              <div class="bl-amt-val text-success">+ ${tk(r.dep)}</div>
              ${r.m && r.m !== '—' ? `
                <div class="bl-amt-spec">
                  <span>${t('bl_method')}: <b>${r.m.startsWith('m_') ? t(r.m) : r.m}</b></span>
                </div>
              ` : ''}
            </div>
          ` : ''}
        </div>

        ${r.prev > 0 ? `
          <div class="bl-prev-strip">
            <span class="text-secondary">${t('bl_prev_due')}:</span>
            <b>${tk(r.prev)}</b>
          </div>
        ` : ''}

        <div class="bl-card-due-footer">
          <div class="bl-due-lbl">
            <i class="bi bi-wallet2 me-1 text-danger"></i>
            <span>${t('bl_total_due')}</span>
          </div>
          <b class="bl-due-val text-danger">${tk(r.due)}</b>
        </div>
      </div>`;
  }).join('');

  $('#view').innerHTML = `
    <div class="enter">
      <div class="page-h bl-page-header">
        <div>
          <h2>${t('bill_ledger_title')}</h2>
          <p>${t('bill_ledger_sub')}</p>
        </div>
        <div class="bl-actions">
          <button class="btn-a bl-btn bl-btn-del" data-act="bladddel"><i class="bi bi-plus-circle"></i> <span>${t('bl_btn_del') || t('bl_rec_delivery')}</span></button>
          <button class="btn-a bl-btn bl-btn-dep" data-act="bladddep"><i class="bi bi-cash-coin"></i> <span>${t('bl_btn_dep') || t('bl_rec_deposit')}</span></button>
          <div class="bl-icon-group">
            <button class="btn-o bl-btn-sm" data-act="blprint" title="${t('bl_print')}"><i class="bi bi-printer"></i></button>
            <button class="btn-o bl-btn-sm" data-act="blexport" title="Excel"><i class="bi bi-file-earmark-excel"></i></button>
          </div>
        </div>
      </div>

      <div class="card mb-3 p-3 border shadow-sm bl-party-card">
        <div class="row g-3 align-items-center">
          <div class="col-12 col-lg-5">
            <label class="form-label fw-bold small text-secondary mb-1"><i class="bi bi-person-circle me-1 text-primary"></i>${t('bl_party')}:</label>
            <select class="form-select form-select-lg fw-bold bl-party-select" data-in="blcust">
              ${opts(D.customers.map((c, i) => [i, L(c) + (i === 5 ? ' (Demo Spreadsheet)' : '')]), BLS.c)}
            </select>
          </div>
          <div class="col-12 col-lg-7">
            <div class="bl-metric-strip">
              <div class="bl-metric-tile bl-tile-del">
                <div class="bl-tile-hdr">
                  <span class="bl-tile-label">${t('bl_tot_delivery')}</span>
                  <i class="bi bi-truck text-warning-emphasis"></i>
                </div>
                <b class="bl-tile-val text-warning-emphasis">${tk(totDel)}</b>
              </div>
              <div class="bl-metric-tile bl-tile-dep">
                <div class="bl-tile-hdr">
                  <span class="bl-tile-label">${t('bl_tot_deposit')}</span>
                  <i class="bi bi-cash-coin text-success"></i>
                </div>
                <b class="bl-tile-val text-success">${tk(totDep)}</b>
              </div>
              <div class="bl-metric-tile bl-tile-due">
                <div class="bl-tile-hdr">
                  <span class="bl-tile-label">${t('bl_curr_due')}</span>
                  <i class="bi bi-exclamation-triangle text-danger"></i>
                </div>
                <b class="bl-tile-val text-danger">${tk(currDue)}</b>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card border shadow-sm bl-content-card">
        <div class="card-header py-2 px-3 d-flex justify-content-between align-items-center flex-wrap gap-2 bl-card-view-header">
          <div class="d-flex align-items-center gap-2">
            <span class="fw-bold fs-5 text-body">${L(cust)}</span>
            <span class="badge bg-primary-subtle text-primary border">${entries.length} ${t('items')}</span>
          </div>
          <div class="btn-group btn-group-sm bl-view-toggle">
            <button type="button" class="btn btn-sm ${currentView==='cards'?'btn-primary':'btn-outline-secondary'}" data-act="blview" data-mode="cards"><i class="bi bi-card-list me-1"></i>${t('cards') || 'Cards'}</button>
            <button type="button" class="btn btn-sm ${currentView==='table'?'btn-primary':'btn-outline-secondary'}" data-act="blview" data-mode="table"><i class="bi bi-table me-1"></i>${t('table') || 'Table'}</button>
          </div>
        </div>

        ${currentView === 'cards' ? `
          <div class="bl-mobile-cards">
            ${cardsHtml || `<div class="text-center py-5 text-muted">${t('empty')}</div>`}
          </div>
        ` : `
          <div class="bl-table-container">
            <div class="bl-swipe-hint d-md-none">
              <i class="bi bi-arrow-left-right me-1"></i>
              <span>${t('swipe_hint') || 'ডানে-বামে সোয়াইপ করুন'}</span>
            </div>
            <div class="tw table-responsive bl-table-wrap">
              <table class="table table-bordered table-hover mb-0 bill-ledger-table" id="bl-table">
                <thead class="table-warning text-center" style="font-size:12.5px;letter-spacing:0.02em">
                  <tr>
                    <th class="bl-col-dt" style="min-width:92px">${t('bl_date')}</th>
                    <th class="bl-col-bno" style="min-width:62px">${t('bl_bill_no')}</th>
                    <th style="min-width:110px">${t('bl_weight')}</th>
                    <th style="min-width:85px">${t('bl_rate')}</th>
                    <th style="min-width:110px">${t('bl_prev_due')}</th>
                    <th style="min-width:120px">${t('bl_today_del')}</th>
                    <th style="min-width:120px">${t('bl_today_dep')}</th>
                    <th style="min-width:90px">${t('bl_method')}</th>
                    <th style="min-width:125px">${t('bl_total_due')}</th>
                  </tr>
                </thead>
                <tbody style="font-size:13px;font-variant-numeric:tabular-nums">
                  ${rowsHtml || `<tr><td colspan="9" class="text-center py-5 text-muted">${t('empty')}</td></tr>`}
                </tbody>
                <tfoot class="table-light fw-bold" style="font-size:13.5px">
                  <tr>
                    <td colspan="5" class="text-end">${t('tot')}:</td>
                    <td class="text-end" style="background:#fef08a">${n(totDel)}</td>
                    <td class="text-end" style="background:#bbf7d0">${n(totDep)}</td>
                    <td></td>
                    <td class="text-end text-danger">${n(currDue)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        `}
      </div>
    </div>`;
}

ACT.blview = (btn) => {
  BLS.userMode = btn.dataset.mode;
  renderBillLedger();
};

P['bill-ledger'] = (f) => {
  initLedgerData(f);
  renderBillLedger();
};

IN.blcust = (x) => {
  BLS.c = +x.value;
  renderBillLedger();
};

// Record new delivery in Bill Ledger
ACT.bladddel = () => {
  const f = getF();
  if (!f) return;
  const { t, D } = f;
  const cust = D.customers[BLS.c];
  const entries = D.billLedgers[BLS.c] || [];
  const lastDue = entries.length ? entries[entries.length - 1].due : cust.due;
  const nextBillNo = entries.length ? (+entries[entries.length - 1].bNo || 0) + 1 : 1;

  const body = `
    <div class="row g-3">
      <div class="col-md-6">${field('bld_dt', t('bl_date'), '<input id="bld_dt" class="form-control" value="' + new Date().toLocaleDateString('en-GB') + '">')}</div>
      <div class="col-md-6">${field('bld_bno', t('bl_bill_no'), '<input id="bld_bno" class="form-control" value="' + nextBillNo + '">')}</div>
      <div class="col-md-6">${field('bld_wt', t('bl_weight'), '<input id="bld_wt" type="number" step="0.1" class="form-control" value="1500">')}</div>
      <div class="col-md-6">${field('bld_r', t('bl_rate'), '<input id="bld_r" type="number" step="1" class="form-control" value="263">')}</div>
    </div>
    <div class="mt-3 p-3 rounded border" style="background:var(--surface-2)">
      <div class="d-flex justify-content-between mb-1"><span>${t('bl_prev_due')}:</span><b>${F.tk(lastDue)}</b></div>
      <div class="d-flex justify-content-between mb-1 text-warning-emphasis"><span>${t('bl_today_del')}:</span><b id="bld_calc_del">৳0</b></div>
      <hr class="my-1">
      <div class="d-flex justify-content-between fs-5 text-danger"><span>${t('bl_total_due')}:</span><b id="bld_calc_total">৳0</b></div>
    </div>`;

  modal(t('bl_rec_delivery') + ' – ' + F.L(cust), body, () => {
    const dt = $('#bld_dt').value.trim() || 'Today';
    const bNo = $('#bld_bno').value.trim() || '1';
    const wt = +$('#bld_wt').value;
    const r = +$('#bld_r').value;

    if (!(wt > 0) || !(r > 0)) {
      F.toast(F.t('pos_qty'), 'exclamation-triangle');
      return false;
    }

    const del = Math.round(wt * r);
    const newDue = lastDue + del;

    entries.push({
      dt,
      bNo,
      wt: String(wt),
      r: String(r),
      prev: lastDue,
      del,
      dep: 0,
      m: '—',
      due: newDue,
      mo: 'Current'
    });

    cust.due = newDue;
    F.toast(F.t('saved'), 'check-circle');
    renderBillLedger();
  }, t('save'));

  const recalcDel = () => {
    const wt = +$('#bld_wt')?.value || 0;
    const r = +$('#bld_r')?.value || 0;
    const d = Math.round(wt * r);
    if ($('#bld_calc_del')) $('#bld_calc_del').textContent = F.tk(d);
    if ($('#bld_calc_total')) $('#bld_calc_total').textContent = F.tk(lastDue + d);
  };
  $('#bld_wt')?.addEventListener('input', recalcDel);
  $('#bld_r')?.addEventListener('input', recalcDel);
  recalcDel();
};

// Record new deposit in Bill Ledger
ACT.bladddep = () => {
  const f = getF();
  if (!f) return;
  const { t, D } = f;
  const cust = D.customers[BLS.c];
  const entries = D.billLedgers[BLS.c] || [];
  const lastDue = entries.length ? entries[entries.length - 1].due : cust.due;
  const nextBillNo = entries.length ? entries[entries.length - 1].bNo : '1';

  const body = `
    <div class="row g-3">
      <div class="col-md-6">${field('bld_dt', t('bl_date'), '<input id="bld_dt" class="form-control" value="' + new Date().toLocaleDateString('en-GB') + '">')}</div>
      <div class="col-md-6">${field('bld_bno', t('bl_bill_no'), '<input id="bld_bno" class="form-control" value="' + nextBillNo + '">')}</div>
      <div class="col-md-6">${field('bld_dep', t('bl_today_dep') + ' (৳)', '<input id="bld_dep" type="number" step="1000" class="form-control" value="500000">')}</div>
      <div class="col-md-6">${field('bld_m', t('bl_method'), '<select id="bld_m" class="form-select">' + opts([['DBBL', 'DBBL'], ['m_cash', t('m_cash')], ['m_bank', t('m_bank')], ['m_bkash', 'bKash']]) + '</select>')}</div>
    </div>
    <div class="mt-3 p-3 rounded border" style="background:var(--surface-2)">
      <div class="d-flex justify-content-between mb-1"><span>${t('bl_prev_due')}:</span><b>${F.tk(lastDue)}</b></div>
      <div class="d-flex justify-content-between mb-1 text-success"><span>${t('bl_today_dep')}:</span><b id="bld_calc_dep">৳0</b></div>
      <hr class="my-1">
      <div class="d-flex justify-content-between fs-5 text-primary"><span>${t('bl_total_due')}:</span><b id="bld_calc_total">৳0</b></div>
    </div>`;

  modal(t('bl_rec_deposit') + ' – ' + F.L(cust), body, () => {
    const dt = $('#bld_dt').value.trim() || 'Today';
    const bNo = $('#bld_bno').value.trim() || '1';
    const dep = +$('#bld_dep').value;
    const m = $('#bld_m').value;

    if (!(dep > 0)) {
      F.toast(F.t('pos_qty'), 'exclamation-triangle');
      return false;
    }

    const newDue = Math.max(0, lastDue - dep);
    entries.push({
      dt,
      bNo,
      wt: '—',
      r: '—',
      prev: lastDue,
      del: 0,
      dep,
      m: m === 'm_cash' ? 'Cash' : m === 'm_bank' ? 'Bank' : m,
      due: newDue,
      mo: 'Current'
    });

    cust.due = newDue;
    F.toast(F.t('coll_done'), 'check-circle');
    renderBillLedger();
  }, t('save'));

  const recalcDep = () => {
    const dp = +$('#bld_dep')?.value || 0;
    if ($('#bld_calc_dep')) $('#bld_calc_dep').textContent = F.tk(dp);
    if ($('#bld_calc_total')) $('#bld_calc_total').textContent = F.tk(Math.max(0, lastDue - dp));
  };
  $('#bld_dep')?.addEventListener('input', recalcDep);
  recalcDep();
};

ACT.blprint = () => {
  const f = getF();
  if (!f) return;
  const table = $('#bl-table');
  if (!table) return;
  const title = f.t('bill_ledger_title') + ' – ' + f.L(f.D.customers[BLS.c]);
  const printHtml = `
    <div style="padding:24px;font-family:'Plus Jakarta Sans','Hind Siliguri',sans-serif">
      <div style="text-align:center;margin-bottom:20px;border-bottom:2px solid #0A0A0D;padding-bottom:12px">
        <h2 style="margin:0">${BRAND.name}</h2>
        <p style="margin:4px 0">${BRAND.tag} · ${BRAND.ph}</p>
        <h3 style="margin:8px 0 0;color:#195568">${title}</h3>
      </div>
      ${table.outerHTML}
    </div>`;
  U.printDoc(printHtml, title);
};

ACT.blexport = () => {
  const f = getF();
  if (!f) return;
  const entries = f.D.billLedgers[BLS.c] || [];
  const rows = [
    ['Date', 'Bill No', 'Weight', 'Rate', 'Previous Due', 'Today Delivery', 'Today Deposit', 'Method', 'Total Due'],
    ...entries.map(e => [e.dt, e.bNo, e.wt, e.r, e.prev, e.del, e.dep, e.m, e.due])
  ];
  const csvContent = '\ufeff' + rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `Bill-Ledger-${F.D.customers[BLS.c].en}.csv`;
  a.click();
  F.toast(F.t('csv_done'), 'download');
};

/* =========================================================
   EXTEND REPORTS FOR REQUIREMENTS 2, 3, 5, 6, 7, 8, 11
   ========================================================= */

// Filter state for new reports
const REP_EXT = {
  expCat: 'all',
  purSup: 'all',
  purProd: 'all',
  stockProd: 0,
  supIdx: 0,
  custIdx: 0,
  crTab: 'overview',
  crCustQ: '',
  crCustSort: 'due_desc',
  crMoveProd: 'all',
  crMoveType: 'all',
  crDueCust: 'all',
  crDueMethod: 'all',
  saleView: 'company',
  saleCompany: 'all',
  saleInvNo: '',
  saleChallan: '',
  saleProd: 'all',
  saleBrand: 'all',
  saleStatus: 'all',
  stockType: 'all',
  stockSku: '',
  stockBrand: 'all',
  stockRef: '',
  stockChallan: '',
  expandedCompanies: {}
};
U.REP_EXT = REP_EXT;

// 2. EXPENSE REPORT RENDERER (Req 2)
function renderExpenseReportTable() {
  const f = getF();
  if (!f) return '';
  initLedgerData(f);
  const { t, lg, tk, D } = f;
  const sum = f.sum || U.sum || ((arr) => arr.reduce((a, b) => a + b, 0));
  const exps = D.exp || [];
  const filtered = exps.filter(e => e.k === 'expense' && (REP_EXT.expCat === 'all' || e.c === REP_EXT.expCat));
  const total = sum(filtered.map(e => e.a));
  const avg = filtered.length ? Math.round(total / filtered.length) : 0;

  const rows = filtered.map(e => `
    <tr>
      <td>${lg(e.d)}</td>
      <td><span class="badge bg-secondary-subtle text-secondary border">${t('c_' + e.c)}</span></td>
      <td>${lg(e.n)}</td>
      <td>${t('m_cash')}</td>
      <td class="r fw-bold text-danger">−${tk(e.a)}</td>
    </tr>`).join('');

  return `
    <div class="p-3 border-bottom d-flex gap-2 align-items-center flex-wrap">
      <label class="form-label mb-0 fw-semibold">${t('exp_type')}:</label>
      <select class="form-select w-auto" data-in="repexpcat">
        <option value="all" ${REP_EXT.expCat === 'all' ? 'selected' : ''}>${t('exp_all_types')}</option>
        ${opts(['rent', 'transport', 'utility', 'salary', 'other', 'scrap'].map(c => [c, t('c_' + c)]), REP_EXT.expCat)}
      </select>
    </div>
    <div class="tw">
      <table class="tbl" id="rtbl">
        <thead>
          <tr>
            <th>${t('exp_date')}</th>
            <th>${t('exp_type')}</th>
            <th>${t('exp_note')}</th>
            <th>${t('exp_paid_to')}</th>
            <th class="r">${t('amount')}</th>
          </tr>
        </thead>
        <tbody>
          ${rows || `<tr><td colspan="5" class="text-center py-4 text-muted">${t('empty')}</td></tr>`}
          <tr class="fw-bold ft">
            <td colspan="4">${t('tot')}:</td>
            <td class="r text-danger">−${tk(total)}</td>
          </tr>
        </tbody>
      </table>
    </div>`;
}

// 3. PURCHASE REPORT RENDERER (Req 3)
function renderPurchaseReportTable() {
  const f = getF();
  if (!f) return '';
  initLedgerData(f);
  const { t, L, tk, kg, D } = f;
  const sum = f.sum || U.sum || ((arr) => arr.reduce((a, b) => a + b, 0));
  const shipments = D.shipments || [];
  const suppliers = D.suppliers || [];
  const products = D.products || [];
  const filtered = shipments.filter(s => {
    const matchSup = REP_EXT.purSup === 'all' || s[1] === +REP_EXT.purSup;
    const matchProd = REP_EXT.purProd === 'all' || s[2] === +REP_EXT.purProd;
    return matchSup && matchProd;
  });

  let totAmt = 0, totKg = 0, totPaid = 0, totDue = 0;
  const rows = filtered.map(s => {
    const sup = suppliers[s[1]] || { en: 'Supplier', bn: 'সরবরাহকারী' };
    const prod = products[s[2]] || { n: { en: 'Product', bn: 'পণ্য' }, cost: 95 };
    const unitRate = s[7] || prod.cost || 95;
    const otherChg = s[8] || 35000;
    const total = s[9] || Math.round(s[3] * unitRate + otherChg);
    const paid = s[10] || (s[4] === 'received' ? total : 0);
    const due = s[11] !== undefined ? s[11] : (total - paid);

    totAmt += total;
    totKg += s[3];
    totPaid += paid;
    totDue += due;

    return `
      <tr>
        <td class="fw-semibold">${s[0]}</td>
        <td>${L(sup)}</td>
        <td>${L(prod.n)}</td>
        <td class="r">${kg(s[3])}</td>
        <td class="r">${tk(unitRate)}</td>
        <td class="r">${tk(otherChg)}</td>
        <td class="r fw-bold text-primary">${tk(total)}</td>
        <td class="r up">${tk(paid)}</td>
        <td class="r ${due > 0 ? 'dn' : 'up'}">${tk(due)}</td>
        <td>${bd(s[4] === 'received' ? 'paid' : 'due', 'st_' + s[4])}</td>
      </tr>`;
  }).join('');

  return `
    <div class="p-3 border-bottom d-flex gap-3 align-items-center flex-wrap">
      <div class="d-flex align-items-center gap-2">
        <label class="form-label mb-0 fw-semibold">${t('filter_sup')}:</label>
        <select class="form-select w-auto" data-in="reppursup">
          <option value="all" ${REP_EXT.purSup === 'all' ? 'selected' : ''}>${t('all_suppliers')}</option>
          ${opts(suppliers.map((s, i) => [i, L(s)]), REP_EXT.purSup)}
        </select>
      </div>
      <div class="d-flex align-items-center gap-2">
        <label class="form-label mb-0 fw-semibold">${t('filter_prod')}:</label>
        <select class="form-select w-auto" data-in="reppurprod">
          <option value="all" ${REP_EXT.purProd === 'all' ? 'selected' : ''}>${t('all_products')}</option>
          ${opts(products.map((p, i) => [i, L(p.n)]), REP_EXT.purProd)}
        </select>
      </div>
    </div>
    <div class="tw">
      <table class="tbl" id="rtbl">
        <thead>
          <tr>
            <th>${t('purch_bill_no')}</th>
            <th>${t('supplier')}</th>
            <th>${t('product')}</th>
            <th class="r">${t('qty_kg')}</th>
            <th class="r">${t('rate')}</th>
            <th class="r">${t('pu_charges')}</th>
            <th class="r">${t('pu_tot_amount')}</th>
            <th class="r">${t('pu_paid_amt')}</th>
            <th class="r">${t('pu_due_amt')}</th>
            <th>${t('status')}</th>
          </tr>
        </thead>
        <tbody>
          ${rows || `<tr><td colspan="10" class="text-center py-4 text-muted">${t('empty')}</td></tr>`}
          <tr class="fw-bold ft">
            <td colspan="3">${t('tot')}:</td>
            <td class="r">${kg(totKg)}</td>
            <td colspan="2"></td>
            <td class="r text-primary">${tk(totAmt)}</td>
            <td class="r up">${tk(totPaid)}</td>
            <td class="r dn">${tk(totDue)}</td>
            <td></td>
          </tr>
        </tbody>
      </table>
    </div>`;
}

// 5. CONSOLIDATED CLOSING REPORT — FINANCIAL & STOCK SUMMARY (Requirement 5)
function renderClosingReportWithWeightAndTaka(dayIndex) {
  const f = getF();
  if (!f) return '';
  initLedgerData(f);
  const { t, L, lg, D, tk, kg, short, n } = f;
  dayIndex = (dayIndex !== undefined && dayIndex !== null && !isNaN(dayIndex)) ? +dayIndex : (window.UI?.RS?.d !== undefined ? +window.UI.RS.d : 29);
  const tab = REP_EXT.crTab || 'overview';

  // Sub-tabs navigation bar
  const subTabs = [
    ['overview', `<i class="bi bi-speedometer2 me-1"></i>${t('overview')}`],
    ['client', `<i class="bi bi-people me-1"></i>${t('tab_client_sum')}`],
    ['wallet', `<i class="bi bi-wallet2 me-1"></i>${t('tab_wallet_sum')}`],
    ['cash', `<i class="bi bi-cash-stack me-1"></i>${t('tab_cash_drawer')}`],
    ['stock', `<i class="bi bi-boxes me-1"></i>${t('tab_stock_sum')}`],
    ['moves', `<i class="bi bi-arrow-left-right me-1"></i>${t('tab_stock_mvmt')}`],
    ['dues', `<i class="bi bi-cash-coin me-1"></i>${t('tab_due_coll')}`]
  ];

  const navHtml = `
    <div class="rep-subtabs-nav">
      ${subTabs.map(([k, lbl]) => `
        <button class="rep-subtab-btn ${tab === k ? 'active' : ''}" data-act="crtab" data-k="${k}">
          ${lbl}
        </button>`).join('')}
    </div>`;

  // -------------------------------------------------------------
  // 5.1 CLIENT SUMMARY (Req 5.1 & Exact Photo Replica)
  // -------------------------------------------------------------
  if (tab === 'client') {
    return renderClientSummaryListTable(navHtml);
  }

  // -------------------------------------------------------------
  // 5.2 WALLET & ACCOUNT SUMMARY (Req 5.2)
  // Formula: Closing = Opening + In - Out - Charges + Adjustments
  // -------------------------------------------------------------
  if (tab === 'wallet') {
    const cb = D.cashBank || { cash: 1845000, bank: 6230000 };
    const wallets = [
      {
        name: 'Cash Drawer / Counter Cash',
        open: cb.cash - 185000,
        in: 250000,
        out: 65000,
        transfers: 0,
        charges: 0,
        adj: 0,
        close: cb.cash
      },
      {
        name: 'Dutch-Bangla Bank (DBBL General A/C)',
        open: 3800000,
        in: 1250000,
        out: 890000,
        transfers: 0,
        charges: 1500,
        adj: 0,
        close: 4158500
      },
      {
        name: 'DBBL Corporate / Import LC A/C',
        open: 2050000,
        in: 680000,
        out: 660000,
        transfers: 0,
        charges: 0,
        adj: 0,
        close: 2070000
      },
      {
        name: 'bKash Merchant MFS Wallet',
        open: 165000,
        in: 120000,
        out: 42000,
        transfers: 0,
        charges: 1800,
        adj: 0,
        close: 241200
      },
      {
        name: 'Nagad Business MFS Wallet',
        open: 95000,
        in: 85000,
        out: 30000,
        transfers: 0,
        charges: 950,
        adj: 0,
        close: 149050
      }
    ];

    const totOpen = sum(wallets.map(w => w.open));
    const totIn = sum(wallets.map(w => w.in));
    const totOut = sum(wallets.map(w => w.out));
    const totCharges = sum(wallets.map(w => w.charges));
    const totClose = sum(wallets.map(w => w.close));

    const rows = wallets.map(w => {
      // Formula verification
      const calculatedClose = w.open + w.in - w.out - w.charges + w.adj;
      return `
        <tr>
          <td><b><i class="bi bi-wallet2 me-2 text-primary"></i>${w.name}</b></td>
          <td class="r">${tk(w.open)}</td>
          <td class="r up fw-bold">+${tk(w.in)}</td>
          <td class="r dn fw-bold">−${tk(w.out)}</td>
          <td class="r text-secondary">${tk(w.transfers)}</td>
          <td class="r dn">${tk(w.charges)}</td>
          <td class="r">${tk(w.adj)}</td>
          <td class="r text-primary fw-bold fs-6">${tk(calculatedClose)}</td>
          <td class="text-center"><span class="badge bg-success-subtle text-success border border-success-subtle"><i class="bi bi-check-circle me-1"></i>Reconciled</span></td>
        </tr>`;
    }).join('');

    return `
      ${navHtml}
      <div class="alert alert-light border shadow-sm mb-3">
        <small class="text-secondary"><i class="bi bi-calculator me-1 text-primary"></i><b>${t('tab_wallet_sum')} Formula:</b> Closing Wallet Balance = Opening Balance + Money In − Money Out − Charges + Adjustments.</small>
      </div>
      <div class="strip mb-3">
        <div><span>${t('opening_bal')}</span><b>${short(totOpen)}</b></div>
        <div><span>${t('money_in')}</span><b class="up">+${short(totIn)}</b></div>
        <div><span>${t('money_out')}</span><b class="dn">−${short(totOut)}</b></div>
        <div><span>${t('closing_bal')}</span><b class="text-primary">${short(totClose)}</b></div>
      </div>
      <div class="tw border rounded">
        <table class="tbl mb-0" id="rtbl">
          <thead>
            <tr>
              <th>Wallet / Account</th>
              <th class="r">${t('opening_bal')}</th>
              <th class="r">${t('money_in')}</th>
              <th class="r">${t('money_out')}</th>
              <th class="r">${t('transfers')}</th>
              <th class="r">${t('charges')}</th>
              <th class="r">${t('adjustments')}</th>
              <th class="r">${t('closing_bal')}</th>
              <th class="text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
            <tr class="fw-bold ft">
              <td>${t('tot')}:</td>
              <td class="r">${tk(totOpen)}</td>
              <td class="r up">+${tk(totIn)}</td>
              <td class="r dn">−${tk(totOut)}</td>
              <td class="r">${tk(0)}</td>
              <td class="r dn">${tk(totCharges)}</td>
              <td class="r">${tk(0)}</td>
              <td class="r text-primary fs-6">${tk(totClose)}</td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>`;
  }

  // -------------------------------------------------------------
  // 5.3 CASH DRAWER / CASH IN HAND LEDGER (Req 5.3)
  // Formula: Closing Cash = Opening Cash + Cash In - Cash Out
  // -------------------------------------------------------------
  if (tab === 'cash') {
    const cb = D.cashBank || { cash: 1845000 };
    const openingCash = cb.cash - 185000;
    const cashSales = 120000;
    const dueCollectionsCash = 85000;
    const otherCashIncome = 45000;
    const totalCashIn = cashSales + dueCollectionsCash + otherCashIncome;

    const cashExpenses = 45000;
    const supplierCashPayments = 20000;
    const adjustmentsCash = 0;
    const totalCashOut = cashExpenses + supplierCashPayments + adjustmentsCash;

    const calculatedClosing = openingCash + totalCashIn - totalCashOut;

    const cashMovements = [
      { dt: '28-10-2026 08:00 AM', dir: 'in', type: 'Opening Cash Balance', amt: openingCash, ref: 'OPN-CASH', u: 'System', note: 'Morning drawer opening' },
      { dt: '28-10-2026 08:30 AM', dir: 'in', type: 'Due Collection (Meghna Carton)', amt: 85000, ref: 'COLL-2026-04', u: 'তানভীর হোসেন', note: 'Cash counter collection' },
      { dt: '28-10-2026 10:15 AM', dir: 'in', type: 'Cash Sale Delivery', amt: 120000, ref: 'INV-2026-1184', u: 'আসির আহমেদ তৌসিফ', note: 'Direct cash sale' },
      { dt: '28-10-2026 12:45 PM', dir: 'out', type: 'Transport Expense', amt: 35000, ref: 'EXP-2026-102', u: 'তানভীর হোসেন', note: 'Factory transport fare' },
      { dt: '28-10-2026 02:30 PM', dir: 'in', type: 'Scrap Paper Sale', amt: 45000, ref: 'INC-2026-106', u: 'আসির আহমেদ তৌসিফ', note: 'Cash received from factory waste' },
      { dt: '28-10-2026 04:15 PM', dir: 'out', type: 'Office Tea & Snacks', amt: 10000, ref: 'EXP-2026-105', u: 'তানভীর হোসেন', note: 'Daily kitchen & tea expenses' },
      { dt: '28-10-2026 05:00 PM', dir: 'out', type: 'Local Supplier Cash Payment', amt: 20000, ref: 'SUP-PAY-441', u: 'আসির আহমেদ তৌসিফ', note: 'Emergency pallet purchase' }
    ];

    const moveRows = cashMovements.map(m => `
      <tr>
        <td><small class="text-secondary">${m.dt}</small></td>
        <td>
          <span class="badge ${m.dir === 'in' ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-danger-subtle text-danger border border-danger-subtle'}">
            <i class="bi bi-arrow-${m.dir === 'in' ? 'down' : 'up'}-left me-1"></i>${m.dir === 'in' ? 'Cash In (+)' : 'Cash Out (−)'}
          </span>
        </td>
        <td><b>${m.type}</b></td>
        <td class="r fw-bold ${m.dir === 'in' ? 'up' : 'dn'}">${m.dir === 'in' ? '+' : '−'}${tk(m.amt)}</td>
        <td><code>${m.ref}</code></td>
        <td><small>${m.u}</small></td>
        <td><small class="text-secondary">${m.note}</small></td>
      </tr>`).join('');

    return `
      ${navHtml}
      <div class="alert alert-light border shadow-sm mb-3">
        <small class="text-secondary"><i class="bi bi-calculator me-1 text-primary"></i><b>${t('tab_cash_drawer')} Formula:</b> Closing Cash = Opening Cash (${tk(openingCash)}) + Total Cash In (${tk(totalCashIn)}) − Total Cash Out (${tk(totalCashOut)}) = <b>${tk(calculatedClosing)}</b></small>
      </div>
      <div class="strip mb-3" style="grid-template-columns:repeat(4,1fr)">
        <div><span>${t('opening_bal')}</span><b>${short(openingCash)}</b></div>
        <div><span>${t('cash_sales')} + ${t('today_coll')}</span><b class="up">+${short(totalCashIn)}</b></div>
        <div><span>${t('expenses')} + Payments</span><b class="dn">−${short(totalCashOut)}</b></div>
        <div><span>${t('closing_bal')}</span><b class="text-primary">${short(calculatedClosing)}</b></div>
      </div>
      <h6 class="fw-bold mb-2"><i class="bi bi-journal-text me-2"></i>Daily Cash Movement Chronological Ledger</h6>
      <div class="tw border rounded">
        <table class="tbl mb-0" id="rtbl">
          <thead>
            <tr>
              <th>Date / Time</th>
              <th>Direction</th>
              <th>Movement Reason</th>
              <th class="r">${t('amount')}</th>
              <th>Reference</th>
              <th>User</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            ${moveRows}
            <tr class="fw-bold ft">
              <td colspan="3">${t('closing_bal')}:</td>
              <td class="r text-primary fs-6">${tk(calculatedClosing)}</td>
              <td colspan="3"></td>
            </tr>
          </tbody>
        </table>
      </div>`;
  }

  // -------------------------------------------------------------
  // 5.4 PRODUCT STOCK SUMMARY (Req 5.4)
  // Formula: Closing Stock = Opening + Purchases + Sales Returns + In - Sales - Purchase Returns - Out ± Adjustments
  // -------------------------------------------------------------
  if (tab === 'stock') {
    const prods = D.products || [];
    let totVal = 0, totKg = 0, lowCount = 0;

    const rows = prods.map(p => {
      const openKg = p.kg + (p.sold || 3000) - (p.purchased || 5000);
      const purchKg = p.purchased || 5000;
      const soldKg = p.sold || 3000;
      const salesReturnKg = p.salesReturn || 0;
      const purchReturnKg = p.purchReturn || 0;
      const wastageKg = p.wastage || 0;
      const adjKg = p.adj || 0;
      const currentStock = p.kg;
      const costRate = p.cost || 95;
      const val = currentStock * costRate;
      totVal += val;
      totKg += currentStock;

      const isLow = currentStock < p.min;
      const isOut = currentStock <= 0;
      if (isLow) lowCount++;

      return `
        <tr>
          <td><b>${L(p.n)}</b></td>
          <td><code>${p.sku || '—'}</code></td>
          <td><span class="badge bg-secondary-subtle text-secondary border">${t('cat_' + p.cat)}</span></td>
          <td class="r">${kg(openKg)}</td>
          <td class="r up">+${kg(purchKg)}</td>
          <td class="r dn">−${kg(soldKg)}</td>
          <td class="r">${kg(salesReturnKg)}</td>
          <td class="r dn">−${kg(purchReturnKg)}</td>
          <td class="r dn">−${kg(wastageKg)}</td>
          <td class="r">${kg(adjKg)}</td>
          <td class="r fw-bold text-primary fs-6">${kg(currentStock)}</td>
          <td class="r">${tk(costRate)}</td>
          <td class="r fw-bold">${tk(val)}</td>
          <td>
            ${isOut ? `<span class="badge bg-danger">${t('out_of_stock')}</span>` :
              isLow ? `<span class="badge bg-warning text-dark">${t('low_stock_warn')}</span>` :
              `<span class="badge bg-success-subtle text-success border border-success-subtle">In Stock</span>`}
          </td>
        </tr>`;
    }).join('');

    return `
      ${navHtml}
      <div class="alert alert-light border shadow-sm mb-3">
        <small class="text-secondary"><i class="bi bi-calculator me-1 text-primary"></i><b>${t('tab_stock_sum')} Formula:</b> Closing Stock = Opening Stock + Purchases + Sales Returns + In − Sales − Purchase Returns − Out ± Adjustments.</small>
      </div>
      <div class="strip mb-3">
        <div><span>${t('total_stock')}</span><b class="text-primary">${kg(totKg)}</b></div>
        <div><span>${t('stock_val')}</span><b class="text-success">${short(totVal)}</b></div>
        <div><span>${t('low_stock')}</span><b class="${lowCount > 0 ? 'dn' : 'up'}">${n(lowCount)}</b></div>
        <div><span>${t('products')}</span><b>${n(prods.length)}</b></div>
      </div>
      <div class="tw border rounded">
        <table class="tbl mb-0" id="rtbl">
          <thead>
            <tr>
              <th>${t('product')}</th>
              <th>SKU</th>
              <th>${t('category')}</th>
              <th class="r">${t('open_stock')}</th>
              <th class="r">Purchases (+)</th>
              <th class="r">Sales (−)</th>
              <th class="r">Sales Ret</th>
              <th class="r">Purch Ret</th>
              <th class="r">Wastage</th>
              <th class="r">Adj</th>
              <th class="r">${t('curr_stock')}</th>
              <th class="r">${t('cost_price')}</th>
              <th class="r">${t('stock_val')}</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
            <tr class="fw-bold ft">
              <td colspan="3">${t('tot')}:</td>
              <td colspan="7"></td>
              <td class="r text-primary fs-6">${kg(totKg)}</td>
              <td></td>
              <td class="r text-success fs-6">${tk(totVal)}</td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>`;
  }

  // -------------------------------------------------------------
  // 5.5 STOCK MOVEMENT HISTORY (Req 5.5 & Detailed In/Out Report)
  // -------------------------------------------------------------
  if (tab === 'moves') {
    return renderStockMovementDetailedReport(navHtml);
  }

  // -------------------------------------------------------------
  // 5.6 DUE COLLECTION LEDGER (Req 5.6)
  // No double-counting receivables as new sales revenue
  // -------------------------------------------------------------
  if (tab === 'dues') {
    let colls = D.dueCollections || [];
    if (REP_EXT.crDueCust !== 'all') {
      colls = colls.filter(c => c.custId === +REP_EXT.crDueCust);
    }
    if (REP_EXT.crDueMethod !== 'all') {
      colls = colls.filter(c => c.m === REP_EXT.crDueMethod);
    }

    const totRecv = sum(colls.map(c => c.amt));

    const rows = colls.map(c => `
      <tr>
        <td><b>${c.id}</b></td>
        <td><b>${c.custName}</b></td>
        <td><code>${c.invNo}</code></td>
        <td class="r text-secondary">${tk(c.prevDue)}</td>
        <td class="r up fw-bold">+${tk(c.amt)}</td>
        <td class="r dn fw-bold">${tk(c.remDue)}</td>
        <td><small class="text-secondary">${c.dtStr}</small></td>
        <td><span class="badge bg-secondary-subtle text-secondary border">${t(c.m)}</span></td>
        <td><code>${c.ref}</code></td>
        <td><small>${c.by}</small></td>
        <td><small class="text-secondary">${c.remarks || '—'}</small></td>
      </tr>`).join('');

    return `
      ${navHtml}
      <div class="alert alert-info py-2 px-3 small mb-3 border-info-subtle">
        <i class="bi bi-info-circle-fill me-2 text-info"></i>
        <b>${t('due_coll_note')}</b>
      </div>
      <div class="card mb-3 border shadow-sm">
        <div class="card-body p-3">
          <div class="d-flex flex-wrap align-items-center gap-2">
            <label class="form-label mb-0 fw-semibold">${t('customer')}:</label>
            <select class="form-select form-select-sm w-auto" data-in="crduecust">
              <option value="all" ${REP_EXT.crDueCust === 'all' ? 'selected' : ''}>${t('all_customers')}</option>
              ${opts(D.customers.map((c, i) => [i, L(c)]), REP_EXT.crDueCust)}
            </select>
            <label class="form-label mb-0 fw-semibold ms-2">${t('method')}:</label>
            <select class="form-select form-select-sm w-auto" data-in="crduem">
              <option value="all" ${REP_EXT.crDueMethod === 'all' ? 'selected' : ''}>All Methods</option>
              ${opts(F.methods().map(m => [m, t(m)]), REP_EXT.crDueMethod)}
            </select>
          </div>
        </div>
      </div>
      <div class="strip mb-3">
        <div><span>Total Collections</span><b class="text-primary">${n(colls.length)}</b></div>
        <div><span>Total Amount Collected</span><b class="up">+${short(totRecv)}</b></div>
        <div><span>Impact on P&amp;L Sales</span><b class="text-secondary">৳0 (Receivables Recovery)</b></div>
        <div><span>Account Increase</span><b class="up">Cash &amp; Bank Ledgers</b></div>
      </div>
      <div class="tw border rounded">
        <table class="tbl mb-0" id="rtbl">
          <thead>
            <tr>
              <th>Collection ID</th>
              <th>${t('customer')}</th>
              <th>Invoice Ref</th>
              <th class="r">${t('prev_due')}</th>
              <th class="r">${t('paid')}</th>
              <th class="r">${t('due_amt')}</th>
              <th>Date / Time</th>
              <th>Method</th>
              <th>Reference</th>
              <th>Received By</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            ${rows || `<tr><td colspan="11" class="text-center py-4 text-muted">${t('empty')}</td></tr>`}
            <tr class="fw-bold ft">
              <td colspan="4">${t('tot')}:</td>
              <td class="r up fs-6">+${tk(totRecv)}</td>
              <td colspan="6"></td>
            </tr>
          </tbody>
        </table>
      </div>`;
  }

  // -------------------------------------------------------------
  // DEFAULT TAB: DAILY OVERVIEW & WEIGHT/TAKA BREAKDOWN
  // -------------------------------------------------------------
  const dObj = (window.UI && window.UI.dayD) ? window.UI.dayD(dayIndex) : { s: 350000, c: 220000, exp: 35000, cash: 120000, bank: 100000, sup: 80000 };
  const balsObj = (window.UI && window.UI.bals) ? window.UI.bals() : null;
  const cashBal = balsObj ? balsObj.cash[dayIndex + 1] : ((D.cashBank && D.cashBank.cash) || 350000);
  const openCash = balsObj ? balsObj.cash[dayIndex] : (cashBal - 120000);
  const bankBal = balsObj ? balsObj.bank[dayIndex + 1] : ((D.cashBank && D.cashBank.bank) || 1250000);
  const openBank = balsObj ? balsObj.bank[dayIndex] : (bankBal - 250000);
  const salesArr = (D.daily && D.daily.sales) || [125000];
  const collArr = (D.daily && D.daily.coll) || [95000];
  const coll = collArr[dayIndex] !== undefined ? collArr[dayIndex] : dObj.c;
  const prods = D.products || [];

  let totalKg = 0, totalTaka = 0, totalCash = 0, totalCredit = 0;
  const productRows = prods.map((p, idx) => {
    const factor = (0.7 + ((dayIndex + idx) % 5) * 0.15);
    const soldKg = Math.round(((p.sold || 3000) / 30) * factor);
    const rate = p.price || 120;
    const soldTaka = Math.round(soldKg * rate);
    const cashShare = Math.round(soldTaka * 0.6);
    const creditShare = soldTaka - cashShare;

    totalKg += soldKg;
    totalTaka += soldTaka;
    totalCash += cashShare;
    totalCredit += creditShare;

    return `
      <tr>
        <td><b>${L(p.n)}</b></td>
        <td><span class="badge bg-secondary-subtle text-secondary border">${t('cat_' + (p.cat || 'paper'))}</span></td>
        <td class="r fw-bold text-primary">${kg(soldKg)}</td>
        <td class="r">${tk(rate)}</td>
        <td class="r fw-bold">${tk(soldTaka)}</td>
        <td class="r up">${tk(cashShare)}</td>
        <td class="r dn">${tk(creditShare)}</td>
      </tr>`;
  }).join('');

  return `
    ${navHtml}
    <div class="strip mb-3" style="grid-template-columns:repeat(4, 1fr)">
      <div><span>${t('daily_weight_tot')}</span><b class="text-primary">${kg(totalKg)}</b></div>
      <div><span>${t('daily_taka_tot')}</span><b class="text-success">${short(totalTaka)}</b></div>
      <div><span>${t('cash_sales')}</span><b class="up">${short(totalCash)}</b></div>
      <div><span>${t('credit_sales')}</span><b class="dn">${short(totalCredit)}</b></div>
    </div>

    <div class="card mb-4 border shadow-sm">
      <div class="card-header bg-light py-2 px-3 fw-bold">
        <i class="bi bi-receipt me-2"></i>${t('reg_sales_rep')}
      </div>
      <div class="tw">
        <table class="tbl" id="rtbl">
          <thead>
            <tr>
              <th>${t('product')}</th>
              <th>${t('category')}</th>
              <th class="r">${t('weight_kg')}</th>
              <th class="r">${t('rate_per_kg')}</th>
              <th class="r">${t('taka_amt')}</th>
              <th class="r">${t('cash_sales')}</th>
              <th class="r">${t('credit_sales')}</th>
            </tr>
          </thead>
          <tbody>
            ${productRows}
            <tr class="fw-bold ft">
              <td colspan="2">${t('tot')}:</td>
              <td class="r text-primary">${kg(totalKg)}</td>
              <td></td>
              <td class="r text-success">${tk(totalTaka)}</td>
              <td class="r up">${tk(totalCash)}</td>
              <td class="r dn">${tk(totalCredit)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Cash Box and Fund Closings -->
    <h6 class="fw-bold mb-2"><i class="bi bi-wallet2 me-2"></i>${t('closing_cash_box')}</h6>
    <div class="stmt-grid">
      <div class="stmt">
        <h4><i class="bi bi-cash-coin"></i>${t('dc_cash')}</h4>
        <table class="tbl stmt-t">
          <tbody>
            <tr><td>${t('dc_open')}</td><td class="r">${tk(openCash)}</td></tr>
            <tr><td>+ ${t('dc_cashin')}</td><td class="r up">${tk(dObj.cash)}</td></tr>
            <tr><td>− ${t('dc_exp')}</td><td class="r dn">${tk(dObj.exp)}</td></tr>
            <tr class="cl"><td>${t('dc_close')}</td><td class="r fw-bold">${tk(cashBal)}</td></tr>
          </tbody>
        </table>
      </div>
      <div class="stmt">
        <h4><i class="bi bi-bank"></i>${t('dc_bank')}</h4>
        <table class="tbl stmt-t">
          <tbody>
            <tr><td>${t('dc_open')}</td><td class="r">${tk(openBank)}</td></tr>
            <tr><td>+ ${t('today_coll')}</td><td class="r up">${tk(dObj.bank + (dObj.dep || 0))}</td></tr>
            <tr><td>− ${t('dc_supp')}</td><td class="r dn">${tk(dObj.sup)}</td></tr>
            <tr class="cl"><td>${t('dc_close')}</td><td class="r fw-bold">${tk(bankBal)}</td></tr>
          </tbody>
        </table>
      </div>
    </div>`;
}

// 6. SUPPLIER LEDGER RENDERER (Req 6)
function renderSupplierLedgerTable() {
  const f = getF();
  if (!f) return '';
  initLedgerData(f);
  const { t, L, lg, tk, kg, D } = f;
  const sups = D.suppliers || [];
  const sup = sups[REP_EXT.supIdx] || sups[0] || { en: 'Supplier', bn: 'সরবরাহকারী', type: 'local', cur: 'BDT', payable: 0, tx: [] };
  let running = 0;
  const tx = sup.tx || [];

  const rows = tx.map(r => {
    const isPurch = r[0] === 'p';
    const amt = r[1];
    running += isPurch ? amt : -amt;

    return `
      <tr>
        <td>${lg(r[2])}</td>
        <td><span class="tag">${isPurch ? 'PURCHASE' : 'PAYMENT'}</span></td>
        <td>${isPurch ? t('sup_purchases') : t('sup_payments')}</td>
        <td class="r ${isPurch ? 'text-primary' : ''}">${isPurch ? tk(amt) : '—'}</td>
        <td class="r up">${isPurch ? '—' : tk(amt)}</td>
        <td class="r fw-bold text-danger">${tk(running)}</td>
      </tr>`;
  }).join('');

  return `
    <div class="p-3 border-bottom d-flex gap-2 align-items-center">
      <label class="form-label mb-0 fw-semibold">${t('supplier')}:</label>
      <select class="form-select w-auto" data-in="repsupidx">
        ${opts(sups.map((s, i) => [i, L(s)]), REP_EXT.supIdx)}
      </select>
    </div>
    <div class="strip mb-3" style="grid-template-columns:repeat(3, 1fr)">
      <div><span>${t('supplier')}</span><b>${L(sup)}</b></div>
      <div><span>${t('type')}</span><b class="text-uppercase">${sup.type} (${sup.cur})</b></div>
      <div><span>${t('sup_running_due')}</span><b class="dn">${tk(sup.payable)}</b></div>
    </div>
    <div class="tw">
      <table class="tbl" id="rtbl">
        <thead>
          <tr>
            <th>${t('date')}</th>
            <th>${t('ac_ref')}</th>
            <th>${t('note')}</th>
            <th class="r">${t('sup_purchases')}</th>
            <th class="r">${t('sup_payments')}</th>
            <th class="r">${t('sup_running_due')}</th>
          </tr>
        </thead>
        <tbody>
          ${rows || `<tr><td colspan="6" class="text-center py-4 text-muted">${t('empty')}</td></tr>`}
        </tbody>
      </table>
    </div>`;
}

// 7. CUSTOMER LEDGER RENDERER (Req 7)
function renderCustomerLedgerTable() {
  const f = getF();
  if (!f) return '';
  initLedgerData(f);
  const { t, L, tk, n, D } = f;
  const custs = D.customers || [];
  const cust = custs[REP_EXT.custIdx] || custs[0] || { en: 'Customer', bn: 'ক্রেতা', phone: '', due: 0 };
  const entries = (D.billLedgers && D.billLedgers[REP_EXT.custIdx]) || [];

  const rows = entries.map(e => `
    <tr>
      <td>${e.dt}</td>
      <td><span class="tag">BILL-${e.bNo}</span></td>
      <td>${e.wt !== '—' ? e.wt + ' kg @ ৳' + e.r : t('bl_today_dep')}</td>
      <td class="r ${e.del > 0 ? 'fw-bold' : ''}">${e.del ? tk(e.del) : '—'}</td>
      <td class="r up">${e.dep ? tk(e.dep) : '—'}</td>
      <td>${e.m || '—'}</td>
      <td class="r fw-bold text-danger">${tk(e.due)}</td>
    </tr>`).join('');

  return `
    <div class="p-3 border-bottom d-flex gap-2 align-items-center">
      <label class="form-label mb-0 fw-semibold">${t('customer')}:</label>
      <select class="form-select w-auto" data-in="repcustidx">
        ${opts(custs.map((c, i) => [i, L(c)]), REP_EXT.custIdx)}
      </select>
    </div>
    <div class="strip mb-3" style="grid-template-columns:repeat(3, 1fr)">
      <div><span>${t('customer')}</span><b>${L(cust)}</b></div>
      <div><span>${t('phone')}</span><b>${cust.phone}</b></div>
      <div><span>${t('cust_running_due')}</span><b class="dn">${tk(cust.due)}</b></div>
    </div>
    <div class="tw">
      <table class="tbl" id="rtbl">
        <thead>
          <tr>
            <th>${t('date')}</th>
            <th>${t('purch_bill_no')}</th>
            <th>${t('note')}</th>
            <th class="r">${t('cust_deliveries')}</th>
            <th class="r">${t('cust_deposits')}</th>
            <th>${t('method')}</th>
            <th class="r">${t('cust_running_due')}</th>
          </tr>
        </thead>
        <tbody>
          ${rows || `<tr><td colspan="7" class="text-center py-4 text-muted">${t('empty')}</td></tr>`}
        </tbody>
      </table>
    </div>`;
}

// 8. PRODUCT STOCK LEDGER WITH EMBEDDED SALES (Req 8)
function renderStockLedgerTable() {
  const f = getF();
  if (!f) return '';
  initLedgerData(f);
  const { t, L, tk, kg, D } = f;
  const prods = D.products || [];
  const p = prods[REP_EXT.stockProd] || prods[0] || { n: { en: 'Product', bn: 'পণ্য' }, kg: 1000, cost: 100, price: 120 };

  // Derive movements: opening, purchase(+), sales(-), adjustments, current
  const movements = [
    { dt: '01.10.2026', ref: 'OPN-01', ty: 'Opening Balance', in: p.kg + 5000, out: 0, bal: p.kg + 5000, party: 'Initial Inventory', rate: p.cost },
    { dt: '15.10.2026', ref: 'SH-0454', ty: 'Purchase (+)', in: 10000, out: 0, bal: p.kg + 15000, party: 'Dhaka Paper Mart', rate: p.cost },
    { dt: '20.10.2026', ref: 'INV-1179', ty: 'Sale (−)', in: 0, out: 4500, bal: p.kg + 10500, party: 'Rahman Packaging', rate: p.price },
    { dt: '25.10.2026', ref: 'INV-1181', ty: 'Sale (−)', in: 0, out: 6200, bal: p.kg + 4300, party: 'New Dhaka Printing', rate: p.price },
    { dt: '28.10.2026', ref: 'INV-1184', ty: 'Sale (−)', in: 0, out: 3500, bal: p.kg + 800, party: 'Ashu Printings', rate: 263 },
    { dt: '29.10.2026', ref: 'ADJ-102', ty: 'Stock Adjustment (+)', in: 2500, out: 0, bal: p.kg, party: 'Warehouse Correction', rate: p.cost }
  ];

  const rows = movements.map(m => `
    <tr>
      <td>${m.dt}</td>
      <td><span class="tag">${m.ref}</span></td>
      <td><span class="badge ${m.in > 0 ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning-emphasis'}">${m.ty}</span></td>
      <td><b>${m.party}</b></td>
      <td class="r">${tk(m.rate)}</td>
      <td class="r up">${m.in ? '+' + kg(m.in) : '—'}</td>
      <td class="r dn">${m.out ? '−' + kg(m.out) : '—'}</td>
      <td class="r fw-bold text-primary">${kg(m.bal)}</td>
    </tr>`).join('');

  return `
    <div class="p-3 border-bottom d-flex gap-2 align-items-center">
      <label class="form-label mb-0 fw-semibold">${t('product')}:</label>
      <select class="form-select w-auto" data-in="repstockprod">
        ${opts(prods.map((x, i) => [i, L(x.n)]), REP_EXT.stockProd)}
      </select>
    </div>
    <div class="strip mb-3" style="grid-template-columns:repeat(4, 1fr)">
      <div><span>${t('product')}</span><b>${L(p.n)}</b></div>
      <div><span>${t('stock_bal')}</span><b class="text-primary">${kg(p.kg)}</b></div>
      <div><span>${t('avgcost')}</span><b>${tk(p.cost)}</b></div>
      <div><span>${t('sell_price')}</span><b class="up">${tk(p.price)}</b></div>
    </div>
    <h6 class="fw-bold px-3 pt-2"><i class="bi bi-clock-history me-2"></i>${t('stock_mvmt')} & ${t('prod_sales_rep')}</h6>
    <div class="tw">
      <table class="tbl" id="rtbl">
        <thead>
          <tr>
            <th>${t('date')}</th>
            <th>${t('ac_ref')}</th>
            <th>${t('type')}</th>
            <th>${t('customer')} / Party</th>
            <th class="r">${t('rate')}</th>
            <th class="r">${t('stock_in')}</th>
            <th class="r">${t('stock_out')}</th>
            <th class="r">${t('stock_bal')}</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>`;
}

// 11. PARTY-WISE PRODUCT RATE HISTORY RENDERER (Req 11)
function renderPartyPriceHistoryTable() {
  const f = getF();
  if (!f) return '';
  initLedgerData(f);
  const { t, L, tk, kg, D } = f;
  if (U.init13) U.init13(f);
  const partyPrices = D.partyPrices || [];
  const customers = D.customers || [];
  const products = D.products || [];

  const rows = partyPrices.map(r => {
    const cust = customers[r.c];
    const prod = products[r.p];
    if (!cust || !prod) return '';

    return `
      <tr>
        <td><b>${L(cust)}</b><br><small class="text-secondary">${cust.phone || ''}</small></td>
        <td><b>${L(prod.n)}</b><br><small class="text-secondary">${t('cat_' + (prod.cat || 'paper'))}</small></td>
        <td class="r fs-6 fw-bold text-primary">${tk(r.rate)}</td>
        <td class="r text-muted">${r.prevRate ? tk(r.prevRate) : '—'}</td>
        <td class="r">${r.qty ? kg(r.qty) : '—'}</td>
        <td>${r.date}</td>
        <td><span class="tag">BILL-${r.billNo}</span></td>
      </tr>`;
  }).join('');

  return `
    <div class="strip mb-3" style="grid-template-columns:repeat(3, 1fr)">
      <div><span>${t('party_price_title')}</span><b>${partyPrices.length} ${t('items')}</b></div>
      <div><span>${t('customer')}</span><b>${customers.length} Parties</b></div>
      <div><span>${t('product')}</span><b>${products.length} Products</b></div>
    </div>
    <div class="tw">
      <table class="tbl" id="rtbl">
        <thead>
          <tr>
            <th>${t('party_name')}</th>
            <th>${t('product')}</th>
            <th class="r">${t('last_rate')} (৳/kg)</th>
            <th class="r">${t('prev_rate')}</th>
            <th class="r">${t('qty_kg')}</th>
            <th>${t('last_sold_on')}</th>
            <th>${t('purch_bill_no')}</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>`;
}

// HOOK INTO REPORTS (modules4.js)
function hookReportsSystem() {
  if (window._hookedRep) return;
  window._hookedRep = true;

  const updateRep = () => {
    if (window.UI && window.UI.reports) {
      window.UI.reports();
    } else {
      const rw = $('#view #rwrap');
      if (rw && window.UI && window.UI.customReportRenderer && window.UI.RS) {
        const h = window.UI.customReportRenderer(window.UI.RS.c, window.UI.RS.d);
        if (h) rw.innerHTML = h;
      }
    }
  };

  // Closing report sub-tabs
  ACT.crtab = (x) => {
    REP_EXT.crTab = x.dataset.k;
    const rw = $('#view #rwrap');
    if (rw) rw.innerHTML = renderClosingReportWithWeightAndTaka(window.UI?.RS?.d || 0);
  };

  IN.crcustq = (x) => {
    REP_EXT.crCustQ = x.value;
    const rw = $('#view #rwrap');
    if (rw) rw.innerHTML = renderClosingReportWithWeightAndTaka(window.UI?.RS?.d || 0);
  };

  IN.crmoveprod = (x) => {
    REP_EXT.crMoveProd = x.value;
    const rw = $('#view #rwrap');
    if (rw) rw.innerHTML = renderClosingReportWithWeightAndTaka(window.UI?.RS?.d || 0);
  };

  IN.crmovetype = (x) => {
    REP_EXT.crMoveType = x.value;
    const rw = $('#view #rwrap');
    if (rw) rw.innerHTML = renderClosingReportWithWeightAndTaka(window.UI?.RS?.d || 0);
  };

  IN.crduecust = (x) => {
    REP_EXT.crDueCust = x.value;
    const rw = $('#view #rwrap');
    if (rw) rw.innerHTML = renderClosingReportWithWeightAndTaka(window.UI?.RS?.d || 0);
  };

  IN.crduem = (x) => {
    REP_EXT.crDueMethod = x.value;
    const rw = $('#view #rwrap');
    if (rw) rw.innerHTML = renderClosingReportWithWeightAndTaka(window.UI?.RS?.d || 0);
  };

  // Stock movements CSV export (Requirement 5.5)
  ACT.mvmtcsv = () => {
    const f = getF();
    const D = f.D;
    const prods = D.products || [];
    let moves = D.stockMovements || [];
    if (REP_EXT.crMoveProd !== 'all') moves = moves.filter(m => m.p === +REP_EXT.crMoveProd);
    if (REP_EXT.crMoveType !== 'all') moves = moves.filter(m => m.ty === REP_EXT.crMoveType);

    const headers = ['Movement ID', 'Product', 'SKU', 'Date/Time', 'Movement Type', 'Previous Stock (KG)', 'Quantity In (KG)', 'Quantity Out (KG)', 'Resulting Stock (KG)', 'Reference ID', 'User', 'Remarks'];
    const rows = moves.map(m => {
      const p = prods[m.p] || { n: { en: 'Product' } };
      return [
        m.id,
        p.n.en || p.n.bn,
        m.sku || '',
        m.dt,
        m.ty,
        m.prev,
        m.in,
        m.out,
        m.res,
        m.ref,
        m.u,
        m.remarks || ''
      ];
    });

    const csvContent = '\ufeff' + [headers, ...rows].map(line =>
      line.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'stock-movements.csv';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    f.toast(f.t('csv_done'), 'download');
  };

  // Statement drill-down modal for Client Summary (Requirement 5.1)
  ACT.stmtview = (x) => {
    const f = getF();
    const D = f.D;
    const { t, L, tk, kg } = f;
    const idx = +x.dataset.i;
    const c = D.customers[idx];
    if (!c) return;

    const invs = D.invoices.filter(v => v[1] === idx);
    const colls = (D.dueCollections || []).filter(dc => dc.custId === idx);
    const ledger = D.billLedgers ? D.billLedgers[idx] || [] : [];

    const stmtHtml = `
      <div class="p-3 mb-3 border rounded bg-light">
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <h5 class="mb-0 fw-bold text-primary">${L(c)}</h5>
            <small class="text-secondary">Phone: ${c.phone || '—'} · Credit Limit: ${tk(c.limit || 0)}</small>
          </div>
          <div class="text-end">
            <span class="badge bg-danger fs-6">${t('due_amt')}: ${tk(c.due)}</span>
          </div>
        </div>
      </div>
      <h6 class="fw-bold mb-2"><i class="bi bi-receipt me-1"></i>${t('invoices')}</h6>
      <div class="tw border rounded mb-3">
        <table class="tbl mb-0">
          <thead>
            <tr><th>Invoice #</th><th>Date</th><th class="r">Total</th><th class="r">Paid</th><th class="r">Due</th><th>Status</th></tr>
          </thead>
          <tbody>
            ${invs.length ? invs.map(v => `
              <tr>
                <td><b>${v[0]}</b></td>
                <td>${v.dateStr || '—'}</td>
                <td class="r">${tk(v[2])}</td>
                <td class="r up">${tk(v[3])}</td>
                <td class="r dn fw-bold">${tk(v[2] - v[3])}</td>
                <td>${v[4]}</td>
              </tr>`).join('') : `<tr><td colspan="6" class="text-center py-2 text-muted">No invoices</td></tr>`}
          </tbody>
        </table>
      </div>
      <h6 class="fw-bold mb-2"><i class="bi bi-cash-coin me-1"></i>${t('tab_due_coll')}</h6>
      <div class="tw border rounded">
        <table class="tbl mb-0">
          <thead>
            <tr><th>Collection ID</th><th>Date</th><th class="r">Amount</th><th>Method</th><th>Reference</th></tr>
          </thead>
          <tbody>
            ${colls.length ? colls.map(cl => `
              <tr>
                <td><b>${cl.id}</b></td>
                <td>${cl.dtStr}</td>
                <td class="r up fw-bold">+${tk(cl.amt)}</td>
                <td>${t(cl.m)}</td>
                <td><code>${cl.ref}</code></td>
              </tr>`).join('') : `<tr><td colspan="5" class="text-center py-2 text-muted">No collection records</td></tr>`}
          </tbody>
        </table>
      </div>`;

    U.showDoc(`Account Statement – ${L(c)}`, stmtHtml, stmtHtml);
  };

  // Listen to input filters
  IN.repexpcat = (x) => { REP_EXT.expCat = x.value; updateRep(); };
  IN.reppursup = (x) => { REP_EXT.purSup = x.value; updateRep(); };
  IN.reppurprod = (x) => { REP_EXT.purProd = x.value; updateRep(); };
  IN.repsupidx = (x) => { REP_EXT.supIdx = +x.value; updateRep(); };
  IN.repcustidx = (x) => { REP_EXT.custIdx = +x.value; updateRep(); };
  IN.repstockprod = (x) => { REP_EXT.stockProd = +x.value; updateRep(); };
  IN.crcustq = (x) => { REP_EXT.crCustQ = x.value; updateRep(); };
  ACT.crcustqclear = () => { REP_EXT.crCustQ = ''; updateRep(); };
  ACT.saleviewtab = (x) => { REP_EXT.saleView = x.dataset.v; updateRep(); };
  ACT.custviewtab = (x) => { REP_EXT.custView = x.dataset.v; updateRep(); };
  ACT.saletoggleco = (x) => {
    const co = x.dataset.co;
    REP_EXT.expandedCompanies[co] = !REP_EXT.expandedCompanies[co];
    updateRep();
  };
  IN.salecompany = (x) => { REP_EXT.saleCompany = x.value; updateRep(); };
  IN.saleinvno = (x) => { REP_EXT.saleInvNo = x.value; updateRep(); };
  IN.salechallan = (x) => { REP_EXT.saleChallan = x.value; updateRep(); };
  IN.saleprod = (x) => { REP_EXT.saleProd = x.value; updateRep(); };
  IN.salebrand = (x) => { REP_EXT.saleBrand = x.value; updateRep(); };
  IN.salestatus = (x) => { REP_EXT.saleStatus = x.value; updateRep(); };
  IN.stocktype = (x) => { REP_EXT.stockType = x.value; updateRep(); };
  IN.stockprod = (x) => { REP_EXT.stockProd = x.value; updateRep(); };
  IN.stocksku = (x) => { REP_EXT.stockSku = x.value; updateRep(); };
  IN.stockbrand = (x) => { REP_EXT.stockBrand = x.value; updateRep(); };
  IN.stockref = (x) => { REP_EXT.stockRef = x.value; updateRep(); };
  IN.stockchallan = (x) => { REP_EXT.stockChallan = x.value; updateRep(); };

  ACT.saleexpcsv = () => {
    const rows = [
      ['Company Name', 'Number of Invoices', 'Total Products', 'Total Quantity (KG)', 'Total Sales Amount', 'Total Paid Amount', 'Outstanding Due', 'Last Purchase Date']
    ];
    document.querySelectorAll('.comp-row').forEach(tr => {
      const cols = Array.from(tr.querySelectorAll('td')).map(td => td.textContent.trim().replace(/\s+/g, ' '));
      if (cols.length >= 8) rows.push(cols.slice(0, 8));
    });
    csvExport('company_sales_report.csv', rows);
  };

  ACT.clientsumcsv = () => {
    const rows = [
      ['SL', 'Client', 'Deliveries Summary', 'Opening Due', 'Gross Bill', 'Bill Discount', 'Net Bill', 'Payment Received', 'Account Discount', 'Closing Due']
    ];
    document.querySelectorAll('.client-summary-tbl tbody tr:not(.ft)').forEach(tr => {
      const cols = Array.from(tr.querySelectorAll('td')).map(td => td.textContent.trim().replace(/\s+/g, ' '));
      if (cols.length >= 10) rows.push(cols);
    });
    csvExport('client_summary_list.csv', rows);
  };

  ACT.clientsumprint = () => {
    const tbl = document.querySelector('.client-summary-tbl');
    if (!tbl) { window.print(); return; }
    const printHtml = `
      <div style="font-family:'Plus Jakarta Sans','Hind Siliguri','Segoe UI',sans-serif;padding:16px;color:#1e293b">
        <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:12px;border-bottom:2px solid #334155;padding-bottom:8px">
          <div>
            <h2 style="margin:0;font-size:20px;font-weight:800;color:#1e293b;letter-spacing:-0.2px">1. Client Summary List</h2>
            <small style="color:#64748b">Ultra Fast Plastics & Packaging ERP · Financial Statement</small>
          </div>
          <div style="text-align:right;font-size:11px;color:#64748b">
            <div>Printed: ${new Date().toLocaleDateString('en-GB', {day:'2-digit',month:'short',year:'numeric'})}</div>
          </div>
        </div>
        ${tbl.outerHTML}
      </div>
    `;
    const fullStyle = `
      @page { size: landscape; margin: 8mm; }
      body { margin: 0; font-family: 'Plus Jakarta Sans', sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .client-summary-tbl { width: 100%; border-collapse: collapse; font-size: 11px; }
      .client-summary-tbl th { background: #334155 !important; color: #ffffff !important; font-weight: 700; padding: 7px 10px; border: 1px solid #475569; }
      .client-summary-tbl td { padding: 7px 10px; border: 1px solid #cbd5e1; vertical-align: top; font-size: 11px; }
      .client-delivery-box:not(:first-child) { border-top: 1px dashed #94a3b8; margin-top: 4px; padding-top: 4px; }
      .client-delivery-time { font-size: 10px; color: #64748b; font-weight: 700; }
      .client-delivery-bill { font-weight: 700; color: #1e293b; }
      .client-summary-tbl .ft td { background: #f1f5f9 !important; font-weight: 700; border-top: 2px solid #334155; }
      .client-summary-tbl .r { text-align: right; }
    `;
    const f = document.createElement('iframe');
    f.setAttribute('aria-hidden', 'true');
    f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
    document.body.append(f);
    const d = f.contentWindow.document;
    d.open();
    d.write('<!doctype html><html><head><meta charset="utf-8"><title>1. Client Summary List</title><style>' + fullStyle + '</style></head><body>' + printHtml + '</body></html>');
    d.close();
    setTimeout(() => {
      try { f.contentWindow.focus(); f.contentWindow.print(); } catch (e) {}
      setTimeout(() => f.remove(), 3000);
    }, 500);
  };

  ACT.mvmtcsv = () => {
    const f = getF();
    const D = f ? f.D : MOCK;
    const rows = [
      ['Movement ID', 'Date & Time', 'Reference No', 'Challan No', 'Product Name', 'SKU', 'Brand', 'Movement Type', 'Qty In', 'Qty Out', 'Prev Stock', 'Current Stock', 'Party', 'Remarks']
    ];
    (D.stockMovements || []).forEach(m => {
      const p = D.products[m.p] || { n: { en: 'Product' } };
      rows.push([
        m.id, m.dt, m.ref, m.challan || '', p.n.en, m.sku, m.brand, m.ty, m.in || 0, m.out || 0, m.prev, m.res, m.party, m.remarks || ''
      ]);
    });
    csvExport('stock_movement_report.csv', rows);
  };

  ACT.mvmtdetail = (x) => {
    const f = getF();
    const { t, L, D, modal, kg } = f;
    const id = x.dataset.id;
    const m = (D.stockMovements || []).find(it => it.id === id);
    if (!m) return;
    const p = D.products[m.p] || { n: { bn: 'পণ্য', en: 'Product' } };
    const isIn = m.ty === 'Stock In';

    modal(`${m.ty} Details – ${m.id}`, `
      <div class="p-3 mb-3 rounded border" style="background:var(--surface-2)">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <h5 class="mb-0 fw-bold ${isIn ? 'text-success' : 'text-primary'}">
            <i class="bi bi-${isIn ? 'box-arrow-in-down' : 'box-arrow-up'} me-2"></i>${m.ty} Record
          </h5>
          <span class="badge ${isIn ? 'bg-success' : 'bg-primary'}">${m.id}</span>
        </div>
        <div class="small text-secondary"><i class="bi bi-clock me-1"></i>${m.dt} · Recorded by <b>${m.u}</b></div>
      </div>

      <div class="row g-3">
        <div class="col-sm-6">
          <label class="form-label small text-secondary fw-semibold mb-0">${t('product')}</label>
          <div class="fs-6 fw-bold">${L(p.n)}</div>
          <small class="text-secondary">SKU: <code>${m.sku}</code> · Brand: <b>${m.brand}</b></small>
        </div>
        <div class="col-sm-6">
          <label class="form-label small text-secondary fw-semibold mb-0">${isIn ? 'Supplier / Source' : 'Customer / Destination'}</label>
          <div class="fs-6 fw-bold">${m.party}</div>
          <small class="text-secondary">Party Type: <b>${m.partyType || 'Party'}</b></small>
        </div>

        <div class="col-sm-6">
          <label class="form-label small text-secondary fw-semibold mb-0">${isIn ? 'Purchase Reference' : 'Sales Invoice Reference'}</label>
          <div class="fw-bold"><code>${m.ref}</code></div>
        </div>
        <div class="col-sm-6">
          <label class="form-label small text-secondary fw-semibold mb-0">${t('challan_no')}</label>
          <div><span class="badge bg-light text-dark border"><i class="bi bi-truck me-1"></i>${m.challan || '—'}</span></div>
        </div>

        <div class="col-12">
          <div class="p-3 border rounded bg-white">
            <div class="row g-2 text-center">
              <div class="col-3">
                <small class="text-secondary d-block">Previous Stock</small>
                <b>${kg(m.prev)}</b>
              </div>
              <div class="col-3">
                <small class="text-secondary d-block">${isIn ? 'Quantity In (+)' : 'Quantity Out (−)'}</small>
                <b class="${isIn ? 'up' : 'dn'} fs-6">${isIn ? '+' + kg(m.in) : '−' + kg(m.out)}</b>
              </div>
              <div class="col-3">
                <small class="text-secondary d-block">Resulting Stock</small>
                <b class="text-primary fs-6">${kg(m.res)}</b>
              </div>
              <div class="col-3">
                <small class="text-secondary d-block">Inspection</small>
                <span class="badge bg-success-subtle text-success border">Verified Quality</span>
              </div>
            </div>
          </div>
        </div>

        <div class="col-12">
          <label class="form-label small text-secondary fw-semibold mb-0">Remarks / Operational Note</label>
          <div class="p-2 border rounded bg-light small">${m.remarks || 'No remarks recorded.'}</div>
        </div>
      </div>
    `, null, null);
  };
}

function tk2(v) {
  return '৳ ' + Number(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// EXACT REPLICA OF USER UPLOADED PHOTO: 1. Client Summary List
function renderClientSummaryListTable(navHtml) {
  const f = getF();
  if (!f) return '';
  initLedgerData(f);
  const { t, L, D, n } = f;

  const q = (REP_EXT.crCustQ || '').toLowerCase().trim();

  // Exactly matching media_1794818746715_b7347806.jpg
  const clientRowsData = [
    {
      sl: 1,
      client: 'JME Pack',
      clientIdx: D.customers.findIndex(c => c.en === 'JME Pack'),
      phone: '01712-349811',
      deliveries: [
        { time: '12:30 PM', billNo: '40', challanNo: '399', productName: 'BOPP GLOSSY FILM', typeUnit: 'KG', qty: 212.14 },
        { time: '12:30 PM', billNo: '40', challanNo: '404', productName: 'BOPP GLOSSY FILM', typeUnit: 'KG', qty: 94.50 },
        { time: '12:30 PM', billNo: '40', challanNo: '406', productName: 'BOPP GLOSSY FILM', typeUnit: 'KG', qty: 80.65 }
      ],
      openingDue: 1225815.30,
      grossBill: 160725.35,
      billDiscount: 0.00,
      netBill: 160725.35,
      paymentReceived: 0.00,
      paymentMethod: '',
      accountDiscount: 0.00,
      closingDue: 1386540.65
    },
    {
      sl: 2,
      client: 'R.K Printing',
      clientIdx: D.customers.findIndex(c => c.en === 'R.K Printing'),
      phone: '01811-998822',
      deliveries: [
        { time: '12:48 PM', billNo: '47', challanNo: '400', productName: 'BOPP GLOSSY FILM', typeUnit: 'KG', qty: 47.77 }
      ],
      openingDue: 302841.85,
      grossBill: 19824.55,
      billDiscount: 0.00,
      netBill: 19824.55,
      paymentReceived: 30000.00,
      paymentMethod: 'Cash: ৳ 30,000.00',
      accountDiscount: 0.00,
      closingDue: 292666.40
    },
    {
      sl: 3,
      client: 'Rahman Packaging Ltd',
      clientIdx: 0,
      phone: '01711-284501',
      deliveries: [
        { time: '10:15 AM', billNo: '51', challanNo: '398', productName: 'Kraft Paper 120 GSM', typeUnit: 'KG', qty: 3500.00 }
      ],
      openingDue: 1240000.00,
      grossBill: 392000.00,
      billDiscount: 0.00,
      netBill: 392000.00,
      paymentReceived: 350000.00,
      paymentMethod: 'Bank: ৳ 350,000.00',
      accountDiscount: 0.00,
      closingDue: 1282000.00
    },
    {
      sl: 4,
      client: 'Meghna Carton Industries',
      clientIdx: 1,
      phone: '01819-662340',
      deliveries: [
        { time: '11:20 AM', billNo: '52', challanNo: '395', productName: 'Duplex Board 300 GSM', typeUnit: 'KG', qty: 2500.00 }
      ],
      openingDue: 2180000.00,
      grossBill: 247500.00,
      billDiscount: 0.00,
      netBill: 247500.00,
      paymentReceived: 85000.00,
      paymentMethod: 'Cash: ৳ 85,000.00',
      accountDiscount: 0.00,
      closingDue: 2342500.00
    }
  ];

  let filtered = clientRowsData;
  if (q) {
    filtered = filtered.filter(r => {
      const allText = (r.client + ' ' + r.phone + ' ' + r.deliveries.map(d => d.billNo + ' ' + d.challanNo + ' ' + d.productName).join(' ')).toLowerCase();
      return allText.includes(q);
    });
  }

  const totOpeningDue = sum(filtered.map(x => x.openingDue));
  const totGrossBill = sum(filtered.map(x => x.grossBill));
  const totBillDisc = sum(filtered.map(x => x.billDiscount));
  const totNetBill = sum(filtered.map(x => x.netBill));
  const totPaymentRecv = sum(filtered.map(x => x.paymentReceived));
  const totAcDisc = sum(filtered.map(x => x.accountDiscount));
  const totClosingDue = sum(filtered.map(x => x.closingDue));
  const totalDeliveriesCount = sum(filtered.map(x => x.deliveries.length));
  const totalDeliveredQty = sum(filtered.map(x => sum(x.deliveries.map(d => d.qty))));

  const tableRowsHtml = filtered.map((row, idx) => {
    const deliveryCellsHtml = row.deliveries.map(d => `
      <div class="client-delivery-box">
        <div class="client-delivery-time">${d.time}</div>
        <div class="client-delivery-bill">Bill: ${d.billNo} Challan: ${d.challanNo}</div>
        <div class="client-delivery-prod">Product: ${d.productName}</div>
        <div class="client-delivery-qty">Type/Unit: ${d.typeUnit || 'KG'} Qty: <b>${typeof d.qty === 'number' ? d.qty.toFixed(2) : d.qty}</b></div>
      </div>
    `).join('');

    return `
      <tr>
        <td class="text-center fw-bold text-secondary">${n(idx + 1)}</td>
        <td>
          <a href="javascript:void(0)" class="fw-bold text-decoration-none text-dark" data-act="cinvs" data-i="${row.clientIdx >= 0 ? row.clientIdx : 0}">
            <b>${row.client}</b>
          </a>
          <br><small class="text-secondary"><i class="bi bi-telephone me-1"></i>${row.phone}</small>
        </td>
        <td class="delivery-cell">
          ${deliveryCellsHtml}
        </td>
        <td class="r fw-semibold">${tk2(row.openingDue)}</td>
        <td class="r fw-semibold">${tk2(row.grossBill)}</td>
        <td class="r text-secondary">${row.billDiscount > 0 ? '− ' + tk2(row.billDiscount) : '− ৳ 0.00'}</td>
        <td class="r fw-bold">${tk2(row.netBill)}</td>
        <td class="r ${row.paymentReceived > 0 ? 'up fw-bold' : ''}">
          ${tk2(row.paymentReceived)}
          ${row.paymentMethod ? `<br><small class="text-secondary fw-normal">${row.paymentMethod}</small>` : ''}
        </td>
        <td class="r text-secondary">${row.accountDiscount > 0 ? '− ' + tk2(row.accountDiscount) : '− ৳ 0.00'}</td>
        <td class="r dn fw-bold fs-6">${tk2(row.closingDue)}</td>
      </tr>
    `;
  }).join('');

  return `
    ${navHtml || ''}
    <div class="card mb-3 border shadow-sm">
      <div class="card-body p-3">
        <div class="d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div class="d-flex align-items-center gap-2 flex-grow-1" style="max-width: 420px">
            <div class="input-group input-group-sm">
              <span class="input-group-text"><i class="bi bi-search"></i></span>
              <input type="text" class="form-control" data-in="crcustq" value="${REP_EXT.crCustQ || ''}" placeholder="Search client, bill, challan, product..." aria-label="Search client summary">
              ${REP_EXT.crCustQ ? `<button class="btn btn-outline-secondary" data-act="crcustqclear"><i class="bi bi-x"></i></button>` : ''}
            </div>
          </div>
          <div class="d-flex align-items-center gap-2">
            <span class="badge bg-secondary-subtle text-secondary border px-2 py-1"><i class="bi bi-file-earmark-check me-1"></i>1. Client Summary List</span>
            <button class="btn btn-sm btn-outline-primary" data-act="clientsumcsv"><i class="bi bi-file-earmark-excel me-1"></i>Excel / CSV</button>
            <button class="btn btn-sm btn-primary" data-act="clientsumprint"><i class="bi bi-printer me-1"></i>${t('print')}</button>
          </div>
        </div>
      </div>
    </div>

    <div class="strip mb-3">
      <div><span>Total Clients</span><b class="text-primary">${n(filtered.length)}</b></div>
      <div><span>${t('gross_bill') || 'Gross Bill'}</span><b>${tk2(totGrossBill)}</b></div>
      <div><span>${t('net_bill') || 'Net Bill'}</span><b>${tk2(totNetBill)}</b></div>
      <div><span>${t('paid') || 'Payment Received'}</span><b class="up">${tk2(totPaymentRecv)}</b></div>
      <div><span>${t('closing_due') || 'Closing Due'}</span><b class="dn">${tk2(totClosingDue)}</b></div>
    </div>

    <div class="d-flex justify-content-between align-items-center mb-2 px-1">
      <h5 class="fw-bold mb-0 text-dark">1. Client Summary List</h5>
      <span class="badge bg-light text-secondary border">Statement Replica</span>
    </div>

    <div class="tw border rounded shadow-sm">
      <table class="client-summary-tbl mb-0" id="rtbl">
        <thead>
          <tr>
            <th style="width: 45px" class="text-center">SL</th>
            <th style="width: 150px">Client</th>
            <th>All Bill / Challan / Product / Type / Unit</th>
            <th class="r">Opening Due</th>
            <th class="r">Gross Bill</th>
            <th class="r">Bill Discount</th>
            <th class="r">Net Bill</th>
            <th class="r">Payment Received / Method</th>
            <th class="r">Account Discount</th>
            <th class="r">Closing Due</th>
          </tr>
        </thead>
        <tbody>
          ${tableRowsHtml || `<tr><td colspan="10" class="text-center py-4 text-muted">${t('empty')}</td></tr>`}
          <tr class="ft">
            <td></td>
            <td><b>Total:</b></td>
            <td><small class="text-secondary">${n(totalDeliveriesCount)} Deliveries · ${totalDeliveredQty.toFixed(2)} KG</small></td>
            <td class="r">${tk2(totOpeningDue)}</td>
            <td class="r">${tk2(totGrossBill)}</td>
            <td class="r">${totBillDisc > 0 ? '− ' + tk2(totBillDisc) : '− ৳ 0.00'}</td>
            <td class="r">${tk2(totNetBill)}</td>
            <td class="r up">${tk2(totPaymentRecv)}</td>
            <td class="r">${totAcDisc > 0 ? '− ' + tk2(totAcDisc) : '− ৳ 0.00'}</td>
            <td class="r dn fw-bold">${tk2(totClosingDue)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
}

// 3. COMPANY-WISE DETAILED SALES REPORT (Req 3)
function renderCompanyWiseSalesReport() {
  const f = getF();
  if (!f) return '';
  initLedgerData(f);
  const { t, L, D, n, tk, short } = f;

  // View Mode: company (primary) or client_list (exact photo replica) or product
  if (REP_EXT.saleView === 'client_list') {
    return `
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <div class="seg">
          <button class="${REP_EXT.saleView==='company'?'on':''}" data-act="saleviewtab" data-v="company"><i class="bi bi-building me-1"></i>${t('company_sales_report') || 'Company-Wise Sales Report'}</button>
          <button class="${REP_EXT.saleView==='client_list'?'on':''}" data-act="saleviewtab" data-v="client_list"><i class="bi bi-card-checklist me-1"></i>${t('client_summary_list') || '1. Client Summary List'}</button>
          <button class="${REP_EXT.saleView==='product'?'on':''}" data-act="saleviewtab" data-v="product"><i class="bi bi-boxes me-1"></i>Product Sales Summary</button>
        </div>
      </div>
      ${renderClientSummaryListTable('')}
    `;
  }

  const activeDate = window.UI.getActiveDateRange ? window.UI.getActiveDateRange() : { start: 0, end: Infinity };

  // Prepare detailed company dataset
  const companiesData = [
    {
      idx: D.customers.findIndex(c => c.en === 'JME Pack'),
      name: 'JME Pack',
      phone: '01712-349811',
      creditLimit: 3500000,
      due: 1386540.65,
      lastPurchaseDate: '16 Nov 2026',
      invoices: [
        {
          invNo: 'INV-2026-1185',
          challanNo: 'CH-399, CH-404, CH-406',
          date: '16 Nov 2026',
          ts: Date.now() - 7200000,
          status: 'due',
          paid: 0,
          total: 160725.35,
          lines: [
            { name: 'BOPP GLOSSY FILM', sku: 'PK-104', brand: 'Prime Film Co', qty: 212.14, unit: 'KG', price: 208, discount: 0, total: 44125.12 },
            { name: 'BOPP GLOSSY FILM', sku: 'PK-104', brand: 'Prime Film Co', qty: 94.50, unit: 'KG', price: 208, discount: 0, total: 19656.00 },
            { name: 'BOPP GLOSSY FILM', sku: 'PK-104', brand: 'Prime Film Co', qty: 80.65, unit: 'KG', price: 208, discount: 0, total: 16775.20 },
            { name: 'White Top Liner 150 GSM', sku: 'PK-103', brand: 'Nordic Liner', qty: 621.46, unit: 'KG', price: 129, discount: 0, total: 80169.03 }
          ]
        },
        {
          invNo: 'INV-2026-1178',
          challanNo: 'CH-372',
          date: '02 Nov 2026',
          ts: Date.now() - 86400000 * 14,
          status: 'paid',
          paid: 336000.00,
          total: 336000.00,
          lines: [
            { name: 'Kraft Paper 120 GSM', sku: 'PK-101', brand: 'Global Kraft', qty: 3000, unit: 'KG', price: 112, discount: 0, total: 336000.00 }
          ]
        }
      ]
    },
    {
      idx: D.customers.findIndex(c => c.en === 'R.K Printing'),
      name: 'R.K Printing',
      phone: '01811-998822',
      creditLimit: 2000000,
      due: 292666.40,
      lastPurchaseDate: '16 Nov 2026',
      invoices: [
        {
          invNo: 'INV-2026-1186',
          challanNo: 'CH-400',
          date: '16 Nov 2026',
          ts: Date.now() - 5400000,
          status: 'partial',
          paid: 30000.00,
          total: 19824.55,
          lines: [
            { name: 'BOPP GLOSSY FILM', sku: 'PK-104', brand: 'Prime Film Co', qty: 47.77, unit: 'KG', price: 208, discount: 0, total: 9936.16 },
            { name: 'Duplex Board 300 GSM', sku: 'PK-102', brand: 'Eagle Board', qty: 100.00, unit: 'KG', price: 99, discount: 11.61, total: 9888.39 }
          ]
        }
      ]
    },
    {
      idx: 0,
      name: 'Rahman Packaging Ltd',
      phone: '01711-284501',
      creditLimit: 3000000,
      due: 1240000.00,
      lastPurchaseDate: '15 Nov 2026',
      invoices: [
        {
          invNo: 'INV-2026-1184',
          challanNo: 'CH-398',
          date: '15 Nov 2026',
          ts: Date.now() - 86400000 * 1,
          status: 'paid',
          paid: 486500.00,
          total: 486500.00,
          lines: [
            { name: 'Kraft Paper 120 GSM', sku: 'PK-101', brand: 'Global Kraft', qty: 4343.75, unit: 'KG', price: 112, discount: 0, total: 486500.00 }
          ]
        },
        {
          invNo: 'INV-2026-1175',
          challanNo: 'CH-360',
          date: '24 Oct 2026',
          ts: Date.now() - 86400000 * 23,
          status: 'paid',
          paid: 350000.00,
          total: 350000.00,
          lines: [
            { name: 'White Top Liner 150 GSM', sku: 'PK-103', brand: 'Nordic Liner', qty: 2713.18, unit: 'KG', price: 129, discount: 0, total: 350000.00 }
          ]
        }
      ]
    },
    {
      idx: 1,
      name: 'Meghna Carton Industries',
      phone: '01819-662340',
      creditLimit: 2500000,
      due: 2180000.00,
      lastPurchaseDate: '11 Nov 2026',
      invoices: [
        {
          invNo: 'INV-2026-1183',
          challanNo: 'CH-395',
          date: '11 Nov 2026',
          ts: Date.now() - 86400000 * 5,
          status: 'partial',
          paid: 300000.00,
          total: 628000.00,
          lines: [
            { name: 'Duplex Board 300 GSM', sku: 'PK-102', brand: 'Eagle Board', qty: 6343.43, unit: 'KG', price: 99, discount: 0, total: 628000.00 }
          ]
        }
      ]
    },
    {
      idx: 2,
      name: 'Alif Plastic',
      phone: '01912-557781',
      creditLimit: 1500000,
      due: 640000.00,
      lastPurchaseDate: '08 Nov 2026',
      invoices: [
        {
          invNo: 'INV-2026-1182',
          challanNo: 'CH-391',
          date: '08 Nov 2026',
          ts: Date.now() - 86400000 * 8,
          status: 'due',
          paid: 0.00,
          total: 342000.00,
          lines: [
            { name: 'Stretch Film 23 Micron', sku: 'PK-106', brand: 'Prime Film Co', qty: 1809.52, unit: 'KG', price: 189, discount: 0, total: 342000.00 }
          ]
        }
      ]
    },
    {
      idx: 3,
      name: 'New Dhaka Printing Press',
      phone: '01678-300912',
      creditLimit: 1200000,
      due: 910000.00,
      lastPurchaseDate: '04 Nov 2026',
      invoices: [
        {
          invNo: 'INV-2026-1181',
          challanNo: 'CH-388',
          date: '04 Nov 2026',
          ts: Date.now() - 86400000 * 12,
          status: 'paid',
          paid: 215500.00,
          total: 215500.00,
          lines: [
            { name: 'Corrugated Medium 100 GSM', sku: 'PK-105', brand: 'Apex Fluting', qty: 2505.81, unit: 'KG', price: 86, discount: 0, total: 215500.00 }
          ]
        }
      ]
    },
    {
      idx: 4,
      name: 'Bashundhara Poly',
      phone: '01555-421098',
      creditLimit: 2000000,
      due: 0.00,
      lastPurchaseDate: '28 Oct 2026',
      invoices: [
        {
          invNo: 'INV-2026-1180',
          challanNo: 'CH-385',
          date: '28 Oct 2026',
          ts: Date.now() - 86400000 * 19,
          status: 'paid',
          paid: 512000.00,
          total: 512000.00,
          lines: [
            { name: 'LDPE Granules', sku: 'PK-107', brand: 'Poly Petrochem', qty: 3506.85, unit: 'KG', price: 146, discount: 0, total: 512000.00 }
          ]
        }
      ]
    }
  ];

  // Filtering
  let filteredCompanies = companiesData.map(co => {
    let invs = co.invoices.filter(inv => {
      if (activeDate.start && inv.ts < activeDate.start) return false;
      if (activeDate.end && inv.ts > activeDate.end) return false;
      if (REP_EXT.saleStatus !== 'all' && inv.status !== REP_EXT.saleStatus) return false;
      if (REP_EXT.saleInvNo && !inv.invNo.toLowerCase().includes(REP_EXT.saleInvNo.toLowerCase().trim())) return false;
      if (REP_EXT.saleChallan && !inv.challanNo.toLowerCase().includes(REP_EXT.saleChallan.toLowerCase().trim())) return false;
      if (REP_EXT.saleProd !== 'all') {
        const hasProd = inv.lines.some(l => l.name.toLowerCase().includes(REP_EXT.saleProd.toLowerCase()));
        if (!hasProd) return false;
      }
      if (REP_EXT.saleBrand !== 'all') {
        const hasBrand = inv.lines.some(l => l.brand.toLowerCase().includes(REP_EXT.saleBrand.toLowerCase()));
        if (!hasBrand) return false;
      }
      return true;
    });

    if (REP_EXT.saleCompany !== 'all' && co.name !== REP_EXT.saleCompany) {
      return null;
    }

    const totalQty = sum(invs.map(i => sum(i.lines.map(l => l.qty))));
    const totalSales = sum(invs.map(i => i.total));
    const totalPaid = sum(invs.map(i => i.paid));
    const allProdNames = new Set(invs.flatMap(i => i.lines.map(l => l.name)));

    return {
      ...co,
      filteredInvoices: invs,
      numInvoices: invs.length,
      distinctProdsCount: allProdNames.size,
      totalQtyPurchased: totalQty,
      totalSalesAmount: totalSales,
      totalPaidAmount: totalPaid
    };
  }).filter(Boolean);

  if (activeDate.start > 0 || REP_EXT.saleStatus !== 'all' || REP_EXT.saleInvNo || REP_EXT.saleChallan || REP_EXT.saleProd !== 'all' || REP_EXT.saleBrand !== 'all') {
    filteredCompanies = filteredCompanies.filter(co => co.numInvoices > 0);
  }

  // Summary Metrics
  const totCoCount = filteredCompanies.length;
  const totInvsCount = sum(filteredCompanies.map(c => c.numInvoices));
  const totQty = sum(filteredCompanies.map(c => c.totalQtyPurchased));
  const totSalesAmt = sum(filteredCompanies.map(c => c.totalSalesAmount));
  const totPaidAmt = sum(filteredCompanies.map(c => c.totalPaidAmount));
  const totDueAmt = sum(filteredCompanies.map(c => c.due));

  // Options
  const companyOptions = [['all', t('all_companies') || 'All Companies'], ...companiesData.map(c => [c.name, c.name])];
  const prodOptions = [['all', t('all_products')], ...D.products.map(p => [p.n.en, L(p.n)])];
  const brandOptions = [['all', t('all_brands') || 'All Brands'], ['Prime Film Co', 'Prime Film Co'], ['Global Kraft', 'Global Kraft'], ['Eagle Board', 'Eagle Board'], ['Nordic Liner', 'Nordic Liner'], ['Apex Fluting', 'Apex Fluting'], ['Poly Petrochem', 'Poly Petrochem']];

  const statusBadge = (s) => {
    if (s === 'paid') return `<span class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">${t('inv_status_paid')}</span>`;
    if (s === 'partial') return `<span class="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle px-2 py-1">${t('inv_status_partial')}</span>`;
    return `<span class="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1">${t('inv_status_due')}</span>`;
  };

  // Render Table Rows with Expandable Accordions
  const tableRowsHtml = filteredCompanies.map(co => {
    const isExpanded = !!REP_EXT.expandedCompanies[co.name];
    const invoicesTableHtml = co.filteredInvoices.map(inv => {
      const lineRows = inv.lines.map(l => `
        <tr>
          <td><b>${l.name}</b></td>
          <td><code>${l.sku}</code></td>
          <td><span class="badge bg-secondary-subtle text-secondary border">${l.brand}</span></td>
          <td class="r">${l.qty.toFixed(2)} ${l.unit}</td>
          <td class="r">${tk(l.price)}</td>
          <td class="r text-secondary">${l.discount > 0 ? tk(l.discount) : '—'}</td>
          <td class="r fw-bold">${tk(l.total)}</td>
        </tr>
      `).join('');

      return `
        <div class="card mb-2 border shadow-none bg-light">
          <div class="card-header bg-white py-2 px-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div class="d-flex align-items-center gap-2 flex-wrap">
              <span class="fw-bold text-primary"><i class="bi bi-receipt me-1"></i>${inv.invNo}</span>
              <span class="badge bg-light text-dark border"><i class="bi bi-truck me-1"></i>Challan: <b>${inv.challanNo}</b></span>
              <span class="text-secondary small"><i class="bi bi-calendar3 me-1"></i>${inv.date}</span>
              ${statusBadge(inv.status)}
            </div>
            <div class="d-flex align-items-center gap-3">
              <span class="small text-secondary">${t('total')}: <b class="text-dark">${tk(inv.total)}</b></span>
              <span class="small text-secondary">${t('paid')}: <b class="up">${tk(inv.paid)}</b></span>
            </div>
          </div>
          <div class="card-body p-2">
            <div class="tw border rounded bg-white">
              <table class="tbl mb-0" style="font-size:12px">
                <thead>
                  <tr>
                    <th>${t('product')}</th>
                    <th>SKU / Part No</th>
                    <th>Brand</th>
                    <th class="r">${t('qty_kg')}</th>
                    <th class="r">Unit Price</th>
                    <th class="r">Discount</th>
                    <th class="r">Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${lineRows}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    }).join('');

    return `
      <tr class="comp-row" data-act="saletoggleco" data-co="${co.name}">
        <td>
          <div class="d-flex align-items-center gap-2">
            <button class="comp-expand-btn ${isExpanded ? 'open' : ''}" data-act="saletoggleco" data-co="${co.name}" title="Toggle Details">
              <i class="bi bi-chevron-right"></i>
            </button>
            <div>
              <b class="fs-6 text-primary">${co.name}</b>
              <br><small class="text-secondary"><i class="bi bi-telephone me-1"></i>${co.phone} · Limit: ${short(co.creditLimit)}</small>
            </div>
          </div>
        </td>
        <td class="r fw-bold fs-6">${n(co.numInvoices)}</td>
        <td class="r">${n(co.distinctProdsCount)} items</td>
        <td class="r fw-semibold">${co.totalQtyPurchased.toFixed(2)} KG</td>
        <td class="r fw-bold text-dark">${tk(co.totalSalesAmount)}</td>
        <td class="r up fw-bold">${tk(co.totalPaidAmount)}</td>
        <td class="r dn fw-bold">${tk(co.due)}</td>
        <td><small class="text-secondary"><i class="bi bi-clock-history me-1"></i>${co.lastPurchaseDate}</small></td>
        <td class="r">
          <button class="btn btn-sm btn-outline-primary py-0 px-2" data-act="saletoggleco" data-co="${co.name}">
            <i class="bi bi-${isExpanded ? 'chevron-up' : 'chevron-down'} me-1"></i>${isExpanded ? 'Hide' : 'Details'}
          </button>
        </td>
      </tr>
      ${isExpanded ? `
        <tr class="table-active">
          <td colspan="9" class="p-3 bg-white">
            <div class="p-3 rounded border" style="background:var(--surface-2)">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h6 class="fw-bold mb-0 text-primary"><i class="bi bi-folder2-open me-2"></i>${co.name} – Purchase & Invoice Breakdown</h6>
                <span class="badge bg-secondary-subtle text-secondary border">${n(co.filteredInvoices.length)} Invoices Found</span>
              </div>
              ${invoicesTableHtml || `<div class="text-muted text-center py-3">No invoices match selected criteria</div>`}
            </div>
          </td>
        </tr>
      ` : ''}
    `;
  }).join('');

  return `
    <!-- Top View Switcher -->
    <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
      <div class="seg">
        <button class="${REP_EXT.saleView==='company'?'on':''}" data-act="saleviewtab" data-v="company"><i class="bi bi-building me-1"></i>Company-Wise Sales Report</button>
        <button class="${REP_EXT.saleView==='client_list'?'on':''}" data-act="saleviewtab" data-v="client_list"><i class="bi bi-card-checklist me-1"></i>1. Client Summary List (Photo Replica)</button>
        <button class="${REP_EXT.saleView==='product'?'on':''}" data-act="saleviewtab" data-v="product"><i class="bi bi-boxes me-1"></i>Product Sales Summary</button>
      </div>
      <div class="d-flex gap-2">
        <button class="btn btn-sm btn-outline-primary" data-act="saleexpcsv"><i class="bi bi-file-earmark-excel me-1"></i>Excel / CSV</button>
        <button class="btn btn-sm btn-outline-secondary" data-act="rprint"><i class="bi bi-printer me-1"></i>${t('print')}</button>
      </div>
    </div>

    <!-- Summary Figures Cards -->
    <div class="strip mb-3" style="grid-template-columns: repeat(auto-fit, minmax(130px, 1fr))">
      <div><span>${t('company_name') || 'Companies'}</span><b class="text-primary">${n(totCoCount)}</b></div>
      <div><span>${t('num_invoices') || 'Invoices'}</span><b>${n(totInvsCount)}</b></div>
      <div><span>${t('total_qty') || 'Quantity'}</span><b>${totQty.toFixed(1)} KG</b></div>
      <div><span>${t('total_sales') || 'Total Sales'}</span><b class="text-dark">${short(totSalesAmt)}</b></div>
      <div><span>${t('total_paid') || 'Total Paid'}</span><b class="up">${short(totPaidAmt)}</b></div>
      <div><span>${t('outstanding_due') || 'Total Due'}</span><b class="dn">${short(totDueAmt)}</b></div>
    </div>

    <!-- Filters Bar -->
    <div class="card mb-3 border shadow-sm">
      <div class="card-body p-3">
        <div class="row g-2 align-items-center">
          <div class="col-md-3 col-sm-6">
            <label class="form-label small fw-semibold text-secondary mb-1">${t('company_name')}</label>
            <select class="form-select form-select-sm" data-in="salecompany">
              ${opts(companyOptions, REP_EXT.saleCompany)}
            </select>
          </div>
          <div class="col-md-2 col-sm-6">
            <label class="form-label small fw-semibold text-secondary mb-1">${t('inv_no')}</label>
            <input type="text" class="form-control form-control-sm" data-in="saleinvno" value="${REP_EXT.saleInvNo}" placeholder="INV-2026-...">
          </div>
          <div class="col-md-2 col-sm-6">
            <label class="form-label small fw-semibold text-secondary mb-1">${t('challan_no')}</label>
            <input type="text" class="form-control form-control-sm" data-in="salechallan" value="${REP_EXT.saleChallan}" placeholder="CH-...">
          </div>
          <div class="col-md-2 col-sm-6">
            <label class="form-label small fw-semibold text-secondary mb-1">${t('product')}</label>
            <select class="form-select form-select-sm" data-in="saleprod">
              ${opts(prodOptions, REP_EXT.saleProd)}
            </select>
          </div>
          <div class="col-md-2 col-sm-6">
            <label class="form-label small fw-semibold text-secondary mb-1">Brand</label>
            <select class="form-select form-select-sm" data-in="salebrand">
              ${opts(brandOptions, REP_EXT.saleBrand)}
            </select>
          </div>
          <div class="col-md-1 col-sm-6">
            <label class="form-label small fw-semibold text-secondary mb-1">${t('status')}</label>
            <select class="form-select form-select-sm" data-in="salestatus">
              ${opts([['all', 'All'], ['paid', 'Paid'], ['partial', 'Partial'], ['due', 'Due']], REP_EXT.saleStatus)}
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Company-Wise Master Table -->
    <div class="tw border rounded shadow-sm">
      <table class="tbl mb-0" id="rtbl">
        <thead>
          <tr>
            <th>${t('company_name')}</th>
            <th class="r">${t('num_invoices')}</th>
            <th class="r">${t('total_prods')}</th>
            <th class="r">${t('total_qty')}</th>
            <th class="r">${t('total_sales')}</th>
            <th class="r">${t('total_paid')}</th>
            <th class="r">${t('outstanding_due')}</th>
            <th>${t('last_purchase_date')}</th>
            <th class="r">Drill-Down</th>
          </tr>
        </thead>
        <tbody>
          ${tableRowsHtml || `
            <tr>
              <td colspan="9" class="text-center py-5 text-secondary">
                <i class="bi bi-inbox fs-2 d-block mb-2 text-muted"></i>
                <b>${t('no_data_in_period')}</b>
                <p class="small text-secondary mb-2">${t('no_data_period_sub')}</p>
                <button class="btn btn-sm btn-outline-primary" data-act="rresetdate"><i class="bi bi-arrow-counterclockwise me-1"></i>${t('reset_filter')}</button>
              </td>
            </tr>
          `}
          ${filteredCompanies.length ? `
            <tr class="fw-bold ft">
              <td>Total (${n(totCoCount)} Companies):</td>
              <td class="r">${n(totInvsCount)}</td>
              <td class="r">—</td>
              <td class="r">${totQty.toFixed(1)} KG</td>
              <td class="r">${tk(totSalesAmt)}</td>
              <td class="r up">${tk(totPaidAmt)}</td>
              <td class="r dn">${tk(totDueAmt)}</td>
              <td colspan="2"></td>
            </tr>
          ` : ''}
        </tbody>
      </table>
    </div>
  `;
}

// 4. DETAILED STOCK MOVEMENT (IN/OUT) REPORT (Req 4)
function renderStockMovementDetailedReport(navHtml) {
  const f = getF();
  if (!f) return '';
  initLedgerData(f);
  const { t, L, D, n, tk, kg } = f;

  const activeDate = window.UI.getActiveDateRange ? window.UI.getActiveDateRange() : { start: 0, end: Infinity };
  const prods = D.products || [];
  let moves = D.stockMovements || [];

  // Filtering
  moves = moves.filter(m => {
    if (activeDate.start && m.ts < activeDate.start) return false;
    if (activeDate.end && m.ts > activeDate.end) return false;
    if (REP_EXT.stockType !== 'all' && m.ty !== REP_EXT.stockType) return false;
    if (REP_EXT.stockProd !== 'all' && m.p !== +REP_EXT.stockProd) return false;
    if (REP_EXT.stockSku && !m.sku.toLowerCase().includes(REP_EXT.stockSku.toLowerCase().trim())) return false;
    if (REP_EXT.stockBrand !== 'all' && !m.brand.toLowerCase().includes(REP_EXT.stockBrand.toLowerCase())) return false;
    if (REP_EXT.stockRef && !m.ref.toLowerCase().includes(REP_EXT.stockRef.toLowerCase().trim())) return false;
    if (REP_EXT.stockChallan && !m.challan.toLowerCase().includes(REP_EXT.stockChallan.toLowerCase().trim())) return false;
    return true;
  });

  // Formula: Closing Stock = Opening Stock + Total Stock In − Total Stock Out
  const baselineOpening = 50000;
  const totIn = sum(moves.map(m => m.in || 0));
  const totOut = sum(moves.map(m => m.out || 0));
  const openingStock = baselineOpening;
  const closingStock = openingStock + totIn - totOut;

  // Render Table Rows with all 13 columns
  const tableRowsHtml = moves.map(m => {
    const p = prods[m.p] || { n: { bn: 'পণ্য', en: 'Product' } };
    const isIn = m.ty === 'Stock In';
    return `
      <tr>
        <td><small class="text-secondary"><i class="bi bi-clock me-1"></i>${m.dt}</small></td>
        <td><code>${m.ref}</code></td>
        <td><span class="badge bg-light text-dark border"><i class="bi bi-truck me-1"></i>${m.challan || '—'}</span></td>
        <td><b>${L(p.n)}</b></td>
        <td><code>${m.sku}</code></td>
        <td><span class="badge bg-secondary-subtle text-secondary border">${m.brand}</span></td>
        <td>
          <span class="${isIn ? 'badge-stock-in' : 'badge-stock-out'}">
            <i class="bi bi-${isIn ? 'box-arrow-in-down' : 'box-arrow-up'}"></i>
            ${m.ty}
          </span>
        </td>
        <td class="r up fw-bold">${m.in > 0 ? '+' + kg(m.in) : '—'}</td>
        <td class="r dn fw-bold">${m.out > 0 ? '−' + kg(m.out) : '—'}</td>
        <td class="r text-secondary">${kg(m.prev)}</td>
        <td class="r text-primary fw-bold">${kg(m.res)}</td>
        <td>
          <b>${m.party}</b>
          <br><small class="text-secondary">${m.partyType === 'supplier' ? 'Supplier' : 'Customer'}</small>
        </td>
        <td><small class="text-secondary">${m.remarks || '—'}</small></td>
        <td class="r">
          <button class="btn btn-sm btn-outline-primary py-0 px-2" data-act="mvmtdetail" data-id="${m.id}" title="View Details">
            <i class="bi bi-eye"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');

  // Setup Comparison Chart
  setTimeout(() => {
    const canvas = document.getElementById('stockMvmtChart');
    if (!canvas || typeof Chart === 'undefined') return;
    if (window._stockChartInst) {
      try { window._stockChartInst.destroy(); } catch (_) {}
    }
    const ctx = canvas.getContext('2d');
    window._stockChartInst = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Overall Movement', 'BOPP Film', 'Kraft Paper', 'Duplex Board'],
        datasets: [
          {
            label: 'Total Stock In (+ KG)',
            data: [totIn, 3200, 5000, 0],
            backgroundColor: 'rgba(10, 122, 80, 0.75)',
            borderColor: '#0a7a50',
            borderWidth: 1
          },
          {
            label: 'Total Stock Out (− KG)',
            data: [totOut, 435.06, 3500, 2500],
            backgroundColor: 'rgba(198, 47, 58, 0.75)',
            borderColor: '#c62f3a',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' },
          tooltip: {
            callbacks: {
              label: ctx => ctx.dataset.label + ': ' + ctx.parsed.y.toLocaleString() + ' KG'
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: v => v.toLocaleString() + ' KG'
            }
          }
        }
      }
    });
  }, 100);

  const brandOptions = [['all', 'All Brands'], ['Prime Film Co', 'Prime Film Co'], ['Global Kraft', 'Global Kraft'], ['Eagle Board', 'Eagle Board'], ['Nordic Liner', 'Nordic Liner'], ['Apex Fluting', 'Apex Fluting']];

  return `
    ${navHtml || ''}
    <!-- KPI Summary Cards with strict calculation Closing = Opening + In - Out -->
    <div class="stock-kpi-grid">
      <div class="stock-kpi-card opening">
        <div class="ic"><i class="bi bi-boxes"></i></div>
        <div>
          <small class="text-secondary d-block">${t('opening_stock')}</small>
          <b class="fs-5">${kg(openingStock)}</b>
        </div>
      </div>
      <div class="stock-kpi-card in">
        <div class="ic"><i class="bi bi-box-arrow-in-down"></i></div>
        <div>
          <small class="text-secondary d-block">${t('total_stock_in')}</small>
          <b class="fs-5 up">+${kg(totIn)}</b>
        </div>
      </div>
      <div class="stock-kpi-card out">
        <div class="ic"><i class="bi bi-box-arrow-up"></i></div>
        <div>
          <small class="text-secondary d-block">${t('total_stock_out')}</small>
          <b class="fs-5 dn">−${kg(totOut)}</b>
        </div>
      </div>
      <div class="stock-kpi-card closing">
        <div class="ic"><i class="bi bi-check2-circle"></i></div>
        <div>
          <small class="text-secondary d-block">${t('closing_stock')}</small>
          <b class="fs-5 text-primary">${kg(closingStock)}</b>
          <small class="text-muted d-block" style="font-size:10.5px">Formula: ${t('closing_stock_formula')}</small>
        </div>
      </div>
    </div>

    <!-- Stock In vs Stock Out Comparison Chart -->
    <div class="card mb-3 p-3 border shadow-sm">
      <div class="d-flex justify-content-between align-items-center mb-2">
        <h6 class="fw-bold mb-0 text-primary"><i class="bi bi-bar-chart-line me-2"></i>${t('stock_in_vs_out')}</h6>
        <span class="badge bg-secondary-subtle text-secondary border">Closing = Opening + In − Out</span>
      </div>
      <div style="height: 180px">
        <canvas id="stockMvmtChart"></canvas>
      </div>
    </div>

    <!-- Filters Bar -->
    <div class="card mb-3 border shadow-sm">
      <div class="card-body p-3">
        <div class="row g-2 align-items-center">
          <div class="col-md-2 col-sm-6">
            <label class="form-label small fw-semibold text-secondary mb-1">${t('movement_type')}</label>
            <select class="form-select form-select-sm" data-in="stocktype">
              <option value="all" ${REP_EXT.stockType==='all'?'selected':''}>All Movements</option>
              <option value="Stock In" ${REP_EXT.stockType==='Stock In'?'selected':''}>Stock In (+)</option>
              <option value="Stock Out" ${REP_EXT.stockType==='Stock Out'?'selected':''}>Stock Out (−)</option>
            </select>
          </div>
          <div class="col-md-2 col-sm-6">
            <label class="form-label small fw-semibold text-secondary mb-1">${t('product')}</label>
            <select class="form-select form-select-sm" data-in="stockprod">
              <option value="all" ${REP_EXT.stockProd==='all'?'selected':''}>${t('all_products')}</option>
              ${opts(prods.map((p, i) => [i, L(p.n)]), REP_EXT.stockProd)}
            </select>
          </div>
          <div class="col-md-2 col-sm-6">
            <label class="form-label small fw-semibold text-secondary mb-1">SKU / Part No</label>
            <input type="text" class="form-control form-control-sm" data-in="stocksku" value="${REP_EXT.stockSku}" placeholder="PK-...">
          </div>
          <div class="col-md-2 col-sm-6">
            <label class="form-label small fw-semibold text-secondary mb-1">Brand</label>
            <select class="form-select form-select-sm" data-in="stockbrand">
              ${opts(brandOptions, REP_EXT.stockBrand)}
            </select>
          </div>
          <div class="col-md-2 col-sm-6">
            <label class="form-label small fw-semibold text-secondary mb-1">Reference No</label>
            <input type="text" class="form-control form-control-sm" data-in="stockref" value="${REP_EXT.stockRef}" placeholder="INV / PO / SH...">
          </div>
          <div class="col-md-2 col-sm-6">
            <label class="form-label small fw-semibold text-secondary mb-1">${t('challan_no')}</label>
            <input type="text" class="form-control form-control-sm" data-in="stockchallan" value="${REP_EXT.stockChallan}" placeholder="CH-...">
          </div>
        </div>
      </div>
    </div>

    <!-- 13 Columns Main Stock Movement Table -->
    <div class="tw border rounded shadow-sm">
      <table class="tbl mb-0" id="rtbl" style="font-size:12px">
        <thead>
          <tr>
            <th>Date & Time</th>
            <th>Reference No</th>
            <th>Challan No</th>
            <th>${t('product')}</th>
            <th>SKU / Part No</th>
            <th>Brand</th>
            <th>Movement Type</th>
            <th class="r">Quantity In (+)</th>
            <th class="r">Quantity Out (−)</th>
            <th class="r">Previous Stock</th>
            <th class="r">Current Stock</th>
            <th>Supplier / Customer</th>
            <th>Remarks</th>
            <th class="r">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${tableRowsHtml || `
            <tr>
              <td colspan="14" class="text-center py-5 text-secondary">
                <i class="bi bi-inbox fs-2 d-block mb-2 text-muted"></i>
                <b>No stock movements match the selected filters</b>
                <p class="small text-secondary mb-2">${t('no_data_period_sub')}</p>
                <button class="btn btn-sm btn-outline-primary" data-act="rresetdate"><i class="bi bi-arrow-counterclockwise me-1"></i>${t('reset_filter')}</button>
              </td>
            </tr>
          `}
          ${moves.length ? `
            <tr class="fw-bold ft">
              <td colspan="7">Total (${n(moves.length)} Movements):</td>
              <td class="r up">+${kg(totIn)}</td>
              <td class="r dn">−${kg(totOut)}</td>
              <td colspan="5"></td>
            </tr>
          ` : ''}
        </tbody>
      </table>
    </div>
  `;
}

// Override report table renderer for new report types
window.UI.customReportRenderer = (code, dayIndex) => {
  if (code === 'sales') return renderCompanyWiseSalesReport();
  if (code === 'cust') {
    if (REP_EXT.custView === 'simple') return null;
    return `
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <div class="seg">
          <button class="${REP_EXT.custView !== 'simple' ? 'on' : ''}" data-act="custviewtab" data-v="summary"><i class="bi bi-card-checklist me-1"></i>${(window.UI?.t && window.UI.t('client_summary_list')) || '1. Client Summary List'}</button>
          <button class="${REP_EXT.custView === 'simple' ? 'on' : ''}" data-act="custviewtab" data-v="simple"><i class="bi bi-people me-1"></i>${(window.UI?.t && window.UI.t('rc_cust')) || 'Customer Dues'}</button>
        </div>
      </div>
      ${renderClientSummaryListTable('')}
    `;
  }
  if (code === 'stockledger') return renderStockMovementDetailedReport('');
  if (code === 'exprep') return renderExpenseReportTable();
  if (code === 'purchrep') return renderPurchaseReportTable();
  if (code === 'dclose' || code === 'closingrep') return renderClosingReportWithWeightAndTaka(dayIndex || 0);
  if (code === 'supledger') return renderSupplierLedgerTable();
  if (code === 'custledger') return renderCustomerLedgerTable();
  if (code === 'partyprices') return renderPartyPriceHistoryTable();
  return null;
};
window.UI.renderClientSummaryListTable = renderClientSummaryListTable;

hookReportsSystem();
})();
