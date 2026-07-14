/**
 * Toast Notification Component
 * Emergency Healthcare AI Platform
 * ─────────────────────────────────
 * Lightweight, accessible toast system. No dependencies.
 */

const Toast = (() => {
  let container = null;

  function getContainer() {
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.setAttribute('aria-live', 'polite');
      container.setAttribute('aria-atomic', 'false');
      container.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 10px;
        pointer-events: none;
      `;
      document.body.appendChild(container);
    }
    return container;
  }

  const icons = {
    success: 'fa-circle-check',
    error:   'fa-circle-xmark',
    warning: 'fa-triangle-exclamation',
    info:    'fa-circle-info',
  };

  const colors = {
    success: '#06d6a0',
    error:   '#e63946',
    warning: '#f4a261',
    info:    '#457b9d',
  };

  /**
   * Show a toast notification.
   * @param {string} message
   * @param {'success'|'error'|'warning'|'info'} type
   * @param {number} duration - ms (0 = persistent)
   */
  function show(message, type = 'info', duration = 4000) {
    const c = getContainer();
    const toast = document.createElement('div');
    const color = colors[type] || colors.info;
    const icon  = icons[type]  || icons.info;

    toast.setAttribute('role', 'alert');
    toast.style.cssText = `
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 18px;
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(13,27,42,0.16);
      border-left: 4px solid ${color};
      min-width: 280px;
      max-width: 380px;
      pointer-events: all;
      opacity: 0;
      transform: translateX(20px);
      transition: all 0.3s ease;
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      color: #0d1b2a;
    `;

    toast.innerHTML = `
      <i class="fas ${icon}" style="color:${color};font-size:1.1rem;flex-shrink:0;"></i>
      <span style="flex:1;line-height:1.4;">${message}</span>
      <button onclick="this.parentElement.remove()" style="
        background:none;border:none;cursor:pointer;
        color:#778da9;font-size:1rem;padding:2px;
        display:flex;align-items:center;
      "><i class="fas fa-xmark"></i></button>
    `;

    c.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(0)';
      });
    });

    // Auto-dismiss
    if (duration > 0) {
      setTimeout(() => dismiss(toast), duration);
    }

    return toast;
  }

  function dismiss(toast) {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    setTimeout(() => toast.remove(), 300);
  }

  return {
    success: (msg, dur) => show(msg, 'success', dur),
    error:   (msg, dur) => show(msg, 'error',   dur),
    warning: (msg, dur) => show(msg, 'warning',  dur),
    info:    (msg, dur) => show(msg, 'info',     dur),
    show,
  };
})();

export default Toast;
