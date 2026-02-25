/**
 * Order Entry Form - Configuration
 * Replace these values before deployment
 */
const API_URL = 'https://script.google.com/macros/s/AKfycbyc-PhgIF8E9pqNPb1jAxDVknt0pdnnlWrsRvzSxyIcjoC34VRWOpck2OavxvOuhC6l/exec';
const API_TOKEN = 'flowerOrder2024';

const form = document.getElementById('orderForm');
const submitBtn = document.getElementById('submitBtn');
const messageEl = document.getElementById('message');

/**
 * Show message to user
 * @param {string} text - Message text
 * @param {'success'|'error'} type - Message type
 */
function showMessage(text, type) {
  messageEl.textContent = text;
  messageEl.className = 'message visible ' + type;
  messageEl.setAttribute('role', 'alert');
}

/**
 * Hide message
 */
function hideMessage() {
  messageEl.textContent = '';
  messageEl.className = 'message';
  messageEl.removeAttribute('role');
}

/**
 * Set loading state
 * @param {boolean} loading - Whether form is loading
 */
function setLoading(loading) {
  if (submitBtn) {
    submitBtn.disabled = loading;
    submitBtn.classList.toggle('loading', loading);
  }
}

/**
 * Build payload object from form values
 */
function getFormPayload() {
  const payload = {
    chatwootId: form.chatwootId.value.trim(),
    orderType: form.orderType.value,
    leadSource: form.leadSource ? form.leadSource.value : '',
    fulfillment: form.fulfillment.value,
    campaign: form.campaign ? form.campaign.value : '',
    product: form.product.value.trim(),
    barcodes: form.barcodes ? form.barcodes.value : '',
    quantity: form.quantity.value ? parseFloat(form.quantity.value) : '',
    orderDate: form.orderDate.value,
    requestedDate: form.requestedDate ? form.requestedDate.value : '',
    requestedTime: form.requestedTime ? form.requestedTime.value : '',
    customerName: form.customerName.value.trim(),
    email: form.email.value.trim(),
    contactNumber: form.contactNumber.value.trim(),
    deliveryAddress: form.deliveryAddress.value.trim(),
    area: form.area.value,
    invoiceNo: form.invoiceNo.value.trim(),
    orderTotal: form.orderTotal.value ? parseFloat(form.orderTotal.value) : '',
    amountPaid: form.amountPaid.value ? parseFloat(form.amountPaid.value) : ''
  };
  return payload;
}

/**
 * Validate form (all fields optional; only validate numeric bounds when provided)
 * @returns {string|null} Error message or null if valid
 */
function validateForm() {
  const qty = parseFloat(form.quantity.value);
  if (form.quantity.value && (isNaN(qty) || qty < 0)) {
    return 'Quantity must be 0 or greater.';
  }

  const orderTotal = parseFloat(form.orderTotal.value);
  if (form.orderTotal.value && (isNaN(orderTotal) || orderTotal < 0)) {
    return 'Total amount must be 0 or greater.';
  }

  const amountPaid = parseFloat(form.amountPaid.value);
  if (form.amountPaid.value && (isNaN(amountPaid) || amountPaid < 0)) {
    return 'Amount Paid must be 0 or greater.';
  }

  if (form.orderTotal.value && form.amountPaid.value && amountPaid > orderTotal) {
    return 'Amount Paid cannot exceed Total amount.';
  }

  return null;
}

/**
 * Clear all form fields (keeps success message visible)
 */
function clearForm() {
  form.reset();
}

/**
 * Submit order to backend
 */
async function submitOrder(e) {
  e.preventDefault();
  hideMessage();

  const validationError = validateForm();
  if (validationError) {
    showMessage(validationError, 'error');
    return;
  }

  if (!API_URL || !API_URL.includes('script.google.com')) {
    showMessage('API URL is not configured. Please set API_URL in script.js.', 'error');
    return;
  }

  if (!API_TOKEN || API_TOKEN === 'YOUR_SECRET_TOKEN') {
    showMessage('API token is not configured. Please set API_TOKEN in script.js.', 'error');
    return;
  }

  setLoading(true);

  const payload = getFormPayload();
  payload.token = API_TOKEN;

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    const data = await res.json().catch(() => ({}));

    if (data.success) {
      showMessage('Order has been saved to sheet', 'success');
      setTimeout(function() { window.location.reload(); }, 1500);
    } else {
      const errMsg = data.error || 'Failed to save order. Please try again.';
      showMessage(errMsg, 'error');
    }
  } catch (err) {
    console.error('Order submission failed:', err);
    showMessage('Network error. Please check your connection and try again.', 'error');
  } finally {
    setLoading(false);
  }
}

