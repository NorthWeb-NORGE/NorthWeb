// Liv i hero-tegningen: etter at rørene er tegnet opp, legges det små
// lyse streker oppå som beveger seg i vannets retning. Hvert rør klones,
// så tegningen i HTML-en slipper å inneholde alt to ganger.

export function initHero() {
  const drawing = document.querySelector(".hero-drawing");
  if (!drawing) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  drawing.querySelectorAll(".dr-pipe").forEach((pipe, i) => {
    const flow = pipe.cloneNode();
    flow.setAttribute("class", "dr-flow");
    flow.removeAttribute("style");
    flow.style.setProperty("--i", i);
    pipe.after(flow);
  });
}
