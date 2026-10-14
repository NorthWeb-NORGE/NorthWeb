// «Slik jobber vi»: røret fylles mens man ruller forbi, og stegene
// tennes etter hvert som vannet når muffen deres.
// JS regner bare ut hvor langt vi er kommet (0–1) og legger tallet i
// CSS-variabelen --p. Resten skjer i css/sections/process.css.

// På bred skjerm ligger røret vannrett og slutter 61,8 % inn i siste kolonne
const PIPE_SHARE = 4.618 / 5;

export function initProcess() {
  const list = document.querySelector(".process__list");
  if (!list) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const steps = [...list.children];
  const wide = window.matchMedia("(min-width: 62rem)");
  list.classList.add("has-progress");

  const update = () => {
    const rect = list.getBoundingClientRect();
    const vh = window.innerHeight;

    // Bred: fylles mens listen beveger seg fra 85 % til 35 % av skjermhøyden.
    // Smal: røret står loddrett, så det fylles i takt med at listen passerer.
    const raw = wide.matches
      ? (vh * 0.85 - rect.top) / (vh * 0.5)
      : (vh * 0.7 - rect.top) / rect.height;
    const p = Math.max(0, Math.min(1, raw));

    list.style.setProperty("--p", p.toFixed(4));
    steps.forEach((step, i) => {
      const reach = wide.matches ? (i / steps.length) / PIPE_SHARE : i / steps.length;
      step.classList.toggle("is-active", p > 0.01 && p >= reach);
    });
  };

  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  update();
}
