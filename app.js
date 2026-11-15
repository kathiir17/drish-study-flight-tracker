// study flight — app.js
// everything except the database (db.js). sections:
//   setup · cities · globe maths · sky and globe drawing · touch, mouse and zoom ·
//   audio · pomodoro · flight timing · interface · history · start-up
'use strict';

// ── Setup ─────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const canvas = $('globe');
const ctx = canvas.getContext('2d');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const fmtNum = n => Math.round(n).toLocaleString('en-GB');

// ── Cities ────────────────────────────────────────────────
const CITIES = [
  {n:'london',lat:51.51,lng:-0.13,c:'united kingdom'},{n:'paris',lat:48.86,lng:2.35,c:'france'},
  {n:'new york',lat:40.71,lng:-74.01,c:'united states'},{n:'tokyo',lat:35.69,lng:139.69,c:'japan'},
  {n:'sydney',lat:-33.87,lng:151.21,c:'australia'},{n:'dubai',lat:25.20,lng:55.27,c:'united arab emirates'},
  {n:'singapore',lat:1.35,lng:103.82,c:'singapore'},{n:'são paulo',lat:-23.55,lng:-46.63,c:'brazil'},
  {n:'cairo',lat:30.04,lng:31.24,c:'egypt'},{n:'mumbai',lat:19.08,lng:72.88,c:'india'},
  {n:'los angeles',lat:34.05,lng:-118.24,c:'united states'},{n:'nairobi',lat:-1.29,lng:36.82,c:'kenya'},
  {n:'moscow',lat:55.75,lng:37.62,c:'russia'},{n:'beijing',lat:39.90,lng:116.41,c:'china'},
  {n:'cape town',lat:-33.92,lng:18.42,c:'south africa'},{n:'mexico city',lat:19.43,lng:-99.13,c:'mexico'},
  {n:'shanghai',lat:31.23,lng:121.47,c:'china'},{n:'delhi',lat:28.61,lng:77.21,c:'india'},
  {n:'istanbul',lat:41.01,lng:28.95,c:'türkiye'},{n:'osaka',lat:34.69,lng:135.50,c:'japan'},
  {n:'karachi',lat:24.86,lng:67.01,c:'pakistan'},{n:'dhaka',lat:23.72,lng:90.41,c:'bangladesh'},
  {n:'bangkok',lat:13.76,lng:100.50,c:'thailand'},{n:'kolkata',lat:22.57,lng:88.36,c:'india'},
  {n:'lagos',lat:6.52,lng:3.38,c:'nigeria'},{n:'kinshasa',lat:-4.32,lng:15.32,c:'dr congo'},
  {n:'jakarta',lat:-6.21,lng:106.85,c:'indonesia'},{n:'seoul',lat:37.57,lng:126.98,c:'south korea'},
  {n:'taipei',lat:25.03,lng:121.56,c:'taiwan'},{n:'hong kong',lat:22.32,lng:114.17,c:'hong kong'},
  {n:'kuala lumpur',lat:3.14,lng:101.69,c:'malaysia'},{n:'manila',lat:14.60,lng:120.98,c:'philippines'},
  {n:'bogotá',lat:4.71,lng:-74.07,c:'colombia'},{n:'lima',lat:-12.05,lng:-77.04,c:'peru'},
  {n:'santiago',lat:-33.45,lng:-70.67,c:'chile'},{n:'buenos aires',lat:-34.60,lng:-58.38,c:'argentina'},
  {n:'johannesburg',lat:-26.20,lng:28.04,c:'south africa'},{n:'casablanca',lat:33.59,lng:-7.62,c:'morocco'},
  {n:'accra',lat:5.56,lng:-0.20,c:'ghana'},{n:'addis ababa',lat:9.03,lng:38.74,c:'ethiopia'},
  {n:'riyadh',lat:24.69,lng:46.72,c:'saudi arabia'},{n:'tehran',lat:35.69,lng:51.39,c:'iran'},
  {n:'baghdad',lat:33.34,lng:44.40,c:'iraq'},{n:'lahore',lat:31.55,lng:74.34,c:'pakistan'},
  {n:'chicago',lat:41.88,lng:-87.63,c:'united states'},{n:'toronto',lat:43.65,lng:-79.38,c:'canada'},
  {n:'miami',lat:25.77,lng:-80.19,c:'united states'},{n:'vancouver',lat:49.25,lng:-123.12,c:'canada'},
  {n:'amsterdam',lat:52.37,lng:4.90,c:'netherlands'},{n:'berlin',lat:52.52,lng:13.40,c:'germany'},
  {n:'madrid',lat:40.42,lng:-3.70,c:'spain'},{n:'rome',lat:41.90,lng:12.50,c:'italy'},
  {n:'lisbon',lat:38.72,lng:-9.14,c:'portugal'},{n:'vienna',lat:48.21,lng:16.37,c:'austria'},
  {n:'warsaw',lat:52.23,lng:21.01,c:'poland'},{n:'stockholm',lat:59.33,lng:18.07,c:'sweden'},
  {n:'auckland',lat:-36.86,lng:174.76,c:'new zealand'},{n:'melbourne',lat:-37.81,lng:144.96,c:'australia'},
  {n:'houston',lat:29.76,lng:-95.37,c:'united states'},{n:'anchorage',lat:61.22,lng:-149.90,c:'united states'},
  {n:'havana',lat:23.14,lng:-82.36,c:'cuba'},{n:'caracas',lat:10.48,lng:-66.88,c:'venezuela'},
  {n:'la paz',lat:-16.50,lng:-68.15,c:'bolivia'},{n:'dakar',lat:14.72,lng:-17.47,c:'senegal'},
  {n:'almaty',lat:43.22,lng:76.85,c:'kazakhstan'},{n:'tashkent',lat:41.30,lng:69.24,c:'uzbekistan'},
  {n:'ulaanbaatar',lat:47.91,lng:106.88,c:'mongolia'},{n:'krasnoyarsk',lat:56.01,lng:92.87,c:'russia'},
  {n:'perth',lat:-31.95,lng:115.86,c:'australia'},{n:'jaffna',lat:9.67,lng:80.02,c:'sri lanka'},
];
// Each city's main airport code, for the boarding passes.
const AIRPORTS = {
  'london':'LHR', 'paris':'CDG', 'new york':'JFK', 'tokyo':'HND', 'sydney':'SYD', 'dubai':'DXB', 'singapore':'SIN',
  'são paulo':'GRU', 'cairo':'CAI', 'mumbai':'BOM', 'los angeles':'LAX', 'nairobi':'NBO', 'moscow':'SVO', 'beijing':'PEK',
  'cape town':'CPT', 'mexico city':'MEX', 'shanghai':'PVG', 'delhi':'DEL', 'istanbul':'IST', 'osaka':'KIX', 'karachi':'KHI',
  'dhaka':'DAC', 'bangkok':'BKK', 'kolkata':'CCU', 'lagos':'LOS', 'kinshasa':'FIH', 'jakarta':'CGK', 'seoul':'ICN',
  'taipei':'TPE', 'hong kong':'HKG', 'kuala lumpur':'KUL', 'manila':'MNL', 'bogotá':'BOG', 'lima':'LIM', 'santiago':'SCL',
  'buenos aires':'EZE', 'johannesburg':'JNB', 'casablanca':'CMN', 'accra':'ACC', 'addis ababa':'ADD', 'riyadh':'RUH',
  'tehran':'IKA', 'baghdad':'BGW', 'lahore':'LHE', 'chicago':'ORD', 'toronto':'YYZ', 'miami':'MIA', 'vancouver':'YVR',
  'amsterdam':'AMS', 'berlin':'BER', 'madrid':'MAD', 'rome':'FCO', 'lisbon':'LIS', 'vienna':'VIE', 'warsaw':'WAW',
  'stockholm':'ARN', 'auckland':'AKL', 'melbourne':'MEL', 'houston':'IAH', 'anchorage':'ANC', 'havana':'HAV',
  'caracas':'CCS', 'la paz':'LPB', 'dakar':'DSS', 'almaty':'ALA', 'tashkent':'TAS', 'ulaanbaatar':'UBN',
  'krasnoyarsk':'KJA', 'perth':'PER', 'jaffna':'JAF',
};
// Each city's continent, for the flight map's colours and filter (and stats later).
const CONTINENTS = [
  { id: 'europe', label: 'europe', color: '#8cc4ff', cities: ['london', 'paris', 'moscow', 'istanbul', 'amsterdam', 'berlin',
    'madrid', 'rome', 'lisbon', 'vienna', 'warsaw', 'stockholm'] },
  { id: 'asia', label: 'asia', color: '#ffbd5a', cities: ['tokyo', 'dubai', 'singapore', 'mumbai', 'beijing', 'shanghai', 'delhi',
    'osaka', 'karachi', 'dhaka', 'bangkok', 'kolkata', 'jakarta', 'seoul', 'taipei', 'hong kong', 'kuala lumpur', 'manila',
    'riyadh', 'tehran', 'baghdad', 'lahore', 'almaty', 'tashkent', 'ulaanbaatar', 'krasnoyarsk', 'jaffna'] },
  { id: 'africa', label: 'africa', color: '#ff8f87', cities: ['cairo', 'nairobi', 'cape town', 'lagos', 'kinshasa', 'johannesburg',
    'casablanca', 'accra', 'addis ababa', 'dakar'] },
  { id: 'north america', label: 'n. america', color: '#c3a6ff', cities: ['new york', 'los angeles', 'mexico city', 'chicago',
    'toronto', 'miami', 'vancouver', 'houston', 'anchorage', 'havana'] },
  { id: 'south america', label: 's. america', color: '#74e0a6', cities: ['são paulo', 'bogotá', 'lima', 'santiago', 'buenos aires',
    'caracas', 'la paz'] },
  { id: 'oceania', label: 'oceania', color: '#5fd8e6', cities: ['sydney', 'auckland', 'melbourne', 'perth'] },
];
const CONTINENT_OF = {};
CONTINENTS.forEach(k => k.cities.forEach(n => { CONTINENT_OF[n] = k; }));
CITIES.forEach(c => { c.scale = 1; c.a = AIRPORTS[c.n]; c.ct = CONTINENT_OF[c.n]; }); // scale: eased size, for the hover/press "bulge"
function findCity(name) { return CITIES.find(c => c.n === String(name).trim().toLowerCase()); }

// ── Globe maths ───────────────────────────────────────────
// GOTCHA: ll2xyz negates longitude to fix a mirrored map, and the drag signs below are
// matched to that. Don't "tidy" either without testing orientation and drag direction.
// baseR = the globe's circle on screen (fixed: zooming never changes it).
// R = baseR × zoom = the radius the map is projected at. Zoomed in, R > baseR and the
// circle acts as a window onto a magnified globe, so the layout never shifts.
let W = 0, H = 0, DPR = 1, CX = 0, CY = 0, baseR = 100, zoom = 1, R = 100;
let rotX = 0.3, rotY = 0;

function ll2xyz(lat, lng) {
  const la = lat * Math.PI / 180, lo = lng * Math.PI / 180;
  return [Math.cos(la)*Math.cos(-lo), Math.sin(la), Math.cos(la)*Math.sin(-lo)];
}
function project(x, y, z) {
  const x1 =  x*Math.cos(rotY) + z*Math.sin(rotY);
  const z1 = -x*Math.sin(rotY) + z*Math.cos(rotY);
  const y2 =  y*Math.cos(rotX) - z1*Math.sin(rotX);
  const z2 =  y*Math.sin(rotX) + z1*Math.cos(rotX);
  // visible = on the near side AND inside the globe's circle (matters when zoomed in)
  return { sx: CX + x1*R, sy: CY - y2*R, vis: z2 > 0 && (x1*x1 + y2*y2) * zoom*zoom <= 1.0001, z: z2 };
}
function projectLL(lat, lng) { return project(...ll2xyz(lat, lng)); }
function slerp(a, b, t) {
  const d = Math.max(-1, Math.min(1, a[0]*b[0]+a[1]*b[1]+a[2]*b[2]));
  const om = Math.acos(d);
  if (om < 1e-6) return a;
  const s = 1/Math.sin(om);
  return a.map((v,i) => s*(Math.sin((1-t)*om)*v + Math.sin(t*om)*b[i]));
}
function haversine(la1, lo1, la2, lo2) {
  const Rk = 6371, D = Math.PI/180;
  const dLa = (la2-la1)*D, dLo = (lo2-lo1)*D;
  const a = Math.sin(dLa/2)**2 + Math.cos(la1*D)*Math.cos(la2*D)*Math.sin(dLo/2)**2;
  return 2*Rk*Math.asin(Math.sqrt(a));
}
function routeKm(from, to) { return haversine(from.lat, from.lng, to.lat, to.lng); }

// ── Flight profile ────────────────────────────────────────
// Airborne time only (no taxiing), built from simple speed ramps. Speeds km/h, times hours:
//   runway    0 → 280 over 40 s         (still on the ground: "preparing for takeoff")
//   climb     280 → 850 over 22 min
//   cruise    850
//   descent   850 → 250 over 28 min
//   landing   250 → 30 over 40 s        (done once it's down to taxi speed)
// Short hops never reach cruise: they climb part-way and start down again (same rates).
const V_CRUISE = 850, V_LIFTOFF = 280, V_TOUCHDOWN = 250, V_TAXI = 30;
const T_ROLL = 40 / 3600, T_CLIMB = 22 / 60, T_DESCENT = 28 / 60, T_ROLLOUT = 40 / 3600;
function makeProfile(segs) {
  let t = 0, d = 0;
  for (const g of segs) { g.t0 = t; g.d0 = d; t += g.T; d += (g.v0 + g.v1) / 2 * g.T; }
  return { segs: segs.filter(g => g.T > 1e-9), totalMs: t * 3600000, dist: d };
}
function buildProfile(km) {
  const a1 = (V_CRUISE - V_LIFTOFF) / T_CLIMB, a2 = (V_CRUISE - V_TOUCHDOWN) / T_DESCENT;   // km/h per hour
  const ground = V_LIFTOFF / 2 * T_ROLL + (V_TOUCHDOWN + V_TAXI) / 2 * T_ROLLOUT;
  const air = Math.max(0, km - ground);
  const climbD = v => (v * v - V_LIFTOFF ** 2) / (2 * a1), descD = v => (v * v - V_TOUCHDOWN ** 2) / (2 * a2);
  let vp = V_CRUISE;
  if (climbD(vp) + descD(vp) > air) {   // too short to reach cruise: find the top speed that fits
    vp = Math.sqrt((air + V_LIFTOFF ** 2 / (2 * a1) + V_TOUCHDOWN ** 2 / (2 * a2)) / (1 / (2 * a1) + 1 / (2 * a2)));
    vp = Math.max(vp, V_LIFTOFF + 1);
  }
  const tClimb = (vp - V_LIFTOFF) / a1, tDesc = (vp - V_TOUCHDOWN) / a2;
  const tCruise = Math.max(0, air - climbD(vp) - descD(vp)) / vp;
  return makeProfile([
    { phase: 'runway',  T: T_ROLL,    v0: 0,           v1: V_LIFTOFF },
    { phase: 'climb',   T: tClimb,    v0: V_LIFTOFF,   v1: vp },
    { phase: 'cruise',  T: tCruise,   v0: vp,          v1: vp },
    { phase: 'descent', T: tDesc,     v0: vp,          v1: V_TOUCHDOWN },
    { phase: 'landing', T: T_ROLLOUT, v0: V_TOUCHDOWN, v1: V_TAXI },
  ]);
}
// the old flat 900 km/h timing, kept only for a flight already in the air when this shipped
function legacyProfile(km) { return makeProfile([{ phase: 'cruise', T: km / 900, v0: 900, v1: 900 }]); }
// Where the plane is `ms` of flight time in: share of the distance, speed (km/h), phase.
function profileAt(prof, ms) {
  const t = ms / 3600000;
  let g = prof.segs[0];
  for (const s of prof.segs) if (t >= s.t0) g = s;
  const u = Math.max(0, Math.min(g.T, t - g.t0));
  const d = g.d0 + g.v0 * u + 0.5 * (g.v1 - g.v0) / g.T * u * u;
  return { frac: Math.min(1, d / prof.dist), v: g.v0 + (g.v1 - g.v0) * u / g.T, phase: g.phase };
}
function routeMs(km) { return buildProfile(km).totalMs; }

// The globe centres in whatever space the panel leaves: to its right on wide screens
// (sidebar), above it on narrow ones (bottom panel). When that space changes (a panel
// growing, a window resizing) the globe glides to its new place rather than jumping.
const panelEl = document.getElementById('panel');
let target = null;   // { cx, cy, r } the globe is easing towards
// sidebar vs bottom panel: the same width rule as styles.css (max-width: 699px = bottom panel)
const dockedQuery = window.matchMedia('(max-width: 699px)');
function panelDocked() { return dockedQuery.matches; }
function computeLayout() {
  const pr = panelEl.getBoundingClientRect();
  if (!panelDocked()) {
    const left = pr.right, w = W - left;
    return { cx: left + w / 2, cy: H / 2, r: Math.max(80, Math.min(w * 0.42, H * 0.42)) };
  }
  const h = pr.top;                                // the space above the bottom panel
  return { cx: W / 2, cy: h / 2 + 10, r: Math.max(70, Math.min(W * 0.44, h * 0.42)) };
}
function relayout(snap) {
  target = computeLayout();
  document.documentElement.style.setProperty('--globe-cx', target.cx + 'px');
  document.documentElement.style.setProperty('--panel-h', (H - panelEl.getBoundingClientRect().top) + 'px');
  if (snap) { CX = target.cx; CY = target.cy; baseR = target.r; R = baseR * zoom; }
}
function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 3);  // full Retina sharpness
  W = window.innerWidth; H = window.innerHeight;
  canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  relayout(true);
}
function easeLayout(dt) {
  if (!target) return;
  const k = reduceMotion.matches ? 1 : 1 - Math.exp(-dt / 0.12);
  CX += (target.cx - CX) * k; CY += (target.cy - CY) * k; baseR += (target.r - baseR) * k; R = baseR * zoom;
}
if (window.ResizeObserver) new ResizeObserver(() => relayout(false)).observe(panelEl);

