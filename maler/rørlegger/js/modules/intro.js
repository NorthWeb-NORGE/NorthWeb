// Åpningsanimasjon: logoen tegnes opp på en dekkflate som så løftes bort.
// Vises bare første gang i en økt (sessionStorage), og aldri for brukere
// som har bedt om redusert bevegelse. Når den er ferdig settes .is-loaded
// på <html>, og det er startskuddet for animasjonene i hero.

const HOLD = 1150; // ms før dekkflaten løftes

export function initIntro() {
  const root = document.documentElement;
  const release = () => root.classList.add("is-loaded");

  // Inline-skriptet i <head> avgjør om introen skal vises
  if (!root.classList.contains("intro-pending")) {
    release();
    return;
  }

  const intro = document.createElement("div");
  intro.className = "intro";
  intro.setAttribute("aria-hidden", "true");
  intro.innerHTML = `
    <svg viewBox="0 0 40 40">
      <path class="intro__pipe" pathLength="1" d="M31 10H17a5 5 0 0 0 0 10h6a5 5 0 0 1 0 10H9"/>
      <path class="intro__bore" pathLength="1" d="M31 10H17a5 5 0 0 0 0 10h6a5 5 0 0 1 0 10H9"/>
      <path class="intro__muffe" d="M30 5.5h3.5v9H30zM6.5 25.5H10v9H6.5z"/>
    </svg>`;
  document.body.append(intro);
  root.classList.remove("intro-pending");

  setTimeout(() => {
    intro.classList.add("is-leaving");
    release();
  }, HOLD);
  setTimeout(() => intro.remove(), HOLD + 1200);

  try {
    sessionStorage.setItem("intro", "1");
  } catch {
    // Privat modus uten lagring: introen vises bare hver gang, det er greit
  }
}
