// FAQ bygger på <details>/<summary>, som fungerer med tastatur og
// skjermleser helt uten JavaScript. Denne modulen legger bare på en
// myk åpne/lukke-animasjon.

export function initFaq() {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return;

  document.querySelectorAll(".faq__item").forEach((item) => {
    const summary = item.querySelector("summary");
    const body = item.querySelector(".faq__body");
    if (!summary || !body || !body.animate) return;

    let running = null;

    summary.addEventListener("click", (event) => {
      event.preventDefault();
      if (running) running.cancel();

      if (item.open) {
        running = body.animate(
          { height: [`${body.offsetHeight}px`, "0px"], opacity: [1, 0] },
          { duration: 220, easing: "ease-in-out" }
        );
        running.onfinish = () => {
          item.open = false;
          running = null;
        };
      } else {
        item.open = true;
        running = body.animate(
          { height: ["0px", `${body.offsetHeight}px`], opacity: [0, 1] },
          { duration: 280, easing: "ease-out" }
        );
        running.onfinish = () => {
          running = null;
        };
      }
    });
  });
}
