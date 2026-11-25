/* Phase 14 / Part 1:
   - Party Price Memory & Registry (Req 11)
   - Invoice Last Payment & Sales History with 1-Click Rate Apply (Req 9)
   - VAT ON/OFF Management System (Req 10)
   - Purchase Module Amount Display & Purchase Recording (Req 1)
*/
(()=>{
const U = window.UI, { modal, field, bad, opts, bd, sum, $, ACT, IN } = U, P = window.PAGES;
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
U.$$ = $$;
window.$$ = $$;

let F;
const getF = () => {
  if (!F) F = window.FMSAPP || (window.UI && window.UI.F && window.UI.F());
  return F;
};

function init(f) {
  if (f) F = f;
  else F = getF();
  const D = F ? F.D : MOCK;

  // 1. Ensure "Ashu Printings" is included in customers for exact demo verification
  if (!D.customers.some(c => c.en.includes('Ashu') || c.bn.includes('আশু'))) {
    D.customers.push({
      bn: 'আশু প্রিন্টিংস',
      en: 'Ashu Printings',
      v: 7850000,
      due: 1216583,
      days: 18,
      phone: '01723-889900',
      limit: 5000000
    });
  }
  const ashuIdx = D.customers.findIndex(c => c.en.includes('Ashu') || c.bn.includes('আশু'));

  // 2. Initialize Party-wise Product Rate Memory (Requirement 11)
  if (!D.partyPrices) {
    D.partyPrices = [
      // Ashu Printings historical rates matching the spreadsheet image
      { c: ashuIdx, p: 0, rate: 263, date: '14-02-2026', billNo: '1', qty: 2997.4, prevRate: 265 },
      { c: ashuIdx, p: 1, rate: 260, date: '13-03-2026', billNo: '4', qty: 1625.9, prevRate: 263 },
      { c: ashuIdx, p: 4, rate: 300, date: '21-04-2026', billNo: '6', qty: 1614, prevRate: 280 },
      { c: ashuIdx, p: 2, rate: 285, date: '26-04-2026', billNo: '7', qty: 672.15, prevRate: 290 },
      { c: ashuIdx, p: 7, rate: 275, date: '29-04-2026', billNo: '8', qty: 1458.48, prevRate: 280 },
      { c: ashuIdx, p: 3, rate: 268, date: '04-05-2026', billNo: '9', qty: 1224.13, prevRate: 275 },

      // Other customers with custom negotiated rates
      { c: 0, p: 0, rate: 112, date: '28-10-2026', billNo: '1184', qty: 4340, prevRate: 110 },
      { c: 0, p: 2, rate: 128, date: '20-10-2026', billNo: '1179', qty: 2500, prevRate: 125 },
      { c: 1, p: 1, rate: 99, date: '27-10-2026', billNo: '1183', qty: 6340, prevRate: 98 },
      { c: 2, p: 3, rate: 205, date: '26-10-2026', billNo: '1182', qty: 1660, prevRate: 208 },
      { c: 3, p: 4, rate: 86, date: '25-10-2026', billNo: '1181', qty: 2500, prevRate: 85 }
    ];
  }

  // 3. Initialize VAT settings in ST.inv (Requirement 10)
  if (U.ST && U.ST.inv) {
    if (U.ST.inv.vatEnabled === undefined) {
      const stored = localStorage.getItem('fms-vat-enabled');
      U.ST.inv.vatEnabled = stored === 'true';
    }
  }

  // 4. Enrich shipments with purchase amounts if not already present (Requirement 1)
  if (D.shipments && D.shipments.length && D.shipments[0].length < 9) {
    D.shipments.forEach((s, idx) => {
      const prod = D.products[s[2]] || D.products[0];
      const unitRate = prod.cost || 95;
      const otherCharges = 45000 + (idx * 25000);
      const totalAmt = Math.round(s[3] * unitRate + otherCharges);
      const paidAmt = s[4] === 'received' ? totalAmt : (s[4] === 'arrived' ? Math.round(totalAmt * 0.7) : 0);
      s.push(unitRate);        // [7] unit cost
      s.push(otherCharges);    // [8] other charges
      s.push(totalAmt);        // [9] total purchase amount
      s.push(paidAmt);         // [10] paid amount
      s.push(totalAmt - paidAmt); // [11] due amount
    });
  }
}

const getPrices = (D) => {
  if (!D.partyPrices) init();
  return D.partyPrices || [];
};

// Helper: Query party-wise last price for a product
U.getPartyLastPrice = (custId, prodId) => {
  const f = getF();
  const D = f ? f.D : MOCK;
  const match = getPrices(D).find(r => r.c === custId && r.p === prodId);
  if (match) return { ...match, isCustom: true };
  const prod = D.products[prodId];
  return {
    c: custId,
    p: prodId,
    rate: prod ? prod.price : 0,
    date: '—',
    billNo: '—',
    qty: 0,
    prevRate: prod ? prod.price : 0,
    isCustom: false
  };
};

// Helper: Save/Update party price memory
U.savePartyPrice = (custId, prodId, rate, qty, billNo, date) => {
  const f = getF();
  const D = f ? f.D : MOCK;
  const prices = getPrices(D);
  const idx = prices.findIndex(r => r.c === custId && r.p === prodId);
  const now = date || new Date().toLocaleDateString(f && f.S.lang === 'bn' ? 'bn-BD' : 'en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  if (idx >= 0) {
    prices[idx].prevRate = prices[idx].rate;
    prices[idx].rate = rate;
    prices[idx].qty = qty;
    prices[idx].billNo = billNo;
    prices[idx].date = now;
  } else {
    prices.unshift({ c: custId, p: prodId, rate, qty, billNo, date: now, prevRate: rate });
  }
};

// Helper: Get Customer Last Payment and Sales History
U.getCustHistory = (custId) => {
  const f = getF();
  const D = f ? f.D : MOCK;
  const custInvoices = (D.invoices || []).filter(v => v[1] === custId);
  const custColls = (D.coll || []).filter(c => c[0] === custId);
  
  // Also check bill ledgers if any
  let lastPayment = null;
  if (custColls.length > 0) {
    const c = custColls[0];
    lastPayment = { amt: c[1], method: c[2], date: c[3] || 'আজ' };
  } else if (D.billLedgers && D.billLedgers[custId]) {
    const deposits = D.billLedgers[custId].filter(r => r.dep > 0);
    if (deposits.length > 0) {
      const d = deposits.at(-1);
      lastPayment = { amt: d.dep, method: d.m || 'DBBL', date: d.dt };
    }
  }

  return {
    invoices: custInvoices.slice(0, 3),
    lastPayment: lastPayment,
    priceMemory: getPrices(D).filter(r => r.c === custId)
  };
};

/* =========================================================
   ENHANCE NEW INVOICE FORM (Requirements 9, 10, 11)
   ========================================================= */
const origSales = P.sales;
let hookInstalled = false;

function installInvoiceEnhancements() {
  if (hookInstalled) return;
  hookInstalled = true;

  // 1. Click handler to apply remembered rate
  ACT.uselast = (btn) => {
    const f = getF();
    const idx = +btn.dataset.i;
    const rate = +btn.dataset.r;
    const input = $(`#view input[data-in="lpr"][data-i="${idx}"]`);
    if (input) {
      input.value = rate;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      const msg = f && f.S && f.S.lang === 'bn' ? `${f.t('last_sold_rate')} (৳${rate}) প্রয়োগ করা হয়েছে` : `${f.t('last_sold_rate')} (৳${rate}) applied`;
      f && f.toast(msg, 'check2-circle');
    }
  };

  // 2. Click handler to toggle VAT on/off from settings
  ACT.vattog = (btn) => {
    const f = getF();
    const isNowOn = btn.dataset.v === 'true';
    U.ST.inv.vatEnabled = isNowOn;
    localStorage.setItem('fms-vat-enabled', String(isNowOn));
    f && f.toast(`${f.t('vat_management')}: ${isNowOn ? f.t('vat_on') : f.t('vat_off')}`, 'check-circle');
    f && f.route(false);
  };
}

// Render the party history card for invoice view
function renderCustHistoryCard(custId) {
  const f = getF();
  if (!f) return '';
  const { t, L, tk, n, D } = f;
  const cust = D.customers[custId];
  const hist = U.getCustHistory(custId);

  let lastPayHtml = '';
  if (hist.lastPayment) {
    lastPayHtml = `
      <div class="col-sm-6">
        <div class="p-2 rounded bg-body-secondary border">
          <small class="text-secondary d-block"><i class="bi bi-wallet2 me-1"></i>${t('last_payment_info')}</small>
          <div class="fs-6 fw-bold text-success">${tk(hist.lastPayment.amt)}</div>
          <small class="text-muted">${hist.lastPayment.date} · ${t(hist.lastPayment.method) || hist.lastPayment.method}</small>
        </div>
      </div>`;
  } else {
    lastPayHtml = `
      <div class="col-sm-6">
        <div class="p-2 rounded bg-body-secondary border">
          <small class="text-secondary d-block"><i class="bi bi-wallet2 me-1"></i>${t('last_payment_info')}</small>
          <div class="text-muted small">${t('empty')}</div>
        </div>
      </div>`;
  }

  // Memorized rates list
  const memorized = hist.priceMemory.slice(0, 4);
  const memHtml = memorized.length ? `
    <div class="mt-2 pt-2 border-top">
      <small class="text-secondary fw-semibold d-block mb-1"><i class="bi bi-tags me-1"></i>${t('diff_rate_hint')}:</small>
      <div class="d-flex flex-wrap gap-1">
        ${memorized.map(m => {
          const p = D.products[m.p];
          return `<span class="badge bg-light text-dark border">
            ${L(p.n).split(' ')[0]}: <b>${tk(m.rate)}</b> <small class="text-secondary">(${m.date})</small>
          </span>`;
        }).join('')}
      </div>
    </div>` : '';

  return `
    <div class="card mb-3 border shadow-sm party-hist-box" style="background:var(--surface-2)">
      <div class="card-body p-3">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <b class="fs-6"><i class="bi bi-person-check-fill text-primary me-2"></i>${L(cust)}</b>
          <span class="badge ${cust.due > 0 ? 'bg-danger-subtle text-danger' : 'bg-success-subtle text-success'}">
            ${t('due_amt')}: ${tk(cust.due)}
          </span>
        </div>
        <div class="row g-2">
          ${lastPayHtml}
          <div class="col-sm-6">
            <div class="p-2 rounded bg-body-secondary border">
              <small class="text-secondary d-block"><i class="bi bi-receipt me-1"></i>${t('prev_bills_title')}</small>
              <div class="fs-6 fw-bold">${n(hist.invoices.length)} ${t('items')}</div>
              <small class="text-muted">${hist.invoices.length ? hist.invoices[0][0] : '—'}</small>
            </div>
          </div>
        </div>
        ${memHtml}
      </div>
    </div>`;
}

// Enhance the invoice table row with last sold rate badge
function attachRateMemoryToInvoice() {
  const f = getF();
  if (!f) return;
  const custSelect = $('#view select[data-in="cust"]');
  if (!custSelect) return;
  const custId = +custSelect.value;

  // Insert or update customer history card above line items
  let histCard = $('#cust-hist-panel');
  if (!histCard) {
    const parent = $('#cinfo');
    if (parent) {
      histCard = document.createElement('div');
      histCard.id = 'cust-hist-panel';
      histCard.className = 'mt-3';
      parent.after(histCard);
    }
  }
  if (histCard && histCard.dataset.c !== String(custId)) {
    histCard.dataset.c = String(custId);
    histCard.innerHTML = renderCustHistoryCard(custId);
  }

  // Update line item table rows with last price hint
  const rows = $$('#view .tw table.tbl tbody tr');
  rows.forEach((row, i) => {
    const pSelect = row.querySelector('select[data-in="lp"]');
    const prInput = row.querySelector('input[data-in="lpr"]');
    if (!pSelect || !prInput) return;

    const prodId = +pSelect.value;
    const lastPrice = U.getPartyLastPrice(custId, prodId);

    let badge = row.querySelector('.rate-memory-badge');
    if (!badge) {
      badge = document.createElement('div');
      badge.className = 'rate-memory-badge mt-1';
      pSelect.parentElement.appendChild(badge);
    }

    const key = custId + '_' + prodId;
    if (badge.dataset.k !== key) {
      badge.dataset.k = key;
      if (lastPrice.isCustom) {
        badge.innerHTML = `
          <div class="d-flex align-items-center justify-content-between p-1 px-2 rounded" style="background:var(--gold-soft);font-size:11px">
            <span><i class="bi bi-clock-history me-1"></i>${f.t('last_sold_badge')}: <b>৳${lastPrice.rate}</b> (${lastPrice.date})</span>
            <button type="button" class="btn btn-xs btn-outline-dark py-0 px-1 ms-1" style="font-size:10px" data-act="uselast" data-i="${i}" data-r="${lastPrice.rate}">
              <i class="bi bi-check-lg"></i> ${f.t('apply_last_rate')}
            </button>
          </div>`;
      } else {
        badge.innerHTML = `<small class="text-muted" style="font-size:10.5px"><i class="bi bi-info-circle me-1"></i>${f.t('std_price_note')}: ৳${lastPrice.rate}/kg</small>`;
      }
    }
  });

  // Handle VAT toggle visibility (OFF by default unless explicitly enabled in Settings)
  const isVatOn = window.FIN ? window.FIN.isVatOn() : (U.ST && U.ST.inv && U.ST.inv.vatEnabled === true);
  const vatInput = $('#view input[data-in="vat"]');
  if (vatInput) {
    const vatCol = vatInput.closest('[data-vat-col], .col-vat, .col-sm-4, .col-sm-3');
    if (vatCol) vatCol.style.display = isVatOn ? '' : 'none';
    if (!isVatOn) vatInput.value = 0;
  }
  const sVatRow = $('#s-vat')?.closest('.lrow');
  if (sVatRow) sVatRow.style.display = isVatOn ? '' : 'none';
}

// Override / wrap invoice save function to update party price memory on save
function patchInvoiceSave() {
  const oldSave = ACT.save;
  if (!oldSave || oldSave._patched) return;

  ACT.save = () => {
    const f = getF();
    const D = f ? f.D : MOCK;
    const iv = U.IV;
    const wasEdit = iv && iv.editingIdx !== undefined && iv.editingIdx !== null;
    const custSelect = $('#view select[data-in="cust"]');
    const custId = custSelect ? +custSelect.value : 0;
    const invNoEl = $('#view .page-h .badge, #view .page-h h2 small');
    const invNo = invNoEl ? invNoEl.textContent.trim() : 'INV-2026-NEW';

    // Before saving, memorize rates for this party
    if (custSelect) {
      const rows = $$('#view .tw table.tbl tbody tr, #view #inv-lines-table tbody tr');
      rows.forEach(r => {
        const pSelect = r.querySelector('select[data-in="lp"]');
        const qInput = r.querySelector('input[data-in="lq"]');
        const prInput = r.querySelector('input[data-in="lpr"]');
        if (pSelect && prInput && qInput) {
          const p = +pSelect.value;
          const q = +qInput.value;
          const pr = +prInput.value;
          if (p >= 0 && pr > 0 && q > 0) {
            U.savePartyPrice(custId, p, pr, q, invNo);
          }
        }
      });
    }

    // Call original save
    oldSave();

    // After new save, if billLedgers exists for this customer, record delivery entry once
    if (!wasEdit && D && D.billLedgers && D.billLedgers[custId] && D.invoices && D.invoices.length) {
      const latest = D.invoices[0];
      const entries = D.billLedgers[custId];
      const bNo = String(latest[0]).replace('INV-2026-', '');
      if (!entries.some(e => e.bNo === bNo)) {
        const lastDue = entries.length ? entries[entries.length - 1].due : Math.max(0, D.customers[custId].due - (latest[2] - latest[3]));
        const now = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '-');
        entries.push({
          dt: now,
          bNo,
          wt: '—',
          r: '—',
          prev: lastDue,
          del: latest[2],
          dep: latest[3],
          m: latest[3] > 0 ? (latest[7] === 'm_cash' ? 'CASH' : 'DBBL') : '—',
          due: D.customers[custId].due,
          mo: 'Current'
        });
      }
    }

    // Re-attach enhancements if invoice form stays open
    if ($('select[data-in="cust"]')) {
      attachRateMemoryToInvoice();
    }
  };
  ACT.save._patched = true;
}

/* =========================================================
   PURCHASE MODULE SYNCHRONIZED CREATION (Req 1 & Module 07)
   ========================================================= */
function enhancePurchasePage() {
  const origPurchase = P.purchase;
  P.purchase = (f) => {
    init(f);
    if (window.FIN) window.FIN.boot(f);
    if (origPurchase) origPurchase(f);
  };

  // Add Purchase Action (Single source in D.purchases + atomic stock & supplier reconciliation)
  ACT.puadd = () => {
    const f = getF();
    if (!f) return;
    const { t, L, D, S } = f;
    const locStr = S.lang === 'bn' ? 'bn-BD' : 'en-IN';
    const body = `
      <div class="row g-2 g-sm-3">
        <div class="col-12 col-sm-6">${field('pu_sup', t('supplier'), `<select id="pu_sup" class="form-select">${opts(D.suppliers.map((s, i) => [i, L(s)]))}</select>`)}</div>
        <div class="col-12 col-sm-6">${field('pu_prod', t('product'), `<select id="pu_prod" class="form-select">${opts(D.products.map((p, i) => [i, L(p.n) + ' (' + p.kg + ' KG)']))}</select>`)}</div>
        <div class="col-6 col-sm-4">${field('pu_kg', t('qty_kg'), '<input id="pu_kg" type="number" min="1" step="50" class="form-control" value="5000">')}</div>
        <div class="col-6 col-sm-4">${field('pu_rate', t('pu_unit_cost') + ' (৳)', '<input id="pu_rate" type="number" min="1" step="1" class="form-control" value="90">')}</div>
        <div class="col-6 col-sm-4">${field('pu_charges', t('pu_other_charges') + ' (৳)', '<input id="pu_charges" type="number" min="0" step="500" class="form-control" value="15000">')}</div>
        <div class="col-6 col-sm-4">${field('pu_paid', t('pu_paid_amt') + ' (৳)', '<input id="pu_paid" type="number" min="0" step="500" class="form-control" value="200000">')}</div>
        <div class="col-6 col-sm-4">${field('pu_method', t('method'), `<select id="pu_method" class="form-select">${opts(f.methods().map(k => [k, t(k)]))}</select>`)}</div>
        <div class="col-12 col-sm-4">${field('pu_status', t('status'), `<select id="pu_status" class="form-select">${opts([['received', t('st_received') || 'Received (Add to Stock)'], ['arrived', t('st_arrived') || 'Ordered / Pending Stock']], 'received')}</select>`)}</div>
        <div class="col-12">${field('pu_note', t('notes') || t('note') || 'Note / Reference', '<input id="pu_note" class="form-control" placeholder="e.g. Challan / Invoice reference">')}</div>
      </div>
      <div class="mt-3 p-3 rounded border" style="background:var(--surface-2)">
        <div class="d-flex justify-content-between mb-1"><span>${t('pu_prod_cost')}:</span><b id="pu_calc_goods">৳0</b></div>
        <div class="d-flex justify-content-between mb-1"><span>${t('pu_charges')}:</span><b id="pu_calc_extra">৳0</b></div>
        <hr class="my-1">
        <div class="d-flex justify-content-between fs-5 text-primary"><span>${t('pu_tot_amount')}:</span><b id="pu_calc_total">৳0</b></div>
        <div class="d-flex justify-content-between text-success mt-1"><span>${t('pu_paid_amt')}:</span><b id="pu_calc_paid">৳0</b></div>
        <div class="d-flex justify-content-between text-danger"><span>${t('pu_due_amt')}:</span><b id="pu_calc_due">৳0</b></div>
      </div>`;

    modal(t('pu_add'), body, () => {
      const supIdx = +$('#pu_sup').value;
      const prodIdx = +$('#pu_prod').value;
      const kg = +$('#pu_kg').value;
      const rate = +$('#pu_rate').value;
      const charges = +$('#pu_charges').value || 0;
      const paid = +$('#pu_paid').value || 0;
      const method = $('#pu_method').value;
      const status = $('#pu_status').value || 'received';
      const note = ($('#pu_note')?.value || '').trim();

      if (!(kg > 0) || !(rate > 0)) {
        f.toast(t('pos_qty'), 'exclamation-triangle');
        return false;
      }

      const totalAmt = Math.round(kg * rate + charges);
      if (paid < 0 || paid > totalAmt) {
        f.toast(t('overpay_err') || 'Paid amount cannot exceed total', 'exclamation-triangle');
        return false;
      }
      const dueAmt = Math.max(0, totalAmt - paid);

      const runner = () => {
        if (!D.purchases) D.purchases = [];
        if (!D.purchSeq) D.purchSeq = 90 + D.purchases.length;
        const poNum = 'PO-2026-' + (++D.purchSeq);
        const sup = D.suppliers[supIdx];
        const prod = D.products[prodIdx];
        const now = Date.now();
        const dtLabel = new Date(now).toLocaleDateString(locStr, { day: '2-digit', month: 'short', year: 'numeric' });
        const byUser = f.S.user ? f.L(f.S.user.n) : 'Admin';

        const payments = [];
        if (paid > 0) {
          payments.push({
            id: 'SPAY-' + (++D.txSeq),
            purchNo: poNum,
            s: supIdx,
            dt: now,
            dtStr: window.FIN ? window.FIN.fmtDtTime(now, f) : dtLabel,
            amt: paid,
            m: method,
            ref: note || poNum,
            by: byUser,
            note: 'Initial purchase payment',
            status: 'posted'
          });
        }

        D.purchases.unshift({
          id: poNum,
          no: poNum,
          ref: poNum,
          supIdx,
          prodIdx,
          kg,
          rate,
          charges,
          total: totalAmt,
          paid,
          due: dueAmt,
          status,
          d: ['আজ', 'Today'],
          ts: now,
          dtStr: dtLabel,
          m: method,
          by: byUser,
          note,
          payments,
          items: [{ p: prodIdx, q: kg, rate }]
        });

        // Update stock via centralized stock movement ledger if received
        if (status === 'received' && prod) {
          if (window.FIN) {
            window.FIN.recordStockMove(f, {
              p: prodIdx,
              qty: kg,
              isIn: true,
              kind: 'purchase',
              ty: t('pur_in') || 'Purchase In',
              ref: poNum,
              purchRef: poNum,
              party: sup ? L(sup) : 'Supplier',
              partyType: 'supplier',
              remarks: note || ('Purchase received: ' + poNum),
              ts: now
            });
          } else {
            prod.kg += kg;
          }
        }

        // Cash/Bank movement & supplier ledger reconciliation
        if (paid > 0) {
          if (window.FIN) window.FIN.postCashBank(D, method, -paid);
          else if (method === 'm_cash') D.cashBank.cash = Math.max(0, D.cashBank.cash - paid);
          else D.cashBank.bank = Math.max(0, D.cashBank.bank - paid);
        }

        if (D.daily && D.daily.purch && D.daily.purch.length) {
          D.daily.purch[D.daily.purch.length - 1] += totalAmt;
        }

        if (window.FIN) {
          window.FIN.reconcileSupplier(supIdx, f);
        } else if (sup) {
          sup.payable += dueAmt;
          D.cashBank.payable += dueAmt;
        }

        if (typeof LOG !== 'undefined') {
          LOG.add({
            uid: S.user?.id,
            u: S.user?.n?.bn,
            r: S.role,
            m: 'purchase',
            t: 'save',
            recordType: 'purchase',
            recordId: poNum,
            msg: `নতুন ক্রয় (${poNum}): ${sup ? L(sup) : ''} – ${f.tk(totalAmt)}`
          });
        }
      };

      const res = window.FIN ? window.FIN.tx(f, runner) : (runner(), true);
      if (res === false) return false;

      f.toast(t('pu_saved'), 'check-circle');
      P.purchase(f);
    }, t('save'));

    // Live calculation inside modal
    const recalc = () => {
      const kg = +$('#pu_kg')?.value || 0;
      const rate = +$('#pu_rate')?.value || 0;
      const chg = +$('#pu_charges')?.value || 0;
      const pd = +$('#pu_paid')?.value || 0;
      const g = kg * rate;
      const tot = g + chg;
      const due = Math.max(0, tot - pd);

      if ($('#pu_calc_goods')) $('#pu_calc_goods').textContent = f.tk(g);
      if ($('#pu_calc_extra')) $('#pu_calc_extra').textContent = f.tk(chg);
      if ($('#pu_calc_total')) $('#pu_calc_total').textContent = f.tk(tot);
      if ($('#pu_calc_paid')) $('#pu_calc_paid').textContent = f.tk(pd);
      if ($('#pu_calc_due')) $('#pu_calc_due').textContent = f.tk(due);
    };

    ['pu_kg', 'pu_rate', 'pu_charges', 'pu_paid'].forEach(id => {
      const el = $('#' + id);
      if (el) el.addEventListener('input', recalc);
    });
    recalc();
  };
}

function renderPurchaseAmountStrip() { /* Unified into modules2.js Purchase view */ }

// Clean event hooks for invoice page
let invoiceHooksSetup = false;
function setupInvoiceHooks() {
  if (invoiceHooksSetup) return;
  invoiceHooksSetup = true;
  installInvoiceEnhancements();

  // Wrap P.sales to enhance whenever new invoice form is rendered
  const origSalesPage = P.sales;
  P.sales = (f) => {
    init(f);
    if (origSalesPage) origSalesPage(f);
    if ($('select[data-in="cust"]')) {
      attachRateMemoryToInvoice();
      patchInvoiceSave();
    }
  };

  // Wrap ACT.inew
  const origInew = ACT.inew;
  ACT.inew = (x) => {
    if (origInew) origInew(x);
    attachRateMemoryToInvoice();
    patchInvoiceSave();
  };

  // Wrap customer change
  const origCustIn = IN.cust;
  IN.cust = (x) => {
    if (origCustIn) origCustIn(x);
    attachRateMemoryToInvoice();
  };

  // Wrap product change in line item
  const origLpIn = IN.lp;
  IN.lp = (x) => {
    if (origLpIn) origLpIn(x);
    attachRateMemoryToInvoice();
  };

  // Wrap add line item
  const origAddAct = ACT.add;
  ACT.add = (x) => {
    if (origAddAct) origAddAct(x);
    attachRateMemoryToInvoice();
  };

  // Wrap remove line item
  const origRmAct = ACT.rm;
  ACT.rm = (x) => {
    if (origRmAct) origRmAct(x);
    attachRateMemoryToInvoice();
  };

  // Wrap payment mode change
  const origModeAct = ACT.mode;
  ACT.mode = (x) => {
    if (origModeAct) origModeAct(x);
    attachRateMemoryToInvoice();
  };
}

addEventListener('DOMContentLoaded', () => {
  setupInvoiceHooks();
});

addEventListener('hashchange', () => {
  setTimeout(() => {
    if (location.hash.includes('sales') && $('select[data-in="cust"]')) {
      attachRateMemoryToInvoice();
      patchInvoiceSave();
    }
  }, 50);
});

// Export helpers to UI
U.init13 = init;
enhancePurchasePage();
setupInvoiceHooks();
})();