// ── Sky and globe drawing ─────────────────────────────────
// Stars: fixed random positions that drift a little as the globe turns, with a gentle twinkle.
const STARS = Array.from({ length: 260 }, () => ({
  x: Math.random(), y: Math.random(),
  r: Math.random() < 0.08 ? 1.1 + Math.random() * 0.7 : 0.35 + Math.random() * 0.6,
  a: 0.25 + Math.random() * 0.65,
  depth: 0.2 + Math.random() * 0.8,
  tw: 0.4 + Math.random() * 1.6, ph: Math.random() * Math.PI * 2,
}));
function drawStars(t) {
  const still = reduceMotion.matches;
  for (const s of STARS) {
    const x = ((s.x * W + rotY * 30 * s.depth) % W + W) % W;
    const y = ((s.y * H + rotX * 20 * s.depth) % H + H) % H;
    const tw = still ? 1 : 0.7 + 0.3 * Math.sin(t * 0.001 * s.tw + s.ph);
    ctx.globalAlpha = s.a * tw;
    ctx.fillStyle = s.r > 1 ? '#fff6e0' : '#dfe9ff';
    ctx.beginPath(); ctx.arc(x, y, s.r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

let geo = null;
let LAND = null;   // every country outline as 3d points [x,y,z, x,y,z, …], worked out once
function landRings(features) {
  const rings = [];
  for (const f of features) {
    const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
    for (const poly of polys) for (const ring of poly) {
      const a = new Float64Array(ring.length * 3);
      ring.forEach(([lng, lat], i) => { const v = ll2xyz(lat, lng); a[i*3] = v[0]; a[i*3+1] = v[1]; a[i*3+2] = v[2]; });
      rings.push(a);
    }
  }
  return rings;
}
// Country shapes from the CDN, pinned to exact versions with integrity hashes: the
// browser refuses the file if its contents ever differ from what we checked. Upgrading
// either means updating the version AND recomputing its hash.
(function loadCountries() {
  const s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/npm/topojson-client@3.1.0/dist/topojson-client.min.js';
  s.integrity = 'sha384-Ukv1p/xTma6P4/2bY5KzWBw+ydSpXmhCMtyciIQVDJ1RmOxtCYNMF1uXT9T63H67';
  s.crossOrigin = 'anonymous';
  s.onload = () => {
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json',
          { integrity: 'sha384-yOCJ+8ShBm8UDqtAVtAvxTDDf4gXo5edxl/YG0FmVC5OTmqVLl7utuVGBDEeZWHf' })
      .then(r => r.json())
      .then(t => { geo = topojson.feature(t, t.objects.countries).features; LAND = landRings(geo); makePassMap(geo); })
      .catch(e => console.error('country shapes failed to load', e));
  };
  document.head.appendChild(s);
})();

// A line on the globe through sampled 3d points, lifting the pen on the far side.
function strokePath(points) {
  ctx.beginPath(); let pen = false;
  for (const pt of points) {
    const p = project(...pt);
    if (!p.vis) { pen = false; continue; }
    pen ? ctx.lineTo(p.sx, p.sy) : ctx.moveTo(p.sx, p.sy); pen = true;
  }
}
const GRATICULE = (() => {
  const lines = [];
  for (let lat = -60; lat <= 60; lat += 30) lines.push(Array.from({ length: 97 }, (_, i) => ll2xyz(lat, -180 + i * 3.75)));
  for (let lng = -180; lng < 180; lng += 30) lines.push(Array.from({ length: 49 }, (_, i) => ll2xyz(-90 + i * 3.75, lng)));
  return lines;
})();

function drawGlobe() {
  // atmosphere glow
  let g = ctx.createRadialGradient(CX, CY, baseR * 0.92, CX, CY, baseR * 1.22);
  g.addColorStop(0, 'rgba(110,170,255,0.28)'); g.addColorStop(0.35, 'rgba(80,140,255,0.10)'); g.addColorStop(1, 'rgba(60,120,255,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(CX, CY, baseR * 1.22, 0, Math.PI * 2); ctx.fill();

  // ocean, lit from the upper left
  g = ctx.createRadialGradient(CX - baseR * 0.35, CY - baseR * 0.4, baseR * 0.05, CX, CY, baseR);
  g.addColorStop(0, '#1d4677'); g.addColorStop(0.6, '#0e2850'); g.addColorStop(1, '#071731');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(CX, CY, baseR, 0, Math.PI * 2); ctx.fill();

  ctx.save();
  ctx.beginPath(); ctx.arc(CX, CY, baseR, 0, Math.PI * 2); ctx.clip();

  ctx.strokeStyle = 'rgba(150,190,255,0.07)'; ctx.lineWidth = 0.7;
  for (const line of GRATICULE) { strokePath(line); ctx.stroke(); }

  if (LAND) {
    // Countries are drawn by their near-side points (z > 0) and the canvas clip trims them
    // to the globe's circle, so zooming in works. Points on the far side of the planet are
    // pushed to the true horizon, so a country crossing it hugs the edge instead of being
    // cut off with a straight line. Borders: near side only. The rotation maths is
    // project() written out inline, because it runs for ~10,000 points every frame.
    const cY = Math.cos(rotY), sY = Math.sin(rotY), cX = Math.cos(rotX), sX = Math.sin(rotX);
    const fill = new Path2D(), border = new Path2D();
    for (const a of LAND) {
      const n = a.length / 3;
      let any = false;
      for (let i = 0; i < n && !any; i++) {
        const x = a[i*3], y = a[i*3+1], z = a[i*3+2];
        if (y * sX + (-x * sY + z * cY) * cX > 0) any = true;
      }
      if (!any) continue;                      // entirely on the far side
      let pen = false;
      for (let i = 0; i < n; i++) {
        const x = a[i*3], y = a[i*3+1], z = a[i*3+2];
        const x1 = x * cY + z * sY, z1 = -x * sY + z * cY;
        const y2 = y * cX - z1 * sX, z2 = y * sX + z1 * cX;
        let px = x1, py = y2;
        if (z2 <= 0) { const d = Math.hypot(x1, y2) || 1; px = x1 / d; py = y2 / d; }
        const sx = CX + px * R, sy = CY - py * R;
        i ? fill.lineTo(sx, sy) : fill.moveTo(sx, sy);
        if (z2 > 0) { pen ? border.lineTo(sx, sy) : border.moveTo(sx, sy); pen = true; } else pen = false;
      }
      fill.closePath();
    }
    ctx.fillStyle = '#28524b'; ctx.fill(fill);
    ctx.strokeStyle = 'rgba(150,215,190,0.28)'; ctx.lineWidth = 0.6; ctx.lineJoin = 'round'; ctx.stroke(border);
  }
  // shade the edge so it reads as a sphere, plus a soft highlight
  g = ctx.createRadialGradient(CX - baseR * 0.2, CY - baseR * 0.25, baseR * 0.5, CX, CY, baseR * 1.02);
  g.addColorStop(0, 'rgba(2,8,22,0)'); g.addColorStop(0.75, 'rgba(2,8,22,0.25)'); g.addColorStop(1, 'rgba(2,8,22,0.7)');
  ctx.fillStyle = g; ctx.fillRect(CX - baseR, CY - baseR, baseR * 2, baseR * 2);
  g = ctx.createRadialGradient(CX - baseR * 0.45, CY - baseR * 0.5, 0, CX - baseR * 0.45, CY - baseR * 0.5, baseR * 0.7);
  g.addColorStop(0, 'rgba(200,225,255,0.10)'); g.addColorStop(1, 'rgba(200,225,255,0)');
  ctx.fillStyle = g; ctx.fillRect(CX - baseR, CY - baseR, baseR * 2, baseR * 2);
  ctx.restore();

  ctx.strokeStyle = 'rgba(150,195,255,0.35)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(CX, CY, baseR, 0, Math.PI * 2); ctx.stroke();
}

const FONT_LABEL = '500 12px ui-rounded, "SF Pro Rounded", -apple-system, system-ui, sans-serif';
function drawLabel(text, x, y, color) {
  ctx.font = FONT_LABEL;
  ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(4,9,20,0.75)'; ctx.lineJoin = 'round';
  ctx.strokeText(text, x, y);
  ctx.fillStyle = color; ctx.fillText(text, x, y);
}

// Where each city's name was drawn this frame, so the name can be hovered/tapped like its dot.
let labelBoxes = [];
function drawCities() {
  const showAll = zoom >= 1.7;
  labelBoxes = [];
  const ends = currentEnds();
  for (const c of CITIES) {
    const isFrom = ends.from === c, isTo = ends.to === c;
    const target = c === pressedCity ? 2.4 : c === hoverCity ? 2.0 : (isFrom || isTo) ? 1.6 : 1;
    c.scale += (target - c.scale) * (1 - Math.exp(-frameDt / 0.06));
    const p = projectLL(c.lat, c.lng);
    if (!p.vis) continue;
    const r = 2.4 * c.scale;
    if (isTo) {
      ctx.fillStyle = '#ffbd5a'; ctx.shadowColor = 'rgba(255,189,90,0.8)'; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(p.sx, p.sy, r, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
    } else if (isFrom) {
      ctx.strokeStyle = '#8cc4ff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(p.sx, p.sy, r + 1, 0, Math.PI * 2); ctx.stroke();
    } else {
      ctx.fillStyle = c === hoverCity || c === pressedCity ? '#ffffff' : 'rgba(220,235,255,0.75)';
      ctx.beginPath(); ctx.arc(p.sx, p.sy, r, 0, Math.PI * 2); ctx.fill();
    }
    if (showAll || isFrom || isTo || c === hoverCity || c === pressedCity) {
      const lx = p.sx + r + 5, ly = p.sy + 4;
      drawLabel(c.n, lx, ly, isTo ? '#ffd79a' : isFrom ? '#cfe6ff' : 'rgba(235,242,255,0.92)');
      labelBoxes.push({ c, x0: p.sx - r, x1: lx + ctx.measureText(c.n).width, y0: ly - 12, y1: ly + 4 });
    }
  }
}

// The route: faint dashes ahead, an amber contrail behind, and the plane facing its heading.
function drawRoute(from, to, prog, withPlane, paused, t) {
  const a = ll2xyz(from.lat, from.lng), b = ll2xyz(to.lat, to.lng);
  const steps = 160, cut = Math.round(steps * prog);
  const pts = Array.from({ length: steps + 1 }, (_, i) => slerp(a, b, i / steps));
  ctx.lineCap = 'round';
  ctx.setLineDash([3, 6]); strokePath(pts.slice(cut));
  ctx.strokeStyle = 'rgba(235,242,255,0.45)'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.setLineDash([]);
  if (cut > 0) {
    const flown = pts.slice(0, cut + 1).concat([slerp(a, b, prog)]);
    strokePath(flown); ctx.strokeStyle = 'rgba(255,189,90,0.18)'; ctx.lineWidth = 8; ctx.stroke();
    strokePath(flown); ctx.strokeStyle = '#ffbd5a'; ctx.lineWidth = 2.4; ctx.stroke();
  }
  if (!withPlane) return;
  const p = project(...slerp(a, b, prog));
  if (!p.vis) return;
  const q = project(...slerp(a, b, Math.min(1, prog + 0.004)));
  const back = project(...slerp(a, b, Math.max(0, prog - 0.004)));
  const ang = Math.atan2(q.sy - back.sy, q.sx - back.sx);
  if (paused) {   // a slow pulse round the plane, so it's clear the flight is holding
    const k = reduceMotion.matches ? 0.5 : ((t || 0) / 1800) % 1;
    ctx.strokeStyle = `rgba(168,183,207,${(0.55 * (1 - k)).toFixed(3)})`; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(p.sx, p.sy, 10 + k * 18, 0, Math.PI * 2); ctx.stroke();
  }
  drawPlane(p.sx, p.sy, ang, paused ? null : 'rgba(255,189,90,0.9)', paused ? '#a8b7cf' : '#fff4dc');
}
function drawPlane(x, y, ang, glow, fill) {
  ctx.save();
  ctx.translate(x, y); ctx.rotate(ang);
  ctx.shadowColor = glow || 'rgba(0,0,0,0)'; ctx.shadowBlur = glow ? 12 : 0;
  ctx.fillStyle = fill;
  ctx.beginPath();   // a small plane, nose pointing along +x
  ctx.moveTo(11, 0); ctx.lineTo(7, -1.6); ctx.lineTo(1, -1.6); ctx.lineTo(-3, -9); ctx.lineTo(-6, -9);
  ctx.lineTo(-3, -1.6); ctx.lineTo(-8, -1.6); ctx.lineTo(-10, -4.5); ctx.lineTo(-12, -4.5); ctx.lineTo(-10.5, 0);
  ctx.lineTo(-12, 4.5); ctx.lineTo(-10, 4.5); ctx.lineTo(-8, 1.6); ctx.lineTo(-3, 1.6); ctx.lineTo(-6, 9);
  ctx.lineTo(-3, 9); ctx.lineTo(1, 1.6); ctx.lineTo(7, 1.6); ctx.closePath(); ctx.fill();
  ctx.restore();
}

// ── Camera: turning and zooming the globe ─────────────────
// All motion is time-based (same feel at 60 Hz or 120 Hz). The key piece is
// solveRotation(): "which rotation puts this point of the Earth at this spot on
// screen?". It powers three things:
//   • dragging: the point you grabbed stays under your finger/cursor
//   • zooming: the point under the cursor (or between your fingers) stays put
//   • facing a route: put the route's midpoint at the centre (spot 0,0)
// tests/behaviour.py checks it against project() for hundreds of random cases.
const ROT_X_LIMIT = 1.4;                 // ~80° tilt either way: a soft stop at the poles
const ZOOM_MIN = 1, ZOOM_MAX = 4;        // never smaller than the circle; up to 4x inside it
const FOLLOW_AFTER_MS = 12000;           // in flight, drift back to the route after 12 s untouched
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const wrapAngle = a => Math.atan2(Math.sin(a), Math.cos(a));   // → (-π, π]

const cam = {
  vx: 0, vy: 0,          // momentum, radians per second (tilt, spin)
  tZoom: 1,              // zoom we're gliding towards
  anchor: null,          // { P, sx, sy }: keep world point P under screen spot (sx, sy) while zooming
  auto: null,            // { rotX, rotY, zoom }: a glide the app started (facing a route)
  lastInteract: 0,
  samples: [],           // recent drag positions, for the flick speed on release
};
function setZoom(z) { zoom = clamp(z, ZOOM_MIN, ZOOM_MAX); R = baseR * zoom; }
function interacted() { if (replay) stopReplay();   // touching the globe stops a map replay
  cam.auto = null; cam.lastInteract = performance.now(); setOffFrame(true); }

// ── Recentre ──
// Once she drags or zooms away from a route, a button (bottom left) glides back to its
// framing. It hides again when the globe is reframed, by the button or the 12 s drift.
const btnRecentre = document.getElementById('btn-recentre');
let offFrame = false;
function currentRoute() {
  if (activeView === 'map') return null;   // the map tab shows every route, not one
  if (viewRoute && activeView === 'passes') return { from: viewRoute.from, to: viewRoute.to, prog: 0.5 };
  if (flight) return { from: flight.from, to: flight.to, prog: flightState(Date.now()).frac };
  if (sel.from && sel.to && sel.from !== sel.to) return { from: sel.from, to: sel.to, prog: 0 };
  return null;
}
function setOffFrame(v) {
  offFrame = v;
  btnRecentre.hidden = !(offFrame && currentRoute());
}
function recentre() {
  const r = currentRoute();
  if (r) { frameRoute(r.from, r.to, r.prog); cam.lastInteract = performance.now(); }
}
btnRecentre.addEventListener('click', recentre);

// Screen spot → point on the Earth (unit vector, world coordinates), or null if the spot
// isn't on the globe. The exact inverse of project().
function unproject(sx, sy) {
  const x1 = (sx - CX) / R, y2 = (CY - sy) / R;
  const d2 = x1 * x1 + y2 * y2;
  if (d2 * zoom * zoom > 1) return null;           // outside the globe's circle
  const z2 = Math.sqrt(Math.max(0, 1 - d2));
  const cX = Math.cos(rotX), sX = Math.sin(rotX), cY = Math.cos(rotY), sY = Math.sin(rotY);
  const y = y2 * cX + z2 * sX, z1 = -y2 * sX + z2 * cX;   // undo the tilt
  return [x1 * cY - z1 * sY, y, x1 * sY + z1 * cY];        // undo the spin
}

// The rotation that puts world point P at screen offset (qx, qy) — measured from the
// globe's centre in units of R — on the near side. Of the two answers, it returns the
// one closest to the current view, with the tilt held within the pole limits.
// Note: the globe only spins and tilts (never rolls), so a point near a pole can't be put
// far to the left or right of centre (|qx| can't exceed the point's distance from the
// axis); then it gives the closest reachable position.
function solveRotation(P, qx, qy) {
  const [x, y, z] = P;
  const A = Math.hypot(x, z), phi = Math.atan2(z, x);
  const a = Math.acos(clamp(qx / Math.max(A, 1e-9), -1, 1));
  let best = null;
  for (const Y of [phi + a, phi - a]) {
    const z1 = -x * Math.sin(Y) + z * Math.cos(Y);
    const B = Math.hypot(y, z1), psi = Math.atan2(z1, y);
    const X = wrapAngle(Math.acos(clamp(qy / Math.max(B, 1e-9), -1, 1)) - psi);
    const Xc = clamp(X, -ROT_X_LIMIT, ROT_X_LIMIT);
    const dY = wrapAngle(Y - rotY);
    const cost = Math.abs(dY) + Math.abs(Xc - rotX) + Math.abs(X - Xc) * 10;
    if (!best || cost < best.cost) best = { cost, rotX: Xc, rotY: rotY + dY };
  }
  return best;
}
function applyRotation(s) { rotX = s.rotX; rotY = s.rotY; }

// Keep the point under (sx, sy) fixed while zoom changes.
function setAnchor(sx, sy) {
  const P = unproject(sx, sy);
  cam.anchor = P ? { P, sx, sy } : null;
}
function holdAnchor() {
  if (!cam.anchor) return;
  const { P, sx, sy } = cam.anchor;
  applyRotation(solveRotation(P, (sx - CX) / R, (CY - sy) / R));
}

// ── Facing places ──
function viewCentredOn(P, z) { const s = solveRotation(P, 0, 0); return { rotX: s.rotX, rotY: s.rotY, zoom: z }; }
function faceCity(c) {
  cam.auto = viewCentredOn(ll2xyz(c.lat, c.lng), Math.max(1, Math.min(cam.tZoom, 2)));
}
// Centre the route and zoom so it fills about three quarters of the circle. Routes too
// long to fit on one side of the planet centre on the plane instead.
function frameRoute(from, to, prog) {
  setOffFrame(false);
  const a = ll2xyz(from.lat, from.lng), b = ll2xyz(to.lat, to.lng);
  const th = Math.acos(clamp(a[0]*b[0] + a[1]*b[1] + a[2]*b[2], -1, 1));   // angle between them
  if (th < 2.0) {
    cam.auto = viewCentredOn(slerp(a, b, 0.5), clamp(0.72 / Math.sin(th / 2 + 1e-6), ZOOM_MIN, ZOOM_MAX));
  } else {
    cam.auto = viewCentredOn(slerp(a, b, prog || 0), 1);
  }
}

// ── Per-frame update ──
function updateCamera(dt) {   // dt in seconds
  const now = performance.now();
  if (cam.auto && !dragging && !pinch) {
    const k = reduceMotion.matches ? 1 : 1 - Math.exp(-dt / (cam.auto.tau || 0.35));   // ease out, settles in ~2 s
    const dY = wrapAngle(cam.auto.rotY - rotY);
    rotY += dY * k; rotX += (cam.auto.rotX - rotX) * k;
    setZoom(zoom + (cam.auto.zoom - zoom) * k); cam.tZoom = zoom; cam.anchor = null;
    if (Math.abs(dY) < 2e-3 && Math.abs(cam.auto.rotX - rotX) < 2e-3 && Math.abs(cam.auto.zoom - zoom) < 4e-3) {
      rotY += wrapAngle(cam.auto.rotY - rotY); rotX = cam.auto.rotX; setZoom(cam.auto.zoom); cam.tZoom = zoom;   // within a hair: settle exactly
      cam.auto = null;
    }
    cam.vx = cam.vy = 0;
    return;
  }
  if (!dragging && !pinch) {
    // momentum after a flick, fading smoothly
    rotY += cam.vy * dt; rotX += cam.vx * dt;
    const decay = Math.exp(-dt / 0.35);
    cam.vx *= decay; cam.vy *= decay;
    if (Math.abs(rotX) > ROT_X_LIMIT) { rotX = Math.sign(rotX) * ROT_X_LIMIT; cam.vx = 0; }
    // zoom glides to its target (scroll wheel / trackpad), holding the spot under the cursor
    if (Math.abs(cam.tZoom - zoom) > 1e-4) {
      const k = reduceMotion.matches ? 1 : 1 - Math.exp(-dt / 0.09);
      setZoom(zoom + (cam.tZoom - zoom) * k);
      holdAnchor();
    } else if (zoom !== cam.tZoom) { setZoom(cam.tZoom); holdAnchor(); cam.anchor = null; }
  }
  // in flight and left alone: drift back to the route
  if (flight && !flight.landed && activeView !== 'map' && !dragging && !pinch && !cam.auto && now - cam.lastInteract > FOLLOW_AFTER_MS
      && Math.abs(cam.vx) + Math.abs(cam.vy) < 0.01 && Math.abs(cam.tZoom - zoom) < 1e-3) {
    frameRoute(flight.from, flight.to, flightState(Date.now()).frac);
    cam.lastInteract = now;
  }
}

// ── Touch, mouse and trackpad ──
// Pointer events cover mouse, pen and touch. One pointer drags (the grabbed point stays
// under it); two pinch and pan together; a tap that barely moves picks the nearest city.
const pointers = new Map();
let dragging = false, pinch = null, press = null, grab = null, lastPos = null;
let hoverCity = null, pressedCity = null;
let mouseX = 0, mouseY = 0;

function hitCity(x, y, touch) {
  const max = touch ? 24 : 14;
  let best = null, bestD = max, onDot = null;
  for (const c of CITIES) {   // right on a dot wins over a name drawn across it
    const p = projectLL(c.lat, c.lng);
    if (p.vis && Math.hypot(p.sx - x, p.sy - y) < 6) { onDot = c; break; }
  }
  if (onDot) return onDot;
  const pad = touch ? 6 : 2;  // then a city's name (latest drawn is on top)
  for (let i = labelBoxes.length - 1; i >= 0; i--) {
    const b = labelBoxes[i];
    if (x >= b.x0 - pad && x <= b.x1 + pad && y >= b.y0 - pad && y <= b.y1 + pad) return b.c;
  }
  for (const c of CITIES) {
    const p = projectLL(c.lat, c.lng);
    if (!p.vis) continue;
    const d = Math.hypot(p.sx - x, p.sy - y);
    if (d < bestD) { best = c; bestD = d; }
  }
  return best;
}
function twoPointers() { const [a, b] = [...pointers.values()]; return { d: Math.hypot(a.x - b.x, a.y - b.y), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 }; }
function sampleDrag() {
  const t = performance.now();
  cam.samples.push({ t, rx: rotX, ry: rotY });
  while (cam.samples.length > 2 && t - cam.samples[0].t > 100) cam.samples.shift();
}
// Drag the globe so that `grab` (a point on the Earth) sits under screen spot (x, y).
// If the spot is off the globe, the point is held at the circle's edge.
function dragTo(x, y) {
  let qx = (x - CX) / R, qy = (CY - y) / R;
  const lim = 0.999 / zoom, d = Math.hypot(qx, qy);
  if (d > lim) { qx *= lim / d; qy *= lim / d; }
  applyRotation(solveRotation(grab, qx, qy));
}

canvas.addEventListener('pointerdown', e => {
  try { canvas.setPointerCapture(e.pointerId); } catch(err) {}  // keeps the drag if the finger leaves the canvas
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  interacted(); closeAC();
  cam.vx = cam.vy = 0; cam.anchor = null; cam.tZoom = zoom; cam.samples = [];
  if (pointers.size === 1) {
    dragging = true; lastPos = { x: e.clientX, y: e.clientY };
    grab = unproject(e.clientX, e.clientY);       // null when grabbing the sky
    pressedCity = hitCity(e.clientX, e.clientY, e.pointerType !== 'mouse');
    press = { x: e.clientX, y: e.clientY, moved: false, city: pressedCity };
  } else if (pointers.size === 2) {
    const tp = twoPointers();
    pinch = { d0: tp.d, z0: zoom, P: unproject(tp.mx, tp.my) };
    press = null; pressedCity = null; dragging = false;
  }
  canvas.style.cursor = 'grabbing';
});
canvas.addEventListener('pointermove', e => {
  mouseX = e.clientX; mouseY = e.clientY;
  if (!pointers.has(e.pointerId)) {      // mouse hovering, no button down
    if (e.pointerType === 'mouse' && activeView === 'map') {
      hoverCity = null; mapState.hover = mapHit(e.clientX, e.clientY, false);
      canvas.style.cursor = mapState.hover ? 'pointer' : 'grab';
    } else if (e.pointerType === 'mouse') {
      hoverCity = hitCity(e.clientX, e.clientY, false);
      canvas.style.cursor = hoverCity && uiState() === 'plan' ? 'pointer' : 'grab';
    }
    return;
  }
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  interacted();
  if (pinch && pointers.size === 2) {   // pinch: zoom with the fingers, and pan with their midpoint
    const tp = twoPointers();
    setZoom(pinch.z0 * tp.d / pinch.d0); cam.tZoom = zoom;
    if (pinch.P) applyRotation(solveRotation(pinch.P, (tp.mx - CX) / R, (CY - tp.my) / R));
    return;
  }
  if (!dragging) return;
  if (press && Math.hypot(e.clientX - press.x, e.clientY - press.y) > 6) { press.moved = true; pressedCity = null; }
  if (grab) dragTo(e.clientX, e.clientY);
  else {                                 // grabbed the sky: turn by distance moved
    const k = 1 / R;
    rotY += (e.clientX - lastPos.x) * k; rotX = clamp(rotX + (e.clientY - lastPos.y) * k, -ROT_X_LIMIT, ROT_X_LIMIT);
  }
  lastPos = { x: e.clientX, y: e.clientY };
  sampleDrag();
});
function pointerEnd(e) {
  if (!pointers.has(e.pointerId)) return;
  pointers.delete(e.pointerId);
  if (pointers.size < 2) pinch = null;
  if (pointers.size === 1) {            // one finger left after a pinch: carry on dragging from it
    const [p] = pointers.values();
    dragging = true; lastPos = { x: p.x, y: p.y }; grab = unproject(p.x, p.y); cam.samples = [];
  }
  if (pointers.size === 0) {
    // flick: carry on at the speed of the last ~100 ms of the drag (none if it had stopped)
    const s = cam.samples, now = performance.now();
    if (dragging && s.length >= 2 && now - s[s.length - 1].t < 60) {
      const a = s[0], b = s[s.length - 1], dt = (b.t - a.t) / 1000;
      if (dt > 0.008) { cam.vx = (b.rx - a.rx) / dt; cam.vy = wrapAngle(b.ry - a.ry) / dt; }
      const max = 6; cam.vx = clamp(cam.vx, -max, max); cam.vy = clamp(cam.vy, -max, max);
    }
    dragging = false; grab = null;
    if (e.type === 'pointerup' && press && !press.moved) {
      if (activeView === 'map') mapTap(press.x, press.y, e.pointerType !== 'mouse');
      else if (press.city) onCityTap(press.city);
    }
    press = null; pressedCity = null;
    canvas.style.cursor = 'grab';
  }
}
canvas.addEventListener('pointerup', pointerEnd);
canvas.addEventListener('pointercancel', pointerEnd);
canvas.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse' && !pointers.size) { hoverCity = null; mapState.hover = null; } });

// Scroll wheel / trackpad: zoom glides towards the cursor. Chrome sends trackpad pinches
// as ctrl+wheel; Safari sends its own gesture events (ignored during a touch pinch,
// which the pointer code handles).
canvas.addEventListener('wheel', e => {
  e.preventDefault(); interacted();
  const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1);
  cam.tZoom = clamp(cam.tZoom * Math.exp(-dy * (e.ctrlKey ? 0.01 : 0.0022)), ZOOM_MIN, ZOOM_MAX);
  setAnchor(e.clientX, e.clientY);
}, { passive: false });
let gestureZoom0 = 1;
document.addEventListener('gesturestart', e => { e.preventDefault(); gestureZoom0 = cam.tZoom; });
document.addEventListener('gesturechange', e => {
  e.preventDefault();
  if (pointers.size >= 2 || e.target !== canvas) return;
  interacted();
  cam.tZoom = clamp(gestureZoom0 * e.scale, ZOOM_MIN, ZOOM_MAX);
  setAnchor(e.clientX ?? mouseX, e.clientY ?? mouseY);
});
document.addEventListener('gestureend', e => e.preventDefault());

// ── Audio ─────────────────────────────────────────────────
// Browsers (iOS Safari especially) only allow sound after a tap or key press, so the
// audio context is created and "unlocked" on the first interaction, and woken up again
// whenever the browser has paused it (tab hidden, device locked).
let audioCtx = null, audioUnlocked = false;
function unlockAudio() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  if (!audioCtx) audioCtx = new AC();
  if (audioCtx.state !== 'running') audioCtx.resume().catch(() => {});
  if (!audioUnlocked) {
    // a silent one-sample sound played inside the tap unlocks older iOS versions
    try {
      const s = audioCtx.createBufferSource();
      s.buffer = audioCtx.createBuffer(1, 1, 22050);
      s.connect(audioCtx.destination); s.start(0);
    } catch(e) {}
    audioUnlocked = true;
  }
}
['pointerdown','touchend','keydown'].forEach(ev => window.addEventListener(ev, unlockAudio, { passive:true }));

function playChime(type) {
  const ac = audioCtx;
  if (!ac) return; // no tap yet (e.g. a restored flight landing on page load): stay silent
  if (ac.state === 'running') { scheduleNotes(ac, type); return; }
  // paused: try to wake it, but don't let a stale chime play much later
  Promise.race([ac.resume(), new Promise((_, rej) => setTimeout(rej, 1000))])
    .then(() => scheduleNotes(ac, type)).catch(() => {});
}
function scheduleNotes(ac, type) {
  try {
    let notes;
    if      (type === 'takeoff') notes = [{f:330,d:0.3},{f:392,d:0.3},{f:523,d:0.5}];
    else if (type === 'halfway') notes = [{f:440,d:0.4},{f:554,d:0.4},{f:659,d:0.4},{f:880,d:0.6}];
    else if (type === 'landing') notes = [{f:523,d:0.25},{f:523,d:0.25},{f:523,d:0.25},{f:659,d:0.5},{f:523,d:0.5},{f:659,d:0.5},{f:784,d:0.8}];
    else if (type === 'break')   notes = [{f:523,d:0.5},{f:392,d:0.5}];
    else if (type === 'resume')  notes = [{f:392,d:0.5},{f:523,d:0.5},{f:659,d:0.5}];
    let t = ac.currentTime;
    notes.forEach(({f,d}) => {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.connect(gain); gain.connect(ac.destination);
      osc.type = type === 'landing' ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(f, t);
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + d);
      osc.start(t); osc.stop(t + d);
      t += d * 0.85;
    });
  } catch(e) {}
}

// ── Pomodoro ──────────────────────────────────────────────
// Runs on real wall-clock time from takeoff. The phase is worked out from the clock (not
// by counting ticks), so it can't drift. Lengths are her choice (remembered on this
// device); each flight keeps the lengths it took off with.
const POMO_DEFAULT = { focus: 50, brk: 10 };   // minutes
const POMO_LIMITS = { focus: [1, 180], brk: [1, 60] };
const PREFS_KEY = 'pomoPrefs';
let pomo = null; // { start, focus, brk (ms), onBreak } while a pomodoro flight is in the air

function pomoPhase(now) {
  const cycle = pomo.focus + pomo.brk;
  const pos = Math.max(0, now - pomo.start) % cycle;
  return pos < pomo.focus
    ? { onBreak:false, left:pomo.focus - pos, limit:pomo.focus }
    : { onBreak:true,  left:cycle - pos,      limit:pomo.brk };
}
function loadPrefs() {
  let p = null;
  try { p = JSON.parse(localStorage.getItem(PREFS_KEY)); } catch(e) {}
  return {
    on: !!(p && p.on),
    focus: validMinutes(p && p.focus, POMO_LIMITS.focus) ?? POMO_DEFAULT.focus,
    brk: validMinutes(p && p.brk, POMO_LIMITS.brk) ?? POMO_DEFAULT.brk,
  };
}
function savePrefs(p) { try { localStorage.setItem(PREFS_KEY, JSON.stringify(p)); } catch(e) {} }
function validMinutes(v, [lo, hi]) {
  const n = Number(v);
  return Number.isInteger(n) && n >= lo && n <= hi ? n : null;
}

// ── Milestone pill ────────────────────────────────────────
// The message follows the flight's phase at the ends (runway, climb, descent,
// touchdown) and her study time in between.
const LANDED_MSG = 'landed. great session 🎉';
const BREAK_MSG = 'break time. step away 🧘';
const PAUSED_MSG = 'paused. take your time ☕';
const pillEl = $('pill');
let pillTarget = '', pillTimer = null;
function setPill(text) {   // crossfade to new text
  if (text === pillTarget) return;
  pillTarget = text;
  if (!pillEl.textContent || reduceMotion.matches) { pillEl.textContent = text; return; }
  pillEl.classList.add('out');
  clearTimeout(pillTimer);
  pillTimer = setTimeout(() => { pillEl.textContent = pillTarget; pillEl.classList.remove('out'); }, 280);
}
function bannerFor(now) {
  if (flight.landed) return LANDED_MSG;
  if (flight.paused) return PAUSED_MSG;
  if (pomo && pomo.onBreak) return BREAK_MSG;
  const { phase } = flightState(now), p = flightProgress(now);
  if (phase === 'runway')  return 'preparing for takeoff 🛫';
  if (phase === 'climb')   return 'wheels up — lock in 👀';
  if (phase === 'descent') return 'starting our descent. almost there 🥰';
  if (phase === 'landing') return 'touchdown 🛬';
  return p >= 0.5 ? 'halfway there. ⏳' : 'stay focused. 🫡';
}
function updateBanner(now) { if (flight) setPill(bannerFor(now)); }

// ── Flight timing ─────────────────────────────────────────
// Flight time runs at `speed` × real time, and stands still while paused. We store how
// much flight time had passed (virtMs) at the last change of speed or pause (lastT);
// everything else is worked out from the clock. So a speed change never makes progress
// jump, and a tick that runs late (background tab) still gives the right numbers.
// Two kinds of progress:
//   flightProgress = share of the flight's TIME done: study timer, messages, halfway chime
//   flightState    = where the plane IS (share of distance), its speed and phase
let flight = null;
const chkPomo  = $('chk-pomo');
const speedBtns = [...document.querySelectorAll('[data-speed]')];
let chosenSpeed = 1;

function selectedSpeed() { return chosenSpeed; }
function showSpeed(v) { speedBtns.forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.speed) === v))); }
function newFlightId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 10); }
function flightVirt(now) { return flight.paused ? flight.virtMs : flight.virtMs + (now - flight.lastT) * flight.speed; }
function flightProgress(now) { return flight.landed ? 1 : Math.min(1, flightVirt(now) / flight.totalMs); }
function flightState(now) {
  return flight.landed ? { frac: 1, v: 0, phase: 'landed' } : profileAt(flight.prof, Math.min(flight.totalMs, flightVirt(now)));
}
// active real time so far, leaving out pauses
function activeMs(now) { return (now - flight.startT) - flight.pausedMs - (flight.paused ? now - flight.pausedAt : 0); }

