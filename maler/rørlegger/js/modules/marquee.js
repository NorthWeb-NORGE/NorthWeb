// Løpende tekststripe som følger rullingen: den går rolig av seg selv,
// får fart når man ruller, og snur når man ruller motsatt vei.
// Innholdet dupliseres én gang, slik at stripen kan gå i en sømløs løkke.

const BASE_SPEED = 38; // px per sekund når siden står stille

export function initMarquee() {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.querySelectorAll(".marquee").forEach((marquee) => {
    const track = marquee.querySelector(".marquee__track");
    if (!track) return;

    track.innerHTML += track.innerHTML;
    if (reduceMotion) return;

    let x = 0;
    let boost = 0;      // ekstra fart fra rulling, dør ut av seg selv
    let direction = 1;
    let lastY = window.scrollY;
    let lastTime = 0;
    let running = false;

    window.addEventListener(
      "scroll",
      () => {
        const delta = window.scrollY - lastY;
        lastY = window.scrollY;
        if (!delta) return;
        direction = delta > 0 ? 1 : -1;
        boost = Math.min(Math.abs(delta) * 14, 900);
      },
      { passive: true }
    );

    const frame = (now) => {
      if (!running) return;
      const dt = Math.min(now - lastTime, 50) / 1000;
      lastTime = now;

      const loop = track.scrollWidth / 2;
      x -= direction * (BASE_SPEED + boost) * dt;
      boost *= Math.pow(0.04, dt); // faller til 4 % på ett sekund
      if (x <= -loop) x += loop;
      if (x > 0) x -= loop;

      track.style.transform = `translate3d(${x}px, 0, 0)`;
      requestAnimationFrame(frame);
    };

    // Kjører bare mens stripen er synlig
    new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !running) {
        running = true;
        lastTime = performance.now();
        requestAnimationFrame(frame);
      } else if (!entry.isIntersecting) {
        running = false;
      }
    }).observe(marquee);
  });
}
