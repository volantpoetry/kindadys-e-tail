(function () {
  'use strict';

  function $(id) { return document.getElementById(id); }

  function currency() {
    return ($('currency') && $('currency').value) || 'GHS â‚µ';
  }
  function money(n) {
    return currency() + ' ' + Number(n || 0).toFixed(2);
  }

  function addRow(desc, qty, price) {
    desc = desc || '';
    qty = qty == null ? 1 : qty;
    price = price == null ? 0 : price;

    var tbody = $('itemsBody');
    var tr = document.createElement('tr');

    var tdDesc = document.createElement('td');
    tdDesc.innerHTML = '<input type="text" class="it-desc" placeholder="Item description">';
    tdDesc.querySelector('input').value = desc;

    var tdQty = document.createElement('td');
    tdQty.className = 'c-qty';
    tdQty.innerHTML = '<input type="number" class="it-qty" inputmode="numeric" min="1" step="1" placeholder="1">';
    tdQty.querySelector('input').value = qty;

    var tdPrice = document.createElement('td');
    tdPrice.className = 'c-price';
    tdPrice.innerHTML = '<input type="number" class="it-price" inputmode="decimal" min="0" step="0.01" placeholder="0.00">';
    tdPrice.querySelector('input').value = price;

    var tdAmt = document.createElement('td');
    tdAmt.className = 'c-amt';
    tdAmt.textContent = money(qty * price);

    var tdDel = document.createElement('td');
    tdDel.className = 'c-del no-print';
    var del = document.createElement('button');
    del.className = 'btn danger';
    del.style.padding = '4px 9px';
    del.textContent = '\u2715';
    del.onclick = function () { tr.remove(); calcTotals(); };
    tdDel.appendChild(del);

    tr.appendChild(tdDesc);
    tr.appendChild(tdQty);
    tr.appendChild(tdPrice);
    tr.appendChild(tdAmt);
    tr.appendChild(tdDel);
    tbody.appendChild(tr);

    calcTotals();
  }

  function calcTotals() {
    var subtotal = 0;
    Array.prototype.forEach.call($('itemsBody').rows, function (tr) {
      var qty = Number(tr.querySelector('.it-qty').value) || 0;
      var price = Number(tr.querySelector('.it-price').value) || 0;
      var line = qty * price;
      subtotal += line;
      tr.querySelector('.c-amt').textContent = money(line);
    });

    var discount = Number($('discount').value) || 0;
    var taxRate = Number($('taxRate').value) || 0;
    var afterDiscount = Math.max(subtotal - discount, 0);
    var tax = afterDiscount * (taxRate / 100);
    var grand = afterDiscount + tax;
    var paid = Number($('amountPaid').value) || 0;
    var change = paid - grand;

    $('subtotal').textContent = money(subtotal);
    $('grandTotal').textContent = money(grand);
    $('change').textContent = money(change);
  }

  function clearInvalid() {
    [$('buyerName'), $('buyerContact'), $('buyerAddr'), $('payMethod'), $('transactionRef')].forEach(function (f) {
      if (f) { f.classList.remove('user-invalid'); f.setCustomValidity(''); }
    });
    Array.prototype.forEach.call($('itemsBody').querySelectorAll('.it-desc'), function (inp) {
      inp.classList.remove('user-invalid');
      inp.setCustomValidity('');
    });
  }

  function validate() {
    clearInvalid();
    var allFields = [$('buyerName'), $('buyerContact'), $('buyerAddr'), $('payMethod'), $('transactionRef')];
    var first = null;
    if (!allFields[0].value.trim()) first = allFields[0];
    else if (!allFields[1].value.trim()) first = allFields[1];
    else if (!allFields[2].value.trim()) first = allFields[2];
    else if (!allFields[3].value) first = allFields[3];
    else if (!allFields[4].value.trim()) first = allFields[4];
    var rows = $('itemsBody').rows;
    if (!first && !rows.length) { alert('Please add at least one item.'); return false; }
    if (!first) {
      var marked = false;
      Array.prototype.forEach.call(rows, function (tr) {
        var inp = tr.querySelector('.it-desc');
        if (!inp.value.trim() && !marked) { first = inp; marked = true; }
      });
    }
    if (first) {
      first.classList.add('user-invalid');
      first.setCustomValidity('Required');
      first.focus();
      first.reportValidity && first.reportValidity();
      return false;
    }
    return true;
  }

  function downloadPDF() {
    if (!validate()) return;
    var element = $('receipt');
    var no = ($('receiptNo').value || 'receipt').replace(/[\\/:*?"<>|]/g, '-');
    var opt = {
      margin: [5, 5, 5, 5],
      filename: 'kindadys-etail-' + no + '.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 3,
        useCORS: true,
        allowTaint: false,
        scrollY: 0,
        backgroundColor: '#ffffff',
        width: element.offsetWidth,
        height: element.offsetHeight
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  }

  function newReceipt() {
    if (!confirm('Clear current receipt and start new?')) return;
    clearInvalid();
    Array.prototype.forEach.call(document.querySelectorAll('#receipt input, #receipt textarea'), function (el) {
      if (el.type === 'number') el.value = 0;
      else if (el.tagName === 'SELECT') el.selectedIndex = 0;
      else el.value = '';
    });
    $('sellerName').value = "Kindady's e-Tail";
    $('sellerPhone').value = '0595736002';
    $('sellerEmail').value = 'asordora992@gmail.com';
    $('receiptNo').value = nextReceiptNo();
    $('payMethod').value = '';
    $('transactionRef').value = '';
    $('itemsBody').innerHTML = '';
    addRow('', 1, 0);
    calcTotals();
  }

  function todayStr() {
    return new Date().toISOString().slice(0, 10);
  }
  function nextReceiptNo() {
    return 'RCP-' + String(Math.floor(Math.random() * 9000) + 1000);
  }

  // Delegated recalculation for editable rows
  $('itemsBody').addEventListener('input', function (e) {
    if (e.target.classList.contains('it-qty') || e.target.classList.contains('it-price') || e.target.classList.contains('it-desc')) {
      if (e.target.classList.contains('it-desc')) e.target.classList.remove('user-invalid');
      calcTotals();
    }
  });
  ['discount', 'taxRate', 'amountPaid', 'currency', 'payMethod', 'transactionRef', 'buyerName', 'buyerContact', 'buyerAddr'].forEach(function (id) {
    $(id).addEventListener('input', function () { $(id).classList.remove('user-invalid'); calcTotals(); });
    $(id).addEventListener('change', function () { $(id).classList.remove('user-invalid'); calcTotals(); });
  });

  $('addRowBtn').onclick = function () { addRow('', 1, 0); };
  $('printBtn').onclick = function () { if (validate()) { saveToHistory(); window.print(); } };
  $('resetBtn').onclick = newReceipt;

  // ---------- History ----------
  var HISTORY_KEY = 'kindadys_receipts_v1';

  function readHistory() {
    try {
      var raw = localStorage.getItem(HISTORY_KEY);
      var list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (e) { return []; }
  }
  function writeHistory(list) {
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(list)); } catch (e) {}
  }
  function fmt(cur, n) { return cur + ' ' + Number(n || 0).toFixed(2); }

  function snapshot() {
    var cur = currency();
    var items = [];
    Array.prototype.forEach.call($('itemsBody').rows, function (tr) {
      items.push({
        desc: tr.querySelector('.it-desc').value,
        qty: Number(tr.querySelector('.it-qty').value) || 0,
        price: Number(tr.querySelector('.it-price').value) || 0
      });
    });
    var subtotal = 0;
    items.forEach(function (it) { subtotal += it.qty * it.price; });
    var discount = Number($('discount').value) || 0;
    var taxRate = Number($('taxRate').value) || 0;
    var afterDiscount = Math.max(subtotal - discount, 0);
    var grand = afterDiscount + afterDiscount * (taxRate / 100);
    var paid = Number($('amountPaid').value) || 0;
    return {
      receiptNo: $('receiptNo').value,
      date: $('receiptDate').value,
      createdAt: Date.now(),
      currency: cur,
      seller: { name: $('sellerName').value, phone: $('sellerPhone').value, email: $('sellerEmail').value, addr: $('sellerAddr').value },
      buyer: { name: $('buyerName').value, contact: $('buyerContact').value, addr: $('buyerAddr').value },
      items: items,
      totals: { subtotal: subtotal, discount: discount, taxRate: taxRate, grand: grand, paid: paid, change: paid - grand },
      payment: { method: $('payMethod').value, ref: $('transactionRef').value }
    };
  }

  function saveToHistory() {
    var snap = snapshot();
    var list = readHistory();
    var idx = -1;
    for (var i = 0; i < list.length; i++) {
      if (list[i].receiptNo === snap.receiptNo) { idx = i; break; }
    }
    if (idx >= 0) { snap.createdAt = list[idx].createdAt || snap.createdAt; list.splice(idx, 1); }
    list.unshift(snap);
    if (list.length > 200) list = list.slice(0, 200);
    writeHistory(list);
  }

  function renderHistory() {
    var q = (($('historySearch') && $('historySearch').value) || '').trim().toLowerCase();
    var list = readHistory();
    var box = $('historyList');
    box.innerHTML = '';
    var shown = 0;
    list.forEach(function (r) {
      var hay = (String(r.receiptNo || '') + ' ' + ((r.buyer && r.buyer.name) || '')).toLowerCase();
      if (q && hay.indexOf(q) === -1) return;
      shown++;
      var item = document.createElement('div');
      item.className = 'history-item';

      var main = document.createElement('div');
      main.className = 'h-main';
      var no = document.createElement('div');
      no.className = 'h-no';
      no.textContent = r.receiptNo || '(no #)';
      var meta = document.createElement('div');
      meta.className = 'h-meta';
      var total = (r.totals && r.totals.grand) || 0;
      meta.textContent = [(r.buyer && r.buyer.name) || 'No customer', r.date || '', fmt(r.currency || currency(), total)].filter(Boolean).join('  ·  ');
      main.appendChild(no);
      main.appendChild(meta);

      var actions = document.createElement('div');
      actions.className = 'h-actions';
      var openBtn = document.createElement('button');
      openBtn.className = 'btn';
      openBtn.textContent = 'Open';
      openBtn.onclick = function () { loadReceipt(r); };
      var delBtn = document.createElement('button');
      openBtn.style.padding = '5px 10px';
      delBtn.className = 'btn danger';
      delBtn.style.padding = '4px 9px';
      delBtn.textContent = '\u2715';
      delBtn.title = 'Delete';
      delBtn.onclick = function () { deleteEntry(r.receiptNo, r.createdAt); };
      actions.appendChild(openBtn);
      actions.appendChild(delBtn);

      item.appendChild(main);
      item.appendChild(actions);
      box.appendChild(item);
    });
    if (!shown) {
      var empty = document.createElement('div');
      empty.className = 'history-empty';
      empty.textContent = q ? 'No matching receipts.' : 'No receipts saved yet.';
      box.appendChild(empty);
    }
  }

  function deleteEntry(receiptNo, createdAt) {
    var list = readHistory();
    var next = list.filter(function (r) { return !(r.receiptNo === receiptNo && r.createdAt === createdAt); });
    writeHistory(next);
    renderHistory();
  }

  function openHistory() { renderHistory(); $('historyModal').classList.remove('hidden'); }
  function closeHistory() { $('historyModal').classList.add('hidden'); }

  function loadReceipt(r) {
    if (!confirm('Replace the current form with this saved receipt?')) return;
    $('sellerName').value = (r.seller && r.seller.name) || "Kindady's e-Tail";
    $('sellerPhone').value = (r.seller && r.seller.phone) || '';
    $('sellerEmail').value = (r.seller && r.seller.email) || '';
    $('sellerAddr').value = (r.seller && r.seller.addr) || '';
    $('buyerName').value = (r.buyer && r.buyer.name) || '';
    $('buyerContact').value = (r.buyer && r.buyer.contact) || '';
    $('buyerAddr').value = (r.buyer && r.buyer.addr) || '';
    $('receiptNo').value = r.receiptNo || '';
    $('receiptDate').value = r.date || todayStr();
    $('currency').value = r.currency || $('currency').value;
    $('discount').value = (r.totals && r.totals.discount) || 0;
    $('taxRate').value = (r.totals && r.totals.taxRate) || 0;
    $('amountPaid').value = (r.totals && r.totals.paid) || 0;
    $('payMethod').value = (r.payment && r.payment.method) || '';
    $('transactionRef').value = (r.payment && r.payment.ref) || '';
    $('itemsBody').innerHTML = '';
    var items = (r.items && r.items.length) ? r.items : [{ desc: '', qty: 1, price: 0 }];
    items.forEach(function (it) { addRow(it.desc || '', it.qty == null ? 1 : it.qty, it.price == null ? 0 : it.price); });
    calcTotals();
    closeHistory();
  }

  $('historyBtn').onclick = openHistory;
  $('historyClose').onclick = closeHistory;
  $('historyModal').addEventListener('click', function (e) {
    if (e.target === $('historyModal')) closeHistory();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeHistory();
  });
  $('historySearch').addEventListener('input', renderHistory);
  $('clearHistoryBtn').onclick = function () {
    if (!readHistory().length) return;
    if (!confirm('Delete all saved receipts? This cannot be undone.')) return;
    writeHistory([]);
    renderHistory();
  };

  // ---------- Install banner ----------
  (function () {
    var popEl = $('pwaInstallPop');
    if (!popEl) return;
    var btnEl = $('pwaInstallBtn');
    var closeEl = $('pwaCloseBtn');
    var deferredPrompt = null;
    var shown = false;
    var closed = false;
    var INSTALL_KEY = 'kindadys_install_dismissed_at';
    var DISMISS_EXPIRY_MS = 24 * 60 * 60 * 1000;

    function isInstalled() {
      return (window.matchMedia && (window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: minimal-ui)').matches)) ||
        (window.navigator && window.navigator.standalone === true);
    }
    if (isInstalled()) return;
    if (!('serviceWorker' in navigator)) return;

    var dismissedAt = 0;
    try { dismissedAt = parseInt(localStorage.getItem(INSTALL_KEY) || '0', 10) || 0; } catch (e) {}
    if (dismissedAt && (Date.now() - dismissedAt) < DISMISS_EXPIRY_MS) return;

    function showPop() {
      if (closed || shown) return;
      shown = true;
      setTimeout(function () { popEl.classList.add('show'); }, 1200);
    }
    function rememberDismiss() {
      try { localStorage.setItem(INSTALL_KEY, String(Date.now())); } catch (e) {}
    }

    window.addEventListener('beforeinstallprompt', function (e) {
      e.preventDefault();
      deferredPrompt = e;
      showPop();
    });

    btnEl.addEventListener('click', function () {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(function (choice) {
        if (choice && choice.outcome === 'dismissed') {
          rememberDismiss();
          popEl.classList.remove('show');
        }
        deferredPrompt = null;
      });
    });

    closeEl.addEventListener('click', function () {
      closed = true;
      rememberDismiss();
      popEl.classList.remove('show');
    });

    window.addEventListener('appinstalled', function () {
      try { localStorage.removeItem(INSTALL_KEY); } catch (e) {}
      popEl.classList.remove('show');
    });
  })();

  // Offline service worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).then(function (reg) {
        reg.update();
        setInterval(function () { reg.update(); }, 60 * 60 * 1000);
      }).catch(function () {});
    });
    var reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (reloaded) return;
      reloaded = true;
      window.location.reload();
    });
  }

  // Collapsible toolbar
  (function () {
    var topbar = $('topbar');
    var toggle = $('toolbarToggle');
    if (!topbar || !toggle) return;
    var KEY = 'kindadys_toolbar_open';
    function apply(open) {
      topbar.classList.toggle('hidden', !open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Hide toolbar' : 'Show toolbar');
    }
    var open = false;
    try { open = localStorage.getItem(KEY) === '1'; } catch (e) {}
    apply(open);
    toggle.onclick = function () {
      open = topbar.classList.contains('hidden');
      apply(open);
      try { localStorage.setItem(KEY, open ? '1' : '0'); } catch (e) {}
    };
  })();

  // ---------- Passcode lock ----------
  (function () {
    var screen = $('lockScreen');
    if (!screen) return;

    var HASH_KEY = 'kindadys_lock_hash';
    var SALT_KEY = 'kindadys_lock_salt';
    var ATT_KEY = 'kindadys_lock_attempts';
    var UNTIL_KEY = 'kindadys_lock_until';
    var HISTORY_KEY = 'kindadys_receipts_v1';
    var MAX_ATTEMPTS = 4;
    var LOCKOUT_MS = 24 * 60 * 60 * 1000;

    var card = screen.querySelector('.lock-card');
    var titleEl = $('lockTitle');
    var msgEl = $('lockMsg');
    var form = $('lockForm');
    var setupFields = $('setupFields');
    var unlockFields = $('unlockFields');
    var changeFields = $('changeFields');
    var newEl = $('lockNew');
    var confirmEl = $('lockConfirm');
    var inputEl = $('lockInput');
    var curEl = $('changeCurrent');
    var newChangeEl = $('changeNew');
    var cancelEl = $('lockCancel');
    var forgotEl = $('forgotBtn');
    var countEl = $('lockCountdown');

    var mode = 'unlock';
    var onUnlockCb = null;
    var countTimer = null;

    function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
    function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
    function lsDel(k) { try { localStorage.removeItem(k); } catch (e) {} }

    function getHash() { return lsGet(HASH_KEY); }
    function getSalt() { return lsGet(SALT_KEY); }
    function hasPasscode() { return !!getHash() && !!getSalt(); }
    function getAttempts() { return Number(lsGet(ATT_KEY)) || 0; }
    function setAttempts(n) { lsSet(ATT_KEY, String(n)); }
    function getUntil() { return Number(lsGet(UNTIL_KEY)) || 0; }

    function randSalt() {
      var a = new Uint8Array(16);
      if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(a);
      else for (var i = 0; i < a.length; i++) a[i] = Math.floor(Math.random() * 256);
      return Array.from(a).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
    }
    function hashPass(pass, salt) {
      if (window.crypto && crypto.subtle && window.TextEncoder) {
        var data = new TextEncoder().encode(salt + '::' + pass);
        return crypto.subtle.digest('SHA-256', data).then(function (buf) {
          return Array.from(new Uint8Array(buf)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
        });
      }
      var h = 0, s = salt + '::' + pass;
      for (var i = 0; i < s.length; i++) { h = (h << 5) - h + s.charCodeAt(i); h |= 0; }
      return Promise.resolve('fb-' + (h >>> 0).toString(16));
    }

    function fail(text) {
      msgEl.textContent = text;
      card.classList.remove('shake');
      void card.offsetWidth;
      card.classList.add('shake');
    }
    function resetFields() {
      setupFields.classList.add('hidden');
      unlockFields.classList.add('hidden');
      changeFields.classList.add('hidden');
      form.classList.remove('hidden');
      forgotEl.classList.add('hidden');
      cancelEl.classList.add('hidden');
      countEl.classList.add('hidden');
      msgEl.textContent = '';
    }
    function showSetup() {
      resetFields();
      mode = 'setup';
      titleEl.textContent = 'Create a passcode';
      setupFields.classList.remove('hidden');
      newEl.value = '';
      confirmEl.value = '';
      newEl.focus();
    }
    function showUnlock() {
      if (!hasPasscode()) { showSetup(); return; }
      resetFields();
      mode = 'unlock';
      titleEl.textContent = 'Enter passcode';
      unlockFields.classList.remove('hidden');
      forgotEl.classList.remove('hidden');
      inputEl.value = '';
      inputEl.focus();
    }
    function showChange() {
      if (!hasPasscode()) { showSetup(); return; }
      resetFields();
      mode = 'change';
      titleEl.textContent = 'Change passcode';
      changeFields.classList.remove('hidden');
      cancelEl.classList.remove('hidden');
      curEl.value = '';
      newChangeEl.value = '';
      curEl.focus();
    }
    function showLocked() {
      resetFields();
      mode = 'locked';
      titleEl.textContent = 'Too many attempts';
      msgEl.textContent = 'The app is locked. Please wait before trying again.';
      form.classList.add('hidden');
      countEl.classList.remove('hidden');
      if (countTimer) { clearInterval(countTimer); countTimer = null; }
      function tick() {
        var left = getUntil() - Date.now();
        if (left <= 0) {
          clearInterval(countTimer);
          countTimer = null;
          setAttempts(0);
          lsDel(UNTIL_KEY);
          showUnlock();
          return;
        }
        var s = Math.floor(left / 1000);
        var hh = String(Math.floor(s / 3600)).padStart(2, '0');
        var mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
        var ss = String(s % 60).padStart(2, '0');
        countEl.textContent = hh + ':' + mm + ':' + ss;
      }
      tick();
      countTimer = setInterval(tick, 1000);
    }
    function finishUnlock() {
      if (countTimer) { clearInterval(countTimer); countTimer = null; }
      screen.classList.add('hidden');
      if (typeof onUnlockCb === 'function') { var cb = onUnlockCb; onUnlockCb = null; cb(); }
    }

    function handleSetup() {
      var p = newEl.value, c = confirmEl.value;
      if (p.length < 4) { fail('Passcode must be at least 4 characters.'); return; }
      if (p !== c) { fail('Passcodes do not match.'); return; }
      var salt = randSalt();
      hashPass(p, salt).then(function (h) {
        lsSet(SALT_KEY, salt);
        lsSet(HASH_KEY, h);
        setAttempts(0);
        lsDel(UNTIL_KEY);
        finishUnlock();
      });
    }
    function handleUnlock() {
      var p = inputEl.value;
      if (!p) { fail('Enter your passcode.'); return; }
      hashPass(p, getSalt()).then(function (h) {
        if (h === getHash()) {
          setAttempts(0);
          lsDel(UNTIL_KEY);
          finishUnlock();
          return;
        }
        var n = getAttempts() + 1;
        setAttempts(n);
        if (n >= MAX_ATTEMPTS) {
          lsSet(UNTIL_KEY, String(Date.now() + LOCKOUT_MS));
          showLocked();
        } else {
          var left = MAX_ATTEMPTS - n;
          fail('Incorrect passcode. ' + left + ' attempt' + (left === 1 ? '' : 's') + ' left.');
          inputEl.value = '';
          inputEl.focus();
        }
      });
    }
    function handleChange() {
      var cur = curEl.value, np = newChangeEl.value;
      if (np.length < 4) { fail('New passcode must be at least 4 characters.'); return; }
      hashPass(cur, getSalt()).then(function (h) {
        if (h !== getHash()) {
          fail('Current passcode is incorrect.');
          curEl.value = '';
          curEl.focus();
          return;
        }
        var salt = randSalt();
        return hashPass(np, salt).then(function (nh) {
          lsSet(SALT_KEY, salt);
          lsSet(HASH_KEY, nh);
          setAttempts(0);
          lsDel(UNTIL_KEY);
          finishUnlock();
        });
      });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (mode === 'setup') handleSetup();
      else if (mode === 'unlock') handleUnlock();
      else if (mode === 'change') handleChange();
    });
    cancelEl.addEventListener('click', function () {
      screen.classList.add('hidden');
    });
    forgotEl.addEventListener('click', function () {
      if (!confirm('Reset the app? This deletes ALL saved receipts AND the passcode. This cannot be undone.')) return;
      lsDel(HASH_KEY); lsDel(SALT_KEY); lsDel(ATT_KEY); lsDel(UNTIL_KEY); lsDel(HISTORY_KEY);
      showSetup();
    });

    // Lock menu
    var lockBtn = $('lockBtn');
    var lockMenu = $('lockMenu');
    if (lockBtn && lockMenu) {
      lockBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        var nowHidden = lockMenu.classList.toggle('hidden');
        lockBtn.setAttribute('aria-expanded', String(!nowHidden));
      });
      document.addEventListener('click', function () {
        if (!lockMenu.classList.contains('hidden')) {
          lockMenu.classList.add('hidden');
          lockBtn.setAttribute('aria-expanded', 'false');
        }
      });
      lockMenu.addEventListener('click', function (e) {
        var action = e.target.getAttribute('data-action');
        if (!action) return;
        lockMenu.classList.add('hidden');
        lockBtn.setAttribute('aria-expanded', 'false');
        if (action === 'lock') {
          if (hasPasscode()) showUnlock(); else showSetup();
        } else if (action === 'change') {
          showChange();
        } else if (action === 'remove') {
          if (!hasPasscode()) { alert('No passcode is set.'); return; }
          var p = prompt('Enter your current passcode to remove protection:');
          if (p === null) return;
          hashPass(p, getSalt()).then(function (h) {
            if (h === getHash()) {
              lsDel(HASH_KEY); lsDel(SALT_KEY); lsDel(ATT_KEY); lsDel(UNTIL_KEY);
              alert('Passcode removed. The app will no longer ask for it.');
            } else {
              alert('Incorrect passcode.');
            }
          });
        }
      });
    }

    // Boot
    (function boot() {
      if (getUntil() > Date.now()) { showLocked(); return; }
      if (getUntil() && getUntil() <= Date.now()) { setAttempts(0); lsDel(UNTIL_KEY); }
      if (hasPasscode()) showUnlock(); else showSetup();
    })();
  })();

  // Init
  $('receiptDate').value = todayStr();
  $('receiptNo').value = nextReceiptNo();
  addRow('', 1, 0);
})();