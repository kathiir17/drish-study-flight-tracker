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
CITIES.forEach(c => { c.scale = 1; }); // eased size, for the hover/press "bulge"
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
function routeMs(km) { return (km / 900) * 3600000; } // 900 km/h cruise (phase 2 makes this realistic)

// The globe centres in whatever space the panel leaves: to its right on wide screens
// (sidebar), above it on narrow ones (bottom panel). When that space changes (a panel
// growing, a window resizing) the globe glides to its new place rather than jumping.
const panelEl = document.getElementById('panel');
let target = null;   // { cx, cy, r } the globe is easing towards
function computeLayout() {
  const pr = panelEl.getBoundingClientRect();
  const sidebar = pr.top < H * 0.5;               // narrow screens dock the panel at the bottom
  if (sidebar) {
    const left = pr.right, w = W - left;
    return { cx: left + w / 2, cy: H / 2, r: Math.max(80, Math.min(w * 0.42, H * 0.42)) };
  }
  const h = pr.top;                                // the space above the bottom panel
  return { cx: W / 2, cy: h / 2 + 10, r: Math.max(70, Math.min(W * 0.44, h * 0.42)) };
}
function relayout(snap) {
  target = computeLayout();
  document.documentElement.style.setProperty('--globe-cx', target.cx + 'px');
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
      .then(t => { geo = topojson.feature(t, t.objects.countries).features; LAND = landRings(geo); })
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

function drawCities() {
  const showAll = zoom >= 1.7;
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
      drawLabel(c.n, p.sx + r + 5, p.sy + 4, isTo ? '#ffd79a' : isFrom ? '#cfe6ff' : 'rgba(235,242,255,0.92)');
    }
  }
}

// The route: faint dashes ahead, an amber contrail behind, and the plane facing its heading.
function drawRoute(from, to, prog, withPlane) {
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
  ctx.save();
  ctx.translate(p.sx, p.sy); ctx.rotate(ang);
  ctx.shadowColor = 'rgba(255,189,90,0.9)'; ctx.shadowBlur = 12;
  ctx.fillStyle = '#fff4dc';
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
function interacted() { cam.auto = null; cam.lastInteract = performance.now(); }

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
    const k = reduceMotion.matches ? 1 : 1 - Math.exp(-dt / 0.35);   // ease out, settles in ~2 s
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
  if (flight && !flight.landed && !dragging && !pinch && !cam.auto && now - cam.lastInteract > FOLLOW_AFTER_MS
      && Math.abs(cam.vx) + Math.abs(cam.vy) < 0.01 && Math.abs(cam.tZoom - zoom) < 1e-3) {
    frameRoute(flight.from, flight.to, flightProgress(Date.now()));
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
  let best = null, bestD = max;
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
    if (e.pointerType === 'mouse') {
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
    if (e.type === 'pointerup' && press && !press.moved && press.city) onCityTap(press.city);
    press = null; pressedCity = null;
    canvas.style.cursor = 'grab';
  }
}
canvas.addEventListener('pointerup', pointerEnd);
canvas.addEventListener('pointercancel', pointerEnd);
canvas.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse' && !pointers.size) hoverCity = null; });

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
const MESSAGES = [
  {threshold:0,    text:"wheels up — lock in 👀"},
  {threshold:0.25, text:"stay focused. 🫡"},
  {threshold:0.5,  text:"halfway there. ⏳"},
  {threshold:0.75, text:"almost done... 🥰"},
  {threshold:1,    text:"landed. great session 🎉"},
];
const BREAK_MSG = 'break time. step away 🧘';
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
function getBannerMsg(p) {
  let msg = MESSAGES[0].text;
  for (const m of MESSAGES) { if (p >= m.threshold) msg = m.text; }
  return msg;
}
function updateBanner(p) { setPill((pomo && pomo.onBreak) ? BREAK_MSG : getBannerMsg(p)); }

// ── Flight timing ─────────────────────────────────────────
// Flight time runs at `speed` × real time. We store how much flight time had passed
// (virtMs) at the last speed change (lastT); everything else is worked out from the
// clock. So a speed change never makes progress jump, and a tick that runs late
// (background tab) still gives the right numbers.
let flight = null;
const chkPomo  = $('chk-pomo');
const speedBtns = [...document.querySelectorAll('[data-speed]')];
let chosenSpeed = 1;

function selectedSpeed() { return chosenSpeed; }
function showSpeed(v) { speedBtns.forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.speed) === v))); }
function newFlightId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 10); }
function flightVirt(now) { return flight.virtMs + (now - flight.lastT) * flight.speed; }
function flightProgress(now) { return flight.landed ? 1 : Math.min(1, flightVirt(now) / flight.totalMs); }

