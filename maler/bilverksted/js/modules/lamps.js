/* Interaktiv tegning: varsellampene.
   Forklaringene står i HTML-en (så de finnes uten JavaScript). Her gjør vi
   bare lampene om til av/på-knapper og viser forklaringen som hører til.
   aria-pressed forteller skjermlesere hvilken lampe som er valgt, og
   aria-live på utfeltet gjør at den nye teksten blir lest opp. */

export function initLamps() {
  const box = document.querySelector('[data-lamps]');
  if (!box) return;

  const buttons = [...box.querySelectorAll('[data-lamp]')];
  const infos = [...box.querySelectorAll('[data-lamp-info]')];
  const empty = box.querySelector('[data-lamps-empty]');
  let current = null;

  const select = (id) => {
    current = id;
    buttons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.lamp === id)));
    infos.forEach((info) => {
      const on = info.dataset.lampInfo === id;
      info.hidden = !on;
      info.classList.toggle('is-swap', on);
    });
    if (empty) empty.hidden = Boolean(id);
  };

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      // Trykk på samme lampe en gang til = slå den av.
      select(current === button.dataset.lamp ? null : button.dataset.lamp);
    });
  });

  select(null);
}
