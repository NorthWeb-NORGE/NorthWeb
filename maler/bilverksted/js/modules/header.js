/* Header, mobilmeny og handlingslinja nederst på mobil.
   - Headeren glir ut når du ruller ned, inn når du ruller opp.
   - Menyknappen åpner/lukker mobilmenyen (Escape lukker).
   - Handlingslinja skjules når kontaktseksjonen er på skjermen – der er
     skjemaet og telefonnummeret allerede. */

export function initHeader() {
  const header = document.querySelector('[data-header]');
  if (!header) return;

  const btn = header.querySelector('[data-menu-btn]');
  const menu = header.querySelector('[data-menu]');
  let lastY = window.scrollY;
  let ticking = false;

  const setMenu = (open) => {
    if (!btn || !menu) return;
    menu.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', String(open));
  };

  const isOpen = () => !!menu && menu.classList.contains('is-open');

  const update = () => {
    ticking = false;
    const y = window.scrollY;
    const delta = y - lastY;
    if (Math.abs(delta) < 6) return; // ignorer småskjelvinger
    // Skjul bare når vi er forbi toppen og menyen er lukket.
    header.classList.toggle('is-hidden', delta > 0 && y > 240 && !isOpen());
    lastY = y;
  };

  window.addEventListener(
    'scroll',
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    },
    { passive: true }
  );

  if (btn && menu) {
    btn.addEventListener('click', () => setMenu(!isOpen()));
    menu.addEventListener('click', (event) => {
      if (event.target.closest('a')) setMenu(false);
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && isOpen()) {
        setMenu(false);
        btn.focus();
      }
    });
  }

  const bar = document.querySelector('[data-actionbar]');
  const contact = document.getElementById('kontakt');
  if (bar && contact && 'IntersectionObserver' in window) {
    new IntersectionObserver(
      ([entry]) => bar.classList.toggle('is-away', entry.isIntersecting),
      { threshold: 0.05 }
    ).observe(contact);
  }
}
