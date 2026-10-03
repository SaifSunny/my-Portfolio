(function () {
  var system = window.matchMedia('(prefers-color-scheme: dark)');
  var choice = null;
  function readChoice() {
    try { var saved = localStorage.getItem('portfolio-theme'); return saved === 'dark' || saved === 'light' ? saved : null; } catch (_) { return null; }
  }
  function applyTheme() {
    var theme = choice || (system.matches ? 'dark' : 'light');
    document.documentElement.dataset.theme = theme;
    document.querySelectorAll('.theme-toggle').forEach(function (button) {
      var dark = theme === 'dark';
      button.setAttribute('aria-checked', String(dark));
      button.title = dark ? 'Switch to light mode' : 'Switch to dark mode';
      var icon = button.querySelector('.theme-toggle-icon');
      var label = button.querySelector('.theme-toggle-label');
      if (icon) icon.textContent = dark ? '☀' : '☾';
      if (label) label.textContent = dark ? 'Light mode' : 'Dark mode';
    });
  }
  choice = readChoice();
  applyTheme();
  document.addEventListener('DOMContentLoaded', function () {
    applyTheme();
    document.querySelectorAll('.theme-toggle').forEach(function (button) {
      button.addEventListener('click', function () {
        choice = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
        try { localStorage.setItem('portfolio-theme', choice); } catch (_) {}
        applyTheme();
      });
    });
    document.querySelectorAll('[data-copyright-year]').forEach(function (year) { year.textContent = new Date().getFullYear(); });
  });
  system.addEventListener('change', function () { if (!choice) applyTheme(); });
  window.addEventListener('storage', function (event) {
    if (event.key === 'portfolio-theme' || event.key === null) { choice = readChoice(); applyTheme(); }
  });
})();
// Keep the home theme switch beside the mobile menu, outside its drawer.
document.addEventListener('DOMContentLoaded', function () {
  const header = document.querySelector('.home .header-content');
  if (!header) return;
  const button = header.querySelector('.theme-toggle');
  const menuItem = header.querySelector('.theme-menu-item');
  const menuToggle = header.querySelector('.menu-toggle');
  if (!button || !menuItem || !menuToggle) return;
  const mobile = window.matchMedia('(max-width: 61.9375rem)');
  function positionThemeSwitch() {
    if (mobile.matches) header.insertBefore(button, menuToggle);
    else menuItem.appendChild(button);
    menuItem.hidden = mobile.matches;
  }
  positionThemeSwitch();
  mobile.addEventListener('change', positionThemeSwitch);
});

// Project details stay on the grid page in accessible native dialogs.
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('[data-project-dialog]').forEach(function (trigger) {
    const dialog = document.getElementById(trigger.dataset.projectDialog);
    if (!dialog) return;
    trigger.addEventListener('click', function (event) {
      event.preventDefault(); dialog.showModal(); document.documentElement.classList.add('project-modal-open');
    });
    dialog.querySelector('.project-dialog-close').addEventListener('click', function () { dialog.close(); });
    dialog.addEventListener('pointerdown', function (event) {
      const rect = dialog.getBoundingClientRect();
      if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
    });
    dialog.addEventListener('close', function () { document.documentElement.classList.remove('project-modal-open'); trigger.focus(); });
  });
});

document.addEventListener('DOMContentLoaded', function () { const id = location.hash.slice(1); if (/^project-[0-9]+$/.test(id)) { const trigger = document.querySelector('[data-project-dialog="' + id + '"]'); if (trigger) trigger.click(); } });

document.addEventListener('DOMContentLoaded', function () { document.querySelectorAll('.activity-toggle').forEach(function (button) { button.addEventListener('click', function (event) { event.preventDefault(); const expanded = button.getAttribute('aria-expanded') !== 'true'; document.getElementById(button.getAttribute('aria-controls')).querySelectorAll('.activity-extra').forEach(function (item) { item.hidden = !expanded; }); button.setAttribute('aria-expanded', String(expanded)); button.textContent = expanded ? 'Show less' : 'Show more'; }); }); });

document.addEventListener('DOMContentLoaded', function () { document.querySelectorAll('.cert-toggle').forEach(function (link) { link.addEventListener('click', function (event) { event.preventDefault(); const expanded = link.getAttribute('aria-expanded') !== 'true'; document.getElementById(link.getAttribute('aria-controls')).classList.toggle('is-expanded', expanded); link.setAttribute('aria-expanded', String(expanded)); link.textContent = expanded ? 'Show less' : 'Show more'; }); }); });

// One image at a time, with buttons, keyboard arrows and touch swiping.
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.project-carousel').forEach(function (gallery) {
    const slides = Array.from(gallery.querySelectorAll('.project-slides img'));
    const counter = gallery.querySelector('.project-slide-count');
    let index = 0, touchX = null;
    function show(next) {
      index = (next + slides.length) % slides.length;
      slides.forEach(function (slide, i) { slide.hidden = i !== index; });
      counter.textContent = (index + 1) + ' / ' + slides.length;
    }
    gallery.querySelectorAll('[data-slide]').forEach(function (button) {
      button.addEventListener('click', function () { show(index + Number(button.dataset.slide)); });
    });
    gallery.closest('dialog').addEventListener('keydown', function (event) {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault(); show(index + (event.key === 'ArrowLeft' ? -1 : 1));
      }
    });
    gallery.addEventListener('touchstart', function (event) { touchX = event.changedTouches[0].clientX; }, { passive: true });
    gallery.addEventListener('touchend', function (event) {
      if (touchX !== null) {
        const distance = event.changedTouches[0].clientX - touchX;
        if (Math.abs(distance) > 40) show(index + (distance < 0 ? 1 : -1));
      }
      touchX = null;
    }, { passive: true });
    gallery.closest('dialog').addEventListener('close', function () { show(0); });
  });
});

// Keep contact submissions on this page and report only confirmed API outcomes.
document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('static-contact');
  if (!form) return;
  const status = document.getElementById('contact-status');
  const button = form.querySelector('[type="submit"]');
  let sending = false;
  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (sending || !form.reportValidity()) return;
    sending = true;
    button.disabled = true;
    button.value = 'Sending…';
    status.hidden = false;
    status.className = 'contact-status';
    status.textContent = 'Sending your message…';
    const controller = new AbortController();
    const timeout = setTimeout(function () { controller.abort(); }, 20000);
    try {
      const response = await fetch(form.dataset.formsubmitEndpoint, {
        method: 'POST', headers: { 'Accept': 'application/json' },
        body: new FormData(form), signal: controller.signal
      });
      const result = await response.json();
      if (!response.ok || !(result.success === true || result.success === 'true')) throw new Error('Submission failed');
      status.className = 'contact-status is-success';
      status.textContent = 'Your message was sent successfully. Thank you for getting in touch!';
      form.reset();
    } catch (_) {
      status.className = 'contact-status is-error';
      status.textContent = 'We couldn’t confirm that your message was sent. Please try again shortly.';
    } finally {
      clearTimeout(timeout);
      sending = false;
      button.disabled = false;
      button.value = 'Send message';
    }
  });
});
