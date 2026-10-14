/* Én IntersectionObserver for alle rulleanimasjoner. Den gjør bare én ting:
   setter .is-in første gang elementet kommer inn i bildet, og slutter så å
   følge med på det. Selve animasjonen ligger i css/components/motion.css.

   Bruk i HTML:
     data-split               overskrift ord for ord
     data-reveal              ton inn og løft
     data-reveal="stagger"    barna én etter én
     data-curtain             bilde avdekkes ovenfra
     class="dwg"              SVG-tegning som tegner seg selv
   Elementer med data-hero hoppes over – de styres av hero-sekvensen. */

const SELECTOR = '[data-split], [data-reveal], [data-curtain], .dwg';

export function showAll() {
  document.querySelectorAll(SELECTOR).forEach((el) => el.classList.add('is-in'));
}

export function initReveal({ reduce = false } = {}) {
  const items = [...document.querySelectorAll(SELECTOR)].filter((el) => !el.hasAttribute('data-hero'));

  // Barna i en stagger-liste får nummeret sitt som --i.
  document.querySelectorAll('[data-reveal="stagger"]').forEach((list) => {
    [...list.children].forEach((child, i) => child.style.setProperty('--i', i));
  });

  if (reduce || !('IntersectionObserver' in window)) {
    showAll();
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target); // hver animasjon spiller én gang
      });
    },
    // Utløses når elementet er kommet et stykke opp fra bunnen av skjermen.
    { rootMargin: '0px 0px -12% 0px', threshold: 0.08 }
  );

  items.forEach((el) => io.observe(el));
}
