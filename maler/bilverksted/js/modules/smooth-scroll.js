/* ==========================================================================
   MYK RULLING – laget selv etter Lenis-prinsippet
   --------------------------------------------------------------------------
   Idéen: hjulet flytter ikke siden direkte. Det flytter et MÅL. Hvert bilde
   (requestAnimationFrame) går den faktiske posisjonen en andel av veien mot
   målet. Resultatet er en rask start og en lang, myk landing.

   Uavhengig av skjermfrekvens: en fast andel per bilde ville gått dobbelt
   så fort på en 120 Hz-skjerm. Derfor regnes andelen ut fra tiden som
   faktisk har gått:  andel = 1 − e^(−STIVHET × dt).

   Vi kaprer BARE musehjul og styreflate. Dette får være i fred:
     - berøring (mobil ruller som vanlig)
     - tastatur (piltaster, mellomrom, Page Up/Down, Home/End)
     - rullefeltet (drar du i det, merker vi at posisjonen endret seg
       utenfra, og slipper taket)
     - ctrl/cmd + hjul (zoom)
     - vannrett rulling
     - rulling inni skjemafelt og andre elementer med egen rulling
   ========================================================================== */

const STIVHET = 5.5; // lavere = mykere og lengre landing

let target = 0;      // dit vi skal
let current = 0;     // der vi er
let lastSet = 0;     // posisjonen vi selv satte sist
let lastTime = 0;
let running = false;
let enabled = false;

const maxScroll = () => document.documentElement.scrollHeight - window.innerHeight;
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

function frame(time) {
  if (!running) return;

  // Har noen andre flyttet siden (rullefelt, tastatur, berøring)? Slipp.
  if (Math.abs(window.scrollY - lastSet) > 2) {
    running = false;
    return;
  }

  const dt = Math.min((time - lastTime) / 1000, 0.05);
  lastTime = time;

  current += (target - current) * (1 - Math.exp(-STIVHET * dt));
  if (Math.abs(target - current) < 0.5) current = target;

  window.scrollTo(0, current);
  lastSet = window.scrollY;

  if (current === target) {
    running = false;
    return;
  }
  requestAnimationFrame(frame);
}

function run() {
  if (running) return;
  running = true;
  lastTime = performance.now();
  lastSet = window.scrollY;
  requestAnimationFrame(frame);
}

/* Kan elementet under pekeren rulle selv i denne retningen? Da lar vi det. */
function scrollsInside(el, deltaY) {
  for (let node = el; node && node !== document.body; node = node.parentElement) {
    if (node.tagName === 'SELECT') return true;
    if (node.scrollHeight <= node.clientHeight + 1) continue;
    const overflow = getComputedStyle(node).overflowY;
    const isScroller = overflow === 'auto' || overflow === 'scroll' || node.tagName === 'TEXTAREA';
    if (!isScroller) continue;
    const atTop = node.scrollTop <= 0;
    const atBottom = node.scrollTop + node.clientHeight >= node.scrollHeight - 1;
    if ((deltaY < 0 && !atTop) || (deltaY > 0 && !atBottom)) return true;
  }
  return false;
}

function onWheel(event) {
  if (event.ctrlKey || event.metaKey || event.defaultPrevented) return;
  if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
  if (scrollsInside(event.target, event.deltaY)) return;

  event.preventDefault();

  // deltaMode 1 = linjer (Firefox med mus), 2 = sider. Gjør om til piksler.
  let delta = event.deltaY;
  if (event.deltaMode === 1) delta *= 40;
  else if (event.deltaMode === 2) delta *= window.innerHeight;

  if (!running) current = target = window.scrollY;
  target = clamp(target + delta, 0, maxScroll());
  run();
}

/* Rull til en posisjon med samme motor. Brukes av menylenkene. */
export function scrollToY(y) {
  const goal = clamp(y, 0, maxScroll());
  if (!enabled) {
    window.scrollTo(0, goal);
    return;
  }
  if (!running) current = window.scrollY;
  target = goal;
  run();
}

function onAnchorClick(event) {
  const link = event.target.closest('a[href^="#"]');
  if (!link || event.metaKey || event.ctrlKey || event.shiftKey) return;

  const id = link.getAttribute('href').slice(1);
  const dest = id ? document.getElementById(id) : null;
  if (!dest) return;

  event.preventDefault();

  // Ruller vi oppover, kommer headeren inn igjen – gi plass til den.
  const top = dest.getBoundingClientRect().top + window.scrollY;
  const header = document.querySelector('[data-header]');
  const offset = top < window.scrollY && header ? header.offsetHeight : 0;
  scrollToY(id === 'topp' ? 0 : top - offset);

  history.pushState(null, '', `#${id}`);

  // Flytt fokus til målet, så tastatur og skjermleser fortsetter derfra.
  if (!dest.hasAttribute('tabindex')) dest.setAttribute('tabindex', '-1');
  dest.focus({ preventScroll: true });
}

export function initSmoothScroll({ reduce = false } = {}) {
  document.addEventListener('click', onAnchorClick);
  if (reduce) return; // lenkene hopper direkte, hjulet er urørt

  enabled = true;
  // passive: false er nødvendig for å få lov til å kalle preventDefault().
  window.addEventListener('wheel', onWheel, { passive: false });
}
