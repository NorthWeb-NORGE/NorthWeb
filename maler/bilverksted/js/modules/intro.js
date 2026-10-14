/* Åpningsanimasjon: logoen tegnes (≈1 s), så løftes flaten bort.
   Vises bare første besøk i økten: skriptet i <head> setter .has-intro
   hvis sessionStorage mangler nøkkelen, og vi setter nøkkelen her.
   Returnerer et løfte som løses i det flaten begynner å gå – da kan
   hero-sekvensen starte under den. */

const KEY = 'dbb-intro';
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function playIntro({ reduce = false } = {}) {
  const root = document.documentElement;
  const el = document.querySelector('[data-intro]');

  if (!el || reduce || !root.classList.contains('has-intro')) {
    root.classList.remove('has-intro');
    return;
  }

  try {
    sessionStorage.setItem(KEY, '1');
  } catch (e) {
    /* privat modus uten lagring: introen vises bare hver gang */
  }

  // To bilder venting, så nettleseren rekker å tegne starttilstanden
  // før overgangen settes i gang.
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  el.classList.add('is-drawing');
  await wait(1500);

  el.classList.add('is-leaving');
  setTimeout(() => {
    root.classList.remove('has-intro');
    el.remove();
  }, 1100);

  await wait(250);
}