// The flight in the air is kept on this device so a refresh (or reopening the tab)
// carries on where it was. Only the unfinished flight lives here; finished flights are
// in Firestore. If the browser clears this, only the current flight is lost.
const ACTIVE_KEY = 'activeFlight';
function persistFlight() {
  try {
    if (!flight || flight.landed) { localStorage.removeItem(ACTIVE_KEY); return; }
    localStorage.setItem(ACTIVE_KEY, JSON.stringify({
      v:1, model:flight.model, id:flight.id, from:flight.from.n, to:flight.to.n, module:flight.module, startT:flight.startT,
      virtMs:flight.virtMs, lastT:flight.lastT, speed:flight.speed, sped:flight.sped,
      paused:flight.paused, pausedAt:flight.pausedAt, pausedMs:flight.pausedMs,
      pomoStart: pomo ? pomo.start : null,
      pomoFocus: pomo ? pomo.focus : null, pomoBreak: pomo ? pomo.brk : null,
    }));
  } catch(e) {}
}
function restoreFlight() {
  let s = null;
  try { s = JSON.parse(localStorage.getItem(ACTIVE_KEY)); } catch(e) {}
  if (!s || s.v !== 1) return;
  const from = findCity(s.from), to = findCity(s.to);
  if (!from || !to || from === to) { try { localStorage.removeItem(ACTIVE_KEY); } catch(e) {} return; }
  launch({ ...s, from, to }, true);
}

