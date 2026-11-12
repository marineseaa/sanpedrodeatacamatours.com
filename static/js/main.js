'use strict';
document.body.classList.add('js');
const partner = document.body.dataset.partner;
const campaign = document.body.dataset.campaign;
document.querySelectorAll('a[data-gyg-href]').forEach(a => {
  const url = new URL(a.dataset.gygHref);
  url.searchParams.set('partner_id', partner);
  url.searchParams.set('cmp', campaign);
  a.setAttribute('href', url.toString());
});
const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('#site-nav');
toggle?.addEventListener('click', () => {
  const open = toggle.getAttribute('aria-expanded') !== 'true';
  toggle.setAttribute('aria-expanded', String(open));
  nav.classList.toggle('open', open);
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && nav?.classList.contains('open')) {
    nav.classList.remove('open'); toggle.setAttribute('aria-expanded','false'); toggle.focus();
  }
});

/* GALLERY END-STATE (flat skill step 9, standalone form for custom gallery JS):
   hide the arrow at either end of the strip (CSS: :disabled -> opacity 0). */
(function () {
  function init() {
    document.querySelectorAll('.gallery-section').forEach(function (sec) {
      var strip = sec.querySelector('.gallery-scroll, .gallery-track');
      var prev = sec.querySelector('.gallery-arrow--prev');
      var next = sec.querySelector('.gallery-arrow--next');
      if (!strip || (!prev && !next)) return;
      var upd = function () {
        var max = strip.scrollWidth - strip.clientWidth - 2;
        if (prev) prev.disabled = strip.scrollLeft <= 2;
        if (next) next.disabled = strip.scrollLeft >= max;
      };
      strip.addEventListener('scroll', function () { window.requestAnimationFrame(upd); }, { passive: true });
      window.addEventListener('resize', upd);
      upd();
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
