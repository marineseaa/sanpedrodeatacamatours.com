'use strict';
/* Date checker for /best-time-to-visit/.
   Inside the 16-day forecast window it reads the Open-Meteo forecast for the
   town and two high-plateau points (El Tatio, Miscanti); beyond it, the town's
   DMC monthly averages (INIA station 220024, 2011-2025). Sun and Moon times
   come from the SunCalc formulas (Vladimir Agafonkin, BSD-2-Clause), computed
   in the browser. Every card says which source it is showing. */
(function () {
  var form = document.getElementById('date-check');
  if (!form) return;
  var TZ = 'America/Santiago', LAT = -22.911, LNG = -68.200;
  var MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  var NORMALS = { // average high, average low, nights below freezing, rain (mm) in town
    1:[31.8,8.7,0,8.0], 2:[31.0,9.5,0,20.6], 3:[30.3,7.4,0,4.8], 4:[28.2,4.0,2,0.2],
    5:[24.8,0.7,13,1.8], 6:[22.5,-1.5,23,0.9], 7:[22.7,-1.7,23,0.7], 8:[24.6,-0.8,20,1.4],
    9:[27.3,1.9,8,0.0], 10:[29.0,3.6,2,0.0], 11:[30.6,4.9,0,0.2], 12:[31.6,6.8,0,0.3]
  };
  var FESTIVALS = {'2-2':'Fiesta de la Candelaria', '5-3':'Cruz de Mayo', '6-29':'Fiesta de San Pedro y San Pablo, the town’s patron-saint festival', '7-25':'San Santiago', '11-1':'Mesa de los difuntos', '11-2':'Mesa de los difuntos'};

  /* ---- SunCalc subset ---- */
  var rad = Math.PI / 180, dayMs = 86400000, J1970 = 2440588, J2000 = 2451545, e = rad * 23.4397;
  function toDays(d) { return d.valueOf() / dayMs - 0.5 + J1970 - J2000; }
  function fromJulian(j) { return new Date((j + 0.5 - J1970) * dayMs); }
  function ra(l, b) { return Math.atan2(Math.sin(l) * Math.cos(e) - Math.tan(b) * Math.sin(e), Math.cos(l)); }
  function dec(l, b) { return Math.asin(Math.sin(b) * Math.cos(e) + Math.cos(b) * Math.sin(e) * Math.sin(l)); }
  function alt(H, phi, d) { return Math.asin(Math.sin(phi) * Math.sin(d) + Math.cos(phi) * Math.cos(d) * Math.cos(H)); }
  function sidereal(d, lw) { return rad * (280.16 + 360.9856235 * d) - lw; }
  function solarM(d) { return rad * (357.5291 + 0.98560028 * d); }
  function eclL(M) { var C = rad * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M)); return M + C + rad * 102.9372 + Math.PI; }
  function sunCoords(d) { var L = eclL(solarM(d)); return { dec: dec(L, 0), ra: ra(L, 0) }; }
  function moonCoords(d) {
    var L = rad * (218.316 + 13.176396 * d), M = rad * (134.963 + 13.064993 * d), F = rad * (93.272 + 13.229350 * d);
    var l = L + rad * 6.289 * Math.sin(M), b = rad * 5.128 * Math.sin(F);
    return { ra: ra(l, b), dec: dec(l, b), dist: 385001 - 20905 * Math.cos(M) };
  }
  function moonAlt(date) {
    var lw = rad * -LNG, phi = rad * LAT, d = toDays(date), c = moonCoords(d);
    return alt(sidereal(d, lw) - c.ra, phi, c.dec) / rad;
  }
  function sunAlt(date) {
    var lw = rad * -LNG, phi = rad * LAT, d = toDays(date), c = sunCoords(d);
    return alt(sidereal(d, lw) - c.ra, phi, c.dec) / rad;
  }
  function moonFraction(date) {
    var d = toDays(date), s = sunCoords(d), m = moonCoords(d), sd = 149598000;
    var phi = Math.acos(Math.sin(s.dec) * Math.sin(m.dec) + Math.cos(s.dec) * Math.cos(m.dec) * Math.cos(s.ra - m.ra));
    var inc = Math.atan2(sd * Math.sin(phi), m.dist - sd * Math.cos(phi));
    return (1 + Math.cos(inc)) / 2;
  }

  /* ---- time zone helpers ---- */
  var partsFmt = new Intl.DateTimeFormat('en-US', { timeZone: TZ, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' });
  function offset(date) {
    var p = {}; partsFmt.formatToParts(date).forEach(function (x) { p[x.type] = x.value; });
    return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second) - date.getTime();
  }
  function localToUtc(y, m, d, h, min) {
    var guess = Date.UTC(y, m - 1, d, h, min);
    var t = guess - offset(new Date(guess));
    return new Date(guess - offset(new Date(t)));
  }
  var clockFmt = new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: 'numeric', minute: '2-digit' });
  function clock(date) { return clockFmt.format(date).replace(' AM', ' a.m.').replace(' PM', ' p.m.'); }
  function crossing(fn, from, to, h0) { // first time fn crosses h0 between from and to, 5-minute steps
    var prev = fn(from) - h0;
    for (var t = from.getTime() + 300000; t <= to.getTime(); t += 300000) {
      var v = fn(new Date(t)) - h0;
      if ((prev < 0) !== (v < 0)) return { at: new Date(t), rising: v > 0 };
      prev = v;
    }
    return null;
  }
  function easter(y) {
    var a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e2 = b % 4, f = Math.floor((b + 8) / 25),
      g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4,
      l = (32 + 2 * e2 + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
    return new Date(Date.UTC(y, Math.floor((h + l - 7 * m + 114) / 31) - 1, ((h + l - 7 * m + 114) % 31) + 1));
  }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  function deg(v) { return String(Math.sign(v) * Math.round(Math.abs(v))).replace('-', '−') + ' °C'; }

  /* ---- rows ---- */
  function holidayRow(y, m, d) {
    var notes = [], key = m + '-' + d;
    if (m === 1 || m === 2) notes.push('Chile’s summer school holidays run through January and February, when many Chileans travel, so book rooms and tours earlier.');
    if (m === 7 || (m === 6 && d >= 20)) notes.push('Chile’s two-week winter school break falls in late June or July and is set region by region; if your date falls inside it, book earlier.');
    if (m === 9 && d >= 16 && d <= 21) notes.push('The Fiestas Patrias holidays on September 18 and 19 are a major travel weekend in Chile; book earlier.');
    if ((m === 12 && d >= 24) || (m === 1 && d === 1)) notes.push('Christmas and New Year are national holidays in Chile; some restaurants and offices keep holiday hours.');
    var es = easter(y), gf = new Date(es.getTime() - 2 * dayMs), cur = Date.UTC(y, m - 1, d);
    if (cur >= gf.getTime() - dayMs && cur <= es.getTime()) notes.push('This is the Easter weekend, a national holiday weekend in Chile; book earlier.');
    if (FESTIVALS[key]) notes.push('Local festival: ' + FESTIVALS[key] + '. Ask before photographing a ceremony.');
    var noon = localToUtc(y, m, d, 12, 0), before = new Date(noon.getTime() - dayMs);
    if (offset(noon) !== offset(before)) notes.push('Chile’s clocks changed overnight before this date: confirm any early pickup time with your operator.');
    return notes.length ? notes.join(' ') : 'No national holiday, school-holiday period or major local festival on this date.';
  }
  function highlandSeason(m) {
    if (m === 12 || m <= 3) return { risk: true, text: 'This date is in the summer storm season on the high plateau (December to March). Storms can close or change the routes to El Tatio, the Altiplanic lagoons and Piedras Rojas on some days, so keep a spare day and choose free cancellation where the listing offers it.' };
    if (m >= 6 && m <= 8) return { risk: true, text: 'This date is in the winter snow season on the high plateau (June to August). Snow can close El Tatio, the lagoons and Piedras Rojas for a day or more, so schedule your high trip early in your stay.' };
    if (m === 9) return { risk: false, text: 'Late-winter snow is still possible on the high routes in September, although the summer storm season has not started. Confirm the route with your operator the day before.' };
    return { risk: false, text: 'This date falls between the summer storm season and the winter snow season, when the high routes are usually open. A single route can still close for wind or snow at short notice, and your operator confirms on the morning.' };
  }
  function moonRow(y, m, d, fc) {
    var start = localToUtc(y, m, d, 21, 0), end = new Date(start.getTime() + 3 * 3600000);
    var up = 0, n = 0;
    for (var t = start.getTime(); t <= end.getTime(); t += 1800000) { n++; if (moonAlt(new Date(t)) > 0) up++; }
    var frac = moonFraction(new Date(start.getTime() + 1.5 * 3600000)), pct = Math.round(frac * 100);
    var eve = localToUtc(y, m, d, 17, 0), morn = localToUtc(y, m, d + 1, 9, 0);
    var c1 = crossing(moonAlt, eve, morn, 0.133), times = '';
    if (c1) {
      var c2 = crossing(moonAlt, new Date(c1.at.getTime() + 600000), morn, 0.133);
      times = ' Moon' + (c1.rising ? 'rise' : 'set') + ' ' + clock(c1.at) + (c2 ? ', moon' + (c2.rising ? 'rise' : 'set') + ' ' + clock(c2.at) : '') + '.';
    }
    var dark = pct <= 25 || up === 0;
    var text;
    if (dark) text = 'A dark evening: the Moon is ' + (up === 0 ? 'below the horizon from 9 p.m. to midnight' : 'a thin ' + pct + '% lit') + ', which suits faint stars and the Milky Way if the sky is clear.';
    else if (pct >= 75 && up >= n - 1) text = 'A bright Moon (' + pct + '% lit) is up for most of the evening, so faint stars are harder to see. SPACE skips the 7 nights around the full moon; some other operators run a Moon-and-planets session instead, so ask which one you are booking.';
    else text = 'The Moon is ' + pct + '% lit and up for part of the evening; ask which part of the night your session covers.';
    text += times.replace(/\.\.$/, '.');
    if (fc) {
      var cc = fc.night;
      if (cc !== null) text += cc < 25 ? ' The forecast shows a mostly clear night (' + Math.round(cc) + '% cloud).' : cc > 60 ? ' The forecast shows a cloudy night (' + Math.round(cc) + '% cloud), and operators can cancel for cloud.' : ' The forecast shows some cloud at night (' + Math.round(cc) + '%).';
    }
    return { text: text, dark: dark, bright: !dark && pct >= 75 && up >= n - 1 };
  }

  function render(dateStr, fc) {
    var p = dateStr.split('-'), y = +p[0], m = +p[1], d = +p[2];
    var label = new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
    var nrm = NORMALS[m], rows = [], stormSignal = false;
    // 1. Highland trips
    if (fc) {
      var w = fc.plateau, bits = [];
      if (w.snow > 0.5) bits.push('snow (' + w.snow.toFixed(1) + ' cm)');
      if (w.precip >= 2) bits.push('rain or snow (' + w.precip.toFixed(1) + ' mm)');
      if (w.thunder) bits.push('thunderstorms');
      var txt;
      if (bits.length) { stormSignal = true; txt = 'The forecast for the high plateau shows ' + bits.join(', ') + '. Routes to El Tatio, the lagoons and Piedras Rojas can close or change on days like this, so plan a lower-site tour as a backup and check with your operator that morning.'; }
      else txt = 'No storm or snow in the forecast for the high plateau. Routes can still close at short notice, and your operator confirms on the morning.';
      if (w.gust >= 75) txt += ' Very strong gusts are forecast up high (up to ' + Math.round(w.gust) + ' km/h): expect a hard, cold wind at the stops.';
      else if (w.gust >= 55) txt += ' Windy up high (gusts up to ' + Math.round(w.gust) + ' km/h): bring a windproof layer.';
      rows.push(['Highland trips', txt]);
    } else {
      var hs = highlandSeason(m); stormSignal = false;
      rows.push(['Highland trips', hs.text]);
    }
    // 2. Holidays
    rows.push(['Holidays and festivals', holidayRow(y, m, d)]);
    // 3. Stargazing
    var mr = moonRow(y, m, d, fc);
    rows.push(['Stargazing', mr.text]);
    // 4. Cold at dawn
    if (fc) rows.push(['Cold at dawn', 'Forecast low about ' + deg(fc.plateau.tmin) + ' on the high plateau and ' + deg(fc.town.tmin) + ' in town. Dress for the plateau figure on a dawn trip to El Tatio.']);
    else rows.push(['Cold at dawn', 'In ' + MONTHS[m - 1] + ' the average low in town is about ' + deg(nrm[1]) + (nrm[2] >= 1 ? ', with about ' + nrm[2] + ' nights in the month below freezing' : '') + '. El Tatio and the lagoons are much colder and can be well below freezing at dawn, so bring a warm jacket, hat and gloves for any early start.']);
    // 5. Daytime in town
    if (fc) rows.push(['Daytime in town', 'Forecast high about ' + deg(fc.town.tmax) + (fc.town.precip >= 1 ? ', with ' + fc.town.precip.toFixed(1) + ' mm of rain forecast' : ', dry') + '.']);
    else rows.push(['Daytime in town', 'The average high in ' + MONTHS[m - 1] + ' is about ' + deg(nrm[0]) + (nrm[0] >= 30 ? ', so afternoons are hot: save cycling and walks for the morning' : '') + '. ' + (nrm[3] >= 1 ? 'Rain in town averages about ' + Math.round(nrm[3]) + ' mm for the whole month, mostly on a few stormy days.' : 'It rarely rains in town this month.')]);
    // 6. Sun times
    var noon = localToUtc(y, m, d, 12, 0);
    var sr = crossing(sunAlt, localToUtc(y, m, d, 4, 0), noon, -0.833), ss = crossing(sunAlt, noon, localToUtc(y, m, d, 22, 0), -0.833);
    rows.push(['Sunrise and sunset', 'Sunrise ' + (sr ? clock(sr.at) : '–') + ', sunset ' + (ss ? clock(ss.at) : '–') + ' in town. Afternoon tours of Valle de la Luna end at sunset, and El Tatio tours arrive around dawn.']);

    var src = fc ? 'Showing the Open-Meteo forecast for this date, read just now. Forecasts more than a few days ahead often change.' : 'Beyond the 16-day forecast window, so this shows the season and the town’s monthly averages (DMC station records, 2011–2025), not a forecast.';
    var vline;
    if (fc) vline = stormSignal ? 'Storms or snow forecast up high: plan a lower-site day as a backup' : 'No storm or snow in the forecast up high';
    else if (m === 12 || m <= 3) vline = 'Summer storm season up high (December to March)';
    else if (m >= 6 && m <= 8) vline = 'Winter snow season up high (June to August)';
    else if (m === 9) vline = 'Dry, but late snow still possible up high';
    else vline = 'Between the storm and snow seasons up high';
    vline += mr.dark ? '; a dark evening for stargazing' : (mr.bright ? '; a bright Moon in the evening' : '; some moonlight in the evening');
    var html = '<h3>' + esc(label) + '</h3><p class="cvd-verdict" data-cvd-verdict>' + esc(vline) + '.</p><p class="cvd-source">' + src + '</p><dl class="cvd-rows">';
    rows.forEach(function (r) { html += '<div class="cvd-row"><dt>' + esc(r[0]) + ':</dt><dd>' + esc(r[1]) + '</dd></div>'; });
    html += '</dl><p class="fineprint">Not a road-status service: closures are announced on the day, so check with your operator.</p>';
    document.getElementById('date-check-out').innerHTML = html;
    var cta = document.getElementById('date-check-cta');
    if (stormSignal) setCta(cta, 'Check Valle de la Luna tour dates', GYG.moon);
    else if (mr.dark) setCta(cta, 'Check stargazing tour dates', GYG.stars);
    else setCta(cta, 'Check Piedras Rojas tour dates', GYG.highland);
  }

  var GYG = {
    highland: 'https://www.getyourguide.com/san-pedro-de-atacama-l1862/full-day-piedras-rojas-altiplanics-lagoons-salar-de-talar-t190853/',
    stars: 'https://www.getyourguide.com/san-pedro-de-atacama-l1862/san-pedro-de-atacama-stargazing-experience-t542449/',
    moon: 'https://www.getyourguide.com/san-pedro-de-atacama-l1862/san-pedro-de-atacama-valle-de-la-luna-shared-sightseeing-tour-t466455/'
  };
  function setCta(a, label, bare) {
    var u = new URL(bare);
    u.searchParams.set('partner_id', document.body.dataset.partner);
    u.searchParams.set('cmp', document.body.dataset.campaign);
    a.textContent = label; a.setAttribute('data-gyg-href', bare); a.href = u.toString();
  }
  var cache = null, pending = null;
  function forecast(dateStr, done) {
    var url = 'https://api.open-meteo.com/v1/forecast?latitude=-22.911,-22.335,-23.74&longitude=-68.200,-68.010,-67.79&elevation=2440,4300,4140' +
      '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,snowfall_sum,wind_gusts_10m_max&hourly=cloud_cover&timezone=America%2FSantiago&forecast_days=16';
    function pick(data) {
      var i = data[0].daily.time.indexOf(dateStr);
      if (i < 0) return null;
      function day(x) { return { tmax: x.daily.temperature_2m_max[i], tmin: x.daily.temperature_2m_min[i], precip: x.daily.precipitation_sum[i] || 0, snow: x.daily.snowfall_sum[i] || 0, gust: x.daily.wind_gusts_10m_max[i] || 0, code: x.daily.weather_code[i] }; }
      var t = day(data[0]), a = day(data[1]), b = day(data[2]);
      var plateau = { tmin: Math.min(a.tmin, b.tmin), precip: Math.max(a.precip, b.precip), snow: Math.max(a.snow, b.snow), gust: Math.max(a.gust, b.gust), thunder: a.code >= 95 || b.code >= 95 };
      var hrs = data[0].hourly, sum = 0, cnt = 0, nxt = new Date(Date.parse(dateStr + 'T12:00:00Z') + dayMs).toISOString().slice(0, 10);
      [dateStr + 'T21:00', dateStr + 'T22:00', dateStr + 'T23:00', nxt + 'T00:00'].forEach(function (k) { var j = hrs.time.indexOf(k); if (j >= 0 && hrs.cloud_cover[j] !== null) { sum += hrs.cloud_cover[j]; cnt++; } });
      return { town: t, plateau: plateau, night: cnt ? sum / cnt : null };
    }
    if (cache) return done(pick(cache));
    if (!pending) pending = fetch(url).then(function (r) { return r.json(); }).then(function (j) { cache = j; return j; });
    pending.then(function (j) { done(pick(j)); }).catch(function () { pending = null; done(null); });
  }

  function run(ev) {
    if (ev) ev.preventDefault();
    var v = document.getElementById('date-check-input').value;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return;
    document.getElementById('date-check-out').innerHTML = '<p>Checking…</p>';
    forecast(v, function (fc) { if (document.getElementById('date-check-input').value === v) render(v, fc); });
  }
  form.addEventListener('submit', run);
  var inp = document.getElementById('date-check-input');
  inp.addEventListener('change', function () { run(); });
  if (inp && !inp.value) {
    var today = new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date());
    inp.value = today;
  }
  run();
})();
