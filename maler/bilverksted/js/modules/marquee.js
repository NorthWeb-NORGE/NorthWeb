/* Løpende tekststripe som følger rullingen.
   Fart = rolig grunnfart + rullefarten. Retningen snur når du ruller opp.
   Lista klones til den dekker skjermbredden + én ekstra, og posisjonen
   «vikles» rundt bredden av én liste – da ser det endeløst ut.
   Løkka går bare mens stripa er synlig. */

const BASE = 36;     // px per sekund uten rulling
const FOLLOW = 0.45; // hvor mye av rullefarten stripa tar med seg

export function initMarquee({ reduce = false } = {}) {
  if (reduce) return; // lista står stille og brytes over flere linjer

  document.querySelectorAll('[data-marquee]').forEach((el) => {
    const track = el.querySelector('.marquee__track');
    const group = track && track.querySelector('.marquee__group');
    if (!group) return;

    el.classList.add('is-ready');

    let groupWidth = 0;
    let x = 0;
    let dir = 1;
    let velocity = 0;
    let lastY = window.scrollY;
    let lastTime = 0;
    let visible = false;
    let running = false;

    const fill = () => {
      groupWidth = group.getBoundingClientRect().width;
      if (!groupWidth) return;
      const needed = Math.ceil(el.clientWidth / groupWidth) + 1;
      while (track.children.length < needed) {
        const copy = group.cloneNode(true);
        copy.setAttribute('aria-hidden', 'true'); // skjermlesere leser lista én gang
        track.append(copy);
      }
    };

    const frame = (time) => {
      if (!visible) {
        running = false;
        return;
      }
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      const y = window.scrollY;
      const scrollSpeed = dt > 0 ? (y - lastY) / dt : 0;
      lastY = y;
      if (Math.abs(scrollSpeed) > 20) dir = Math.sign(scrollSpeed);
      // Glatt ut rullefarten, så stripa ikke rykker.
      velocity += (scrollSpeed - velocity) * (1 - Math.exp(-6 * dt));

      x -= (BASE * dir + velocity * FOLLOW) * dt;
      if (groupWidth) x = ((x % groupWidth) - groupWidth) % groupWidth;
      track.style.transform = `translate3d(${x.toFixed(2)}px, 0, 0)`;

      requestAnimationFrame(frame);
    };

    fill();
    window.addEventListener('resize', fill);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fill);

    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !running) {
        running = true;
        lastTime = performance.now();
        lastY = window.scrollY;
        requestAnimationFrame(frame);
      }
    }).observe(el);
  });
}
