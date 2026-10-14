// Headeren glir ut av veien når man ruller nedover, og kommer tilbake
// straks man ruller litt opp. Gir innholdet mer plass uten at menyen
// noen gang er langt unna.

export function initHeader() {
  const header = document.querySelector(".site-header");
  if (!header) return;

  let last = window.scrollY;

  window.addEventListener(
    "scroll",
    () => {
      const y = window.scrollY;
      if (Math.abs(y - last) < 6) return; // ignorer småskjelv

      const menuOpen = header.querySelector(".nav.is-open");
      header.classList.toggle("is-hidden", y > last && y > 320 && !menuOpen);
      last = y;
    },
    { passive: true }
  );
}
