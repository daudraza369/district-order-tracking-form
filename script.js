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