// The flight in the air is kept on this device so a refresh (or reopening the tab)
// carries on where it was. Only the unfinished flight lives here; finished flights are
// in Firestore. If the browser clears this, only the current flight is lost.
const ACTIVE_KEY = 'activeFlight';
function persistFlight() {
  try {
    if (!flight || flight.landed) { localStorage.removeItem(ACTIVE_KEY); return; }
    localStorage.setItem(ACTIVE_KEY, JSON.stringify({
      v:1, id:flight.id, from:flight.from.n, to:flight.to.n, startT:flight.startT,
      virtMs:flight.virtMs, lastT:flight.lastT, speed:flight.speed, sped:flight.sped,
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
  launch({ id:newFlightId(), from, to, startT:now, virtMs:0, lastT:now, speed, sped: speed > 1,
           pomoStart: pomoMins ? now : null,
           pomoFocus: pomoMins ? pomoMins.focus * 60000 : null,
           pomoBreak: pomoMins ? pomoMins.brk * 60000 : null }, false);
}

function launch(s, restored) {
  const km = routeKm(s.from, s.to);
  flight = { id:s.id, from:s.from, to:s.to, km, totalMs:routeMs(km),
             startT:s.startT, virtMs:s.virtMs, lastT:s.lastT, speed:s.speed, sped:!!s.sped,
             landed:false, halfwayChimed:false };
  const now = Date.now();
  pomo = s.pomoStart != null
    ? { start:s.pomoStart, focus:s.pomoFocus || POMO_DEFAULT.focus * 60000, brk:s.pomoBreak || POMO_DEFAULT.brk * 60000, onBreak:false }
    : null;
  if (pomo) pomo.onBreak = pomoPhase(now).onBreak;               // no chime for the current phase
  if (restored) flight.halfwayChimed = flightProgress(now) >= 0.5; // or for a halfway already passed
  sel.from = flight.from; sel.to = flight.to;
  chosenSpeed = flight.speed; showSpeed(chosenSpeed);
  persistFlight();
  if (!restored) playChime('takeoff');
  frameRoute(flight.from, flight.to, flightProgress(now));
  cam.lastInteract = performance.now();
  renderState();
  tick();
}

function tick() {
  if (!flight || flight.landed) return;
  const now = Date.now();
  const virt = flightVirt(now);
  if (virt >= flight.totalMs) { land(); return; }
  const p = virt / flight.totalMs;
  if (pomo) {
    const onBreak = pomoPhase(now).onBreak;
    if (onBreak !== pomo.onBreak) { pomo.onBreak = onBreak; playChime(onBreak ? 'break' : 'resume'); }
  }
  if (p >= 0.5 && !flight.halfwayChimed) { flight.halfwayChimed = true; playChime('halfway'); }
  if (activeView === 'fly') updateBanner(p);
}

function land() {
  // the exact moment it reached 100%, even if this tick ran late or the page was closed
  const landT = Math.max(flight.startT, flight.lastT + (flight.totalMs - flight.virtMs) / flight.speed);
  flight.landed = true;
  flight.landT = landT;
  pomo = null;
  persistFlight(); // clears the stored in-progress flight
  playChime('landing');
  renderState();
  saveToHistory(flight, landT);
}

function stopFlight() {
  flight = null; pomo = null;
  persistFlight(); // clears the stored in-progress flight
  renderState();
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
const sel = { from: null, to: null };           // the route being planned
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
  chkPomo.disabled = st === 'flying';
  textCache.clear();
  if (st === 'plan') {
    inpFrom.value = sel.from ? sel.from.n : inpFrom.value;
    inpTo.value = sel.to ? sel.to.n : inpTo.value;
    updatePlan();
  } else if (st === 'flying') {
    setRoute($('fl-route'), flight.from.n, flight.to.n);
    $('pomo-ring').hidden = !pomo;
    $('fl-real').hidden = flight.speed === 1;
    resetStopButton();
    updateHud(Date.now());
    updateBanner(flightProgress(Date.now()));
  } else {
    const f = flight;
    $('ld-title').textContent = `landed in ${f.to.n}`;
    $('ld-sub').textContent = `${fmtNum(f.km)} km and ${durWords(f.totalMs)} of study. lovely work.`;
    $('btn-onward').textContent = `fly onward from ${f.to.n}`;
    setPill(MESSAGES[MESSAGES.length - 1].text);
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
  const virt = Math.min(flight.totalMs, flightVirt(now));
  const p = virt / flight.totalMs;
  setText($('fl-left'), clock(flight.totalMs - virt));
  if (flight.speed !== 1) setText($('fl-real'), `${clock((flight.totalMs - virt) / flight.speed)} real time at ${flight.speed}x`);
  $('fl-bar').style.width = (p * 100).toFixed(2) + '%';
  setText($('fl-flown'), `${fmtNum(p * flight.km)} km flown`);
  setText($('fl-togo'), `${fmtNum(flight.km - p * flight.km)} km to go`);
  if (pomo) {
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
  if (r.top > H * 0.5) { acEl.style.top = 'auto'; acEl.style.bottom = (H - r.top + 8) + 'px'; }
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
  startFlight(from, to, mins);
});

// stop: two taps, so a stray click doesn't throw away a session
const btnStop = $('btn-stop');
let stopArmTimer = null;
function resetStopButton() { clearTimeout(stopArmTimer); btnStop.classList.remove('armed'); btnStop.textContent = 'stop'; }
btnStop.addEventListener('click', () => {
  if (btnStop.classList.contains('armed')) { resetStopButton(); stopFlight(); return; }
  btnStop.classList.add('armed'); btnStop.textContent = 'stop? it won’t be saved';
  stopArmTimer = setTimeout(resetStopButton, 3500);
});

// after landing
$('btn-onward').addEventListener('click', () => { const next = flight.to; stopFlight(); sel.from = next; sel.to = null; inpTo.value = ''; renderState(); faceCity(next); inpTo.focus(); });
$('btn-new').addEventListener('click', () => { stopFlight(); sel.from = sel.to = null; inpFrom.value = inpTo.value = ''; renderState(); });

// tabs
document.querySelectorAll('.tab').forEach(tab => tab.addEventListener('click', () => showView(tab.dataset.view)));
function showView(name) {
  activeView = name;
  document.querySelectorAll('.tab').forEach(t => {
    if (t.dataset.view === name) t.setAttribute('aria-current', 'page'); else t.removeAttribute('aria-current');
  });
  for (const v of ['fly', 'passes', 'map', 'stats']) $('view-' + v).hidden = v !== name;
  document.body.classList.toggle('on-fly', name === 'fly');
  closeAC();
  if (name === 'passes') renderHistory();
  if (name === 'fly') { textCache.clear(); renderState(); tick(); }
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
    await DB.addFlight({
      id: f.id,
      seq: h.reduce((m,x) => Math.max(m, x.seq), 0) + 1,
      from:f.from.n, to:f.to.n, km:Math.round(f.km),
      dur:formatDur(f.km/900),
      realDur: f.sped ? formatDur((landT - f.startT)/3600000) : null,
      date:ddmmyyyy(new Date(landT)),
      // summable numbers for stats (see REVAMP.md phase 0); realMin will exclude pauses
      flightMin: Math.round(f.totalMs / 60000),
      realMin: Math.round((landT - f.startT) / 60000),
      startedAt: new Date(f.startT),
      endedAt: new Date(landT)
    });
    if (activeView === 'passes') renderHistory();
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
  count.textContent = h.length ? `${h.length} flight${h.length === 1 ? '' : 's'}` : '';
  if (!h.length) {
    list.replaceChildren(el('p', 'hist-empty', 'no flights yet. your first landing will appear here.'));
    return;
  }
  list.replaceChildren(...h.map(f => {
    const route = el('div', 'hist-route');
    route.append(String(f.from), el('span', 'arrow', '→'), String(f.to));
    const detail = el('div', 'hist-detail', `${f.date}, ${fmtNum(f.km)} km, ${f.dur}${f.realDur ? ` (${f.realDur} real)` : ''}`);
    const main = el('div', 'hist-main'); main.append(route, detail);
    const del = el('button', 'hist-del', '✕');
    del.type = 'button'; del.setAttribute('aria-label', `delete ${f.from} to ${f.to}`);
    let armT = null;
    del.addEventListener('click', () => {
      if (del.classList.contains('armed')) { clearTimeout(armT); del.disabled = true; deleteHistory(f.id); return; }
      del.classList.add('armed'); del.textContent = 'delete?';
      armT = setTimeout(() => { del.classList.remove('armed'); del.textContent = '✕'; }, 3500);
    });
    const row = el('div', 'hist-row'); row.append(main, del);
    return row;
  }));
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
  if (flight) drawRoute(flight.from, flight.to, flightProgress(now), !flight.landed);
  else if (sel.from && sel.to && sel.from !== sel.to) drawRoute(sel.from, sel.to, 0, false);
  drawCities();
  updateHud(now);
  requestAnimationFrame(loop);
}
window.addEventListener('resize', resize);
document.body.classList.add('on-fly');
resize();
renderState();
restoreFlight();   // pick up a flight that was in the air before a refresh
requestAnimationFrame(loop);