function startFlight(from, to, pomoMins) {
  stopFlight();
  const now = Date.now(), speed = selectedSpeed();
  launch({ model:2, id:newFlightId(), from, to, module: sel.module, startT:now, virtMs:0, lastT:now, speed, sped: speed > 1,
           paused:false, pausedAt:null, pausedMs:0,
           pomoStart: pomoMins ? now : null,
           pomoFocus: pomoMins ? pomoMins.focus * 60000 : null,
           pomoBreak: pomoMins ? pomoMins.brk * 60000 : null }, false);
}

function launch(s, restored) {
  const km = routeKm(s.from, s.to);
  // model 2 = the realistic profile. A flight saved before it existed (no model) keeps
  // the old flat 900 km/h timing, so its progress doesn't jump when the app updates.
  const model = s.model === 2 ? 2 : 1;
  const prof = model === 2 ? buildProfile(km) : legacyProfile(km);
  flight = { id:s.id, model, from:s.from, to:s.to, module:s.module || null, km, prof, totalMs:prof.totalMs,
             startT:s.startT, virtMs:s.virtMs, lastT:s.lastT, speed:s.speed, sped:!!s.sped,
             paused:!!s.paused, pausedAt:s.pausedAt ?? null, pausedMs:s.pausedMs || 0,
             landed:false, halfwayChimed:false };
  const now = Date.now();
  pomo = s.pomoStart != null
    ? { start:s.pomoStart, focus:s.pomoFocus || POMO_DEFAULT.focus * 60000, brk:s.pomoBreak || POMO_DEFAULT.brk * 60000, onBreak:false }
    : null;
  if (pomo && !flight.paused) pomo.onBreak = pomoPhase(now).onBreak;   // no chime for the current phase
  if (restored) flight.halfwayChimed = flightProgress(now) >= 0.5;     // or for a halfway already passed
  sel.from = flight.from; sel.to = flight.to;
  chosenSpeed = flight.speed; showSpeed(chosenSpeed);
  persistFlight();
  if (!restored) playChime('takeoff');
  showLivePass(!restored);   // takeoff: the boarding pass prints and tears; after a refresh it's just there
  frameRoute(flight.from, flight.to, flightState(now).frac);
  cam.lastInteract = performance.now();
  renderState();
  tick();
}

function tick() {
  if (!flight || flight.landed || flight.paused) return;
  const now = Date.now();
  const virt = flightVirt(now);
  if (virt >= flight.totalMs) { land(); return; }
  const p = virt / flight.totalMs;
  if (pomo) {
    const onBreak = pomoPhase(now).onBreak;
    if (onBreak !== pomo.onBreak) { pomo.onBreak = onBreak; playChime(onBreak ? 'break' : 'resume'); }
  }
  if (p >= 0.5 && !flight.halfwayChimed) { flight.halfwayChimed = true; playChime('halfway'); }
  if (activeView === 'fly') updateBanner(now);
}

function land() {
  // the exact moment it reached 100%, even if this tick ran late or the page was closed
  const landT = Math.max(flight.startT, flight.lastT + (flight.totalMs - flight.virtMs) / flight.speed);
  flight.landed = true;
  flight.landT = landT;
  flight.activeMs = Math.max(0, (landT - flight.startT) - flight.pausedMs);   // real study time, pauses left out
  pomo = null;
  persistFlight(); // clears the stored in-progress flight
  playChime('landing');
  landLivePass();
  renderState();
  saveToHistory(flight, landT);
}

function stopFlight() {
  if (flight && !flight.landed) dropLivePass();
  flight = null; pomo = null;
  persistFlight(); // clears the stored in-progress flight
  renderState();
}

// Pause freezes the flight clock and the pomodoro. Resuming starts a fresh focus period
// (the pause was a break in itself). Paused time isn't counted anywhere.
function pauseFlight() {
  if (!flight || flight.landed || flight.paused) return;
  tick();                        // land first if it was already due
  if (flight.landed) return;
  const now = Date.now();
  flight.virtMs = flightVirt(now); flight.lastT = now;
  flight.paused = true; flight.pausedAt = now;
  persistFlight();
  renderState();
}
function resumeFlight() {
  if (!flight || !flight.paused) return;
  const now = Date.now();
  flight.pausedMs += now - flight.pausedAt;
  flight.paused = false; flight.pausedAt = null; flight.lastT = now;
  if (pomo) { pomo.start = now; pomo.onBreak = false; }
  persistFlight();
  renderState();
  tick();
}

speedBtns.forEach(b => b.addEventListener('click', () => {
  chosenSpeed = Number(b.dataset.speed); showSpeed(chosenSpeed);
  if (!flight || flight.landed) return;   // before takeoff it just sets the speed to fly at
  tick();                        // land first if it was already due at the old speed
  if (flight.landed) return;
  const now = Date.now();
  flight.virtMs = flightVirt(now); flight.lastT = now;
  flight.speed = chosenSpeed;
  if (flight.speed > 1) flight.sped = true;
  persistFlight();
  $('fl-real').hidden = flight.speed === 1;
  tick();
}));

// Background tabs slow normal timers right down (Chrome: to once a minute), which made
// chimes, pomodoro switches and the landing save late. A tiny Web Worker's timer is not
// slowed as much, so it drives tick(). Fallback: plain setInterval.
(function startTicker() {
  try {
    const src = 'setInterval(function(){postMessage(0)},500)';
    const w = new Worker(URL.createObjectURL(new Blob([src], { type:'text/javascript' })));
    w.onmessage = tick;
  } catch(e) {
    setInterval(tick, 500);
  }
})();
// Coming back to the tab or device: catch up straight away and wake the audio.
function onReturn() {
  if (document.hidden) return;
  if (audioCtx && audioCtx.state !== 'running') audioCtx.resume().catch(() => {});
  tick();
}
document.addEventListener('visibilitychange', onReturn);
window.addEventListener('pageshow', onReturn);
window.addEventListener('focus', onReturn);

// ── Interface ─────────────────────────────────────────────
// Three states on the fly tab: plan (choose a route), flying, landed.
const sel = { from: null, to: null, module: null };   // the flight being planned (module stays chosen between flights)
const inpFrom = $('inp-from'), inpTo = $('inp-to');
const cardPlan = $('card-plan'), cardFlight = $('card-flight'), cardLanded = $('card-landed');
const pomoFocusInp = $('pomo-focus'), pomoBreakInp = $('pomo-break');
let activeView = 'fly';

function uiState() { return !flight ? 'plan' : flight.landed ? 'landed' : 'flying'; }
function currentEnds() { return flight ? { from: flight.from, to: flight.to } : sel; }

