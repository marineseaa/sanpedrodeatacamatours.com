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