/**
 * Phone input: strip non-digits on blur for cleaner storage
 */
function initPhoneMask() {
  const input = form.contactNumber;
  if (!input) return;

  input.addEventListener('blur', function() {
    const digits = this.value.replace(/\D/g, '');
    if (digits && this.value !== digits) {
      this.value = digits;
    }
  });
}

// Attach submit handler (Enter key in inputs will trigger form submit)
form.addEventListener('submit', submitOrder);

// Optional: phone mask
initPhoneMask();

// Requested Date/Time: show based on fulfillment
// Pickup & Delivery: Requested Date + Requested Time
// Priority Delivery: Requested Time only
function initRequestedDateTimeVisibility() {
  var fulfillment = document.getElementById('fulfillment');
  var dateWrap = document.getElementById('requestedDateWrap');
  var timeWrap = document.getElementById('requestedTimeWrap');
  var dateInput = document.getElementById('requestedDate');
  var timeInput = document.getElementById('requestedTime');
  if (!fulfillment || !dateWrap || !timeWrap) return;
  function update() {
    var val = fulfillment.value;
    var isPickupOrDelivery = val === 'Pickup' || val === 'Delivery';
    var isPriority = val === 'Priority Delivery';
    dateWrap.classList.toggle('hidden', !isPickupOrDelivery);
    timeWrap.classList.toggle('hidden', !isPriority);
    if (!isPickupOrDelivery && dateInput) dateInput.value = '';
    if (!isPriority && timeInput) timeInput.value = '';
  }
  fulfillment.addEventListener('change', update);
  update();
}
initRequestedDateTimeVisibility();