// hours → "23 min", "10 h 37 min"
function durWords(ms) {
  const totalMin = Math.max(1, Math.round(ms / 60000));
  const h = Math.floor(totalMin / 60), m = totalMin % 60;
  return h ? (m ? `${h} h ${m} min` : `${h} h`) : `${m} min`;
}
// ms → "9h 32m" / "12:05" style countdown
function clock(ms) {
  const t = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60;
  return h ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}:${String(s).padStart(2, '0')}`;
}
function formatDur(hours) {   // history display string (kept identical to older flights)
  const totalSec = Math.round(hours * 3600);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return h + 'h ' + String(m).padStart(2,'0') + 'm';
  if (m > 0) return m + 'm ' + String(s).padStart(2,'0') + 's';
  return s + 's';
}
const textCache = new Map();
function setText(el, text) { if (textCache.get(el) !== text) { textCache.set(el, text); el.textContent = text; } }
function setRoute(el, from, to) {   // "london ✈ paris" built safely
  el.replaceChildren(document.createTextNode(from), Object.assign(document.createElement('span'), { className: 'plane', textContent: '✈' }), document.createTextNode(to));
}

function renderState() {
  const st = uiState();
  cardPlan.hidden = st !== 'plan';
  cardFlight.hidden = st !== 'flying';
  cardLanded.hidden = st !== 'landed';
  $('speed-row').hidden = st === 'landed';
  $('btn-fly').hidden = st !== 'plan';
  document.body.classList.toggle('in-flight', st === 'flying');
  document.body.classList.toggle('paused', st === 'flying' && flight.paused);
  chkPomo.disabled = st === 'flying';
  textCache.clear();
  if (st === 'plan') {
    inpFrom.value = sel.from ? sel.from.n : inpFrom.value;
    inpTo.value = sel.to ? sel.to.n : inpTo.value;
    updatePlan();
  } else if (st === 'flying') {
    setRoute($('fl-route'), flight.from.n, flight.to.n);
    $('fl-module').textContent = flight.module || '';
    $('pomo-ring').hidden = !pomo;
    $('fl-real').hidden = flight.speed === 1;
    resetStopButton();
    const btnPause = $('btn-pause');
    btnPause.textContent = flight.paused ? 'resume' : 'pause';
    btnPause.classList.toggle('resume', flight.paused);
    btnPause.setAttribute('aria-pressed', String(flight.paused));
    updateHud(Date.now());
    updateBanner(Date.now());
  } else {
    const f = flight;
    $('ld-title').textContent = `landed in ${f.to.n}`;
    $('ld-sub').textContent = `${fmtNum(f.km)} km and ${durWords(f.totalMs)} of ${f.module || 'study'}. lovely work.`;
    $('btn-onward').textContent = `fly onward from ${f.to.n}`;
    // badges this landing earned: each one opens it in the stats tab
    const nb = f.newBadges || [];
    $('ld-badge').hidden = !nb.length;
    $('ld-badge').replaceChildren(...(nb.length ? [el('span', 'landed-badge-lead', `new badge${nb.length > 1 ? 's' : ''} 🎉`),
      ...nb.map(b => { const x = el('button', 'badge-link', `${b.icon} ${b.name}`); x.type = 'button'; x.title = 'see it in your stats';
                       x.addEventListener('click', () => openBadge(b.id)); return x; })] : []));
    setPill(LANDED_MSG);
  }
}

function updatePlan() {
  const msg = $('plan-msg');
  const ok = sel.from && sel.to && sel.from !== sel.to;
  const preview = $('route-preview');
  if (ok) {
    const km = routeKm(sel.from, sel.to);
    preview.replaceChildren(
      Object.assign(document.createElement('b'), { textContent: `${fmtNum(km)} km` }),
      document.createTextNode(`, about ${durWords(routeMs(km))} of study`));
  }
  preview.hidden = !ok;
  if (ok) msg.textContent = '';
  if (activeView === 'fly' && uiState() === 'plan') {
    setPill(!sel.from ? 'tap a city to set off from'
          : !sel.to ? 'now pick where you’re flying to'
          : sel.from === sel.to ? 'pick two different cities'
          : 'ready when you are ✈');
  }
}

// HUD numbers, refreshed every frame while in the air (cheap: text only changes when needed)
function updateHud(now) {
  if (uiState() !== 'flying') return;
  updateLivePass(now);
  const virt = Math.min(flight.totalMs, flightVirt(now));
  const st = flightState(now);                       // where the plane is: distance share, speed, phase
  setText($('fl-left'), clock(flight.totalMs - virt));
  setText($('fl-left-label'), flight.paused ? 'paused, take your time' : 'left in the air');
  if (flight.speed !== 1) setText($('fl-real'), `${clock((flight.totalMs - virt) / flight.speed)} real time at ${flight.speed}x`);
  const v = Math.round(st.v / 10) * 10;
  setText($('fl-phase'), flight.paused ? 'holding position'
    : st.phase === 'runway' ? 'on the runway'
    : st.phase === 'climb' ? `climbing, ${v} km/h`
    : st.phase === 'cruise' ? `cruising at ${v} km/h`
    : st.phase === 'descent' ? `descending, ${v} km/h`
    : 'touching down');
  $('fl-bar').style.width = (st.frac * 100).toFixed(2) + '%';
  setText($('fl-flown'), `${fmtNum(st.frac * flight.km)} km flown`);
  setText($('fl-togo'), `${fmtNum(flight.km - st.frac * flight.km)} km to go`);
  if (pomo && flight.paused) {                       // frozen; resuming starts a fresh focus period
    $('pomo-ring').classList.remove('break');
    $('pomo-arc').style.strokeDashoffset = '0';
    setText($('pomo-time'), `${Math.round(pomo.focus / 60000)}m`);
    setText($('pomo-phase'), 'paused');
  } else if (pomo) {
    const ph = pomoPhase(now);
    $('pomo-ring').classList.toggle('break', ph.onBreak);
    $('pomo-arc').style.strokeDashoffset = (169.65 * (1 - ph.left / ph.limit)).toFixed(2);
    setText($('pomo-time'), ph.left >= 60000 ? `${Math.ceil(ph.left / 60000)}m` : `${Math.ceil(ph.left / 1000)}s`);
    setText($('pomo-phase'), ph.onBreak ? 'break' : 'focus');
  }
}

// Choosing cities: by tapping the globe (first tap = from, second = to) or by typing.
function onCityTap(c) {
  if (uiState() === 'landed') { stopFlight(); }
  if (uiState() !== 'plan') return;
  if (sel.from === c && !sel.to) sel.from = null;
  else if (sel.to === c) sel.to = null;
  else if (sel.from === c) { sel.from = sel.to; sel.to = null; }
  else if (!sel.from) sel.from = c;
  else if (!sel.to) sel.to = c;
  else { sel.from = c; sel.to = null; }
  inpFrom.value = sel.from ? sel.from.n : '';
  inpTo.value = sel.to ? sel.to.n : '';
  $('plan-msg').textContent = '';
  updatePlan();
  if (sel.from && sel.to) frameRoute(sel.from, sel.to);   // a tapped city is already in view; a full route gets framed
}
// After choosing a city by typing: show the whole route, or turn to the city.
function faceChoice(c) {
  if (sel.from && sel.to && sel.from !== sel.to) frameRoute(sel.from, sel.to);
  else if (c) faceCity(c);
}

$('btn-swap').addEventListener('click', () => {
  [sel.from, sel.to] = [sel.to, sel.from];
  [inpFrom.value, inpTo.value] = [inpTo.value, inpFrom.value];
  updatePlan();
});

// autocomplete
const acEl = $('ac');
let acFor = null, acItems = [], acIndex = -1;
function openAC(inp) {
  const v = inp.value.trim().toLowerCase();
  acItems = v ? CITIES.filter(c => c.n.includes(v) || c.c.includes(v))
                      .sort((a, b) => (b.n.startsWith(v) - a.n.startsWith(v)) || a.n.localeCompare(b.n))
                      .slice(0, 7) : [];
  if (!acItems.length || (acItems.length === 1 && acItems[0].n === v)) { closeAC(); return; }
  acFor = inp; acIndex = -1;
  acEl.replaceChildren(...acItems.map((c, i) => {
    const li = document.createElement('li');
    li.setAttribute('role', 'option'); li.id = 'ac-' + i;
    li.append(Object.assign(document.createElement('span'), { textContent: c.n }),
              Object.assign(document.createElement('span'), { className: 'country', textContent: c.c }));
    li.addEventListener('pointerdown', e => { e.preventDefault(); pickCity(c); });
    return li;
  }));
  acEl.hidden = false;
  placeAC(inp);
  inp.setAttribute('aria-expanded', 'true');
}
// under the field in the sidebar; above it when the panel is docked at the bottom
function placeAC(inp) {
  const r = inp.getBoundingClientRect();
  acEl.style.left = r.left + 'px';
  acEl.style.width = r.width + 'px';
  if (panelDocked()) { acEl.style.top = 'auto'; acEl.style.bottom = (H - r.top + 8) + 'px'; }
  else { acEl.style.bottom = 'auto'; acEl.style.top = (r.bottom + 6) + 'px'; }
}
function closeAC() {
  acEl.hidden = true; acItems = []; acIndex = -1;
  inpFrom.setAttribute('aria-expanded', 'false'); inpTo.setAttribute('aria-expanded', 'false');
}
function highlightAC(i) {
  acIndex = (i + acItems.length) % acItems.length;
  [...acEl.children].forEach((li, j) => li.setAttribute('aria-selected', String(j === acIndex)));
  acFor.setAttribute('aria-activedescendant', 'ac-' + acIndex);
}
function pickCity(c) {
  const inp = acFor;
  inp.value = c.n;
  sel[inp === inpFrom ? 'from' : 'to'] = c;
  closeAC();
  updatePlan();
  faceChoice(c);
  if (inp === inpFrom && !sel.to) inpTo.focus();
}
[inpFrom, inpTo].forEach(inp => {
  const key = inp === inpFrom ? 'from' : 'to';
  inp.addEventListener('input', () => {
    const before = sel[key];
    sel[key] = findCity(inp.value) || null;
    $('plan-msg').textContent = ''; updatePlan(); openAC(inp);
    if (sel[key] && sel[key] !== before) faceChoice(sel[key]);
  });
  inp.addEventListener('focus', () => { if (inp.value) openAC(inp); });
  inp.addEventListener('blur', () => setTimeout(closeAC, 120));
  inp.addEventListener('keydown', e => {
    if (acEl.hidden || acFor !== inp) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); highlightAC(acIndex + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); highlightAC(acIndex - 1); }
    else if (e.key === 'Enter' && acIndex >= 0) { e.preventDefault(); pickCity(acItems[acIndex]); }
    else if (e.key === 'Escape') { closeAC(); }
  });
});

// pomodoro settings
const prefs = loadPrefs();
chkPomo.checked = prefs.on;
pomoFocusInp.value = prefs.focus; pomoBreakInp.value = prefs.brk;
$('pomo-lengths').hidden = !prefs.on;
chkPomo.addEventListener('change', () => {
  $('pomo-lengths').hidden = !chkPomo.checked;
  prefs.on = chkPomo.checked; savePrefs(prefs);
});
[[pomoFocusInp, 'focus'], [pomoBreakInp, 'brk']].forEach(([inp, key]) => {
  inp.addEventListener('change', () => {
    const v = validMinutes(inp.value, POMO_LIMITS[key]);
    if (v != null) { prefs[key] = v; savePrefs(prefs); $('plan-msg').textContent = ''; }
  });
});

// fly
cardPlan.addEventListener('submit', e => {
  e.preventDefault();
  closeAC();
  const msg = $('plan-msg');
  const from = sel.from || findCity(inpFrom.value), to = sel.to || findCity(inpTo.value);
  if (!from) { msg.textContent = inpFrom.value ? `we don’t fly from “${inpFrom.value.trim()}” yet. pick a city from the list.` : 'choose where you’re leaving from.'; return; }
  if (!to)   { msg.textContent = inpTo.value ? `we don’t fly to “${inpTo.value.trim()}” yet. pick a city from the list.` : 'choose where you’re flying to.'; return; }
  if (from === to) { msg.textContent = 'pick two different cities.'; return; }
  let mins = null;
  if (chkPomo.checked) {
    const focus = validMinutes(pomoFocusInp.value, POMO_LIMITS.focus);
    const brk = validMinutes(pomoBreakInp.value, POMO_LIMITS.brk);
    if (focus == null) { msg.textContent = 'focus time needs to be 1 to 180 minutes.'; pomoFocusInp.focus(); return; }
    if (brk == null) { msg.textContent = 'break time needs to be 1 to 60 minutes.'; pomoBreakInp.focus(); return; }
    mins = { focus, brk };
    Object.assign(prefs, mins); savePrefs(prefs);
  }
  sel.from = from; sel.to = to;
  if (!sel.module && !e.skipModuleCheck) { askNoModule(); return; }
  startFlight(from, to, mins);
});
function submitPlan(skipModuleCheck) {   // press fly from code (after the warning or the picker)
  const ev = new Event('submit', { cancelable: true });
  ev.skipModuleCheck = skipModuleCheck;
  cardPlan.dispatchEvent(ev);
}

// stop: two taps, so a stray click doesn't throw away a session
const btnStop = $('btn-stop');
let stopArmTimer = null;
function resetStopButton() { clearTimeout(stopArmTimer); btnStop.classList.remove('armed'); btnStop.textContent = 'stop'; }
btnStop.addEventListener('click', () => {
  if (btnStop.classList.contains('armed')) { resetStopButton(); stopFlight(); return; }
  btnStop.classList.add('armed'); btnStop.textContent = 'stop? it won’t be saved';
  stopArmTimer = setTimeout(resetStopButton, 3500);
});

// ── Modules ───────────────────────────────────────────────
// Her module list lives here (grouped, like the cities); modules she adds go to the
// database ("your modules"). A flight records the module's name; none = uncategorised.
const MODULE_GROUPS = [
  { label: 'year 4, module a', items: ['acute medicine', 'cardiology', 'endocrinology', 'respiratory'] },
  { label: 'year 4, module b', items: ['gastroenterology & hepatology', 'gastrointestinal surgery', 'rheumatology',
                                       'trauma & orthopaedics', 'peri-operative care & anaesthetics', 'vascular surgery'] },
  { label: 'year 4, module c', items: ['ear, nose & throat', 'haematology', 'infectious diseases', 'nephrology', 'neurology'] },
  { label: 'year 5, module a', items: ['child health', 'core general practice', 'child & adolescent mental health'] },
  { label: 'year 5, module b', items: ['breast', 'dermatology', 'obstetrics & gynaecology', 'sexual health & hiv medicine', 'urology'] },
  { label: 'year 5, module c', items: ['cancer medicine', 'care of the older person', 'ophthalmology', 'palliative care', 'psychiatry'] },
  { label: 'year 6', items: ['gp assistantship', 'hospital assistantship'] },
  { label: 'cpp', items: ['uses of medicine', 'ethics and law'] },
  { label: 'exam prep', items: ['akt', 'osce'] },
];
const BUILT_IN_MODULES = new Set(MODULE_GROUPS.flatMap(g => g.items));
let customModules = [];
const moduleMenu = $('module-menu'), moduleList = $('module-list'), moduleSearch = $('module-search');
const btnModule = $('btn-module');
let flyAfterPick = false;   // the picker was opened from the "no module" warning: picking takes off

async function loadCustomModules() {
  try {
    const DB = await dbReady;
    customModules = (await DB.loadModules()).filter(n => !BUILT_IN_MODULES.has(n));
    if (!moduleMenu.hidden) renderModuleList();
  } catch (e) { console.error(e); }
}
function showModule() {
  const v = $('module-value');
  v.textContent = sel.module || 'choose a module';
  v.classList.toggle('empty', !sel.module);
}
function renderModuleList() {
  const q = moduleSearch.value.trim().toLowerCase();
  const groups = [...MODULE_GROUPS, { label: 'your modules', items: customModules }]
    .map(g => ({ label: g.label, items: g.items.filter(n => !q || n.includes(q) || g.label.includes(q)) }))
    .filter(g => g.items.length);
  const item = (name, label, cls) => {
    const b = el('button', 'module-item' + (cls ? ' ' + cls : ''), label);
    b.type = 'button'; b.setAttribute('role', 'option');
    b.setAttribute('aria-selected', String(sel.module === name));
    b.addEventListener('click', () => chooseModule(name));
    return b;
  };
  const out = [];
  if (!q) out.push(item(null, 'no module (uncategorised)', 'none'));
  for (const g of groups) { out.push(el('div', 'module-group', g.label)); g.items.forEach(n => out.push(item(n, n))); }
  if (!groups.length) out.push(el('p', 'module-empty', `no module matches “${q}”. add it below.`));
  moduleList.replaceChildren(...out);
}
// below the sidebar if there's room; beside it if not; above the panel when it's docked at the bottom
function placeModuleMenu() {
  const pr = panelEl.getBoundingClientRect(), m = moduleMenu.style;
  m.left = m.right = m.top = m.bottom = m.width = m.maxHeight = '';
  if (!panelDocked()) {
    const below = H - pr.bottom - 26;
    if (below >= 260) { m.left = pr.left + 'px'; m.top = (pr.bottom + 10) + 'px'; m.width = pr.width + 'px'; m.maxHeight = below + 'px'; }
    else { m.left = (pr.right + 10) + 'px'; m.top = pr.top + 'px'; m.width = pr.width + 'px'; m.maxHeight = (H - pr.top - 16) + 'px'; }
  } else {
    m.left = pr.left + 'px'; m.width = pr.width + 'px';
    m.bottom = (H - pr.top + 8) + 'px'; m.maxHeight = Math.max(200, pr.top - 70) + 'px';
  }
}
function openModuleMenu(thenFly) {
  flyAfterPick = !!thenFly;
  closeAC();
  moduleSearch.value = ''; $('module-new').value = ''; $('module-msg').textContent = '';
  renderModuleList();
  moduleMenu.hidden = false;
  btnModule.setAttribute('aria-expanded', 'true');
  placeModuleMenu();
  const chosen = moduleList.querySelector('[aria-selected="true"]');
  if (chosen) chosen.scrollIntoView({ block: 'center' });
  if (window.matchMedia('(hover: hover)').matches) moduleSearch.focus();   // no surprise keyboard on touch screens
  loadCustomModules();
}
function closeModuleMenu() {
  moduleMenu.hidden = true; flyAfterPick = false;
  btnModule.setAttribute('aria-expanded', 'false');
}
function chooseModule(name) {
  const fly = flyAfterPick;
  sel.module = name;
  showModule();
  closeModuleMenu();
  btnModule.classList.remove('nudge');
  if (fly && uiState() === 'plan') submitPlan(true);
}
btnModule.addEventListener('click', () => moduleMenu.hidden ? openModuleMenu(false) : closeModuleMenu());
moduleSearch.addEventListener('input', renderModuleList);
moduleSearch.addEventListener('keydown', e => {
  if (e.key === 'Enter') { e.preventDefault(); const first = moduleList.querySelector('.module-item:not(.none)'); if (first) first.click(); }
});
$('module-add').addEventListener('submit', async e => {
  e.preventDefault();
  const msg = $('module-msg');
  const name = $('module-new').value.trim().toLowerCase().replace(/\s+/g, ' ');
  if (!name) { msg.textContent = 'type a module name first.'; return; }
  if (name.length > 40 || name.includes('/') || name === '.' || name === '..' || /^__.*__$/.test(name)) {
    msg.textContent = 'module names can be up to 40 characters, without a “/”.'; return;
  }
  if (BUILT_IN_MODULES.has(name) || customModules.includes(name)) { chooseModule(name); return; }
  try {
    const DB = await dbReady;
    const n = await DB.addModule(name);
    if (!customModules.includes(n)) customModules.push(n);
    customModules.sort((a, b) => a.localeCompare(b));
    chooseModule(n);
  } catch (err) {
    console.error(err);
    msg.textContent = 'couldn’t add that module. check your connection and try again.';
  }
});
// close when tapping elsewhere, or with escape
document.addEventListener('pointerdown', e => {
  if (!moduleMenu.hidden && !moduleMenu.contains(e.target) && !btnModule.contains(e.target)) closeModuleMenu();
});
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (!$('confirm').hidden) { e.preventDefault(); answerConfirm(false); }
  else if (!moduleMenu.hidden) { closeModuleMenu(); btnModule.focus(); }
});
window.addEventListener('resize', () => { if (!moduleMenu.hidden) placeModuleMenu(); });
if (window.ResizeObserver) new ResizeObserver(() => { if (!moduleMenu.hidden) placeModuleMenu(); }).observe(panelEl);

// flying with no module: ask first. yes = fly uncategorised; no = open the picker,
// and picking a module then takes off straight away.
function askNoModule() {
  closeModuleMenu();
  askConfirm('no module selected', 'are you sure you want to fly without one? this flight will count as uncategorised in your stats.',
             'no, pick a module', 'yes, fly anyway', yes => {
    if (yes) submitPlan(true);
    else { btnModule.classList.add('nudge'); openModuleMenu(true); }
  });
}
// The yes/no box, shared by the no-module warning and the long-replay warning.
// Tapping outside it or pressing escape counts as no.
let confirmAnswer = null;
function askConfirm(title, body, noText, yesText, answer) {
  $('confirm-title').textContent = title; $('confirm-body').textContent = body;
  $('confirm-no').textContent = noText; $('confirm-yes').textContent = yesText;
  confirmAnswer = answer;
  $('confirm').hidden = false;
  $('confirm-yes').focus();
}
function answerConfirm(yes) {
  $('confirm').hidden = true;
  const a = confirmAnswer; confirmAnswer = null;
  if (a) a(yes);
}
$('confirm-yes').addEventListener('click', () => answerConfirm(true));
$('confirm-no').addEventListener('click', () => answerConfirm(false));
$('confirm').addEventListener('pointerdown', e => { if (e.target === $('confirm')) answerConfirm(false); });
showModule();

// pause / resume
$('btn-pause').addEventListener('click', () => { flight && flight.paused ? resumeFlight() : pauseFlight(); });

// after landing
$('btn-onward').addEventListener('click', () => { const next = flight.to; stopFlight(); sel.from = next; sel.to = null; inpTo.value = ''; renderState(); faceCity(next); inpTo.focus(); });
$('btn-new').addEventListener('click', () => { stopFlight(); sel.from = sel.to = null; inpFrom.value = inpTo.value = ''; renderState(); });

// tabs
document.querySelectorAll('.tab').forEach(tab => tab.addEventListener('click', () => showView(tab.dataset.view)));
function showView(name) {
  const prev = activeView;
  activeView = name;
  document.querySelectorAll('.tab').forEach(t => {
    if (t.dataset.view === name) t.setAttribute('aria-current', 'page'); else t.removeAttribute('aria-current');
  });
  for (const v of ['fly', 'passes', 'map', 'stats']) $('view-' + v).hidden = v !== name;
  document.body.classList.toggle('on-fly', name === 'fly');
  if (name !== 'passes') viewRoute = null;
  updateDock();
  closeAC();
  if (name === 'passes') renderHistory();
  if (name === 'fly') { textCache.clear(); renderState(); tick(); }
  if (name === 'map' && prev !== 'map') { mapState.sel = null; renderMap(true); }
  if (name === 'stats') renderStats();
  if (prev === 'map' && name !== 'map') {   // back from the map: return to the flight (or plan) being shown
    mapState.hover = null; stopReplay();
    const r = currentRoute();
    if (r) frameRoute(r.from, r.to, r.prog);
  }
  setOffFrame(offFrame);   // the recentre button only belongs where there's one route
}

// ── History (stored via db.js) ────────────────────────────
// db.js is a module that loads after this script; wait for it before any database call.
const dbReady = new Promise(res => {
  if (window.DB) res(window.DB);
  else window.addEventListener('db-ready', () => res(window.DB), { once: true });
});
function ddmmyyyy(d) {
  return String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')+'/'+d.getFullYear();
}

// f = the landed flight, landT = the real time it landed.
// The flight's own id is reused as the document id, so if two open tabs both land the
// same flight, the second save is refused by the rules (no edits) instead of duplicating.
async function saveToHistory(f, landT) {
  try {
    const DB = await dbReady;
    const h = await DB.loadFlights();
    const rec = {
      id: f.id,
      seq: h.reduce((m,x) => Math.max(m, x.seq), 0) + 1,
      from:f.from.n, to:f.to.n, km:Math.round(f.km),
      dur:formatDur(f.totalMs/3600000),
      realDur: f.sped ? formatDur(f.activeMs/3600000) : null,
      date:ddmmyyyy(new Date(landT)),
      // summable numbers for stats (see REVAMP.md phase 0); realMin leaves out pauses
      flightMin: Math.round(f.totalMs / 60000),
      realMin: Math.round(f.activeMs / 60000),
      startedAt: new Date(f.startT),
      endedAt: new Date(landT),
      module: f.module || null          // no module = uncategorised (the field is simply left out)
    };
    await DB.addFlight(rec);
    // any badges this landing earned show on the landed card
    try {
      const had = earnedIds(h), now = BADGES.filter(b => earnedIds([...h, rec]).has(b.id) && !had.has(b.id));
      if (now.length) { f.newBadges = now; if (flight === f) renderState(); }
    } catch(e) { console.error(e); }
    if (activeView === 'passes') renderHistory();
    if (activeView === 'map') renderMap(false);
    if (activeView === 'stats') renderStats();
  } catch(e) {
    console.error(e);
    setPill('couldn’t save this flight. check your connection.');
  }
}

async function deleteHistory(id) {
  try {
    const DB = await dbReady;
    await DB.deleteFlight(id);
  } catch(e) {
    console.error(e);
    setPill('couldn’t delete that flight. check your connection.');
  }
  await renderHistory();
}

// Anyone with the link can add a flight, so nothing from the database is ever turned
// into HTML: every value goes in as plain text (textContent), and buttons are wired up
// directly instead of pasting ids into code.
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = String(text); return e; };
const svgEl = (tag, attrs) => { const e = document.createElementNS('http://www.w3.org/2000/svg', tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };
const sleep = ms => new Promise(r => setTimeout(r, ms));
function anim(node, frames, ms, easing) {
  const a = node.animate(frames, { duration: ms, easing: easing || 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' });
  return a.finished.catch(() => {});
}

// ── Boarding passes ───────────────────────────────────────
// Every flight has a pass, built from its record (nothing extra is stored). Seat and gate
// look random but come from the flight's id, so a pass never changes between visits.
const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
function hashStr(s) { let h = 2166136261; for (const ch of String(s)) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
function seatGate(id) {
  const a = hashStr(id), b = hashStr(id + ':gate');
  return { seat: `${1 + a % 38}${'ABCDEF'[(a >>> 8) % 6]}`, gate: `${'ABCDEFG'[b % 7]}${1 + (b >>> 5) % 40}` };
}
function cityCode(name) { const c = findCity(name); return c ? c.a : '???'; }
function asDate(v) { if (!v) return null; const d = typeof v.toDate === 'function' ? v.toDate() : new Date(v); return isNaN(d) ? null : d; }
function parseDDMMYYYY(s) { const m = /^(\d\d)\/(\d\d)\/(\d{4})$/.exec(String(s || '')); return m ? new Date(+m[3], +m[2] - 1, +m[1]) : null; }
function dateWords(d) { return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`; }
function timeWords(d) { const h = d.getHours(); return `${h % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`; }

// km or miles, her choice (remembered on this device)
const UNIT_KEY = 'distUnit';
let distUnit = 'km';
try { if (localStorage.getItem(UNIT_KEY) === 'mi') distUnit = 'mi'; } catch(e) {}
const fmtDist = km => distUnit === 'mi' ? `${fmtNum(km * 0.621371)} mi` : `${fmtNum(km)} km`;

// What a pass shows, from a saved flight or from the flight in the air.
function passFromRecord(f) {
  const start = asDate(f.startedAt), day = start || parseDDMMYYYY(f.date);
  return { id: String(f.id), from: String(f.from), to: String(f.to), fromCode: cityCode(f.from), toCode: cityCode(f.to),
           date: day ? dateWords(day) : String(f.date), dur: String(f.dur), km: Number(f.km) || 0,
           module: f.module ? String(f.module) : null,
           departs: start, arrives: asDate(f.endedAt), status: 'landed', ...seatGate(f.id) };
}
function passFromFlight(fl) {
  return { id: fl.id, from: fl.from.n, to: fl.to.n, fromCode: fl.from.a, toCode: fl.to.a,
           date: dateWords(new Date(fl.startT)), dur: formatDur(fl.totalMs / 3600000), km: Math.round(fl.km),
           module: fl.module, departs: new Date(fl.startT), arrives: null,
           status: fl.paused ? 'holding' : 'boarding', ...seatGate(fl.id) };
}

function planeIcon() {
  const s = svgEl('svg', { viewBox: '0 0 24 24', class: 'pass-plane', 'aria-hidden': 'true' });
  s.append(svgEl('path', { d: 'M21 15.5v-1.8l-8-5V3.5a1.5 1.5 0 0 0-3 0v5.2l-8 5v1.8l8-2.5v5.4l-2 1.5V21l3.5-1 3.5 1v-1.6l-2-1.5V13z' }));
  return s;
}
function barcode(id) {   // decorative, but always the same for a given flight
  const s = svgEl('svg', { viewBox: '0 0 200 44', preserveAspectRatio: 'none', class: 'pass-barcode', 'aria-hidden': 'true' });
  let x = 0, h = hashStr(id);
  while (x < 200) {
    h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
    const w = 1 + (h % 3), gap = 1 + ((h >>> 4) % 3);
    s.append(svgEl('rect', { x, y: 0, width: w, height: 44 }));
    x += w + gap;
  }
  return s;
}
function setPassStatus(pass, status) {
  const chip = pass.querySelector('.pass-status');
  chip.textContent = status;
  chip.dataset.status = status;
}

