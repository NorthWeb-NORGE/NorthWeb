// Myk rulling for musehjul, styreflate og menylenker.
//
// Et vanlig musehjul flytter siden i hakk på rundt 100 px. Her fanger vi
// hjulet, legger hakket til et MÅL, og lar siden gli mot målet litt for
// hvert bilde (ca. 60 ganger i sekundet). Samme prinsipp som biblioteket
// Lenis, bare uten biblioteket. Lenker til #seksjoner bruker samme motor,
// så all bevegelse på siden kjennes lik.
//
// Berøringsskjerm, tastatur og rullefelt bruker nettleserens egen rulling.

const SMOOTHING = 0.075; // andel av gjenstående avstand per bilde ved 60 Hz. Lavere = mykere og tregere.

export function initSmoothScroll() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  // Slår av scroll-behavior: smooth i CSS, ellers ville de to kjempet
  document.documentElement.classList.add("has-smooth-scroll");

  let target = window.scrollY;
  let current = window.scrollY;
  let running = false;
  let last = 0;

  const maxScroll = () => document.documentElement.scrollHeight - window.innerHeight;
  const clamp = (y) => Math.max(0, Math.min(y, maxScroll()));

  // Skal hjulet rulle noe INNI siden (tekstfelt, nedtrekksliste)? Da lar vi det være.
  function scrollsInside(node, delta) {
    for (let n = node; n && n !== document.body; n = n.parentElement) {
      if (n.scrollHeight <= n.clientHeight + 1) continue;
      const overflow = getComputedStyle(n).overflowY;
      if (overflow !== "auto" && overflow !== "scroll") continue;
      const atTop = n.scrollTop <= 0;
      const atBottom = n.scrollTop + n.clientHeight >= n.scrollHeight - 1;
      if ((delta < 0 && !atTop) || (delta > 0 && !atBottom)) return true;
    }
    return false;
  }

  function step(now) {
    if (!running) return;

    // Regner om til faktisk tid mellom bildene, så farten blir lik på 60 og 120 Hz
    const dt = Math.min(now - last, 50);
    last = now;
    const ease = 1 - Math.pow(1 - SMOOTHING, dt / 16.67);

    current += (target - current) * ease;
    if (Math.abs(target - current) < 0.4) current = target;

    window.scrollTo(0, current);

    if (current === target) running = false;
    else requestAnimationFrame(step);
  }

  function glideTo(y) {
    if (!running) {
      current = window.scrollY;
      last = performance.now();
      running = true;
      requestAnimationFrame(step);
    }
    target = clamp(y);
  }

  function stop() {
    running = false;
    target = current = window.scrollY;
  }

  window.addEventListener(
    "wheel",
    (event) => {
      if (event.ctrlKey || event.defaultPrevented) return;          // ctrl + hjul = zoom
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;   // sidelengs
      if (document.hidden || scrollsInside(event.target, event.deltaY)) return;

      event.preventDefault();

      let delta = event.deltaY;
      if (event.deltaMode === 1) delta *= 40;                 // linjer → piksler
      if (event.deltaMode === 2) delta *= window.innerHeight; // sider → piksler

      glideTo((running ? target : window.scrollY) + delta);
    },
    { passive: false } // må være false for å få lov til å stoppe standardrullingen
  );

  // Lenker til en seksjon på samme side
  document.addEventListener("click", (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link || event.defaultPrevented || document.hidden) return;

    const id = link.getAttribute("href").slice(1);
    const section = id ? document.getElementById(id) : null;
    if (!section) return;

    event.preventDefault();
    history.pushState(null, "", `#${id}`);

    // Venter ett bilde, slik at mobilmenyen rekker å lukke seg før vi måler
    requestAnimationFrame(() => {
      const offset = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
      const y = id === "topp" ? 0 : section.getBoundingClientRect().top + window.scrollY - offset;
      glideTo(y);
    });

    // Flytter tastaturfokus til seksjonen, slik en vanlig ankerlenke gjør
    section.setAttribute("tabindex", "-1");
    section.focus({ preventScroll: true });
  });

  // Tar brukeren over på en annen måte, slipper vi taket med en gang
  window.addEventListener("touchstart", stop, { passive: true });
  window.addEventListener("keydown", (event) => {
    if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(event.key)) stop();
  });
  window.addEventListener("pointerdown", (event) => {
    // Bare klikk på selve rullefeltet (utenfor innholdet) skal avbryte
    if (event.clientX >= document.documentElement.clientWidth) stop();
  });
}