// Barcode scanner: camera scan + list with + / - per item
function initBarcodeScanner() {
  var scanBtn = document.getElementById('barcodeScanBtn');
  var scanClose = document.getElementById('barcodeScanClose');
  var modal = document.getElementById('barcodeScannerModal');
  var scannerEl = document.getElementById('barcodeScanner');
  var listEl = document.getElementById('barcodeList');
  var hiddenInput = document.getElementById('barcodes');
  if (!scanBtn || !modal || !scannerEl || !listEl || !hiddenInput) return;

  var items = [];
  var html5Qr = null;

  function addBarcode(code) {
    code = String(code || '').trim();
    if (!code) return;
    var found = items.find(function (x) { return x.barcode === code; });
    if (found) {
      found.qty += 1;
    } else {
      items.push({ barcode: code, qty: 1 });
    }
    render();
  }

  function changeQty(index, delta) {
    items[index].qty += delta;
    if (items[index].qty < 1) items.splice(index, 1);
    render();
  }

  function removeBarcode(index) {
    items.splice(index, 1);
    render();
  }

  function buildBarcodesString() {
    return items.map(function (x) { return x.barcode + '×' + x.qty; }).join(' | ');
  }

  function render() {
    hiddenInput.value = buildBarcodesString();
    listEl.innerHTML = '';
    items.forEach(function (item, i) {
      var row = document.createElement('div');
      row.className = 'flex items-center justify-between gap-2 px-4 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-700/50';
      row.innerHTML =
        '<span class="text-sm font-mono truncate flex-1 min-w-0">' + item.barcode + '</span>' +
        '<div class="flex items-center gap-1 shrink-0">' +
        '<button type="button" class="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 flex items-center justify-center text-lg font-bold leading-none" data-action="minus" data-index="' + i + '" aria-label="Decrease">−</button>' +
        '<span class="w-8 text-center font-semibold text-sm">' + item.qty + '</span>' +
        '<button type="button" class="w-8 h-8 rounded-lg bg-primary hover:bg-primary-dark text-white flex items-center justify-center text-lg font-bold leading-none" data-action="plus" data-index="' + i + '" aria-label="Increase">+</button>' +
        '<button type="button" class="w-8 h-8 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center ml-1" data-action="remove" data-index="' + i + '" aria-label="Remove">×</button>' +
        '</div>';
      listEl.appendChild(row);
    });
  }

  function playScanSound() {
    try {
      var ctx = new (window.AudioContext || window.webkitAudioContext)();
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 800;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    } catch (_) {}
  }

  function showScanSuccess() {
    if (typeof jQuery !== 'undefined') {
      jQuery('#barcodeScanSuccess').stop(true).removeClass('opacity-0').addClass('opacity-100');
      jQuery('#barcodeScanSuccess .scan-tick').removeClass('scale-out').addClass('scale-in');
    } else {
      var o = document.getElementById('barcodeScanSuccess');
      var t = o && o.querySelector('.scan-tick');
      if (o) { o.classList.remove('opacity-0'); o.classList.add('opacity-100'); }
      if (t) { t.classList.remove('scale-out'); t.classList.add('scale-in'); }
    }
  }

  function hideScanSuccess() {
    if (typeof jQuery !== 'undefined') {
      jQuery('#barcodeScanSuccess').addClass('opacity-0').removeClass('opacity-100');
      jQuery('#barcodeScanSuccess .scan-tick').addClass('scale-out').removeClass('scale-in');
    } else {
      var o = document.getElementById('barcodeScanSuccess');
      var t = o && o.querySelector('.scan-tick');
      if (o) { o.classList.add('opacity-0'); o.classList.remove('opacity-100'); }
      if (t) { t.classList.add('scale-out'); t.classList.remove('scale-in'); }
    }
  }

  function onScanSuccess(decodedText) {
    addBarcode(decodedText);
    playScanSound();
    showScanSuccess();
    setTimeout(function () {
      hideScanSuccess();
      closeScanner();
    }, 800);
  }

  function openScanner() {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    scannerEl.innerHTML = '';
    hideScanSuccess();
    if (typeof Html5Qrcode !== 'undefined') {
      html5Qr = new Html5Qrcode(scannerEl.id);
      html5Qr.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 100 } },
        onScanSuccess
      ).catch(function (err) {
        console.error('Camera error:', err);
        scannerEl.innerHTML = '<p class="p-4 text-red-600 text-center">Camera access denied or unavailable.</p>';
      });
    } else {
      scannerEl.innerHTML = '<p class="p-4 text-slate-600 text-center">Barcode library loading...</p>';
    }
  }

  function closeScanner() {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    if (html5Qr) {
      html5Qr.stop().catch(function () {});
      html5Qr.clear();
      html5Qr = null;
    }
  }

  scanBtn.addEventListener('click', openScanner);
  scanClose.addEventListener('click', closeScanner);
  modal.addEventListener('click', function (e) {
    if (e.target === modal) closeScanner();
  });

  listEl.addEventListener('click', function (e) {
    var btn = e.target.closest('button');
    if (!btn || !btn.dataset.action) return;
    var i = parseInt(btn.dataset.index, 10);
    if (btn.dataset.action === 'minus') changeQty(i, -1);
    else if (btn.dataset.action === 'plus') changeQty(i, 1);
    else if (btn.dataset.action === 'remove') removeBarcode(i);
  });
}

initBarcodeScanner();