// kind: 'live' (the flight in the air, with its stub) or 'list' (the passes tab)
function buildPass(p, kind) {
  const pass = el('article', 'pass ' + kind);
  pass.dataset.id = p.id;
  pass.setAttribute('aria-label', `boarding pass, ${p.from} to ${p.to}, ${p.date}`);
  const main = el('div', 'pass-main');
  const top = el('div', 'pass-top');
  top.append(el('span', 'pass-date pf', p.date), el('span', 'pass-status'));
  const end = (code, city, side) => {
    const e = el('div', 'pass-end ' + side);
    e.append(el('b', 'pass-code pf', code), el('span', 'pass-city pf', city));
    return e;
  };
  const mid = el('div', 'pass-mid');
  const track = el('div', 'pass-track');
  track.append(planeIcon());
  mid.append(track, el('span', 'pass-dur pf', p.dur));
  const route = el('div', 'pass-route');
  route.append(end(p.fromCode, p.from, 'from'), mid, end(p.toCode, p.to, 'to'));
  const fields = el('dl', 'pass-fields');
  const field = (label, value, cls) => {
    const d = el('div', 'pass-field pf' + (cls ? ' ' + cls : ''));
    d.append(el('dt', null, label), el('dd', null, value));
    return d;
  };
  fields.append(field('seat', p.seat, 'mono'), field('gate', p.gate, 'mono'), field('distance', fmtDist(p.km), 'dist'));
  if (p.departs) fields.append(field('departs', timeWords(p.departs)));
  if (p.arrives) fields.append(field('arrives', timeWords(p.arrives)));
  fields.append(field('module', p.module || 'uncategorised', 'wide' + (p.module ? '' : ' muted')));
  main.append(top, route, fields);
  pass.append(main);
  setPassStatus(pass, p.status);
  if (kind === 'live') {
    const perf = el('div', 'pass-perf');
    const stub = el('div', 'pass-stub');
    stub.append(barcode(p.id), el('span', 'pass-stub-code', `${p.fromCode} ${p.toCode} ${p.seat}`));
    pass.append(perf, stub);
  }
  return pass;
}

// ── The pass in the air ──
// Takeoff: the pass slides in below the sidebar, fills itself in, the tear line draws,
// the stub tears off and falls away, and the pass stays docked for the flight.
// Landing: a "landed" stamp, then it flies into the passes tab.
const dock = $('pass-dock');
let livePass = null, passRun = 0;
function placeDock() {
  if (!livePass) return;
  const pr = panelEl.getBoundingClientRect(), s = dock.style;
  s.width = pr.width + 'px'; s.left = pr.left + 'px';
  if (panelDocked()) { s.top = 'auto'; s.bottom = (H - pr.top + 10) + 'px'; }
  else { s.bottom = 'auto'; s.top = (pr.bottom + 12) + 'px'; }
}
function updateDock() {
  // on a phone the pass only shows while it's animating (the flight card has the details)
  dock.hidden = !livePass || activeView !== 'fly' || (panelDocked() && !livePass.classList.contains('animating'));
  placeDock();
}
if (window.ResizeObserver) new ResizeObserver(placeDock).observe(panelEl);
window.addEventListener('resize', updateDock);

function scramble(node) {   // airport codes flick through letters before settling, like a departures board
  const final = node.textContent, L = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let n = 0;
  const t = setInterval(() => {
    n++;
    node.textContent = n >= 7 ? final : final.split('').map((c, i) => n > 3 + i ? c : L[(Math.random() * 26) | 0]).join('');
    if (n >= 7) clearInterval(t);
  }, 45);
}
function showStatic(pass) {   // finished state, no animation (refresh mid-flight, reduced motion)
  pass.querySelector('.pass-perf')?.remove();
  pass.querySelector('.pass-stub')?.remove();
  pass.classList.add('torn');
}
async function showLivePass(animate) {
  const run = ++passRun;
  livePass = buildPass(passFromFlight(flight), 'live');
  const pass = livePass;
  dock.replaceChildren(pass);
  const alive = () => run === passRun && livePass === pass;
  if (!animate || reduceMotion.matches) { showStatic(pass); setPassStatus(pass, flight.paused ? 'holding' : 'in flight'); updateDock(); return; }
  pass.classList.add('animating', 'printing');
  updateDock();
  await anim(pass, [{ opacity: 0, transform: 'translateY(16px) scale(.97)' }, { opacity: 1, transform: 'none' }], 420);
  for (const f of pass.querySelectorAll('.pf')) {          // fill in, field by field (.pf = a pass field)
    if (!alive()) return;
    f.classList.add('in');
    if (f.classList.contains('pass-code')) scramble(f);
    await sleep(f.classList.contains('pass-code') ? 260 : 110);
  }
  if (!alive()) return;
  const bars = pass.querySelector('.pass-barcode'), perf = pass.querySelector('.pass-perf'), stub = pass.querySelector('.pass-stub');
  await anim(bars, [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], 450, 'cubic-bezier(.4,0,.2,1)');
  if (!alive()) return;
  await anim(perf, [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], 420, 'cubic-bezier(.4,0,.2,1)');
  await sleep(380);
  if (!alive()) return;
  pass.classList.add('torn');                                 // the zigzag edges appear
  perf.remove();
  await anim(stub, [{ transform: 'none', opacity: 1 },
                    { transform: 'translate(10px, 6px) rotate(3deg)', opacity: 1, offset: .25 },
                    { transform: 'translate(46px, 70px) rotate(12deg)', opacity: 0 }], 900, 'cubic-bezier(.4,0,.7,.2)');
  if (!alive()) return;
  stub.remove();
  pass.classList.remove('printing');
  setPassStatus(pass, flight && flight.paused ? 'holding' : 'in flight');
  if (panelDocked()) { await sleep(1200); if (alive()) await anim(pass, [{ opacity: 1 }, { opacity: 0 }], 350); }
  if (alive()) { pass.classList.remove('animating'); pass.getAnimations().forEach(a => a.cancel()); updateDock(); }
}
function updateLivePass(now) {   // the little plane on the pass follows the real one
  if (!livePass || !flight) return;
  livePass.style.setProperty('--p', flightState(now).frac.toFixed(4));
  if (!livePass.classList.contains('printing')) {
    const st = flight.landed ? 'landed' : flight.paused ? 'holding' : 'in flight';
    if (livePass.querySelector('.pass-status').dataset.status !== st) setPassStatus(livePass, st);
  }
}
async function landLivePass() {
  const pass = livePass;
  if (!pass) return;
  const run = ++passRun;
  const alive = () => run === passRun && livePass === pass;
  showStatic(pass); pass.classList.remove('printing');
  pass.getAnimations().forEach(a => a.cancel());
  setPassStatus(pass, 'landed');
  if (activeView !== 'fly' || reduceMotion.matches) { clearLivePass(); return; }
  pass.classList.add('animating'); updateDock();
  const stamp = el('div', 'pass-stamp', 'landed');
  pass.querySelector('.pass-main').append(stamp);
  await anim(stamp, [{ opacity: 0, transform: 'rotate(-12deg) scale(2.6)' }, { opacity: 1, transform: 'rotate(-12deg) scale(1)' }], 300, 'cubic-bezier(.3,1.5,.6,1)');
  anim(pass, [{ transform: 'none' }, { transform: 'translateY(3px)' }, { transform: 'none' }], 220, 'ease-out');
  await sleep(1300);
  if (!alive()) return;
  const tab = document.querySelector('.tab[data-view="passes"]');
  const a = pass.getBoundingClientRect(), b = tab.getBoundingClientRect();
  const dx = (b.left + b.width / 2) - (a.left + a.width / 2), dy = (b.top + b.height / 2) - (a.top + a.height / 2);
  await anim(pass, [{ transform: 'none', opacity: 1 }, { transform: `translate(${dx}px, ${dy}px) scale(.08)`, opacity: .25 }], 800, 'cubic-bezier(.55,0,.75,.2)');
  if (!alive()) return;
  anim(tab, [{ transform: 'scale(1)' }, { transform: 'scale(1.18)' }, { transform: 'scale(1)' }], 380, 'ease-out');
  clearLivePass();
}
async function dropLivePass() {   // a stopped flight leaves no pass: it just fades away
  const pass = livePass;
  if (!pass) return;
  passRun++;
  await anim(pass, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(8px)' }], 300);
  if (livePass === pass) clearLivePass();
}
function clearLivePass() {
  passRun++;
  livePass = null;
  dock.replaceChildren();
  updateDock();
}

// A faint dotted world map for the passes, drawn once from the country shapes.
function makePassMap(features) {
  try {
    const W0 = 180, H0 = 90, src = document.createElement('canvas');
    src.width = W0; src.height = H0;
    const g = src.getContext('2d');
    g.fillStyle = '#000';
    for (const f of features) {
      const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
      for (const poly of polys) {
        const ring = poly[0];
        if (ring.some(([, lat]) => lat < -60)) continue;                               // leave out antarctica
        if (ring.some(([lng], i) => i && Math.abs(lng - ring[i - 1][0]) > 180)) continue; // and shapes split by the date line
        g.beginPath();
        ring.forEach(([lng, lat], i) => { const x = (lng + 180) / 360 * W0, y = (90 - lat) / 180 * H0; i ? g.lineTo(x, y) : g.moveTo(x, y); });
        g.fill();
      }
    }
    const px = g.getImageData(0, 0, W0, H0).data, step = 2, out = document.createElement('canvas');
    out.width = W0 * 4; out.height = (H0 - 30) * 4;            // crop the far south
    const o = out.getContext('2d');
    o.fillStyle = '#15233f';
    for (let y = 0; y < H0 - 30; y += step) for (let x = 0; x < W0; x += step) {
      if (px[(y * W0 + x) * 4 + 3] > 80) { o.beginPath(); o.arc(x * 4 + 2, y * 4 + 2, 1.6, 0, Math.PI * 2); o.fill(); }
    }
    document.documentElement.style.setProperty('--pass-map', `url("${out.toDataURL('image/png')}")`);
  } catch(e) { console.error('pass map', e); }
}

// ── Passes tab ──
// Every landed flight as a boarding pass, newest first, with the total distance (km or
// miles). Tapping a pass shows its route on the globe; deleting needs two taps.
let viewRoute = null;   // { from, to, id } the route of the pass she tapped
let lastHistory = [];
async function renderHistory() {
  const list = $('hist-list'), count = $('hist-count');
  let h;
  try {
    const DB = await dbReady;
    h = await DB.loadFlights();
  } catch(e) {
    console.error(e);
    list.replaceChildren(el('p', 'hist-empty', 'couldn’t load your flights. check your connection and open this tab again.'));
    return;
  }
  lastHistory = h;
  count.textContent = h.length ? `${h.length} flight${h.length === 1 ? '' : 's'}` : '';
  const totalKm = h.reduce((s, f) => s + (Number(f.km) || 0), 0);
  $('hist-total').textContent = fmtDist(totalKm);
  $('hist-totals').hidden = !h.length;
  document.querySelectorAll('[data-unit]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.unit === distUnit)));
  if (!h.length) {
    list.replaceChildren(el('p', 'hist-empty', 'no flights yet. your first landing will appear here.'));
    return;
  }
  list.replaceChildren(...h.map(f => {
    const pass = buildPass(passFromRecord(f), 'list');
    pass.tabIndex = 0; pass.setAttribute('role', 'button');
    pass.classList.toggle('selected', !!viewRoute && viewRoute.id === String(f.id));
    const show = () => showPassRoute(f, pass);
    pass.addEventListener('click', show);
    pass.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(); } });
    const del = el('button', 'hist-del', '✕');
    del.type = 'button'; del.setAttribute('aria-label', `delete ${f.from} to ${f.to}`);
    let armT = null;
    del.addEventListener('click', e => {
      e.stopPropagation();
      if (del.classList.contains('armed')) {
        clearTimeout(armT); del.disabled = true;
        if (viewRoute && viewRoute.id === String(f.id)) viewRoute = null;
        deleteHistory(f.id); return;
      }
      del.classList.add('armed'); del.textContent = 'delete?';
      armT = setTimeout(() => { del.classList.remove('armed'); del.textContent = '✕'; }, 3500);
    });
    pass.querySelector('.pass-top').append(del);
    return pass;
  }));
}
function showPassRoute(f, pass) {
  const from = findCity(f.from), to = findCity(f.to);
  if (!from || !to || from === to) return;
  if (viewRoute && viewRoute.id === String(f.id)) { viewRoute = null; pass.classList.remove('selected'); return; }
  viewRoute = { from, to, id: String(f.id) };
  document.querySelectorAll('#hist-list .pass.selected').forEach(p => p.classList.remove('selected'));
  pass.classList.add('selected');
  frameRoute(from, to, 0.5);
}
document.querySelectorAll('[data-unit]').forEach(b => b.addEventListener('click', () => {
  distUnit = b.dataset.unit;
  try { localStorage.setItem(UNIT_KEY, distUnit); } catch(e) {}
  if (lastHistory.length) {   // re-render from what's already loaded
    $('hist-total').textContent = fmtDist(lastHistory.reduce((s, f) => s + (Number(f.km) || 0), 0));
    document.querySelectorAll('#hist-list .pass').forEach(p => {
      const f = lastHistory.find(x => String(x.id) === p.dataset.id);
      if (f) p.querySelector('.pass-field.dist dd').textContent = fmtDist(Number(f.km) || 0);
    });
  }
  document.querySelectorAll('[data-unit]').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.unit === distUnit)));
}));

// ── Flight map tab ────────────────────────────────────────
// Every landed flight as an arc, coloured by the continent it landed in. Flights on the
// same route (same from → to) share one arc that gets thicker and brighter the more it's
// been flown. Cities she's landed in get a dot that grows with each landing; places she
// has only flown from get a small ring. "Been to" always means landed in.
// Filters: destination continent, module, and dates (every flight has a date, even the
// oldest ones). Tapping a route or a city shows its details in the sidebar.
const DAY_MS = 86400000;
const dayNum = d => Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / DAY_MS);
const dayDate = n => { const d = new Date(n * DAY_MS); return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()); };
function shortDate(d) {
  const y = d.getFullYear() !== new Date().getFullYear() ? ` ${d.getFullYear()}` : '';
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}${y}`;
}
// minutes she actually studied on a flight (real time, pauses left out)
function studiedMin(f) { return Math.max(0, Number(f.realMin) || 0); }
function minWords(min) { return min < 1 ? '0 min' : durWords(min * 60000); }
function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a.toFixed(3)})`;
}

const UNCAT = '\u0000uncategorised';   // the module filter's "uncategorised" value (can't clash with a name)
const mapState = {
  all: [],              // every flight that can be drawn: { from, to, day, mins, module }
  cont: 'all', module: 'all',
  min: 0, max: 0, d0: 0, d1: 0, loaded: false,
  routes: [], cities: new Map(),
  sel: null,            // { kind: 'route' | 'city', key } what she tapped
  hover: null,
};
const mapEls = {
  summary: $('map-summary'), conts: $('map-conts'), module: $('map-module'),
  d0: $('map-d0'), d1: $('map-d1'), fill: $('map-range-fill'), dates: $('map-dates'),
  custom: $('map-custom'), from: $('map-from'), to: $('map-to'),
  presets: [...document.querySelectorAll('[data-preset]')], detail: $('map-detail'), hint: $('map-hint'),
};

async function renderMap(face) {
  let h;
  try {
    const DB = await dbReady;
    h = await DB.loadFlights();
  } catch(e) {
    console.error(e);
    mapEls.summary.textContent = 'couldn’t load your flights. check your connection and open this tab again.';
    return;
  }
  const today = dayNum(new Date());
  mapState.all = [];
  for (const f of h) {
    const from = findCity(f.from), to = findCity(f.to), d = parseDDMMYYYY(f.date);
    if (!from || !to || from === to || !d) continue;    // only real routes can be drawn
    mapState.all.push({ seq: Number(f.seq) || 0, from, to, day: dayNum(d), mins: studiedMin(f), km: Number(f.km) || routeKm(from, to),
                        module: typeof f.module === 'string' ? f.module : null });
  }
  // the date range runs from her first flight to today; keep her choice if she'd set one
  const first = mapState.all.reduce((m, f) => Math.min(m, f.day), today);
  const wasAll = !mapState.loaded || (mapState.d0 === mapState.min && mapState.d1 === mapState.max);
  const wasToToday = mapState.d1 === mapState.max;
  mapState.min = Math.min(first, today - 1); mapState.max = today;
  if (wasAll) { mapState.d0 = mapState.min; mapState.d1 = mapState.max; }
  else {
    mapState.d0 = clamp(mapState.d0, mapState.min, mapState.max);
    mapState.d1 = wasToToday ? mapState.max : clamp(mapState.d1, mapState.d0, mapState.max);
  }
  mapState.loaded = true;
  buildModuleOptions();
  applyMapFilters();
  if (face) faceMap();
}

function buildModuleOptions() {
  const names = [...new Set(mapState.all.filter(f => f.module).map(f => f.module))].sort((a, b) => a.localeCompare(b));
  const hasUncat = mapState.all.some(f => !f.module);
  const opts = [['all', 'all modules'], ...names.map(n => [n, n]), ...(hasUncat ? [[UNCAT, 'uncategorised']] : [])];
  if (!opts.some(o => o[0] === mapState.module)) mapState.module = 'all';
  mapEls.module.replaceChildren(...opts.map(([v, t]) => { const o = el('option', null, t); o.value = v; return o; }));
  mapEls.module.value = mapState.module;
}

// which flights pass the module and date filters (and the continent one, unless told not to)
function mapMatches(f, withCont) {
  if (f.day < mapState.d0 || f.day > mapState.d1) return false;
  if (mapState.module === UNCAT) { if (f.module) return false; }
  else if (mapState.module !== 'all' && f.module !== mapState.module) return false;
  return !withCont || mapState.cont === 'all' || f.to.ct.id === mapState.cont;
}

