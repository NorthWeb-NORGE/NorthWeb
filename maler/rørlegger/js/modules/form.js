// Kontaktskjema – KUN FRONTEND-DEMO. Ingenting sendes noe sted.
// For en ekte kunde: bytt ut innholdet i send() med et kall til f.eks.
// Formspree, Netlify Forms eller kundens eget API.

// Én regel per felt (navnet matcher name-attributtet i HTML).
// Hver regel returnerer en feilmelding, eller en tom streng når alt er ok.
const rules = {
  navn: (v) => (v.length < 2 ? "Skriv inn navnet ditt." : ""),
  telefon: (v) => {
    const digits = v.replace(/[\s+()-]/g, "").replace(/^(0047|47)(?=\d{8}$)/, "");
    return /^\d{8}$/.test(digits) ? "" : "Skriv inn et telefonnummer med 8 sifre.";
  },
  epost: (v) =>
    v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)
      ? ""
      : "E-postadressen ser ikke riktig ut. Sjekk at den har @ og et domene.",
  oppdrag: (v) => (v ? "" : "Velg hva henvendelsen gjelder."),
  melding: (v) =>
    v.length < 10 ? "Beskriv jobben med noen få ord, så vi kan forberede oss." : "",
};

export function initForm() {
  const form = document.querySelector("#tilbudsskjema");
  const success = document.querySelector("#skjema-kvittering");
  if (!form || !success) return;

  const fields = Object.keys(rules)
    .map((name) => form.elements[name])
    .filter(Boolean);

  const validate = (field) => {
    const message = rules[field.name](field.value.trim());
    const error = document.getElementById(`${field.id}-feil`);

    field.setAttribute("aria-invalid", String(Boolean(message)));
    if (error) {
      error.textContent = message;
      error.hidden = !message;
    }
    return !message;
  };

  fields.forEach((field) => {
    // Valider når man forlater feltet, og fortløpende etter første feil –
    // da forsvinner feilmeldingen med en gang feltet er rettet.
    field.addEventListener("blur", () => validate(field));
    field.addEventListener("input", () => {
      if (field.getAttribute("aria-invalid") === "true") validate(field);
    });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const invalid = fields.filter((field) => !validate(field));
    if (invalid.length) {
      invalid[0].focus();
      return;
    }

    send(new FormData(form));

    const firstName = form.elements.navn.value.trim().split(/\s+/)[0];
    success.querySelector("[data-name]").textContent = firstName;
    form.hidden = true;
    success.hidden = false;
    success.focus(); // flytter fokus så skjermlesere leser kvitteringen
  });

  success.querySelector("[data-reset]").addEventListener("click", () => {
    form.reset();
    fields.forEach((field) => field.removeAttribute("aria-invalid"));
    form.querySelectorAll(".field__error").forEach((el) => (el.hidden = true));
    success.hidden = true;
    form.hidden = false;
    form.elements.navn.focus();
  });
}

// Demo: gjør ingenting. Her kobles ekte innsending på.
function send(data) {
  void data;
}