// Order insights: logo click opens modal, fetch and display metrics (with date range filter)
function initInsights() {
  var logoBtn = document.getElementById('insightsLogoBtn');
  var modal = document.getElementById('insightsModal');
  var closeBtn = document.getElementById('insightsClose');
  var rangeSel = document.getElementById('insightsRange');
  var customWrap = document.getElementById('insightsCustomWrap');
  var fromInput = document.getElementById('insightsFrom');
  var toInput = document.getElementById('insightsTo');
  var applyBtn = document.getElementById('insightsApply');
  var els = {
    total: document.getElementById('insightTotal'),
    delivery: document.getElementById('insightDelivery'),
    pickup: document.getElementById('insightPickup'),
    priority: document.getElementById('insightPriority'),
    today: document.getElementById('insightToday')
  };
  if (!logoBtn || !modal || !closeBtn) return;

  function todayStr() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).replace(/^(\d)$/, '0$1') + '-' + String(d.getDate()).replace(/^(\d)$/, '0$1');
  }

  function fetchInsights() {
    var url = API_URL + (API_URL.indexOf('?') >= 0 ? '&' : '?') + 'action=insights';
    var range = rangeSel ? rangeSel.value : '';
    if (range === 'today' || range === 'week') {
      url += '&range=' + encodeURIComponent(range);
    } else if (range === 'custom' && fromInput && toInput && fromInput.value && toInput.value) {
      url += '&from=' + encodeURIComponent(fromInput.value) + '&to=' + encodeURIComponent(toInput.value);
    }
    if (els.total) els.total.textContent = '—';
    if (els.delivery) els.delivery.textContent = '—';
    if (els.pickup) els.pickup.textContent = '—';
    if (els.priority) els.priority.textContent = '—';
    if (els.today) els.today.textContent = '—';
    fetch(url)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.error) {
          if (els.total) els.total.textContent = 'Error';
          if (els.total) els.total.title = data.error;
          return;
        }
        if (els.total) { els.total.textContent = data.total != null ? data.total : '—'; els.total.removeAttribute('title'); }
        if (els.delivery) els.delivery.textContent = data.delivery != null ? data.delivery : '—';
        if (els.pickup) els.pickup.textContent = data.pickup != null ? data.pickup : '—';
        if (els.priority) els.priority.textContent = data.priorityDelivery != null ? data.priorityDelivery : '—';
        if (els.today) els.today.textContent = data.today != null ? data.today : '—';
      })
      .catch(function (err) {
        if (els.total) { els.total.textContent = 'Error'; els.total.title = err.message || 'Fetch failed'; }
      });
  }

  function openModal() {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    if (rangeSel) rangeSel.value = '';
    if (customWrap) customWrap.classList.add('hidden');
    if (fromInput && toInput) {
      var t = todayStr();
      fromInput.value = t;
      toInput.value = t;
    }
    fetchInsights();
  }

  function closeModal() {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }

  if (rangeSel) {
    rangeSel.addEventListener('change', function () {
      var v = rangeSel.value;
      if (customWrap) customWrap.classList.toggle('hidden', v !== 'custom');
      if (v === 'custom' && fromInput && toInput) {
        var d = new Date();
        var to = todayStr();
        d.setDate(d.getDate() - 7);
        var from = d.getFullYear() + '-' + String(d.getMonth() + 1).replace(/^(\d)$/, '0$1') + '-' + String(d.getDate()).replace(/^(\d)$/, '0$1');
        fromInput.value = from;
        toInput.value = to;
      }
      if (v === 'today' || v === 'week' || v === '') fetchInsights();
    });
  }
  if (applyBtn) applyBtn.addEventListener('click', fetchInsights);

  logoBtn.addEventListener('click', openModal);
  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', function (e) {
    if (e.target === modal) closeModal();
  });
}
initInsights();

// Load campaigns from sheet into dropdown
function loadCampaigns() {
  var sel = document.getElementById('campaign');
  if (!sel) return;
  var url = API_URL + (API_URL.indexOf('?') >= 0 ? '&' : '?') + 'action=campaigns';
  fetch(url)
    .then(function(r) { return r.json(); })
    .then(function(data) {
      var list = data.campaigns || ['None'];
      sel.innerHTML = '';
      list.forEach(function(c) {
        var opt = document.createElement('option');
        opt.value = c;
        opt.textContent = c;
        sel.appendChild(opt);
      });
    })
    .catch(function() {
      sel.innerHTML = '<option value="">None</option>';
    });
}
loadCampaigns();

// Info icon: click to show/hide tooltip, click outside to close
function initInfoTooltips() {
  document.querySelectorAll('.info-icon').forEach(function (icon) {
    var wrap = icon.closest('.info-icon-wrap');
    if (!wrap) return;

    function toggle() {
      var isActive = wrap.classList.contains('active');
      document.querySelectorAll('.info-icon-wrap.active').forEach(function (w) {
        if (w !== wrap) w.classList.remove('active');
      });
      wrap.classList.toggle('active', !isActive);
    }

    icon.addEventListener('click', function (e) {
      e.preventDefault();
      toggle();
    });

    icon.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle();
      }
    });
  });

  document.addEventListener('click', function (e) {
    if (!e.target.closest('.info-icon-wrap')) {
      document.querySelectorAll('.info-icon-wrap.active').forEach(function (w) {
        w.classList.remove('active');
      });
    }
  });
}
initInfoTooltips();
