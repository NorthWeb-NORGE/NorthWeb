/* ==========================================================================
   DEN RØDE TRÅDEN – bremserøret som følger siden nedover
   --------------------------------------------------------------------------
   Slik virker det:
   1. build() MÅLER siden: hvor røret forlater hero-tegningen
      (data-thread-anchor), hvor margen er, hvor hver seksjon starter og
      hvor røret skal ende. Ut fra målene skrives ÉN SVG-bane:
          anker → ned → bue → vannrett under hero-teksten → bue → rett ned
   2. Banen skjules med stroke-dasharray = hele lengden, og tegnes ved å
      minke stroke-dashoffset. update() regner ut hvor mye som skal vises:
      spissen av røret ligger på 61,8 % av skjermhøyden (det gylne snitt).
   3. Hver <section data-thread="Navn"> får en rørklammer med påskrift,
      som tones inn når røret når den.
   4. Mørke seksjoner: samme bane ligger én gang til i lys farge, klippet
      med en clipPath som dekker akkurat de mørke seksjonene.
   5. ResizeObserver kaller build() på nytt hver gang <main> endrer
      størrelse (vindu, fonter som lastes, FAQ som åpnes …).
   ========================================================================== */

const NS = 'http://www.w3.org/2000/svg';
const GOLDEN = 0.618;
const DARK_TONES = ['dark', 'iron'];

function make(tag, attrs = {}, parent) {
  const node = document.createElementNS(NS, tag);
  Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
  if (parent) parent.append(node);
  return node;
}

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

