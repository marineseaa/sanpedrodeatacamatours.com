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
const checker = document.querySelector('#season-checker');
checker?.addEventListener('submit', e => {
 e.preventDefault();
 const value = document.querySelector('#visit-date').value;
 if (!value) return;
 const date = new Date(value + 'T12:00:00Z');
 const month = date.getUTCMonth() + 1;
 const rainy = month >= 12 || month <= 3;
 const winter = month >= 6 && month <= 8;
 const synodic = 29.530588853;
 const days = (date.getTime() - Date.UTC(2000,0,6,18,14)) / 86400000;
 const age = ((days % synodic) + synodic) % synodic;
 const illumination = Math.round(50 * (1 - Math.cos(2 * Math.PI * age / synodic)));
 const highland = rainy ? 'This date is in the December–March highland summer-rain period. Keep a spare day and ask your operator about the actual route forecast and road access before departure.' : winter ? 'Prepare for particularly cold dawn and night excursions. Snow or road restrictions can still change highland trips: confirm the route with your operator.' : 'This date falls outside the usual summer-rain period. Pack for cold highland mornings and ask your operator about wind and current road conditions.';
 const sky = illumination >= 70 ? 'The Moon is likely to be bright. Ask whether the session concentrates on lunar/planetary viewing or offers a darker departure time.' : illumination <= 30 ? 'The Moon is likely to be relatively dim. This can favour faint stars and Milky Way viewing, if the observing period is dark and skies are clear.' : 'Expect some moonlight. Ask the operator about Moon rise/set relative to the actual observing session.';
 document.querySelector('#checker-output').innerHTML = '<h3>Highland day trips</h3><p>' + highland + '</p><h3>Stargazing</h3><p>Approximate lunar illumination: ' + illumination + '%. ' + sky + '</p><p class="fineprint">Seasonal guidance and an approximate lunar calculation, not a weather forecast, moonrise table, availability result or safety clearance. Illumination is estimated at noon UTC for the selected date.</p>';
 const link=document.querySelector('#checker-cta');
 link.textContent = rainy ? 'Compare flexible day-trip options' : 'Check Piedras Rojas dates';
 link.href=rainy ? '/tours/#availability' : '/piedras-rojas-tours/#availability';
});
