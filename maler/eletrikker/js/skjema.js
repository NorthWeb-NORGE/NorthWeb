/* ==========================================================================
   SKJEMA.JS – validering av kontaktskjemaet
   Dette er en ren frontend-demo: ingenting sendes noe sted. Når siden skal
   brukes på ekte, byttes «visKvittering» ut med et kall til en skjematjeneste
   (f.eks. Formspree, Netlify Forms eller kundens egen e-postløsning).
   ========================================================================== */

(function () {
  "use strict";

  const skjema = document.querySelector("[data-skjema]");
  const kvittering = document.querySelector("[data-kvittering]");
  if (!skjema || !kvittering) return;

  // Én regel per felt. Hver regel får verdien og returnerer en feilmelding,
  // eller en tom tekst hvis alt er i orden.
  const regler = {
    navn: function (verdi) {
      return verdi.trim().length >= 2 ? "" : "Skriv inn navnet ditt.";
    },
    telefon: function (verdi) {
      // Fjern mellomrom og bindestrek, tillat +47 foran, krev åtte siffer
      const siffer = verdi.replace(/[\s-]/g, "").replace(/^(\+47|0047)/, "");
      return /^\d{8}$/.test(siffer) ? "" : "Skriv inn et telefonnummer med åtte siffer.";
    },
    epost: function (verdi) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(verdi.trim())
        ? ""
        : "Skriv inn en gyldig e-postadresse, for eksempel navn@eksempel.no.";
    },
    melding: function (verdi) {
      return verdi.trim().length >= 10
        ? ""
        : "Beskriv kort hva du trenger hjelp til – minst ti tegn.";
    },
  };

  function sjekkFelt(felt) {
    const regel = regler[felt.name];
    if (!regel) return true;

    const feil = regel(felt.value);
    const feilboks = document.getElementById(felt.id + "-feil");

    // aria-invalid gjør at skjermlesere sier «ugyldig», og CSS-en farger kanten
    felt.setAttribute("aria-invalid", feil ? "true" : "false");
    if (feilboks) feilboks.textContent = feil;
    return !feil;
  }

  // Sjekk et felt når brukeren forlater det …
  skjema.addEventListener("focusout", function (hendelse) {
    if (hendelse.target.name in regler && hendelse.target.value !== "") {
      sjekkFelt(hendelse.target);
    }
  });

  // … og fjern feilen med én gang den er rettet
  skjema.addEventListener("input", function (hendelse) {
    if (hendelse.target.getAttribute("aria-invalid") === "true") {
      sjekkFelt(hendelse.target);
    }
  });

  skjema.addEventListener("submit", function (hendelse) {
    hendelse.preventDefault();

    const felter = Array.from(skjema.elements).filter(function (felt) {
      return felt.name in regler;
    });
    const ugyldige = felter.filter(function (felt) {
      return !sjekkFelt(felt);
    });

    if (ugyldige.length) {
      ugyldige[0].focus(); // flytt fokus til første feil
      return;
    }

    visKvittering();
  });

  function visKvittering() {
    const fornavn = skjema.elements.navn.value.trim().split(/\s+/)[0];
    // textContent (ikke innerHTML) – da kan ingen lure inn kode via navnefeltet
    kvittering.querySelector("[data-kvittering-navn]").textContent = fornavn;

    skjema.hidden = true;
    kvittering.hidden = false;
    kvittering.focus(); // skjermlesere leser opp meldingen
  }

  kvittering.querySelector("[data-ny-foresporsel]").addEventListener("click", function () {
    skjema.reset();
    skjema.querySelectorAll("[aria-invalid]").forEach(function (felt) {
      felt.removeAttribute("aria-invalid");
    });
    kvittering.hidden = true;
    skjema.hidden = false;
    skjema.elements.navn.focus();
  });
})();
