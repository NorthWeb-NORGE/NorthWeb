/* ==========================================================================
   INDEX.JS – meny, myk rulling, skapet (samleskinne + vern), inntoning ved
   rulling og markering av aktiv menylenke.
   Ingen biblioteker. Alt er pakket i én funksjon så ingenting lekker ut
   som globale variabler.
   ========================================================================== */

(function () {
  "use strict";

  // Forteller CSS-en at JavaScript kjører. Uten denne klassen er menyen
  // alltid åpen, alt innhold synlig og alle vern «på» – siden virker uten JS.
  document.documentElement.classList.add("js");

  // Brukere som har bedt systemet om mindre bevegelse, får ingen effekter
  const redusertBevegelse = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* --- Mobilmeny --------------------------------------------------------- */

  const menyknapp = document.querySelector("[data-menyknapp]");
  const meny = document.querySelector("[data-meny]");

  function settMeny(apen) {
    meny.classList.toggle("er-apen", apen);
    // aria-expanded er det skjermlesere bruker for å si «åpen»/«lukket»
    menyknapp.setAttribute("aria-expanded", String(apen));
  }

  if (menyknapp && meny) {
    menyknapp.addEventListener("click", function () {
      settMeny(menyknapp.getAttribute("aria-expanded") !== "true");
    });

    // Lukk når man velger en lenke
    meny.addEventListener("click", function (hendelse) {
      if (hendelse.target.closest("a")) settMeny(false);
    });

    // Escape lukker menyen og setter fokus tilbake på knappen
    document.addEventListener("keydown", function (hendelse) {
      if (hendelse.key === "Escape" && menyknapp.getAttribute("aria-expanded") === "true") {
        settMeny(false);
        menyknapp.focus();
      }
    });
  }

  /* --- Myk rulling med musehjul ------------------------------------------
     Et vanlig musehjul flytter siden i hakk. Her fanger vi hakkene og glir
     mot målet i stedet, slik at siden «seiler» på plass. Det samme gjelder
     styreflate. Berøringsskjermer ruller allerede mykt og får være i fred.
     Sett MYK_RULLING til false for å skru av hele effekten.                */

  const MYK_RULLING = true;
  const TREGHET_MS = 140; // høyere tall = lengre og mykere glid

  if (MYK_RULLING && !redusertBevegelse && window.matchMedia("(pointer: fine)").matches) {
    let mal = 0; // dit vi skal
    let posisjon = 0; // der vi er
    let ruller = false;
    let forrigeTid = 0;

    function steg(tid) {
      const dt = Math.min(tid - forrigeTid, 50);
      forrigeTid = tid;
      // Flytt en andel av resten hver gang. Andelen regnes ut fra tiden som
      // har gått, så farten blir lik på 60 Hz- og 144 Hz-skjermer.
      posisjon += (mal - posisjon) * (1 - Math.exp(-dt / TREGHET_MS));

      if (Math.abs(mal - posisjon) < 0.5) {
        posisjon = mal;
        ruller = false;
      }
      window.scrollTo({ top: posisjon, behavior: "instant" });
      if (ruller) requestAnimationFrame(steg);
    }

    window.addEventListener(
      "wheel",
      function (hendelse) {
        // Ctrl + hjul er zoom, og tekstfelt/nedtrekk skal rulle selv
        if (hendelse.ctrlKey || hendelse.target.closest("textarea, select")) return;

        // Sveip sidelengs på styreflate lar vi nettleseren ta
        if (Math.abs(hendelse.deltaX) > Math.abs(hendelse.deltaY)) return;

        // Både musehjul (store hakk) og styreflate (mange små steg) glattes.
        // deltaMode 1 betyr at tallet er i linjer, 2 at det er i hele sider.
        hendelse.preventDefault();
        let hakk = hendelse.deltaY;
        if (hendelse.deltaMode === 1) hakk *= 40;
        if (hendelse.deltaMode === 2) hakk *= window.innerHeight;
        const maks = document.documentElement.scrollHeight - window.innerHeight;

        if (!ruller) {
          mal = posisjon = window.scrollY;
          forrigeTid = performance.now();
          ruller = true;
          requestAnimationFrame(steg);
        }
        mal = Math.max(0, Math.min(maks, mal + hakk));
      },
      { passive: false } // må være false for at preventDefault skal virke
    );

    // Tastatur, rullefelt og ankerlenker overtar umiddelbart
    ["keydown", "mousedown", "touchstart"].forEach(function (type) {
      window.addEventListener(type, function () { ruller = false; }, { passive: true });
    });
  }

  /* --- Skapet: samleskinna fylles med strøm ------------------------------
     Vi regner ut hvor langt ned i <main> midten av vinduet er (0–1) og gir
     tallet til CSS som variabelen --fremdrift. CSS-en skalerer skinna.    */

  const skapet = document.querySelector(".skapet");
  const strom = document.querySelector(".skinne__strom");

  if (skapet && strom) {
    let venter = false;

    function oppdaterSkinne() {
      venter = false;
      const boks = skapet.getBoundingClientRect();
      const punkt = window.innerHeight * 0.55 - boks.top;
      const fremdrift = Math.max(0, Math.min(1, punkt / boks.height));
      strom.style.setProperty("--fremdrift", fremdrift.toFixed(4));
    }

    // requestAnimationFrame samler mange rullehendelser til én oppdatering
    // per bilde – ellers jobber nettleseren unødig mye.
    function planlegg() {
      if (venter) return;
      venter = true;
      requestAnimationFrame(oppdaterSkinne);
    }

    window.addEventListener("scroll", planlegg, { passive: true });
    window.addEventListener("resize", planlegg);
    oppdaterSkinne();
  }

  /* --- Skapet: vernene slås på -------------------------------------------
     Når en ny rad (.hylle) når omtrent midten av vinduet – altså der
     strømmen i samleskinna er kommet – får den klassen er-pa.             */

  const hyller = document.querySelectorAll("[data-hylle]");

  if ("IntersectionObserver" in window) {
    const hylleObservator = new IntersectionObserver(
      function (oppforinger) {
        oppforinger.forEach(function (oppforing) {
          if (!oppforing.isIntersecting) return;
          oppforing.target.classList.add("er-pa");
          hylleObservator.unobserve(oppforing.target);
        });
      },
      { rootMargin: "0px 0px -45% 0px" }
    );
    hyller.forEach(function (hylle) {
      hylleObservator.observe(hylle);
    });
  } else {
    hyller.forEach(function (hylle) {
      hylle.classList.add("er-pa");
    });
  }

  /* --- Inntoning ved rulling ---------------------------------------------
     IntersectionObserver sier fra når et element kommer inn i vinduet.
     Det er mye lettere for nettleseren enn å lytte på hver eneste rulling.
     Kommer flere elementer inn samtidig, får de litt økende forsinkelse.  */

  const skalVises = document.querySelectorAll("[data-vis]");

  if ("IntersectionObserver" in window) {
    const visObservator = new IntersectionObserver(
      function (oppforinger) {
        let nummer = 0;
        oppforinger.forEach(function (oppforing) {
          if (!oppforing.isIntersecting) return;
          oppforing.target.style.setProperty("--forsinkelse", nummer * 90 + "ms");
          oppforing.target.classList.add("er-synlig");
          visObservator.unobserve(oppforing.target); // bare én gang
          nummer += 1;
        });
      },
      { rootMargin: "0px 0px -10% 0px" }
    );
    skalVises.forEach(function (element) {
      visObservator.observe(element);
    });
  } else {
    skalVises.forEach(function (element) {
      element.classList.add("er-synlig");
    });
  }

  /* --- Aktiv menylenke ---------------------------------------------------
     Markerer lenken til seksjonen som ligger midt i vinduet akkurat nå.   */

  const menylenker = document.querySelectorAll('.meny__lenke[href^="#"]');

  if ("IntersectionObserver" in window && menylenker.length) {
    const seksjonObservator = new IntersectionObserver(
      function (oppforinger) {
        oppforinger.forEach(function (oppforing) {
          if (!oppforing.isIntersecting) return;
          menylenker.forEach(function (lenke) {
            if (lenke.getAttribute("href") === "#" + oppforing.target.id) {
              lenke.setAttribute("aria-current", "true");
            } else {
              lenke.removeAttribute("aria-current");
            }
          });
        });
      },
      // Tynn stripe midt i vinduet: seksjonen som krysser den, er «aktiv»
      { rootMargin: "-45% 0px -50% 0px" }
    );
    document.querySelectorAll("main section[id]").forEach(function (seksjon) {
      seksjonObservator.observe(seksjon);
    });
  }

  /* --- Årstall i bunnen -------------------------------------------------- */

  const ar = document.querySelector("[data-ar]");
  if (ar) ar.textContent = String(new Date().getFullYear());
})();