export function initThread({ reduce = false } = {}) {
  const root = document.querySelector('[data-thread-root]');
  const anchor = document.querySelector('[data-thread-anchor]');
  const endSection = root && root.querySelector('[data-thread-end]');
  if (!root || !anchor || !endSection) return null;

  const hero = anchor.closest('section');

  // --- Bygg SVG-skjelettet én gang -----------------------------------------
  const svg = make('svg', { class: 'thread', 'aria-hidden': 'true', focusable: 'false' });
  const clip = make('clipPath', { id: 'thread-dark', clipPathUnits: 'userSpaceOnUse' }, make('defs', {}, svg));
  const line = make('path', { class: 'thread__line' }, svg);
  const lineDark = make('path', { class: 'thread__line thread__line--dark', 'clip-path': 'url(#thread-dark)' }, svg);
  const marksGroup = make('g', {}, svg);

  // Sluttdetalj: rørmutter + manometer.
  const end = make('g', { class: 'thread__end' }, svg);
  make('rect', { class: 'thread__end-stroke', x: -6, y: -11, width: 12, height: 9, rx: 1 }, end);
  make('circle', { class: 'thread__end-stroke', cx: 0, cy: 9, r: 9 }, end);
  make('path', { class: 'thread__end-stroke', d: 'M-5.5 5.5l1.6 1.6M5.5 5.5l-1.6 1.6M0 2.2v2.2' }, end);
  make('line', { class: 'thread__needle', x1: 0, y1: 10, x2: 4.2, y2: 4.6 }, end);
  make('circle', { class: 'thread__end-stroke', cx: 0, cy: 10, r: 1.4 }, end);

  root.prepend(svg);

  // --- Tilstand --------------------------------------------------------------
  let geo = null;      // mål fra siste build()
  let marks = [];      // { el, at } – «at» = lengden langs banen der merket sitter
  let shown = 0;       // lengde som vises nå
  let goal = 0;        // lengde vi er på vei mot
  let maxTip = 0;      // lengste punkt røret har vært – det tegnes bare én gang
  let started = false;
  let animating = false;
  let lastTime = 0;
  let buildQueued = false;

  function build() {
    buildQueued = false;
    const box = root.getBoundingClientRect();
    const width = box.width;
    const top = (rect) => rect.top - box.top;

    // SVG-en har ingen viewBox og fyller <main> via CSS (100 % × 100 %).
    // Da er én SVG-enhet = én piksel, og den kan aldri lage vannrett rulling.

    // Ankeret: punktet nederst i hero-tegningen der røret går ut.
    const a = anchor.getBoundingClientRect();
    const ax = a.left + a.width / 2 - box.left;
    const ay = a.top + a.height / 2 - box.top;

    // Margen: midt i luften mellom skjermkant/beholderkant og innholdet.
    const container = hero.querySelector('.container');
    const gutter = parseFloat(getComputedStyle(container).paddingLeft) || 26;
    const tx = Math.round(container.getBoundingClientRect().left - box.left + gutter / 2);

    // Den vannrette strekningen ligger i luften nederst i hero.
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const yH = Math.round(top(hero.getBoundingClientRect()) + hero.offsetHeight - rem * 2.618);

    // Slutten: midt på overskriften i kontaktseksjonen.
    const stop = endSection.querySelector('[data-thread-stop]');
    const stopRect = stop ? stop.getBoundingClientRect() : null;
    const yEnd = Math.round(stopRect ? top(stopRect) + stopRect.height / 2 : top(endSection.getBoundingClientRect()) + rem * 6);

    // Buene får aldri større radius enn det er plass til.
    const r = Math.max(0, Math.min(18, (ax - tx) / 2, (yH - ay) / 2));
    const yV = yH + r; // her begynner den rette, loddrette delen

    const prefix = `M${ax} ${ay}V${yH - r}Q${ax} ${yH} ${ax - r} ${yH}H${tx + r}Q${tx} ${yH} ${tx} ${yV}`;
    line.setAttribute('d', prefix);
    const L0 = line.getTotalLength(); // lengden av «svingen» ut av hero
    const L = L0 + Math.max(0, yEnd - yV);
    const d = `${prefix}V${yEnd}`;

    [line, lineDark].forEach((path) => {
      path.setAttribute('d', d);
      path.style.strokeDasharray = `${L} ${L}`;
    });

    // Klippeflater for de mørke seksjonene.
    clip.replaceChildren();
    root.querySelectorAll('[data-tone]').forEach((section) => {
      if (!DARK_TONES.includes(section.dataset.tone)) return;
      const rect = section.getBoundingClientRect();
      make('rect', { x: 0, y: top(rect), width, height: rect.height }, clip);
    });

    // Merker ved hver seksjon.
    marksGroup.replaceChildren();
    marks = [];
    root.querySelectorAll('section[data-thread]').forEach((section) => {
      const y = Math.round(top(section.getBoundingClientRect()));
      if (y <= yV) return;
      const dark = DARK_TONES.includes(section.dataset.tone);
      // Ytre <g> plasserer, indre <g> animeres. (CSS-transform på samme
      // element ville overstyrt transform-attributtet.)
      const pos = make('g', { transform: `translate(${tx} ${y})` }, marksGroup);
      const mark = make('g', { class: `thread__mark${dark ? ' thread__mark--dark' : ''}` }, pos);
      make('rect', { class: 'thread__clip', x: -6, y: -5, width: 12, height: 10, rx: 1 }, mark);
      const label = make('text', { class: 'thread__label', transform: 'rotate(-90)', x: -14, y: 12, 'text-anchor': 'end' }, mark);
      label.textContent = section.dataset.thread;
      marks.push({ el: mark, at: L0 + (y - yV) });
    });

    // I en smal marg (mobil) krympes manometeret, så det ikke tar i teksten.
    end.setAttribute('transform', `translate(${tx} ${yEnd}) scale(${gutter < 40 ? 0.75 : 1})`);

    geo = { L, L0, yH, yV, rootTop: box.top + window.scrollY };
    update();
  }

  function queueBuild() {
    if (buildQueued) return;
    buildQueued = true;
    requestAnimationFrame(build);
  }

  /* Hvor langt skal røret være tegnet akkurat nå? */
  function update() {
    if (!geo) return;
    const { L, L0, yH, yV, rootTop } = geo;

    if (reduce) {
      shown = goal = L; // redusert bevegelse: røret står ferdig tegnet
      render();
      return;
    }
    if (!started) {
      render();
      return;
    }

    const vh = window.innerHeight;
    maxTip = Math.max(maxTip, window.scrollY + vh * GOLDEN - rootTop);

    // Svingen ut av hero er lang, men nesten flat. Den får derfor sin egen
    // strekning av rullingen, så den ikke dukker opp i ett rykk.
    const tStart = yH - vh * (1 - GOLDEN);
    let length;
    if (maxTip <= tStart) length = 0;
    else if (maxTip < yV) length = (L0 * (maxTip - tStart)) / (yV - tStart);
    else length = L0 + (maxTip - yV);

    goal = clamp(length, 0, L);
    shown = Math.min(shown, L);
    render(); // merkene bygges på nytt i build() og må få tilstanden sin igjen
    if (!animating && Math.abs(goal - shown) > 0.5) {
      animating = true;
      lastTime = performance.now();
      requestAnimationFrame(tick);
    }
  }

  /* Samme prinsipp som den myke rullingen: gå en andel av veien per bilde. */
  function tick(time) {
    const dt = Math.min((time - lastTime) / 1000, 0.05);
    lastTime = time;
    shown += (goal - shown) * (1 - Math.exp(-8 * dt));
    if (Math.abs(goal - shown) < 0.5) shown = goal;
    render();
    if (shown !== goal) requestAnimationFrame(tick);
    else animating = false;
  }

  function render() {
    const offset = Math.max(0, geo.L - shown);
    line.style.strokeDashoffset = offset;
    lineDark.style.strokeDashoffset = offset;
    marks.forEach((mark) => mark.el.classList.toggle('is-on', shown >= mark.at));
    end.classList.toggle('is-on', shown >= geo.L - 1);
  }

  build();
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', queueBuild);
  if ('ResizeObserver' in window) new ResizeObserver(queueBuild).observe(root);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(queueBuild);

  return {
    start() {
      started = true;
      update();
    },
  };
}
