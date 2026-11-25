/* Centralized Finance, Inventory & Ledger Synchronization Engine (Single Source of Truth)
   Handles:
   - Atomic transactions with automatic state rollback on error (`FIN.tx`)
   - Unified VAT configuration (`FIN.isVatOn`, `FIN.getVatPct`, defaults to OFF)
   - Synchronized Stock Movements & Chronological Product History (`FIN.recordStockMove`, `FIN.getProductHistory`)
   - Synchronized Customer Receivable Statements & Running Balances (`FIN.getCustomerStatement`, `FIN.reconcileCustomer`)
   - Synchronized Supplier Payable Statements & Running Balances (`FIN.getSupplierStatement`, `FIN.reconcileSupplier`)
   - Unified Purchase & Import Aggregation (`FIN.getAllPurchases`)
   - Role permission checks for destructive & financial actions (`FIN.canEditDel`)
*/
(() => {
  const sum = a => a.reduce((x, y) => x + (+y || 0), 0);

  function deepClone(val) {
    if (val === null || typeof val !== 'object') return val;
    if (Array.isArray(val)) {
      const copy = val.map(deepClone);
      for (const key of Object.keys(val)) {
        if (String(+key) !== key) copy[key] = deepClone(val[key]);
      }
      return copy;
    }
    const out = {};
    for (const key of Object.keys(val)) {
      out[key] = deepClone(val[key]);
    }
    return out;
  }

  function getF() {
    return window.FMSAPP || (window.UI && window.UI.F && window.UI.F()) || null;
  }

  function getD(f) {
    return (f && f.D) || (getF() && getF().D) || (typeof MOCK !== 'undefined' ? MOCK : null);
  }

  function langLoc(f) {
    const curF = f || getF();
    return curF && curF.S && curF.S.lang === 'bn' ? 'bn-BD' : 'en-IN';
  }

  function fmtDt(ts, f) {
    const d = new Date(ts || Date.now());
    return d.toLocaleDateString(langLoc(f), { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function fmtDtTime(ts, f) {
    const d = new Date(ts || Date.now());
    return fmtDt(ts, f) + ' ' + d.toLocaleTimeString(langLoc(f), { hour: '2-digit', minute: '2-digit' });
  }

  function L(o, f) {
    if (!o) return '—';
    if (typeof o === 'string') return o;
    const lg = ((f || getF())?.S?.lang) || 'bn';
    return o[lg] || o.bn || o.en || '—';
  }

  /* ---------------- 1. Unified VAT Configuration (Default OFF) ---------------- */
  function isVatOn() {
    const stored = localStorage.getItem('fms-vat-enabled');
    if (stored === null) return false;
    const stVat = window.UI && window.UI.ST && window.UI.ST.inv ? window.UI.ST.inv.vatEnabled : undefined;
    if (stVat !== undefined) return stored === 'true' && stVat === true;
    return stored === 'true';
  }

  function getVatPct() {
    const stPct = window.UI && window.UI.ST && window.UI.ST.inv ? window.UI.ST.inv.vat : undefined;
    const storedPct = localStorage.getItem('fms-vat-pct');
    return stPct !== undefined ? (+stPct || 0) : (storedPct !== null ? (+storedPct || 5) : 5);
  }

  /* ---------------- 2. Permission Helpers ---------------- */
  function canEditDel(f) {
    const curF = f || getF();
    if (!curF || !curF.D || !curF.D.roles || !curF.S) return false;
    const role = curF.D.roles.find(r => r.id === curF.S.role);
    if (!role) return false;
    if (role.id === 'admin') return true;
    return !!role.editDel;
  }

  /* ---------------- 3. Atomic Transaction Wrapper ---------------- */
  function tx(f, fn) {
    if (typeof f === 'function') {
      fn = f;
      f = getF();
    }
    const D = getD(f);
    if (!D) return fn(f, null);

    const keys = [
      'products', 'customers', 'suppliers', 'invoices', 'purchases',
      'shipments', 'cashBank', 'daily', 'stockMovements', 'dueCollections',
      'customerTx', 'supplierTx', 'deletedInvoices', 'deletedPurchases', 'exp', 'returns'
    ];
    const snap = {};
    keys.forEach(k => {
      if (D[k] !== undefined) snap[k] = deepClone(D[k]);
    });

    try {
      const res = fn(f, D);
      if (res === false) {
        keys.forEach(k => {
          if (snap[k] !== undefined) D[k] = snap[k];
          else delete D[k];
        });
        return false;
      }
      return res;
    } catch (err) {
      console.error('Transaction rolled back:', err);
      keys.forEach(k => {
        if (snap[k] !== undefined) D[k] = snap[k];
        else delete D[k];
      });
      if (f && f.toast) f.toast(err.message || 'Transaction failed – rolled back', 'exclamation-triangle');
      return false;
    }
  }

  /* ---------------- 4. Boot & Single-Source Normalization ---------------- */
  let booted = false;
  let booting = false;

  function boot(f) {
    const curF = f || getF();
    const D = getD(curF);
    if (!D) return;
    if ((booted && D._finBooted) || booting) return;
    booting = true;
    try {
      // Ensure all other sub-initializers have populated base arrays first
      if (window.UI) {
        if (window.UI.boot && curF && !D._uBooted) {
          D._uBooted = true;
          window.UI.boot(curF);
        }
        if (window.UI.init2 && curF && !D.suppliers) window.UI.init2(curF);
        if (window.UI.init3 && curF && !D.exp) window.UI.init3(curF);
        if (window.UI.init13 && curF && !D.partyPrices) window.UI.init13(curF);
      }

      booted = true;
      D._finBooted = true;

    const nowTs = Date.now();
    const dayMs = 86400000;

    if (!D.invoiceSeq) D.invoiceSeq = 1200;
    if (!D.paySeq) D.paySeq = 1000;
    if (!D.purchSeq) D.purchSeq = 90;
    if (!D.txSeq) D.txSeq = 500;
    if (!D.deletedInvoices) D.deletedInvoices = [];
    if (!D.deletedPurchases) D.deletedPurchases = [];
    if (!D.customerTx) D.customerTx = [];
    if (!D.supplierTx) D.supplierTx = [];
    if (!D.dueCollections) D.dueCollections = [];

    // Ensure Customers have ID/Code, Phone, Address, Status
    const custPhones = ['01711-284501', '01819-662340', '01912-557781', '01678-300912', '01555-421098', '01723-889900', '01712-349811', '01811-998822'];
    const custAddrs = ['Tejgaon I/A, Dhaka', 'Tongi BSCIC, Gazipur', 'Narayanganj BSCIC', 'Nawabpur Road, Dhaka', 'Uttara Sector 11, Dhaka', 'Fakirapool, Dhaka', 'Konabari, Gazipur', 'Motijheel C/A, Dhaka'];
    (D.customers || []).forEach((c, i) => {
      if (!c.code) c.code = 'CUST-' + (101 + i);
      if (!c.phone) c.phone = custPhones[i % custPhones.length];
      if (!c.address) c.address = custAddrs[i % custAddrs.length];
      if (!c.limit) c.limit = 2000000;
      if (!c.status) c.status = 'active';
    });

    // Ensure Suppliers have ID/Code, Address, Status
    const supAddrs = ['Hangzhou Paper District, China', 'Jurong Industrial Estate, Singapore', 'Nayabazar Paper Market, Dhaka'];
    (D.suppliers || []).forEach((s, i) => {
      if (!s.code) s.code = 'SUP-' + (101 + i);
      if (!s.address) s.address = supAddrs[i % supAddrs.length] || 'Dhaka, Bangladesh';
      if (!s.status) s.status = 'active';
      if (!s.tx) s.tx = [];
    });

    // Normalize Invoices cleanly (respect VAT default OFF if unseeded, preserve line items & timestamps)
    const vatDefaultPct = isVatOn() ? getVatPct() : 0;
    (D.invoices || []).forEach((v, i) => {
      if (!v[6] || !v[6].length) {
        const pIdx = (v[1] * 2 + i) % D.products.length;
        const pr = D.products[pIdx].price;
        const q = Math.max(50, Math.round(v[2] / pr / 10) * 10);
        const sub = Math.round(q * pr);
        v[6] = [{ p: pIdx, q, pr }];
        v.subtotal = sub;
        v.discPct = 0;
        v.discount = 0;
        v.carry = 0;
        v.vatPct = vatDefaultPct;
        v.vat = vatDefaultPct ? Math.round(sub * vatDefaultPct / 100) : 0;
        v[2] = sub + v.vat;
        v[3] = v[4] === 'paid' ? v[2] : v[4] === 'due' ? 0 : Math.min(v[3], Math.max(0, v[2] - 1000));
        v[5] = Math.round(q * (pr - D.products[pIdx].cost));
      }
      if (!v.createdTs) {
        const dObj = new Date(2026, 9, 28 - i, 11, 30 - i * 10);
        v.createdTs = dObj.getTime();
        v.dateStr = fmtDt(v.createdTs, curF);
      }
      if (!v.challan) {
        const demoChallans = ['CH-399', 'CH-400', 'CH-404', 'CH-406', 'CH-395', 'CH-391'];
        v.challan = demoChallans[i % demoChallans.length] || ('CH-' + (390 + i));
      }
      if (v.discPct === undefined) {
        v.discPct = (v.subtotal && v.discount) ? Math.round((v.discount / v.subtotal) * 1000) / 10 : 0;
      }
      if (v.vatPct === undefined) {
        const base = (v.subtotal || v[2]) - (v.discount || 0);
        v.vatPct = (v.vat && base > 0) ? Math.round((v.vat / base) * 1000) / 10 : 0;
      }
      if (!v.payments) {
        v.payments = [];
        if (v[3] > 0) {
          v.payments.push({
            id: 'PAY-2026-' + (++D.paySeq),
            invNo: v[0],
            c: v[1],
            dt: v.createdTs,
            dtStr: fmtDtTime(v.createdTs, curF),
            amt: v[3],
            m: v[7] || (i % 2 === 0 ? 'm_bank' : 'm_cash'),
            ref: 'TXN-' + (84100 + i),
            u: 'আসির আহমেদ তৌসিফ',
            note: 'Initial invoice payment',
            status: 'posted'
          });
        }
      }
    });

    // Normalize Purchases & Shipments with timestamps, IDs, payment arrays
    (D.purchases || []).forEach((p, idx) => {
      if (!p.id) p.id = p.no || ('PO-2026-' + (88 - idx));
      if (!p.ts) p.ts = nowTs - ((idx + 1) * 4 * dayMs);
      if (!p.dtStr) p.dtStr = fmtDt(p.ts, curF);
      if (!p.payments) {
        p.payments = [];
        if (p.paid > 0) {
          p.payments.push({
            id: 'SPAY-' + (++D.txSeq),
            purchNo: p.no,
            s: p.supIdx,
            dt: p.ts,
            dtStr: fmtDtTime(p.ts, curF),
            amt: p.paid,
            m: p.m || 'm_bank',
            ref: 'TXN-' + (91200 + idx),
            by: p.by || 'Admin',
            note: 'Purchase settlement',
            status: 'posted'
          });
        }
      }
      if (!p.items) {
        p.items = [{ p: p.prodIdx, q: p.kg, rate: p.rate }];
      }
    });

    (D.shipments || []).forEach((s, idx) => {
      if (s.length < 9) {
        const prod = D.products[s[2]] || D.products[0];
        const unitRate = prod.cost || 95;
        const otherCharges = 45000 + (idx * 25000);
        const totalAmt = Math.round(s[3] * unitRate + otherCharges);
        const paidAmt = s[4] === 'received' ? totalAmt : (s[4] === 'arrived' ? Math.round(totalAmt * 0.5) : 0);
        s.push(unitRate);
        s.push(otherCharges);
        s.push(totalAmt);
        s.push(paidAmt);
        s.push(totalAmt - paidAmt);
      }
      if (!s.ts) s.ts = nowTs - ((idx + 2) * 5 * dayMs);
      if (!s.dtStr) s.dtStr = fmtDt(s.ts, curF);
      if (!s.payments) {
        s.payments = [];
        const pd = s[10] || 0;
        if (pd > 0) {
          s.payments.push({
            id: 'SPAY-' + (++D.txSeq),
            purchNo: s[0],
            s: s[1],
            dt: s.ts,
            dtStr: fmtDtTime(s.ts, curF),
            amt: pd,
            m: 'm_bank',
            ref: 'LC-PAY-' + (450 + idx),
            by: 'Admin',
            note: 'Import shipment payment',
            status: 'posted'
          });
        }
      }
    });

    // Normalize Products (SKU, desc, img, status, stock movements reconciliation)
    const descs = [
      'High-strength Virgin & Recycled Kraft Paper ideal for corrugated boxes and heavy packaging.',
      'Smooth white coated Duplex Board (grey back) suitable for carton boxes and commercial printing.',
      'Bright white top liner paper engineered for high-end retail packaging and sharp print clarity.',
      'Biaxially oriented polypropylene (BOPP) glossy film for flexible packaging & lamination.',
      'Semi-chemical fluting corrugated medium ensuring superior edge-crush box strength.',
      'High-puncture-resistance LLDPE pallet stretch film for industrial wrapping.',
      'Industrial grade LDPE polymer resin granules for blown film extrusion.',
      'Rigid recycled Grey Board ideal for bookbinding, rigid gift boxes and industrial separators.'
    ];
    (D.products || []).forEach((p, idx) => {
      if (!p.sku) p.sku = 'PK-' + (101 + idx);
      if (p.desc === undefined) p.desc = descs[idx] || 'Industrial packaging & paper product.';
      if (!p.status) p.status = 'active';
      if (p.img === undefined) p.img = '';
      if (!p.adjHistory) p.adjHistory = [];
    });

    // Ensure stockMovements exists & matches products mathematically
    if (!D.stockMovements) {
      D.stockMovements = [];
    }

    // Reconcile Customer & Supplier Opening Balances once on boot so running statement matches c.due & sup.payable
    (D.customers || []).forEach((c, cIdx) => {
      if (c.openingDue === undefined) {
        const net = calcCustomerLedgerNet(cIdx, D);
        c.openingDue = Math.round((c.due - net) * 100) / 100;
      }
    });

    (D.suppliers || []).forEach((s, sIdx) => {
      if (s.openingPayable === undefined) {
        const net = calcSupplierLedgerNet(sIdx, D);
        s.openingPayable = Math.round((s.payable - net) * 100) / 100;
      }
    });
    } finally {
      booting = false;
    }
  }

  /* ---------------- 5. Product & Stock Ledger Engine ---------------- */
  function recordStockMove(f, opts) {
    const D = getD(f);
    if (!D) return null;
    if (!D.stockMovements) D.stockMovements = [];
    const pIdx = opts.p;
    const p = D.products[pIdx];
    if (!p) return null;

    const qty = +opts.qty || 0;
    const isIn = !!opts.isIn;
    const prev = p.kg;
    p.kg = Math.max(0, Math.round((p.kg + (isIn ? qty : -qty)) * 100) / 100);
    const res = p.kg;

    if (opts.kind === 'sale') p.sold = Math.max(0, (p.sold || 0) + qty);
    if (opts.kind === 'sale_rev') p.sold = Math.max(0, (p.sold || 0) - qty);
    if (opts.kind === 'purchase') p.purchased = Math.max(0, (p.purchased || 0) + qty);
    if (opts.kind === 'purchase_rev') p.purchased = Math.max(0, (p.purchased || 0) - qty);
    if (opts.kind === 'sales_return') {
      p.salesReturn = (p.salesReturn || 0) + qty;
      p.sold = Math.max(0, (p.sold || 0) - qty);
    }
    if (opts.kind === 'purchase_return') {
      p.purchReturn = (p.purchReturn || 0) + qty;
    }

    const nowTs = opts.ts || Date.now();
    const curF = f || getF();
    const user = (curF && curF.S && curF.S.user) ? L(curF.S.user.n, curF) : 'System';

    const mv = {
      id: 'MV-2026-' + String(D.stockMovements.length + 1).padStart(3, '0'),
      p: pIdx,
      sku: p.sku || ('PK-' + (101 + pIdx)),
      brand: opts.brand || L(p.n, curF),
      ts: nowTs,
      dt: fmtDtTime(nowTs, curF),
      ty: opts.ty || (isIn ? 'Stock In' : 'Stock Out'),
      kind: opts.kind || (isIn ? 'in' : 'out'),
      in: isIn ? qty : 0,
      out: isIn ? 0 : qty,
      prev,
      res,
      ref: opts.ref || '—',
      challan: opts.challan || '',
      invIdx: opts.invIdx,
      purchRef: opts.purchRef,
      party: opts.party || 'Warehouse',
      partyType: opts.partyType || 'system',
      u: opts.u || user,
      remarks: opts.remarks || ''
    };

    D.stockMovements.unshift(mv);

    if (opts.kind === 'adjustment') {
      p.adj = (p.adj || 0) + (isIn ? qty : -qty);
      if (!p.adjHistory) p.adjHistory = [];
      p.adjHistory.push({
        ts: nowTs,
        dateStr: fmtDt(nowTs, curF),
        type: 'adjustment',
        adjSubType: opts.adjType || 'adj',
        ref: mv.id,
        qtyChange: isIn ? qty : -qty,
        prevStock: prev,
        updatedStock: res,
        party: 'Inventory Adjustment',
        remarks: opts.remarks || ''
      });
    }

    return mv;
  }

  /* Complete Chronological Product History from Actual DB Records */
  function getProductHistory(prodIdx, f) {
    const curF = f || getF();
    const D = getD(curF);
    if (!D || !D.products[prodIdx]) return null;
    const p = D.products[prodIdx];
    const nowTs = Date.now();
    const dayMs = 86400000;
    const events = [];
    const seenRefs = new Set();

    // 1. Real Stock Movements (from D.stockMovements linked to this product)
    (D.stockMovements || []).filter(m => m.p === prodIdx).forEach(m => {
      const qtyChange = (m.in || 0) - (m.out || 0);
      const isSale = m.kind === 'sale' || m.ty === 'Stock Out' || String(m.ref || '').startsWith('INV-');
      const isPurch = m.kind === 'purchase' || m.ty === 'Stock In' || String(m.ref || '').startsWith('PO-') || String(m.ref || '').startsWith('SH-');
      const isAdj = m.kind === 'adjustment' || String(m.ty || '').toLowerCase().includes('adjust');
      const invIdx = m.invIdx !== undefined ? m.invIdx : (D.invoices || []).findIndex(v => v[0] === m.ref);
      events.push({
        ts: m.ts || (nowTs - dayMs),
        dateStr: fmtDt(m.ts || nowTs, curF),
        type: isAdj ? 'adjustment' : isSale ? 'sale' : isPurch ? 'purchase' : (qtyChange >= 0 ? 'in' : 'out'),
        ref: m.ref,
        challan: m.challan || '',
        invIdx: invIdx >= 0 ? invIdx : undefined,
        purchRef: isPurch ? m.ref : undefined,
        qtyChange,
        party: m.party || '—',
        remarks: m.remarks || m.ty
      });
      if (m.ref) seenRefs.add(m.ref + '_' + (qtyChange >= 0 ? 'in' : 'out'));
    });

    // 2. Sales Invoices referencing this product (if not already represented in stockMovements)
    let totalSoldQty = 0;
    let totalSalesValue = 0;
    const productInvoices = [];
    (D.invoices || []).forEach((v, invIdx) => {
      const lines = (v[6] || []).filter(l => l.p === prodIdx);
      if (!lines.length) return;
      productInvoices.push({ invIdx, v });
      lines.forEach(l => {
        totalSoldQty += l.q;
        totalSalesValue += (l.q * l.pr);
        if (!seenRefs.has(v[0] + '_out')) {
          seenRefs.add(v[0] + '_out');
          events.push({
            ts: v.createdTs || (nowTs - (invIdx + 3) * dayMs),
            dateStr: v.dateStr || fmtDt(v.createdTs || nowTs, curF),
            type: 'sale',
            ref: v[0],
            challan: v.challan || '',
            invIdx,
            qtyChange: -l.q,
            party: D.customers[v[1]] ? L(D.customers[v[1]], curF) : 'Customer',
            remarks: `Sales Invoice @ ${(curF?.tk ? curF.tk(l.pr) : '৳' + l.pr)}/KG`
          });
        }
      });
    });

    // 3. Purchases & Shipments referencing this product
    let totalPurchQty = 0;
    let totalPurchValue = 0;
    const purchaseRecords = [];
    const seenPurchRefs = new Set();

    (D.purchases || []).forEach(pur => {
      const items = pur.items || [{ p: pur.prodIdx, q: pur.kg, rate: pur.rate }];
      items.filter(it => it.p === prodIdx).forEach(it => {
        totalPurchQty += it.q;
        totalPurchValue += Math.round(it.q * (it.rate || pur.rate || p.cost));
        purchaseRecords.push({
          ref: pur.no,
          dateStr: pur.dtStr || fmtDt(pur.ts, curF),
          ts: pur.ts,
          supIdx: pur.supIdx,
          supplier: D.suppliers[pur.supIdx] ? L(D.suppliers[pur.supIdx], curF) : 'Supplier',
          qty: it.q,
          rate: it.rate || pur.rate,
          total: pur.total,
          status: pur.status
        });
        seenPurchRefs.add(pur.no);
        if (pur.status === 'received' && !seenRefs.has(pur.no + '_in')) {
          seenRefs.add(pur.no + '_in');
          events.push({
            ts: pur.ts || (nowTs - 10 * dayMs),
            dateStr: pur.dtStr || fmtDt(pur.ts, curF),
            type: 'purchase',
            ref: pur.no,
            purchRef: pur.no,
            qtyChange: it.q,
            party: D.suppliers[pur.supIdx] ? L(D.suppliers[pur.supIdx], curF) : 'Supplier',
            remarks: `Local Purchase @ ৳${it.rate || pur.rate}/KG`
          });
        }
      });
    });

    (D.shipments || []).forEach((s, idx) => {
      if (s[2] !== prodIdx || seenPurchRefs.has(s[0])) return;
      const rate = s[7] || s[6] || p.cost;
      totalPurchQty += s[3];
      totalPurchValue += Math.round(s[3] * rate);
      purchaseRecords.push({
        ref: s[0],
        dateStr: s.dtStr || fmtDt(s.ts || (nowTs - (idx + 6) * dayMs), curF),
        ts: s.ts || (nowTs - (idx + 6) * dayMs),
        supIdx: s[1],
        supplier: D.suppliers[s[1]] ? L(D.suppliers[s[1]], curF) : 'Supplier',
        qty: s[3],
        rate,
        total: s[9] || Math.round(s[3] * rate),
        status: s[4]
      });
      if (s[4] === 'received' && !seenRefs.has(s[0] + '_in')) {
        seenRefs.add(s[0] + '_in');
        events.push({
          ts: s.ts || (nowTs - (idx + 6) * dayMs),
          dateStr: s.dtStr || fmtDt(s.ts || nowTs, curF),
          type: 'purchase',
          ref: s[0],
          purchRef: s[0],
          qtyChange: s[3],
          party: D.suppliers[s[1]] ? L(D.suppliers[s[1]], curF) : 'Supplier',
          remarks: `Import Shipment (${s[4]}) @ ৳${rate}/KG`
        });
      }
    });

    // 4. Purchase returns on this product
    (D.returns || []).filter(r => r.p === prodIdx).forEach((r, idx) => {
      const refKey = (r.ref || 'RET-' + idx) + '_out';
      if (!seenRefs.has(refKey)) {
        seenRefs.add(refKey);
        events.push({
          ts: r.ts || (nowTs - 4 * dayMs),
          dateStr: r.dtStr || fmtDt(r.ts || nowTs, curF),
          type: 'adjustment',
          ref: r.ref || ('RET-' + idx),
          purchRef: r.ref,
          qtyChange: -(r.q || 0),
          party: 'Supplier Return',
          remarks: 'Purchase Return: ' + (r.why || '')
        });
      }
    });

    // Compute exact net event change so opening balance reconciles mathematically to current p.kg!
    const netDelta = sum(events.map(e => e.qtyChange));
    const openingBal = Math.round((p.kg - netDelta) * 100) / 100;

    const minTs = events.length ? Math.min(...events.map(e => e.ts)) - dayMs : (nowTs - 30 * dayMs);
    events.push({
      ts: minTs,
      dateStr: fmtDt(minTs, curF),
      type: 'opening',
      ref: 'OPEN-' + (p.sku || '001'),
      qtyChange: openingBal,
      party: 'Opening Inventory',
      remarks: 'Reconciled Opening Stock Balance'
    });

    events.sort((a, b) => a.ts - b.ts);
    let runBal = 0;
    events.forEach(ev => {
      ev.prevStock = Math.round(runBal * 100) / 100;
      runBal += ev.qtyChange;
      ev.updatedStock = Math.round(runBal * 100) / 100;
    });

    return {
      product: p,
      prodIdx,
      openingStock: openingBal,
      currentStock: p.kg,
      stockValueCost: Math.round(p.kg * p.cost),
      stockValueRetail: Math.round(p.kg * p.price),
      totalSoldQty: Math.max(totalSoldQty, p.sold || 0),
      invoiceSoldQty: totalSoldQty,
      totalSalesValue: totalSalesValue || ((p.sold || 0) * p.price),
      invoiceCount: productInvoices.length,
      recentInvoices: productInvoices,
      totalPurchQty,
      totalPurchValue,
      purchaseRecords,
      adjustmentsNet: p.adj || 0,
      events: [...events].reverse()
    };
  }

  /* ---------------- 6. Customer Financial Ledger Engine ---------------- */
  function calcCustomerLedgerNet(custIdx, D) {
    let net = 0;
    (D.invoices || []).forEach(v => {
      if (v[1] !== custIdx) return;
      net += (+v[2] || 0);
      const postedPays = (v.payments || []).filter(p => p.status === 'posted');
      net -= sum(postedPays.map(p => +p.amt || 0));
    });
    (D.dueCollections || []).forEach(dc => {
      if (dc.custId !== custIdx || dc.linkedPayId) return;
      net -= (+dc.amt || 0);
    });
    (D.customerTx || []).forEach(txItem => {
      if (txItem.custIdx !== custIdx) return;
      if (txItem.dir === 'debit') net += (+txItem.amt || 0);
      else net -= (+txItem.amt || 0);
    });
    return net;
  }

  function reconcileCustomer(custIdx, f) {
    const D = getD(f);
    if (!D || !D.customers[custIdx]) return 0;
    const c = D.customers[custIdx];
    const open = +c.openingDue || 0;
    const net = calcCustomerLedgerNet(custIdx, D);
    c.due = Math.max(0, Math.round((open + net) * 100) / 100);
    if (c.due <= 0) c.days = 0;
    else if (!c.days) c.days = 1;
    return c.due;
  }

  function getCustomerTransactions(custIdx, f) {
    const curF = f || getF();
    const D = getD(curF);
    if (!D || !D.customers[custIdx]) return { entries: [], totals: { debit: 0, credit: 0, sales: 0, payments: 0, returns: 0, adjustments: 0, opening: 0, closing: 0 } };
    const c = D.customers[custIdx];
    const rows = [];
    const dayMs = 86400000;
    const baseMinTs = Date.now() - 60 * dayMs;

    const open = +c.openingDue || 0;
    if (open !== 0 || true) {
      rows.push({
        id: 'OPEN-C-' + (101 + custIdx),
        ts: baseMinTs,
        dateStr: fmtDt(baseMinTs, curF),
        type: 'opening',
        typeLabel: 'Opening Balance',
        ref: c.code || ('CUST-' + (101 + custIdx)),
        desc: 'Opening receivable balance brought forward',
        method: '—',
        debit: open > 0 ? open : 0,
        credit: open < 0 ? -open : 0,
        notes: ''
      });
    }

    (D.invoices || []).forEach((v, invIdx) => {
      if (v[1] !== custIdx) return;
      const ts = v.createdTs || (Date.now() - (invIdx + 1) * dayMs);
      rows.push({
        id: v[0],
        ts,
        dateStr: v.dateStr || fmtDt(ts, curF),
        type: 'invoice',
        typeLabel: 'Sales Invoice',
        ref: v[0],
        invIdx,
        desc: `Sales Invoice ${v[0]}${v.challan ? ' (Challan: ' + v.challan + ')' : ''}`,
        method: v[7] || 'm_cash',
        debit: +v[2] || 0,
        credit: 0,
        notes: v[4]
      });

      (v.payments || []).forEach((p, pIdx) => {
        if (p.status === 'posted') {
          rows.push({
            id: p.id,
            ts: (p.dt || ts) + 1000 + pIdx,
            dateStr: p.dtStr || fmtDt(p.dt || ts, curF),
            type: 'payment',
            typeLabel: 'Payment Received',
            ref: p.ref || p.id,
            relatedRef: v[0],
            invIdx,
            desc: `Payment against ${v[0]}${p.note ? ' · ' + p.note : ''}`,
            method: p.m || 'm_cash',
            debit: 0,
            credit: +p.amt || 0,
            notes: p.note || ''
          });
        } else if (p.status === 'reversed') {
          rows.push({
            id: p.id,
            ts: (p.dt || ts) + 1000 + pIdx,
            dateStr: p.dtStr || fmtDt(p.dt || ts, curF),
            type: 'payment',
            typeLabel: 'Payment Received (Reversed)',
            ref: p.ref || p.id,
            relatedRef: v[0],
            invIdx,
            desc: `Original payment against ${v[0]}`,
            method: p.m || 'm_cash',
            debit: 0,
            credit: +p.amt || 0,
            notes: p.note || ''
          });
        } else if (p.status === 'reversal') {
          rows.push({
            id: p.id,
            ts: (p.dt || ts) + 2000 + pIdx,
            dateStr: p.dtStr || fmtDt(p.dt || ts, curF),
            type: 'adjustment',
            typeLabel: 'Payment Reversal',
            ref: p.id,
            relatedRef: v[0],
            invIdx,
            desc: p.note || `Reversal for ${v[0]}`,
            method: p.m || 'm_cash',
            debit: Math.abs(+p.amt || 0),
            credit: 0,
            notes: p.revReason || ''
          });
        }
      });
    });

    (D.dueCollections || []).forEach((dc, idx) => {
      if (dc.custId !== custIdx || dc.linkedPayId) return;
      const ts = dc.dt || (Date.now() - (idx + 2) * dayMs);
      rows.push({
        id: dc.id,
        ts,
        dateStr: dc.dtStr || fmtDt(ts, curF),
        type: 'payment',
        typeLabel: 'Due Collection',
        ref: dc.ref || dc.id,
        relatedRef: dc.invNo || 'GEN-RECV',
        desc: dc.remarks || 'Customer receivable collection',
        method: dc.m || 'm_cash',
        debit: 0,
        credit: +dc.amt || 0,
        notes: dc.remarks || ''
      });
    });

    (D.customerTx || []).forEach(txItem => {
      if (txItem.custIdx !== custIdx) return;
      const isDeb = txItem.dir === 'debit';
      rows.push({
        id: txItem.id,
        ts: txItem.ts || Date.now(),
        dateStr: txItem.dtStr || fmtDt(txItem.ts, curF),
        type: txItem.type || 'adjustment',
        typeLabel: txItem.typeLabel || (txItem.type === 'sales_return' ? 'Sales Return' : txItem.type === 'discount' ? 'Discount' : isDeb ? 'Debit Adjustment' : 'Credit Adjustment'),
        ref: txItem.ref || txItem.id,
        relatedRef: txItem.relatedRef || '—',
        desc: txItem.desc || txItem.typeLabel || 'Adjustment',
        method: txItem.method || '—',
        debit: isDeb ? (+txItem.amt || 0) : 0,
        credit: isDeb ? 0 : (+txItem.amt || 0),
        notes: txItem.notes || ''
      });
    });

    rows.sort((a, b) => a.ts - b.ts);
    let run = 0;
    let totDebit = 0, totCredit = 0, totSales = 0, totPayments = 0, totReturns = 0, totAdj = 0;
    rows.forEach(r => {
      run += (r.debit - r.credit);
      r.balance = Math.round(run * 100) / 100;
      totDebit += r.debit;
      totCredit += r.credit;
      if (r.type === 'invoice') totSales += r.debit;
      if (r.type === 'payment') totPayments += r.credit;
      if (r.type === 'sales_return') totReturns += r.credit;
      if (r.type === 'adjustment' || r.type === 'discount') totAdj += (r.debit - r.credit);
    });

    const lastTx = rows.filter(r => r.type !== 'opening').at(-1);
    const lastPay = rows.filter(r => r.type === 'payment').at(-1);

    return {
      customer: c,
      custIdx,
      entries: rows,
      lastTxDate: lastTx ? lastTx.dateStr : '—',
      lastTxTs: lastTx ? lastTx.ts : 0,
      lastPayDate: lastPay ? lastPay.dateStr : '—',
      totals: {
        opening: open,
        debit: Math.round(totDebit * 100) / 100,
        credit: Math.round(totCredit * 100) / 100,
        sales: Math.round(totSales * 100) / 100,
        payments: Math.round(totPayments * 100) / 100,
        returns: Math.round(totReturns * 100) / 100,
        adjustments: Math.round(totAdj * 100) / 100,
        closing: c.due
      }
    };
  }

  /* ---------------- 7. Unified Purchase & Supplier Financial Engine ---------------- */
  function getAllPurchases(f) {
    const curF = f || getF();
    const D = getD(curF);
    if (!D) return [];
    const list = [];
    const seen = new Set();

    (D.purchases || []).forEach((p, idx) => {
      seen.add(p.no);
      const due = Math.max(0, (p.total || 0) - (p.paid || 0));
      const status = due <= 0 ? 'paid' : (p.paid > 0 ? 'partial' : 'due');
      list.push({
        uid: 'PO_' + idx,
        kind: 'local',
        idx,
        ref: p.no,
        ts: p.ts || Date.now(),
        dateStr: p.dtStr || (p.d ? (curF?.S?.lang === 'bn' ? p.d[0] : p.d[1]) : fmtDt(Date.now(), curF)),
        supIdx: p.supIdx,
        prodIdx: p.prodIdx,
        kg: p.kg || 0,
        rate: p.rate || 0,
        charges: p.charges || 0,
        total: p.total || 0,
        paid: p.paid || 0,
        due,
        payStatus: status,
        delivStatus: p.status || 'arrived',
        method: p.m || 'm_bank',
        by: p.by || 'Admin',
        payments: p.payments || [],
        raw: p
      });
    });

    (D.shipments || []).forEach((s, idx) => {
      if (seen.has(s[0])) return;
      seen.add(s[0]);
      const prod = D.products[s[2]] || { cost: 95 };
      const unitRate = s[7] || s[6] || prod.cost || 95;
      const charges = s[8] || 0;
      const total = s[9] !== undefined ? s[9] : Math.round((s[3] || 0) * unitRate + charges);
      const paid = s[10] !== undefined ? s[10] : (s[4] === 'received' ? total : 0);
      const due = Math.max(0, total - paid);
      const status = due <= 0 ? 'paid' : (paid > 0 ? 'partial' : 'due');
      list.push({
        uid: 'SH_' + idx,
        kind: 'import',
        idx,
        ref: s[0],
        ts: s.ts || Date.now(),
        dateStr: s.dtStr || fmtDt(s.ts || Date.now(), curF),
        supIdx: s[1],
        prodIdx: s[2],
        kg: s[3] || 0,
        rate: unitRate,
        charges,
        total,
        paid,
        due,
        payStatus: status,
        delivStatus: s[4] || 'transit',
        method: 'm_bank',
        by: 'Admin',
        payments: s.payments || [],
        raw: s
      });
    });

    list.sort((a, b) => b.ts - a.ts);
    return list;
  }

  function calcSupplierLedgerNet(supIdx, D) {
    let net = 0;
    const allP = getAllPurchases({ D });
    allP.filter(p => p.supIdx === supIdx).forEach(p => {
      net += (+p.total || 0);
      if (p.payments && p.payments.length) {
        net -= sum(p.payments.filter(pay => pay.status !== 'reversed').map(pay => +pay.amt || 0));
      } else {
        net -= (+p.paid || 0);
      }
    });
    (D.supplierTx || []).forEach(txItem => {
      if (txItem.supIdx !== supIdx) return;
      if (txItem.dir === 'credit') net += (+txItem.amt || 0);
      else net -= (+txItem.amt || 0);
    });
    return net;
  }

  function reconcileSupplier(supIdx, f) {
    const D = getD(f);
    if (!D || !D.suppliers[supIdx]) return 0;
    const s = D.suppliers[supIdx];
    const open = +s.openingPayable || 0;
    const net = calcSupplierLedgerNet(supIdx, D);
    s.payable = Math.max(0, Math.round((open + net) * 100) / 100);
    if (D.cashBank) {
      D.cashBank.payable = sum(D.suppliers.map(x => +x.payable || 0));
    }
    return s.payable;
  }

  function getSupplierTransactions(supIdx, f) {
    const curF = f || getF();
    const D = getD(curF);
    if (!D || !D.suppliers[supIdx]) return { entries: [], totals: { debit: 0, credit: 0, purchases: 0, payments: 0, returns: 0, adjustments: 0, opening: 0, closing: 0 } };
    const s = D.suppliers[supIdx];
    const rows = [];
    const dayMs = 86400000;
    const baseMinTs = Date.now() - 60 * dayMs;
    const open = +s.openingPayable || 0;

    // For suppliers (Liability): Credit increases payable, Debit decreases payable
    rows.push({
      id: 'OPEN-S-' + (101 + supIdx),
      ts: baseMinTs,
      dateStr: fmtDt(baseMinTs, curF),
      type: 'opening',
      typeLabel: 'Opening Payable',
      ref: s.code || ('SUP-' + (101 + supIdx)),
      desc: 'Opening payable balance brought forward',
      method: '—',
      debit: open < 0 ? -open : 0,
      credit: open > 0 ? open : 0,
      notes: ''
    });

    const supsPurch = getAllPurchases(curF).filter(p => p.supIdx === supIdx);
    supsPurch.forEach((p, idx) => {
      const prod = D.products[p.prodIdx] || { n: { bn: 'পণ্য', en: 'Product' } };
      rows.push({
        id: p.ref,
        ts: p.ts || (Date.now() - (idx + 2) * dayMs),
        dateStr: p.dateStr,
        type: 'purchase',
        typeLabel: p.kind === 'import' ? 'Import Shipment' : 'Purchase Order',
        ref: p.ref,
        purchRef: p.ref,
        desc: `${L(prod.n, curF)} (${p.kg} KG @ ৳${p.rate})`,
        method: p.method,
        debit: 0,
        credit: +p.total || 0,
        notes: p.delivStatus
      });

      if (p.payments && p.payments.length) {
        p.payments.forEach((pay, pIdx) => {
          if (pay.status === 'reversed') return;
          rows.push({
            id: pay.id,
            ts: (pay.dt || p.ts) + 1000 + pIdx,
            dateStr: pay.dtStr || fmtDt(pay.dt || p.ts, curF),
            type: 'payment',
            typeLabel: 'Supplier Payment',
            ref: pay.ref || pay.id,
            relatedRef: p.ref,
            purchRef: p.ref,
            desc: `Payment for ${p.ref}${pay.note ? ' · ' + pay.note : ''}`,
            method: pay.m || 'm_bank',
            debit: +pay.amt || 0,
            credit: 0,
            notes: pay.note || ''
          });
        });
      }
    });

    (D.supplierTx || []).forEach(txItem => {
      if (txItem.supIdx !== supIdx) return;
      const isCred = txItem.dir === 'credit';
      rows.push({
        id: txItem.id,
        ts: txItem.ts || Date.now(),
        dateStr: txItem.dtStr || fmtDt(txItem.ts, curF),
        type: txItem.type || 'adjustment',
        typeLabel: txItem.typeLabel || (txItem.type === 'purchase_return' ? 'Purchase Return' : isCred ? 'Credit Adjustment' : 'Debit Adjustment'),
        ref: txItem.ref || txItem.id,
        relatedRef: txItem.relatedRef || '—',
        desc: txItem.desc || txItem.typeLabel || 'Supplier adjustment',
        method: txItem.method || '—',
        debit: isCred ? 0 : (+txItem.amt || 0),
        credit: isCred ? (+txItem.amt || 0) : 0,
        notes: txItem.notes || ''
      });
    });

    rows.sort((a, b) => a.ts - b.ts);
    let run = 0;
    let totDebit = 0, totCredit = 0, totPurch = 0, totPay = 0, totRet = 0, totAdj = 0;
    rows.forEach(r => {
      run += (r.credit - r.debit);
      r.balance = Math.round(run * 100) / 100;
      totDebit += r.debit;
      totCredit += r.credit;
      if (r.type === 'purchase') totPurch += r.credit;
      if (r.type === 'payment') totPay += r.debit;
      if (r.type === 'purchase_return') totRet += r.debit;
      if (r.type === 'adjustment') totAdj += (r.credit - r.debit);
    });

    const lastTx = rows.filter(r => r.type !== 'opening').at(-1);
    const lastPay = rows.filter(r => r.type === 'payment').at(-1);

    return {
      supplier: s,
      supIdx,
      entries: rows,
      purchases: supsPurch,
      lastTxDate: lastTx ? lastTx.dateStr : '—',
      lastTxTs: lastTx ? lastTx.ts : 0,
      lastPayDate: lastPay ? lastPay.dateStr : '—',
      totals: {
        opening: open,
        debit: Math.round(totDebit * 100) / 100,
        credit: Math.round(totCredit * 100) / 100,
        purchases: Math.round(totPurch * 100) / 100,
        payments: Math.round(totPay * 100) / 100,
        returns: Math.round(totRet * 100) / 100,
        adjustments: Math.round(totAdj * 100) / 100,
        closing: s.payable
      }
    };
  }

  /* ---------------- 8. Synchronized Write Operations ---------------- */
  function postCashBank(D, method, delta) {
    if (!D.cashBank) return;
    if (method === 'm_cash') D.cashBank.cash += delta;
    else if (method === 'm_adminrecv') D.cashBank.adminCash = (D.cashBank.adminCash || 0) + delta;
    else D.cashBank.bank += delta;
  }

  function addCustomerAdjustment(f, { custIdx, type, amt, ref, desc, notes, method, dtTs }) {
    return tx(f, (curF, D) => {
      const c = D.customers[custIdx];
      if (!c) return false;
      const now = dtTs || Date.now();
      const dir = (type === 'debit_adj' || type === 'opening_debit') ? 'debit' : 'credit';
      const labels = {
        sales_return: 'Sales Return',
        credit_adj: 'Credit Adjustment',
        debit_adj: 'Debit Adjustment',
        discount: 'Account Discount',
        opening_debit: 'Opening Balance Adjustment'
      };
      const id = 'CADJ-' + (++D.txSeq);
      D.customerTx.push({
        id,
        custIdx,
        ts: now,
        dtStr: fmtDt(now, curF),
        type,
        typeLabel: labels[type] || 'Adjustment',
        dir,
        amt: +amt,
        ref: ref || id,
        desc: desc || labels[type],
        notes: notes || '',
        method: method || '—',
        by: curF?.S?.user ? L(curF.S.user.n, curF) : 'Admin'
      });
      reconcileCustomer(custIdx, curF);
      if (typeof LOG !== 'undefined') {
        LOG.add({
          m: 'dues',
          t: 'adjust',
          recordType: 'customer_adjustment',
          recordId: id,
          msg: `${L(c, curF)} – ${labels[type] || type}: ${amt}`
        });
      }
      return id;
    });
  }

  function addSupplierAdjustment(f, { supIdx, type, amt, ref, desc, notes, method, dtTs }) {
    return tx(f, (curF, D) => {
      const s = D.suppliers[supIdx];
      if (!s) return false;
      const now = dtTs || Date.now();
      const dir = (type === 'debit_adj' || type === 'purchase_return' || type === 'discount' || type === 'payment') ? 'debit' : 'credit';
      const labels = {
        purchase_return: 'Purchase Return',
        credit_adj: 'Credit Adjustment (+Payable)',
        debit_adj: 'Debit Adjustment (−Payable)',
        discount: 'Supplier Discount',
        payment: 'Supplier Payment'
      };
      const id = 'SADJ-' + (++D.txSeq);
      if (type === 'payment') {
        postCashBank(D, method || 'm_bank', -(+amt));
        s.tx.push(['m', +amt, [fmtDt(now, curF), fmtDt(now, curF)]]);
        D.supplierTx.push({
          id, supIdx, ts: now, dtStr: fmtDt(now, curF),
          type: 'payment', typeLabel: 'Supplier Payment', dir: 'debit',
          amt: +amt, ref: ref || id, desc: desc || 'Supplier payment', notes: notes || '', method: method || 'm_bank'
        });
      } else {
        if (type === 'purchase_return') s.tx.push(['r', +amt, [fmtDt(now, curF), fmtDt(now, curF)]]);
        D.supplierTx.push({
          id, supIdx, ts: now, dtStr: fmtDt(now, curF),
          type, typeLabel: labels[type] || 'Adjustment', dir,
          amt: +amt, ref: ref || id, desc: desc || labels[type], notes: notes || '', method: method || '—'
        });
      }
      reconcileSupplier(supIdx, curF);
      if (typeof LOG !== 'undefined') {
        LOG.add({
          m: 'dues',
          t: type === 'payment' ? 'save' : 'adjust',
          recordType: 'supplier_' + type,
          recordId: id,
          msg: `${L(s, curF)} – ${labels[type] || type}: ${amt}`
        });
      }
      return id;
    });
  }

  window.FIN = {
    boot,
    tx,
    deepClone,
    isVatOn,
    getVatPct,
    canEditDel,
    recordStockMove,
    getProductHistory,
    reconcileCustomer,
    getCustomerTransactions,
    getAllPurchases,
    reconcileSupplier,
    getSupplierTransactions,
    postCashBank,
    addCustomerAdjustment,
    addSupplierAdjustment,
    fmtDt,
    fmtDtTime
  };
})();
