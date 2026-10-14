// Inngangsfil: importerer modulene og starter dem.
// Hver modul gjør én ting og tåler at elementene den leter etter mangler,
// slik at samme fil kan brukes på både forsiden og undersidene.

import { initIntro } from "./modules/intro.js";
import { initSmoothScroll } from "./modules/smoothscroll.js";
import { initHeader } from "./modules/header.js";
import { initNav } from "./modules/nav.js";
import { initReveal } from "./modules/reveal.js";
import { initHero } from "./modules/hero.js";
import { initPagePipe } from "./modules/pagepipe.js";
import { initProcess } from "./modules/process.js";
import { initValve } from "./modules/valve.js";
import { initMarquee } from "./modules/marquee.js";
import { initFaq } from "./modules/faq.js";
import { initForm } from "./modules/form.js";

// Rekkefølgen betyr litt: reveal deler opp overskriftene i ord før
// introen slipper siden fri, og røret måler siden etter at alt er på plass.
initReveal();
initIntro();
initSmoothScroll();
initHeader();
initNav();
initHero();
initPagePipe();
initProcess();
initValve();
initMarquee();
initFaq();
initForm();

// Årstall i footeren holder seg oppdatert av seg selv
const year = document.querySelector("[data-year]");
if (year) year.textContent = new Date().getFullYear();
