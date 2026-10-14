# Damsgård Bil & Bremse – demonettside for bilverksted

Portefølje-demo for en **oppdiktet** bedrift. Ren HTML, CSS og vanilla JavaScript – ingen rammeverk, ingen biblioteker, ingen byggesteg.

> Alt om bedriften er plassholdere. Søk etter `PLASSHOLDER` (navn, telefon, adresse, org.nr., priser, jobber) og `BEKREFT` (godkjenninger, forsikring, lovhenvisninger, faglige råd) i koden før siden brukes for en ekte kunde.

## Kjør lokalt

Siden bruker ES-moduler, og de virker ikke fra `file://`. Start en liten lokal server i prosjektmappa:

```bash
python -m http.server 8080
```

eller

```bash
npx serve
```

Åpne deretter `http://localhost:8080`.

## Publisering (GitHub Pages)

1. Legg mappa i et GitHub-repo.
2. **Settings → Pages → Deploy from a branch**, velg `main` og `/ (root)`.
3. Ferdig. Alle lenker er relative, så siden virker også under `brukernavn.github.io/repo-navn/`.

## Mappestruktur

```
index.html
pages/personvern.html
css/
  index.css            kun @import
  base/                variables, reset, typography, layout
  components/          motion, logo, button, header, thread, drawing, form …
  sections/            hero, services, process, projects, trust, faq, contact, footer
js/
  index.js             starter modulene
  modules/             én fil per oppgave
assets/                favicon (og ekte bilder når de kommer)
```

## Bytte merkevare

Alt ligger i `css/base/variables.css`: farger, fonter, typografiskala, avstander, radius, strek og animasjonskurve. Bytter du fonter, må også `<link>` til Google Fonts i de to HTML-filene oppdateres. Fargene i `assets/favicon.svg` er skrevet inn for hånd.

Det gylne snitt (1,618) er brukt i typografiskalaen, avstandsskalaen, kolonneforholdet `1.618fr : 1fr`, linjehøyden og varighetene – og tråden tegnes ned til 61,8 % av skjermhøyden.

## Animasjoner – hvor de ligger og hvordan de brukes

Felles regler: én kurve (`--ease`), bare `opacity`, `transform`, `clip-path` og `stroke-dashoffset` animeres, alt slås av ved `prefers-reduced-motion`, og ingenting skjules uten at `<html>` har klassen `.js`.

| Animasjon | CSS | JS | Slik bruker du den |
| --- | --- | --- | --- |
| Åpningsanimasjon (logo tegnes, flate løftes) | `components/intro.css` | `modules/intro.js` + skriptet i `<head>` | Automatisk første besøk i økten (`sessionStorage`-nøkkel `dbb-intro`) |
| Hero-sekvens | `components/motion.css` | `playHero()` i `index.js` | Sett `data-hero` på elementet og rekkefølgen med `style="--delay:.5s"` |
| Overskrift ord for ord | `components/motion.css` (`.w`, `.w__i`) | `modules/split.js`, `modules/reveal.js` | `data-split` på overskriften |
| Ton inn | `components/motion.css` | `modules/reveal.js` | `data-reveal` |
| Liste én etter én | `components/motion.css` | `modules/reveal.js` | `data-reveal="stagger"` på forelderen |
| Bilde bak forheng | `components/motion.css` | `modules/reveal.js` | `data-curtain` på en beholder rundt bildet |
| Tegning som tegner seg selv | `components/motion.css` (`.draw`, `.fade`) | `modules/reveal.js` | `class="dwg"` på SVG-en, `class="draw" pathLength="1"` på hver strek, rekkefølge med `style="--d:.4s"` |
| Løkker i hero-tegningen | `components/motion.css` (`.loop-turn`, `.loop-pulse`) | – | Klassene settes på streken i SVG-en |
| Den røde tråden (bremserøret) | `components/thread.css` | `modules/thread.js` | `data-thread-root` på `<main>`, `data-thread-anchor` i hero-SVG-en, `data-thread="Påskrift"` på hver seksjon, `data-thread-end` på siste seksjon og `data-thread-stop` der røret skal ende. Mørke seksjoner: `data-tone="dark"` eller `"iron"` |
| Prosess fylles steg for steg | `sections/process.css` | `modules/process.js` | `data-process` på lista |
| Løpende tekststripe | `components/marquee.css` | `modules/marquee.js` | `data-marquee` rundt `.marquee__track > .marquee__group` |
| Interaktive varsellamper | `components/lamps.css` | `modules/lamps.js` | `data-lamp="id"` på knappen, `data-lamp-info="id"` på forklaringen |
| Knapp med fargesveip | `components/button.css` | – | `class="btn"` + `data-label` med samme tekst som knappen |
| Menylenke med strek som vokser | `components/header.css` (`.nav-link`) | – | `class="nav-link"` |
| Rad med aksentstrek | `sections/services.css` (`.ledger__row`) | – | Hover på raden |
| Pluss/minus og svar i FAQ | `sections/faq.css` | – | Vanlig `<details>` |
| Header glir ut/inn | `components/header.css` | `modules/header.js` | `data-header` |
| Handlingslinje på mobil | `components/actionbar.css` | `modules/header.js` | `data-actionbar` |
| Myk rulling + menylenker | – | `modules/smooth-scroll.js` | Automatisk. Mykheten justeres med `STIVHET` øverst i fila |
| Skjema: feil og kvittering | `components/form.css` | `modules/form.js` | `data-form`. Ekte innsending kobles til der det står «DEMO» |

## Bytte ut bildeplasser

Hver bildeplass er en `<div class="ph" style="--ratio: 16 / 10">`. Bytt den med et `<img>` som har samme størrelsesforhold (`aspect-ratio` eller `width`/`height`), og behold beholderen med `data-curtain` rundt.

## Tilgjengelighet

Semantisk HTML, hopp-til-innhold-lenke, synlig fokus, skjema med `aria-invalid`/`aria-describedby` og feiloppsummering, `<details>` for spørsmål og svar, og `aria-pressed` på lampeknappene. Kontrastene står i kommentaren øverst i `variables.css`.
