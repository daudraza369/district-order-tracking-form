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
    fulfillment: form.fulfillment.value,
    product: form.product.value.trim(),
    quantity: form.quantity.value ? parseFloat(form.quantity.value) : '',
    orderDate: form.orderDate.value,
    requestedDate: form.requestedDate.value,
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
 * Validate required fields
 * @returns {string|null} Error message or null if valid
 */
function validateForm() {
  const required = [
    { id: 'orderType', label: 'Order Type' },
    { id: 'fulfillment', label: 'Delivery or Pickup' },
    { id: 'product', label: 'Product' },
    { id: 'quantity', label: 'Quantity' },
    { id: 'orderDate', label: 'Order Date' },
    { id: 'requestedDate', label: 'Requested Date' },
    { id: 'customerName', label: 'Customer Name' },
    { id: 'email', label: 'Email' },
    { id: 'contactNumber', label: 'Contact Number' },
    { id: 'deliveryAddress', label: 'Delivery Address' },
    { id: 'area', label: 'Area' },
    { id: 'orderTotal', label: 'Order Total' },
    { id: 'amountPaid', label: 'Amount Paid' }
  ];

  for (const field of required) {
    const el = form[field.id];
    const val = el ? (el.value || '').toString().trim() : '';
    if (!val) {
      return field.label + ' is required.';
    }
  }

  const qty = parseFloat(form.quantity.value);
  if (isNaN(qty) || qty < 1) {
    return 'Quantity must be at least 1.';
  }

  const orderTotal = parseFloat(form.orderTotal.value);
  if (isNaN(orderTotal) || orderTotal < 0) {
    return 'Order Total must be 0 or greater.';
  }

  const amountPaid = parseFloat(form.amountPaid.value);
  if (isNaN(amountPaid) || amountPaid < 0) {
    return 'Amount Paid must be 0 or greater.';
  }

  if (amountPaid > orderTotal) {
    return 'Amount Paid cannot exceed Order Total.';
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
 * Switch footer button to "Add Another Order" mode
 */
function switchToReentryMode() {
  const btnText = submitBtn ? submitBtn.querySelector('.btn-text') : null;
  if (!submitBtn || !btnText) return;
  submitBtn.type = 'button';
  submitBtn.removeAttribute('form');
  btnText.textContent = 'Add Another Order';
  submitBtn.onclick = showFormForNewOrder;
}

/**
 * Restore form and button for a new order entry
 */
function showFormForNewOrder() {
  const btnText = submitBtn ? submitBtn.querySelector('.btn-text') : null;
  if (!submitBtn || !btnText) return;
  hideMessage();
  clearForm();
  submitBtn.type = 'submit';
  submitBtn.setAttribute('form', 'orderForm');
  btnText.textContent = 'Save';
  submitBtn.onclick = null;
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
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json().catch(() => ({}));

    if (data.success) {
      showMessage('Order has been saved to sheet', 'success');
      clearForm();
      switchToReentryMode();
    } else {
      const errMsg = data.error || 'Failed to save order. Please try again.';
      showMessage(errMsg, 'error');
    }
  } catch (err) {
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
