/* «Slik jobber vi»: røret fylles og stegene tennes i takt med rullingen.
   Framdriften p (0–1) er hvor langt 61,8 %-linja på skjermen har kommet
   ned gjennom lista. CSS bruker --p til å skalere fyllet (scaleY), og
   .is-on tenner hvert steg. Det går bare framover – tent er tent. */

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

export function initProcess({ reduce = false } = {}) {
  const list = document.querySelector('[data-process]');
  if (!list) return;

  const steps = [...list.children];

  if (reduce) {
    steps.forEach((step) => step.classList.add('is-on'));
    return; // --p står på 1 fra CSS
  }

  let best = 0;
  let ticking = false;

  const update = () => {
    ticking = false;
    const rect = list.getBoundingClientRect();
    if (!rect.height) return;
    const p = clamp((window.innerHeight * 0.618 - rect.top) / rect.height, 0, 1);
    if (p <= best) return;
    best = p;
    list.style.setProperty('--p', best.toFixed(4));
    steps.forEach((step) => {
      if (best >= (step.offsetTop + 12) / rect.height) step.classList.add('is-on');
    });
  };

  const queue = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };

  list.style.setProperty('--p', '0');
  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', queue);
  update();
}