function summaryText(list) {
  const km = list.reduce((s, f) => s + f.km, 0), countries = new Set(list.map(f => f.to.c)).size;
  return `${list.length} flight${list.length === 1 ? '' : 's'} · ${fmtDist(km)} · ${countries} countr${countries === 1 ? 'y' : 'ies'}`;
}
// one arc per route, one entry per city: added to one flight at a time (the replay does it as each lands)
function addToMap(routes, cities, f) {
  const key = f.from.n + '>' + f.to.n;
  let r = routes.get(key);
  if (!r) {
    const a = ll2xyz(f.from.lat, f.from.lng), b = ll2xyz(f.to.lat, f.to.lng);
    r = { key, from: f.from, to: f.to, n: 0, mins: 0, last: 0, pts: Array.from({ length: 49 }, (_, i) => slerp(a, b, i / 48)) };
    routes.set(key, r);
  }
  r.n++; r.mins += f.mins; r.last = Math.max(r.last, f.day);
  const city = c => cities.get(c.n) || cities.set(c.n, { c, landed: 0, departed: 0, mins: 0, last: null }).get(c.n);
  const t = city(f.to); t.landed++; t.mins += f.mins; t.last = Math.max(t.last || 0, f.day);
  city(f.from).departed++;
}

function applyMapFilters() {
  endReplay();
  const shown = mapState.all.filter(f => mapMatches(f, true));
  const routes = new Map(), cities = new Map();
  for (const f of shown) addToMap(routes, cities, f);
  mapState.routes = [...routes.values()].sort((a, b) => a.n - b.n);   // busiest drawn last, on top
  mapState.cities = cities;

  mapState.shown = shown;
  mapEls.summary.textContent = !mapState.all.length ? 'no flights yet. every flight you land will be drawn here.'
    : !shown.length ? 'no flights match these filters.' : summaryText(shown);
  btnReplay.disabled = !shown.length;

  renderContinentChips();
  renderDateRange();
  showMapDetail();
}

function renderContinentChips() {
  const counts = {};
  for (const f of mapState.all) if (mapMatches(f, false)) counts[f.to.ct.id] = (counts[f.to.ct.id] || 0) + 1;
  const chip = (id, label, color) => {
    const b = el('button', 'chip'); b.type = 'button';
    if (color) { const dot = el('span', 'chip-dot'); dot.style.background = color; b.append(dot); }
    b.append(document.createTextNode(label));
    b.setAttribute('aria-pressed', String(mapState.cont === id));
    b.disabled = id !== 'all' && !counts[id] && mapState.cont !== id;
    b.addEventListener('click', () => { mapState.cont = id; applyMapFilters(); });
    return b;
  };
  mapEls.conts.replaceChildren(chip('all', 'all'), ...CONTINENTS.map(k => chip(k.id, k.label, k.color)));
}

