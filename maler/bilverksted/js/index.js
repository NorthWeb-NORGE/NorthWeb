/* ==========================================================================
   INNGANG – starter modulene i riktig rekkefølge.
   Hver modul er pakket i «trygg()», så en feil ett sted ikke stopper resten.
   ========================================================================== */

import { splitText } from './modules/split.js';
import { initReveal, showAll } from './modules/reveal.js';
import { playIntro } from './modules/intro.js';
import { initSmoothScroll } from './modules/smooth-scroll.js';
import { initHeader } from './modules/header.js';
import { initThread } from './modules/thread.js';
import { initProcess } from './modules/process.js';
import { initMarquee } from './modules/marquee.js';
import { initLamps } from './modules/lamps.js';
import { initForm } from './modules/form.js';

const root = document.documentElement;
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const FEIL = Symbol('feil');

function trygg(navn, fn) {
  try {
    return fn();
  } catch (feil) {
    console.error(`[${navn}]`, feil);
    return FEIL;
  }
}

/* Hero-sekvensen: alt med data-hero får .is-in samtidig. Rekkefølgen
   (overskrift → tekst → knapper → løfter → tegning) ligger i --delay
   på hvert element i HTML-en, så den kan justeres uten å røre JS. */
function playHero() {
  document.querySelectorAll('[data-hero]').forEach((el) => el.classList.add('is-in'));
}

async function start() {
  // Modulene lever: stopp tidsuret fra <head> som ellers fjerner .js.
  clearTimeout(window.__failsafe);

  // Går selve avdekkingen galt, viser vi heller alt enn å skjule noe.
  const ok = trygg('split', () => splitText()) !== FEIL
    && trygg('reveal', () => initReveal({ reduce })) !== FEIL;
  if (!ok) {
    root.classList.remove('js');
    showAll();
  }

  trygg('smooth-scroll', () => initSmoothScroll({ reduce }));
  trygg('header', () => initHeader());
  trygg('process', () => initProcess({ reduce }));
  trygg('marquee', () => initMarquee({ reduce }));
  trygg('lamps', () => initLamps());
  trygg('form', () => initForm());

  const thread = trygg('thread', () => initThread({ reduce }));

  // Åpningsanimasjonen (hvis den skal vises) løser seg i det flaten
  // begynner å løftes – da starter hero under den.
  await trygg('intro', () => playIntro({ reduce }));
  playHero();

  // Tråden venter til røret i hero-tegningen er tegnet ferdig, så det
  // ser ut som samme strek fortsetter ut av tegningen.
  if (thread && thread !== FEIL) setTimeout(thread.start, reduce ? 0 : 2600);
}

start();

// Hvis noe helt uventet skjer, skal innholdet uansett være synlig.
window.addEventListener('error', () => root.classList.remove('has-intro'));
