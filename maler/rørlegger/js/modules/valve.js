// Stoppekranen ved «Vanlige spørsmål» kan stenges og åpnes med et klikk.
// Knappen bytter bare klassen .is-closed; hendelen og vannstrømmen
// animeres i css/components/valve.css.

export function initValve() {
  document.querySelectorAll(".valve").forEach((valve) => {
    const button = valve.querySelector(".valve__button");
    const status = valve.querySelector(".valve__status");
    if (!button || !status) return;

    button.addEventListener("click", () => {
      const closed = valve.classList.toggle("is-closed");
      button.setAttribute("aria-pressed", String(closed));
      status.textContent = closed
        ? "Stengt. Vannet er av i hele boligen."
        : "Åpen. Trykk på kranen for å stenge.";
    });
  });
}