function renderDateRange() {
  const { min, max, d0, d1 } = mapState;
  for (const inp of [mapEls.d0, mapEls.d1]) { inp.min = min; inp.max = max; }
  mapEls.d0.value = d0; mapEls.d1.value = d1;
  const pct = v => (max > min ? (v - min) / (max - min) * 100 : 0);
  mapEls.fill.style.left = pct(d0) + '%'; mapEls.fill.style.right = (100 - pct(d1)) + '%';
  mapEls.d0.style.zIndex = pct(d0) > 50 ? 3 : 1;     // when both handles meet, the one that can still move is on top
  // the exact-date pickers (left alone while she's typing in one)
  for (const [inp, v] of [[mapEls.from, d0], [mapEls.to, d1]]) {
    inp.min = isoDay(min); inp.max = isoDay(max);
    if (document.activeElement !== inp) inp.value = isoDay(v);
  }
  mapEls.dates.textContent = d0 === d1 ? shortDate(dayDate(d0)) : `${shortDate(dayDate(d0))} – ${shortDate(dayDate(d1))}`;
  // light up the widest preset that matches (with only a few weeks of flights, "month" is the same as "all")
  const on = d1 === max ? ['all', '30', '7'].find(pr => d0 === presetStart(pr)) : null;
  mapEls.presets.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.preset === on)));
}
// day number ↔ the "2026-11-15" text a date input uses
function isoDay(n) { const d = dayDate(n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
function dayFromIso(s) { const m = /^(\d{4})-(\d\d)-(\d\d)$/.exec(s || ''); return m ? dayNum(new Date(+m[1], +m[2] - 1, +m[3])) : null; }
function presetStart(p) { return p === 'all' ? mapState.min : Math.max(mapState.min, mapState.max - (Number(p) - 1)); }

mapEls.module.addEventListener('change', () => { mapState.module = mapEls.module.value; applyMapFilters(); });
mapEls.d0.addEventListener('input', () => { mapState.d0 = Math.min(Number(mapEls.d0.value), mapState.d1); applyMapFilters(); });
mapEls.d1.addEventListener('input', () => { mapState.d1 = Math.max(Number(mapEls.d1.value), mapState.d0); applyMapFilters(); });
// tapping the dates above the slider opens exact from/to pickers
mapEls.dates.addEventListener('click', () => {
  const open = mapEls.custom.hidden;
  mapEls.custom.hidden = !open; mapEls.dates.setAttribute('aria-expanded', String(open));
});
mapEls.from.addEventListener('change', () => {
  const n = dayFromIso(mapEls.from.value);
  if (n != null) { mapState.d0 = clamp(n, mapState.min, mapState.d1); }
  mapEls.from.blur(); applyMapFilters();
});
mapEls.to.addEventListener('change', () => {
  const n = dayFromIso(mapEls.to.value);
  if (n != null) { mapState.d1 = clamp(n, mapState.d0, mapState.max); }
  mapEls.to.blur(); applyMapFilters();
});
mapEls.presets.forEach(b => b.addEventListener('click', () => {
  mapState.d0 = presetStart(b.dataset.preset); mapState.d1 = mapState.max; applyMapFilters();
}));

// Turn the globe to face the middle of everything shown, whole globe in view.
function faceMap() {
  let x = 0, y = 0, z = 0;
  for (const r of mapState.routes) for (const c of [r.from, r.to]) { const p = ll2xyz(c.lat, c.lng); x += p[0]; y += p[1]; z += p[2]; }
  const len = Math.hypot(x, y, z);
  if (len < 1e-6) { cam.auto = { rotX, rotY, zoom: 1 }; return; }
  cam.auto = viewCentredOn([x / len, y / len, z / len], 1);
}

// ── Drawing ──
function mapSelected() {
  if (replay) return null;
  const s = mapState.sel;
  if (!s) return null;
  if (s.kind === 'route') { const r = mapState.routes.find(x => x.key === s.key); return r ? { kind: 'route', r } : null; }
  const e = mapState.cities.get(s.key);
  return e ? { kind: 'city', e } : null;
}
function routeLit(r, s) { return !s || (s.kind === 'route' ? s.r === r : r.from === s.e.c || r.to === s.e.c); }
function cityDotR(e) { return e.landed ? Math.min(11, 2.6 + 1.7 * Math.sqrt(e.landed)) : 2.6; }

function drawMap() {
  const s = mapSelected(), hv = replay ? null : mapState.hover;
  const routes = replay ? replay.routes : mapState.routes, cities = replay ? replay.cities : mapState.cities;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const r of routes.values()) {
    const lit = routeLit(r, s), k = Math.log2(r.n), col = r.to.ct.color;
    const isHover = hv && hv.kind === 'route' && hv.r === r;
    const w = 1.4 + 0.9 * k + (isHover ? 0.8 : 0);
    const a = lit ? Math.min(1, 0.55 + 0.15 * k + (isHover ? 0.2 : 0)) : 0.1;
    strokePath(r.pts);
    if (lit && (r.n > 1 || (s && s.kind === 'route'))) { ctx.strokeStyle = hexA(col, a * 0.22); ctx.lineWidth = w + 6; ctx.stroke(); }
    ctx.strokeStyle = hexA(col, a); ctx.lineWidth = w; ctx.stroke();
  }
  const labelAll = zoom >= 1.7;
  for (const e of cities.values()) {
    const p = projectLL(e.c.lat, e.c.lng);
    if (!p.vis) continue;
    const related = !s || (s.kind === 'city' ? s.e === e : s.r.from === e.c || s.r.to === e.c);
    const isHover = hv && hv.kind === 'city' && hv.e === e;
    const r = cityDotR(e) * (isHover ? 1.25 : 1), dim = related ? 1 : 0.25;
    if (e.landed) {
      ctx.fillStyle = hexA(e.c.ct.color, 0.95 * dim);
      ctx.shadowColor = hexA(e.c.ct.color, 0.7 * dim); ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(p.sx, p.sy, r, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
    } else {
      ctx.strokeStyle = `rgba(235,242,255,${(0.75 * dim).toFixed(3)})`; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(p.sx, p.sy, r, 0, Math.PI * 2); ctx.stroke();
    }
    if (related && (labelAll || isHover || s)) drawLabel(e.c.n, p.sx + r + 5, p.sy + 4, `rgba(235,242,255,${(0.92 * dim).toFixed(3)})`);
  }
  if (replay) drawReplayFlight();
}

// ── Tapping ──
function segDist(px, py, a, b) {
  const dx = b.sx - a.sx, dy = b.sy - a.sy, L = dx * dx + dy * dy;
  const t = L ? clamp(((px - a.sx) * dx + (py - a.sy) * dy) / L, 0, 1) : 0;
  return Math.hypot(px - (a.sx + t * dx), py - (a.sy + t * dy));
}
// what's under a spot on screen: a city first (they're small targets), else the nearest route
function mapHit(x, y, touch) {
  let best = null, bd = touch ? 22 : 12;
  for (const e of mapState.cities.values()) {
    const p = projectLL(e.c.lat, e.c.lng);
    if (!p.vis) continue;
    const d = Math.max(0, Math.hypot(p.sx - x, p.sy - y) - cityDotR(e));
    if (d < bd) { bd = d; best = e; }
  }
  if (best) return { kind: 'city', e: best };
  let rb = null, rd = touch ? 16 : 8;
  for (const r of mapState.routes) {
    let prev = null;
    for (const pt of r.pts) {
      const p = project(...pt);
      if (!p.vis) { prev = null; continue; }
      if (prev) { const d = segDist(x, y, prev, p); if (d <= rd) { rd = d; rb = r; } }
      prev = p;
    }
  }
  return rb ? { kind: 'route', r: rb } : null;
}
function mapTap(x, y, touch) {
  const h = mapHit(x, y, touch);
  const key = h && (h.kind === 'route' ? h.r.key : h.e.c.n);
  const same = h && mapState.sel && mapState.sel.kind === h.kind && mapState.sel.key === key;
  mapState.sel = h && !same ? { kind: h.kind, key } : null;
  showMapDetail();
}

// ── Replay ──
// Plays the flights matching the filters, oldest first: a plane whizzes from A to B in
// 1.25 s (at 1x), its arc stays behind, then the next. The globe glides along, the
// summary counts up and a caption names each flight. Anything she does (touching the
// globe, changing a filter, leaving the tab) stops it and the full map comes back.
const REPLAY_WHIZZ_MS = 1250, REPLAY_WARN_S = 60;
const btnReplay = $('btn-replay'), replayCap = $('replay-cap');
const rspeedBtns = [...document.querySelectorAll('[data-rspeed]')];
let replay = null;     // { list, i, t0, routes, cities }
let replaySpeed = 1;

function replaySecs(n, speed) { return n * REPLAY_WHIZZ_MS / 1000 / speed; }
function secsWords(s) { s = Math.round(s); return s < 60 ? `${s} s` : `${Math.floor(s / 60)} min${s % 60 ? ` ${s % 60} s` : ''}`; }

function askReplay() {
  const list = mapState.shown || [];
  if (!list.length) return;
  const secs = replaySecs(list.length, replaySpeed);
  if (secs <= REPLAY_WARN_S) { startReplay(); return; }
  // too long: say how long, and what would make it shorter
  const faster = [2, 5].filter(v => v > replaySpeed).map(v => `${v}x takes ${secsWords(replaySecs(list.length, v))}`);
  const tips = [faster.length ? `a faster speed (${faster.join(', ')})` : null,
                mapState.cont === 'all' ? 'one continent' : null,
                mapState.module === 'all' ? 'one module' : null,
                'a shorter date range'].filter(Boolean);
  const last = tips.pop();
  askConfirm('this replay is a long one',
    `${list.length} flights will take ${secsWords(secs)} at ${replaySpeed}x. to shorten it, try ${tips.length ? tips.join(', ') + ' or ' : ''}${last}.`,
    'change it', 'replay anyway', yes => { if (yes) startReplay(); });
}

function startReplay() {
  const list = [...mapState.shown].sort((a, b) => a.day - b.day || a.seq - b.seq);
  mapState.sel = null; showMapDetail();
  replay = { list, i: 0, t0: performance.now(), routes: new Map(), cities: new Map() };
  btnReplay.classList.add('playing'); $('replay-label').textContent = 'stop';
  document.body.classList.add('replaying');
  replayCap.hidden = false;
  mapEls.summary.textContent = summaryText([]);
  replayFace();
  replayCaption();
}
function endReplay() {   // tidy up without redrawing (the caller rebuilds the map)
  if (!replay) return;
  replay = null;
  btnReplay.classList.remove('playing'); $('replay-label').textContent = 'replay';
  document.body.classList.remove('replaying');
  replayCap.hidden = true; replayCap.textContent = '';
}
function stopReplay() { if (replay) applyMapFilters(); }

function replayDur() { return REPLAY_WHIZZ_MS / replaySpeed; }
function replayFace() {   // turn towards the next route; quicker at higher speeds
  const f = replay.list[replay.i];
  const a = ll2xyz(f.from.lat, f.from.lng), b = ll2xyz(f.to.lat, f.to.lng);
  const th = Math.acos(clamp(a[0]*b[0] + a[1]*b[1] + a[2]*b[2], -1, 1));
  const v = viewCentredOn(slerp(a, b, 0.5), clamp(0.72 / Math.sin(th / 2 + 1e-6), 1, 1.6));
  v.tau = 0.35 / Math.sqrt(replaySpeed);
  cam.auto = v;
}
function replayCaption() {
  const f = replay.list[replay.i];
  replayCap.textContent = `${shortDate(dayDate(f.day))} · ${f.from.n} → ${f.to.n}${f.module ? ' · ' + f.module : ''} · ${replay.i + 1} of ${replay.list.length}`;
}
const easeInOut = x => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

// called every frame from drawMap while it plays
function drawReplayFlight() {
  const now = performance.now();
  let k = (now - replay.t0) / replayDur();
  while (replay && k >= 1) {   // landed: keep its arc, move on (more than one if a frame ran late)
    const f = replay.list[replay.i];
    addToMap(replay.routes, replay.cities, f);
    mapEls.summary.textContent = summaryText(replay.list.slice(0, replay.i + 1));
    replay.i++;
    if (replay.i >= replay.list.length) { stopReplay(); return; }
    replay.t0 += replayDur(); k = (now - replay.t0) / replayDur();
    replayFace(); replayCaption();
  }
  const f = replay.list[replay.i];
  const a = ll2xyz(f.from.lat, f.from.lng), b = ll2xyz(f.to.lat, f.to.lng);
  const e = easeInOut(clamp(k, 0, 1)), col = f.to.ct.color;
  const steps = 48, pts = [];
  for (let i = 0; i <= steps * e; i++) pts.push(slerp(a, b, i / steps));
  pts.push(slerp(a, b, e));
  ctx.lineCap = 'round';
  strokePath(pts); ctx.strokeStyle = hexA(col, 0.25); ctx.lineWidth = 7; ctx.stroke();
  strokePath(pts); ctx.strokeStyle = hexA(col, 0.95); ctx.lineWidth = 2.2; ctx.stroke();
  const p = project(...slerp(a, b, e));
  if (!p.vis) return;
  const q = project(...slerp(a, b, Math.min(1, e + 0.004))), back = project(...slerp(a, b, Math.max(0, e - 0.004)));
  drawPlane(p.sx, p.sy, Math.atan2(q.sy - back.sy, q.sx - back.sx), hexA(col, 0.9), '#fff4dc');
}

btnReplay.addEventListener('click', () => { replay ? stopReplay() : askReplay(); });
rspeedBtns.forEach(b => b.addEventListener('click', () => {
  const v = Number(b.dataset.rspeed);
  if (replay) {   // change speed mid-replay without the plane jumping
    const now = performance.now(), k = (now - replay.t0) / replayDur();
    replaySpeed = v; replay.t0 = now - k * replayDur();
    if (cam.auto) cam.auto.tau = 0.35 / Math.sqrt(v);
  } else replaySpeed = v;
  rspeedBtns.forEach(x => x.setAttribute('aria-pressed', String(x === b)));
}));

// ── The details card ──
function showMapDetail() {
  const s = mapSelected();
  if (!s) mapState.sel = null;
  mapEls.detail.hidden = !s; mapEls.hint.hidden = !!s || !mapState.routes.length;
  if (!s) return;
  const title = el('h3', 'map-detail-title'), sub = el('p', 'map-detail-sub');
  const cells = [];
  const cell = (label, value) => { const d = el('div'); d.append(el('dt', null, label), el('dd', null, value)); cells.push(d); };
  if (s.kind === 'route') {
    const r = s.r;
    setRoute(title, r.from.n, r.to.n);
    sub.textContent = `${r.from.a} → ${r.to.a} · ${fmtDist(routeKm(r.from, r.to))}`;
    cell(r.n === 1 ? 'flight' : 'flights', r.n);
    cell('studied', minWords(r.mins));
    cell('last flown', shortDate(dayDate(r.last)));
  } else {
    const e = s.e;
    title.textContent = e.c.n;
    sub.textContent = `${e.c.c} · ${e.c.ct.label}`;
    if (e.landed) {
      cell('landed', `${e.landed} time${e.landed === 1 ? '' : 's'}`);
      cell('studied', minWords(e.mins));
      cell('last landed', shortDate(dayDate(e.last)));
    } else {
      sub.textContent += ' · not landed here yet';
      cell('departures', e.departed);
    }
  }
  const close = el('button', 'map-detail-close', '✕');
  close.type = 'button'; close.setAttribute('aria-label', 'close details');
  close.addEventListener('click', () => { mapState.sel = null; showMapDetail(); });
  const head = el('div', 'map-detail-head');
  const words = el('div'); words.append(title, sub);
  head.append(words, close);
  const dl = el('dl', 'map-stats'); dl.append(...cells);
  mapEls.detail.replaceChildren(head, dl);
}

// ── Stats tab ─────────────────────────────────────────────
// Her study in numbers. "Study time" is the real time she spent (realMin: pauses left
// out, not the sped-up flight time). Every landed flight counts; one with no module is
// uncategorised.
// The week / month / all time choice changes the numbers, modules, records and places;
// streaks, the calendar and the badges always count everything.
const KM_WORLD = 40075;

function statRec(f) {
  const d = parseDDMMYYYY(f.date);
  if (!d) return null;
  let from = findCity(f.from), to = findCity(f.to);
  if (!from || !to || from === to) from = to = null;
  return {
    day: dayNum(d), km: Number(f.km) || 0, mins: studiedMin(f), flightMins: Math.max(0, Number(f.flightMin) || 0),
    module: typeof f.module === 'string' ? f.module : null,
    from, to, st: asDate(f.startedAt), en: asDate(f.endedAt),
  };
}
function dayTotals(recs) { const m = new Map(); for (const r of recs) m.set(r.day, (m.get(r.day) || 0) + r.mins); return m; }
function streaks(recs) {   // days in a row with at least one landing
  const days = new Set(recs.map(r => r.day)), sorted = [...days].sort((a, b) => a - b);
  let best = 0, run = 0, prev = null;
  for (const d of sorted) { run = prev === d - 1 ? run + 1 : 1; best = Math.max(best, run); prev = d; }
  const today = dayNum(new Date());
  let cur = 0, d = days.has(today) ? today : days.has(today - 1) ? today - 1 : null;   // still alive if she landed yesterday
  while (d != null && days.has(d)) { cur++; d--; }
  return { cur, best };
}
function statTotals(recs) {
  const landed = recs.filter(r => r.to), days = dayTotals(recs);
  return {
    flights: recs.length,
    mins: recs.reduce((s, r) => s + r.mins, 0),
    km: recs.reduce((s, r) => s + r.km, 0),
    countries: new Set(landed.map(r => r.to.c)).size,
    continents: new Set(landed.map(r => r.to.ct.id)).size,
    best: streaks(recs).best,
    longest: recs.reduce((m, r) => Math.max(m, r.flightMins), 0),
    bigDay: Math.max(0, ...days.values()),
    early: recs.some(r => r.st && r.st.getHours() < 8) ? 1 : 0,
    owl: recs.some(r => r.en && (r.en.getHours() >= 23 || r.en.getHours() < 4)) ? 1 : 0,
  };
}

// ── Badges ──
// kind decides how progress reads: n (a count), h (hours), km (distance), yes (one-off)
const BADGES = [
  { id: 'first', icon: '🛫', name: 'first flight', desc: 'land your very first flight', kind: 'n', of: 'flights', goal: 1 },
  { id: 'f10', icon: '✈️', name: 'frequent flyer', desc: 'land 10 flights', kind: 'n', of: 'flights', goal: 10 },
  { id: 'f25', icon: '🎫', name: 'gold card', desc: 'land 25 flights', kind: 'n', of: 'flights', goal: 25 },
  { id: 'f50', icon: '💎', name: 'platinum', desc: 'land 50 flights', kind: 'n', of: 'flights', goal: 50 },
  { id: 'f100', icon: '👑', name: 'centurion', desc: 'land 100 flights', kind: 'n', of: 'flights', goal: 100 },

  { id: 'h10', icon: '📖', name: 'ten hours', desc: 'study for 10 hours in total', kind: 'h', of: 'mins', goal: 10 },
  { id: 'h25', icon: '📚', name: 'bookworm', desc: 'study for 25 hours in total', kind: 'h', of: 'mins', goal: 25 },
  { id: 'h50', icon: '🧠', name: 'big brain', desc: 'study for 50 hours in total', kind: 'h', of: 'mins', goal: 50 },
  { id: 'h100', icon: '🎓', name: 'hundred hours', desc: 'study for 100 hours in total', kind: 'h', of: 'mins', goal: 100 },
  { id: 'h250', icon: '🏛️', name: 'scholar', desc: 'study for 250 hours in total', kind: 'h', of: 'mins', goal: 250 },
  { id: 'h500', icon: '🌟', name: 'five hundred', desc: 'study for 500 hours in total', kind: 'h', of: 'mins', goal: 500 },

  { id: 'amazon', icon: '🌿', name: 'the amazon', desc: 'fly as far as the amazon river is long', kind: 'km', of: 'km', goal: 6400 },
  { id: 'through', icon: '🌎', name: 'straight through', desc: 'fly the width of the earth, pole to pole through the middle', kind: 'km', of: 'km', goal: 12742 },
  { id: 'wall', icon: '🧱', name: 'the great wall', desc: 'fly the full length of the great wall of china', kind: 'km', of: 'km', goal: 21196 },
  { id: 'mars', icon: '🔴', name: 'around mars', desc: 'fly once around the red planet', kind: 'km', of: 'km', goal: 21344 },
  { id: 'kangaroo', icon: '🦘', name: 'the kangaroo route', desc: 'fly london to sydney and back again', kind: 'km', of: 'km', goal: 33980 },
  { id: 'geo', icon: '🛰️', name: 'satellite height', desc: 'fly as high as the tv satellites orbit', kind: 'km', of: 'km', goal: 35786 },
  { id: 'world', icon: '🌍', name: 'around the world', desc: 'fly the whole way round the equator', kind: 'km', of: 'km', goal: KM_WORLD },
  { id: 'k50', icon: '🧭', name: 'fifty thousand', desc: 'fly 50,000 km', kind: 'km', of: 'km', goal: 50000 },
  { id: 'twice', icon: '🌏', name: 'twice around', desc: 'fly around the world two times', kind: 'km', of: 'km', goal: KM_WORLD * 2 },
  { id: 'k100', icon: '🚀', name: 'six figures', desc: 'fly 100,000 km', kind: 'km', of: 'km', goal: 100000 },
  { id: 'moon', icon: '🌕', name: 'to the moon', desc: 'fly as far as the moon', kind: 'km', of: 'km', goal: 384400 },

  { id: 'c5', icon: '🗺️', name: 'explorer', desc: 'land in 5 countries', kind: 'n', of: 'countries', goal: 5 },
  { id: 'c10', icon: '🧳', name: 'globetrotter', desc: 'land in 10 countries', kind: 'n', of: 'countries', goal: 10 },
  { id: 'c15', icon: '🛂', name: 'full passport', desc: 'land in 15 countries', kind: 'n', of: 'countries', goal: 15 },
  { id: 'c25', icon: '🌐', name: 'citizen of the world', desc: 'land in 25 countries', kind: 'n', of: 'countries', goal: 25 },
  { id: 'cont', icon: '🏆', name: 'every continent', desc: 'land on all six continents', kind: 'n', of: 'continents', goal: 6 },

  { id: 's3', icon: '🔥', name: 'on a roll', desc: 'land a flight 3 days in a row', kind: 'n', of: 'best', goal: 3 },
  { id: 's7', icon: '⚡', name: 'full week', desc: 'land a flight 7 days in a row', kind: 'n', of: 'best', goal: 7 },
  { id: 's14', icon: '💪', name: 'fortnight', desc: 'land a flight 14 days in a row', kind: 'n', of: 'best', goal: 14 },
  { id: 's30', icon: '🏅', name: 'unstoppable', desc: 'land a flight 30 days in a row', kind: 'n', of: 'best', goal: 30 },

  { id: 'long', icon: '🛬', name: 'long haul', desc: 'land a single flight of 8 hours or more', kind: 'h', of: 'longest', goal: 8 },
  { id: 'bigday', icon: '☀️', name: 'marathon day', desc: 'study 6 hours in one day', kind: 'h', of: 'bigDay', goal: 6 },
  { id: 'early', icon: '🌅', name: 'early bird', desc: 'take off before 8 am', kind: 'yes', of: 'early', goal: 1 },
  { id: 'owl', icon: '🦉', name: 'night owl', desc: 'still studying past 11 pm', kind: 'yes', of: 'owl', goal: 1 },
];
function badgeVal(b, t) { const v = t[b.of]; return b.kind === 'h' ? v / 60 : v; }
function earnedIds(flights) {
  const t = statTotals(flights.map(statRec).filter(Boolean));
  return new Set(BADGES.filter(b => badgeVal(b, t) >= b.goal).map(b => b.id));
}
function badgeProgress(b, v) {
  if (b.kind === 'yes') return 'not yet';
  if (b.kind === 'km') return `${fmtDist(v)} of ${fmtDist(b.goal)}`;
  if (b.kind === 'h') return `${Math.floor(v)} of ${b.goal} h`;
  return `${fmtNum(v)} of ${fmtNum(b.goal)}`;
}

// ── Rendering ──
let statsRange = 'all', statsRecs = [];
const statsBody = $('stats-body');
async function renderStats() {
  let h;
  try {
    const DB = await dbReady;
    h = await DB.loadFlights();
  } catch(e) {
    console.error(e);
    statsBody.replaceChildren(el('p', 'hist-empty', 'couldn’t load your flights. check your connection and open this tab again.'));
    return;
  }
  statsRecs = h.map(statRec).filter(Boolean);
  drawStats();
}
document.querySelectorAll('[data-srange]').forEach(b => b.addEventListener('click', () => {
  statsRange = b.dataset.srange;
  document.querySelectorAll('[data-srange]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
  drawStats();
}));

const section = (title, ...kids) => { const s = el('section', 'stat-sec'); s.append(el('h3', 'stat-h', title), ...kids); return s; };
function drawStats() {
  const all = statsRecs;
  if (!all.length) { statsBody.replaceChildren(el('p', 'hist-empty', 'no flights yet. land your first one and your stats start here.')); return; }
  const today = dayNum(new Date());
  const recs = statsRange === 'all' ? all : all.filter(r => r.day > today - Number(statsRange));
  const t = statTotals(recs);
  const word = statsRange === '7' ? 'this week' : statsRange === '30' ? 'in the last month' : '';
  const out = [];

  // headline numbers
  const grid = el('div', 'stat-grid');
  const tile = (value, label) => { const d = el('div', 'stat-tile'); d.append(el('strong', null, value), el('span', null, label)); grid.append(d); };
  tile(minWords(t.mins), 'studied');
  tile(fmtNum(t.flights), t.flights === 1 ? 'flight' : 'flights');
  tile(fmtDist(t.km), 'flown');
  tile(fmtNum(t.countries), t.countries === 1 ? 'country' : 'countries');
  out.push(grid);
  if (!recs.length) out.push(el('p', 'stat-note', `no flights ${word} yet.`));

  // time per module (tap one to see it on the map)
  if (recs.length) {
    const by = new Map();
    for (const r of recs) { const k = r.module || UNCAT; by.set(k, (by.get(k) || 0) + r.mins); }
    const rows = [...by.entries()].sort((a, b) => (a[0] === UNCAT) - (b[0] === UNCAT) || b[1] - a[1]);   // uncategorised last
    const max = Math.max(1, ...rows.map(r => r[1])), total = Math.max(1, t.mins);
    const list = el('div', 'mod-bars');
    for (const [k, mins] of rows) {
      const name = k === UNCAT ? 'uncategorised' : k;
      const row = el('button', 'mod-bar' + (k === UNCAT ? ' uncat' : ''));
      const top = el('div', 'mod-bar-top');
      top.append(el('span', 'mod-name', name), el('span', 'mod-time', `${minWords(mins)} · ${Math.round(mins / total * 100)}%`));
      const track = el('div', 'mod-track'), fill = el('div', 'mod-fill');
      fill.style.width = (mins / max * 100).toFixed(1) + '%'; track.append(fill);
      row.append(top, track);
      row.type = 'button'; row.title = 'show on the map';
      row.addEventListener('click', () => { mapState.module = k; mapState.cont = 'all'; showView('map'); });
      list.append(row);
    }
    out.push(section('time per module', list));
  }

  // records
  const landed = recs.filter(r => r.to);
  if (landed.length) {
    const recList = el('div', 'records');
    const record = (label, main, sub) => { const d = el('div', 'record'); d.append(el('span', 'record-label', label), el('strong', null, main), el('span', 'record-sub', sub)); recList.append(d); };
    const far = landed.reduce((a, b) => (b.km > a.km ? b : a));
    record('longest flight', `${far.from.n} → ${far.to.n}`, `${fmtDist(far.km)} · ${minWords(far.flightMins)} · ${shortDate(dayDate(far.day))}`);
    const days = [...dayTotals(recs).entries()].sort((a, b) => b[1] - a[1]);
    if (days.length && days[0][1] > 0) record('longest study day', shortDate(dayDate(days[0][0])), minWords(days[0][1]));
    const count = (keyOf) => { const m = new Map(); landed.forEach(r => m.set(keyOf(r), (m.get(keyOf(r)) || 0) + 1)); return [...m.entries()].sort((a, b) => b[1] - a[1])[0]; };
    const route = count(r => `${r.from.n} → ${r.to.n}`);
    record('most flown route', route[0], route[1] > 1 ? `${route[1]} times` : 'no repeats yet');
    const fav = count(r => r.to.n);
    record('favourite destination', fav[0], `landed ${fav[1]} time${fav[1] === 1 ? '' : 's'}`);
    out.push(section('records', recList));

    // places: the six continents, lit once she's landed on them
    const seen = new Set(landed.map(r => r.to.ct.id));
    const conts = el('div', 'chips');
    for (const k of CONTINENTS) {
      const c = el('span', 'chip static' + (seen.has(k.id) ? ' lit' : ''));
      const dot = el('span', 'chip-dot'); dot.style.background = k.color; c.append(dot, document.createTextNode(k.label));
      conts.append(c);
    }
    const cities = new Set(landed.map(r => r.to.n)).size;
    out.push(section('places', el('p', 'stat-line', `${t.countries} countr${t.countries === 1 ? 'y' : 'ies'} and ${cities} cit${cities === 1 ? 'y' : 'ies'} on ${seen.size} of 6 continents`), conts));
  }

  // streaks and the study calendar (all time)
  const st = streaks(all);
  const line = el('p', 'stat-line', st.cur ? `${st.cur} day${st.cur === 1 ? '' : 's'} in a row right now 🔥 · best ${st.best}` : `best streak: ${st.best} day${st.best === 1 ? '' : 's'}. land one today to start a new one.`);
  out.push(section('streak', line, studyCalendar(all)));

  // badges (all time): earned first, then the closest to earning
  const tAll = statTotals(all);
  const scored = BADGES.map(b => { const v = badgeVal(b, tAll); return { b, v, p: Math.min(1, v / b.goal), done: v >= b.goal }; });
  const done = scored.filter(x => x.done), todo = scored.filter(x => !x.done).sort((a, b) => b.p - a.p);
  const bgrid = el('div', 'badges');
  [...done, ...todo].forEach((x, i) => {
    const card = el('div', 'badge' + (x.done ? ' earned' : '') + (!x.done && i === done.length ? ' next' : ''));
    card.dataset.badge = x.b.id;
    card.append(el('span', 'badge-icon', x.b.icon), el('strong', 'badge-name', x.b.name), el('span', 'badge-desc', x.b.desc));
    if (!x.done) {
      if (x.b.kind !== 'yes') { const tr = el('div', 'badge-track'), f = el('div', 'badge-fill'); f.style.width = (x.p * 100).toFixed(1) + '%'; tr.append(f); card.append(tr); }
      card.append(el('span', 'badge-prog', (i === done.length ? 'next up · ' : '') + badgeProgress(x.b, x.v)));
    }
    bgrid.append(card);
  });
  out.push(section(`badges · ${done.length} of ${BADGES.length}`, bgrid));
  out.push(el('p', 'stat-note', 'streaks and badges count every flight you’ve landed.'));
  statsBody.replaceChildren(...out);
  if (statsFocus) focusBadge(statsFocus);
}
// from the landed card: open the stats tab at that badge and make it glow
let statsFocus = null;
function openBadge(id) { statsFocus = id; showView('stats'); }
function focusBadge(id) {
  statsFocus = null;
  const card = statsBody.querySelector(`.badge[data-badge="${id}"]`);
  if (!card) return;
  card.scrollIntoView({ block: 'center', behavior: reduceMotion.matches ? 'auto' : 'smooth' });
  card.classList.remove('flash'); void card.offsetWidth; card.classList.add('flash');
}

// the last 12 weeks, one square a day (monday at the top), shaded by time studied
function studyCalendar(recs) {
  const mins = dayTotals(recs), today = dayNum(new Date());
  const dow = (dayDate(today).getDay() + 6) % 7;            // 0 = monday
  const start = today - dow - 7 * 11;
  const cal = el('div', 'cal'); cal.setAttribute('role', 'img');
  let studied = 0;
  for (let d = start; d < start + 84; d++) {
    const m = mins.get(d) || 0;
    const lvl = d > today ? 'future' : !m && !mins.has(d) ? '0' : m < 30 ? '1' : m < 90 ? '2' : m < 180 ? '3' : '4';
    const c = el('span', 'cal-day l' + lvl);
    if (d <= today) c.title = `${shortDate(dayDate(d))}: ${mins.has(d) ? minWords(m) : 'no flights'}`;
    if (mins.has(d)) studied++;
    cal.append(c);
  }
  cal.setAttribute('aria-label', `study calendar: flights on ${studied} of the last 12 weeks' days`);
  const wrap = el('div', 'cal-wrap'), legend = el('div', 'cal-legend');
  legend.append(el('span', null, '12 weeks ago'), el('span', null, 'today'));
  wrap.append(cal, legend);
  return wrap;
}

// ── Start-up ──────────────────────────────────────────────
let lastFrame = 0, frameDt = 1 / 60;
function loop(t) {
  t = t || performance.now();
  frameDt = lastFrame ? Math.min(0.1, (t - lastFrame) / 1000) : 1 / 60;   // seconds since last frame
  lastFrame = t;
  easeLayout(frameDt);
  updateCamera(frameDt);
  ctx.clearRect(0, 0, W, H);
  drawStars(t || 0);
  drawGlobe();
  const now = Date.now();
  if (activeView === 'map') drawMap();
  else {
    if (viewRoute && activeView === 'passes') drawRoute(viewRoute.from, viewRoute.to, 1, false);
    else if (flight) drawRoute(flight.from, flight.to, flightState(now).frac, !flight.landed, flight.paused, t);
    else if (sel.from && sel.to && sel.from !== sel.to) drawRoute(sel.from, sel.to, 0, false);
    drawCities();
  }
  updateHud(now);
  requestAnimationFrame(loop);
}
window.addEventListener('resize', resize);
document.body.classList.add('on-fly');
resize();
renderState();
restoreFlight();   // pick up a flight that was in the air before a refresh
requestAnimationFrame(loop);
