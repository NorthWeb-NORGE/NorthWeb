// Sidens røde tråd: de to stigeledningene i hero-tegningen (kaldt og varmt
// vann) fortsetter ut av tegningen, ut i høyre marg og ned gjennom hele
// siden. De tegnes opp i takt med rullingen, og får en muffe med påskrift
// der hver seksjon begynner.
//
// Slik virker det:
//   1. build() måler hvor ting står akkurat nå og lager én lang SVG-bane.
//   2. En tabell (lengde langs banen → y-posisjon) gjør at vi kan spørre:
//      «hvor langt skal røret være tegnet når skjermen står her?»
//   3. Ved rulling settes et mål, og tick() glir mykt mot målet.
// Alt bygges på nytt når siden endrer størrelse.

const NS = "http://www.w3.org/2000/svg";

// Må stemme med stigeledningene i hero-SVG-en i index.html
const RISER_VV_X = 459.5;
const RISER_KV_X = 464.75;
const RISER_STROKE = 2.6;

const CORNER = 12;        // radius i bendene
const FOLLOW = 0.618;     // røret tegnes ned til det gylne snitt av skjermhøyden

const el = (name, attrs = {}) => {
  const node = document.createElementNS(NS, name);
  Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
  return node;
};

export function initPagePipe() {
  const main = document.querySelector("main");
  const drawing = document.querySelector(".hero-drawing");
  const endAnchor = document.querySelector("[data-pipe-end]");
  const container = document.querySelector(".hero .container");
  if (!main || !drawing || !endAnchor || !container) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const svg = el("svg", { class: "pagepipe", "aria-hidden": "true", focusable: "false" });
  main.append(svg);

  let lines = [];     // { path, length }
  let marks = [];     // { node, at }
  let table = [];     // y-posisjon for hver STEP langs senterlinjen
  let endNode = null;
  let total = 0;
  let drawn = 0;
  let target = 0;
  let frame = 0;
  const STEP = 6;

  // --- Geometri -----------------------------------------------------------

  // Lager en bane gjennom punktene, forskjøvet `offset` px til siden, med
  // avrundede hjørner. Det innerste røret i en sving får mindre radius enn
  // det ytterste, slik at de to linjene holder lik avstand hele veien.
  function buildPath(points, offset) {
    const dirs = points.slice(1).map((p, i) => {
      const dx = Math.sign(p.x - points[i].x);
      const dy = Math.sign(p.y - points[i].y);
      return { x: dx, y: dy };
    });
    const normal = (d) => ({ x: d.y, y: -d.x });

    const moved = points.map((p, i) => {
      const a = dirs[i - 1];
      const b = dirs[i];
      const n = a && b
        ? { x: normal(a).x + normal(b).x, y: normal(a).y + normal(b).y }
        : normal(a || b);
      return { x: p.x + n.x * offset, y: p.y + n.y * offset };
    });

    let d = `M${moved[0].x} ${moved[0].y}`;
    for (let i = 1; i < moved.length; i++) {
      const v = moved[i];
      const a = dirs[i - 1];
      const b = dirs[i];
      if (!b) {
        d += `L${v.x} ${v.y}`;
        break;
      }
      const cross = a.x * b.y - a.y * b.x; // +1 = sving med klokka
      const r = Math.max(1, CORNER + offset * cross);
      d += `L${v.x - a.x * r} ${v.y - a.y * r}`;
      d += `A${r} ${r} 0 0 ${cross > 0 ? 1 : 0} ${v.x + b.x * r} ${v.y + b.y * r}`;
    }
    return d;
  }

  // Hvor langt langs banen er vi når røret har nådd høyden y?
  function lengthAt(y) {
    let lo = 0;
    let hi = table.length - 1;
    if (y <= table[0]) return 0;
    if (y >= table[hi]) return total;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (table[mid] <= y) lo = mid;
      else hi = mid;
    }
    const span = table[hi] - table[lo] || 1;
    return (lo + (y - table[lo]) / span) * STEP;
  }

  function build() {
    const box = main.getBoundingClientRect();
    const width = main.clientWidth;
    const height = main.offsetHeight;
    const top = (node) => node.getBoundingClientRect().top - box.top;

    svg.replaceChildren();
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.style.height = `${height}px`;

    // Start: der stigeledningene forlater hero-tegningen
    const view = drawing.viewBox.baseVal;
    const rect = drawing.getBoundingClientRect();
    const scale = rect.width / view.width;
    const toX = (x) => rect.left - box.left + (x - view.x) * scale;
    const half = ((RISER_KV_X - RISER_VV_X) * scale) / 2;
    const startX = toX((RISER_KV_X + RISER_VV_X) / 2);
    const startY = rect.bottom - box.top;

    // Margen: røret går midt i luften mellom innholdet og skjermkanten
    const margin = width - (container.getBoundingClientRect().right - box.left);
    const roomy = margin >= 36;
    const gutterX = width - margin + Math.min(Math.max(margin / 2, 9), 40);

    // Slutt: like under kontaktoverskriften (så bendet går klar av muffen
    // og påskriften). Med plass i margen bøyer røret inn mot innholdet og
    // ender i to stoppekraner.
    const endY = endAnchor.getBoundingClientRect().bottom - box.top + 60;
    const stub = roomy && width >= 960 ? 68 : 0;

    const points = [
      { x: startX, y: startY },
      { x: startX, y: startY + 20 },
      { x: gutterX, y: startY + 20 },
      { x: gutterX, y: endY },
    ];
    if (stub) points.push({ x: gutterX - stub, y: endY });

    const strokeWidth = Math.max(1.4, RISER_STROKE * scale);

    // Tynn, stiplet «planlagt føring» som viser hvor røret skal gå
    const track = el("path", { class: "pagepipe__track", d: buildPath(points, 0) });
    svg.append(track);
    total = track.getTotalLength();
    table = [];
    for (let len = 0; len <= total; len += STEP) table.push(track.getPointAtLength(len).y);

    // Mørke seksjoner: der byttes den mørkegrønne streken mot en lys
    const clipId = "pagepipe-dark";
    const clip = el("clipPath", { id: clipId, clipPathUnits: "userSpaceOnUse" });
    document.querySelectorAll("[data-pipe-dark]").forEach((section) => {
      clip.append(el("rect", { x: 0, y: top(section), width, height: section.offsetHeight }));
    });
    svg.append(clip);

    lines = [
      { cls: "pagepipe__vv", offset: -half, tipCls: "pagepipe__tip--vv" },
      { cls: "pagepipe__kv", offset: half, tipCls: "pagepipe__tip--kv" },
      { cls: "pagepipe__kv pagepipe__kv--light", offset: half, clip: true },
    ].map(({ cls, offset, clip: clipped, tipCls }) => {
      const path = el("path", { class: `pagepipe__line ${cls}`, d: buildPath(points, offset) });
      path.style.strokeWidth = strokeWidth;
      if (clipped) path.setAttribute("clip-path", `url(#${clipId})`);
      svg.append(path);
      const length = path.getTotalLength();
      path.style.strokeDasharray = `${length} ${length}`;
      // Prikken som leder an i enden av streken
      const tip = tipCls
        ? el("circle", { class: `pagepipe__tip ${tipCls}`, r: strokeWidth * 1.15 })
        : null;
      return { path, length, tip };
    });
    lines.forEach(({ tip }) => tip && svg.append(tip));

    // Muffer med påskrift der hver seksjon begynner
    marks = [...document.querySelectorAll("[data-pipe-label]")].map((section) => {
      const heading = section.querySelector("h2") || section;
      const y = top(heading) + 6;
      const group = el("g", { class: "pagepipe__mark" });
      if (section.hasAttribute("data-pipe-dark")) group.classList.add("pagepipe__mark--dark");

      const w = half * 2 + 9;
      group.append(el("rect", { x: gutterX - w / 2, y, width: w, height: 9, rx: 1 }));

      if (roomy) {
        const label = el("text", {
          transform: `translate(${gutterX - half - 15} ${y + 18}) rotate(90)`,
        });
        label.textContent = section.dataset.pipeLabel.toUpperCase();
        group.append(label);
      }
      svg.append(group);
      return { node: group, at: lengthAt(y) };
    });

    // Stoppekranene i enden
    const last = points[points.length - 1];
    endNode = el("g", { class: "pagepipe__end" });
    [-half, half].forEach((offset, i) => {
      const cx = stub ? last.x : last.x + offset;
      const cy = stub ? last.y + offset : last.y;
      endNode.append(
        el("circle", {
          class: i ? "pagepipe__valve pagepipe__valve--kv" : "pagepipe__valve pagepipe__valve--vv",
          cx,
          cy,
          r: Math.max(2.2, strokeWidth * 1.1),
        })
      );
    });
    svg.append(endNode);

    measure();
    drawn = target; // ingen animasjon rett etter ombygging
    render();
  }

  // --- Rulling ------------------------------------------------------------

  function measure() {
    if (reduceMotion) {
      target = total;
      return;
    }
    const doc = document.documentElement;
    const atBottom = window.scrollY + window.innerHeight >= doc.scrollHeight - 2;
    const y = window.innerHeight * FOLLOW - main.getBoundingClientRect().top;
    target = atBottom ? total : lengthAt(y);
  }

  function render() {
    const part = total ? drawn / total : 1;
    const moving = part > 0.002 && part < 0.998;
    lines.forEach(({ path, length, tip }) => {
      path.style.strokeDashoffset = length * (1 - part);
      if (!tip) return;
      const point = path.getPointAtLength(length * part);
      tip.setAttribute("cx", point.x);
      tip.setAttribute("cy", point.y);
      tip.style.opacity = moving ? 1 : 0;
    });
    marks.forEach(({ node, at }) => node.classList.toggle("is-reached", drawn >= at - 1));
    if (endNode) endNode.classList.toggle("is-reached", part > 0.995);
  }

  function tick() {
    drawn += (target - drawn) * 0.16;
    if (Math.abs(target - drawn) < 0.5) drawn = target;
    render();
    frame = drawn === target ? 0 : requestAnimationFrame(tick);
  }

  function onScroll() {
    measure();
    // Skjult fane: nettleseren kjører ikke animasjonsbilder, så vi hopper rett til målet
    if (document.hidden) {
      drawn = target;
      render();
    } else if (!frame) {
      frame = requestAnimationFrame(tick);
    }
  }

  // --- Oppstart -----------------------------------------------------------

  build();

  let rebuild = 0;
  new ResizeObserver(() => {
    clearTimeout(rebuild);
    rebuild = setTimeout(build, 120);
  }).observe(main);

  if (!reduceMotion) {
    window.addEventListener("scroll", onScroll, { passive: true });
  }
}
