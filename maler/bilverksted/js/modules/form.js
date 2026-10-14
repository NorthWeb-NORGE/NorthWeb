/* Kontaktskjema – FRONTEND-DEMO. Ingenting sendes.
   Vi slår av nettleserens egne bobler (novalidate) og validerer selv, så
   feilmeldingene blir på norsk, står under riktig felt og leses opp:
     - aria-invalid på feltet
     - meldingen ligger i <p id="e-…"> som feltet peker på med
       aria-describedby
     - en oppsummering øverst med role="alert", og fokus på første feil

   Koble til ekte innsending: bytt ut blokka merket «DEMO» i onSubmit med
   f.eks.  await fetch('https://…', { method: 'POST', body: new FormData(form) }) */

const RULES = {
  navn: (v) => (v.length >= 2 ? '' : 'Skriv navnet ditt.'),
  telefon: (v) => {
    const digits = v.replace(/^\+47/, '').replace(/\D/g, '');
    return digits.length === 8 ? '' : 'Skriv et telefonnummer med åtte siffer.';
  },
  epost: (v) => (!v || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? '' : 'E-postadressen ser ikke riktig ut.'),
  regnr: (v) => (!v || /^[A-ZÆØÅ]{2}\s?\d{4,5}$/i.test(v) ? '' : 'Skriv to bokstaver og fire eller fem siffer, for eksempel AB 12345.'),
  tjeneste: (v) => (v ? '' : 'Velg hva henvendelsen gjelder.'),
  melding: (v) => (v.length >= 10 ? '' : 'Beskriv kort hva du har merket på bilen – minst et par ord.'),
};

export function initForm() {
  const form = document.querySelector('[data-form]');
  if (!form) return;

  const summary = form.querySelector('[data-form-summary]');
  const receipt = document.querySelector('[data-form-receipt]');
  const again = document.querySelector('[data-form-again]');
  form.setAttribute('novalidate', '');

  const errorEl = (field) => document.getElementById(field.getAttribute('aria-describedby').split(' ')[0]);

  const check = (field) => {
    const rule = RULES[field.name];
    if (!rule) return '';
    const message = rule(field.value.trim());
    field.setAttribute('aria-invalid', message ? 'true' : 'false');
    errorEl(field).textContent = message;
    return message;
  };

  const fields = [...form.elements].filter((el) => RULES[el.name]);

  // Rett opp fortløpende: sjekk når feltet forlates, og mens brukeren
  // skriver hvis feltet allerede er merket som feil.
  fields.forEach((field) => {
    field.addEventListener('blur', () => {
      if (field.value.trim() || field.getAttribute('aria-invalid') === 'true') check(field);
    });
    field.addEventListener('input', () => {
      if (field.getAttribute('aria-invalid') === 'true') check(field);
    });
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const failed = fields.filter((field) => check(field));
    if (failed.length) {
      summary.hidden = false;
      summary.textContent = failed.length === 1
        ? 'Ett felt må rettes før vi kan sende.'
        : `${failed.length} felt må rettes før vi kan sende.`;
      failed[0].focus();
      return;
    }
    summary.hidden = true;

    // --- DEMO: her ville den ekte innsendingen ligget ----------------------
    const data = Object.fromEntries(new FormData(form));
    const now = new Date();
    const ref = `DB-${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(Math.floor(Math.random() * 900) + 100)}`;
    const fill = (key, value) => {
      const el = receipt.querySelector(`[data-r="${key}"]`);
      if (el) el.textContent = value; // textContent: brukerens tekst blir aldri tolket som HTML
    };
    fill('navn', data.navn.trim().split(/\s+/)[0]);
    fill('telefon', data.telefon.trim());
    fill('ref', ref);
    fill('tjeneste', data.tjeneste);
    fill('regnr', data.regnr.trim() ? data.regnr.trim().toUpperCase() : 'Ikke oppgitt');
    // -----------------------------------------------------------------------

    form.hidden = true;
    receipt.hidden = false;
    receipt.focus();
  });

  if (again) {
    again.addEventListener('click', () => {
      form.reset();
      fields.forEach((field) => {
        field.removeAttribute('aria-invalid');
        errorEl(field).textContent = '';
      });
      receipt.hidden = true;
      form.hidden = false;
      fields[0].focus();
    });
  }
}
