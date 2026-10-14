# Rørlegger-mal (demo: Straumsnes Rør AS)

Porteføljeside for en fiktiv rørleggerbedrift. Ren HTML, CSS og JavaScript, uten rammeverk og uten byggesteg.

> Bedriften, telefonnumrene, prosjektene og alle godkjenninger er oppdiktet. Søk etter `PLASSHOLDER` i koden før siden brukes for en ekte kunde.

## Kjøre lokalt

Siden bruker ES-moduler (`<script type="module">`). Nettlesere blokkerer moduler når en fil åpnes med dobbeltklikk (`file://`), så du må starte en liten lokal server fra prosjektmappen:

```bash
python -m http.server 5180
```

eller, hvis du har Node:

```bash
npx serve
```

Åpne deretter `http://localhost:5180` (eller adressen `serve` skriver ut).

## Legge ut på GitHub Pages

1. Lag et nytt repo på GitHub og last opp hele mappen (`index.html` må ligge i roten).
2. Gå til **Settings → Pages**.
3. Under **Build and deployment** velger du **Deploy from a branch**, branch `main` og mappe `/ (root)`.
4. Etter et minutt ligger siden på `https://<brukernavn>.github.io/<repo>/`.

Alle lenker i prosjektet er relative (`css/index.css`, ikke `/css/index.css`), så siden fungerer også når den ligger i en undermappe slik den gjør på GitHub Pages.

## Mappestruktur

```
index.html                 Forsiden
pages/personvern.html      Personvernerklæring
css/
  index.css                Importerer alt under, i riktig rekkefølge
  base/                    variables, reset, typography, layout
  components/              button, header, alertbar, faq, form, placeholder, mobilebar,
                           reveal, pagepipe, intro, valve, marquee
  sections/                hero, services, process, projects, trust, contact, footer, legal
js/
  index.js                 Importerer og starter modulene
  modules/                 intro, smoothscroll, header, nav, reveal, hero, pagepipe,
                           process, valve, marquee, faq, form
assets/
  svg/                     favicon
  img/                     legg ekte bilder her
  fonts/                   legg fontfiler her hvis de skal ligge lokalt
```

## Bytte merkevare

Alt som styrer utseendet ligger i `css/base/variables.css`:

| Hva | Variabler |
| --- | --- |
| Farger | `--c-*` (selve paletten) og rollene `--brand`, `--accent`, `--urgent`, `--bg` |
| Fonter | `--font-display`, `--font-body`, `--font-mono` (husk også `<link>` til Google Fonts i HTML-filene) |
| Størrelser | `--fs-*` (typografi) og `--sp-*` (avstand), begge bygget på gyllent snitt |
| Form | `--r-1`, `--r-2`, `--line-w` |

Tekst og innhold byttes i `index.html`. Logoen er en innebygd SVG i headeren og footeren, og fargene i `assets/svg/favicon.svg` må endres for hånd.

## Røret som følger siden

De to stigeledningene i hero-tegningen fortsetter ut av tegningen og ned langs høyre marg, og tegnes opp mens man ruller (`js/modules/pagepipe.js`, utseende i `css/components/pagepipe.css`).

- En seksjon får muffe og påskrift ved å ha `data-pipe-label="Navn"` på `<section>`.
- Mørke seksjoner merkes med `data-pipe-dark`, så bytter røret til lys strek der.
- Røret slutter ved elementet som har `data-pipe-end`.
- Endrer du stigeledningene i hero-SVG-en, må `RISER_VV_X` og `RISER_KV_X` øverst i `pagepipe.js` oppdateres.

Myk rulling med musehjul og styreflate ligger i `js/modules/smoothscroll.js`. Tallet `SMOOTHING` øverst styrer hvor mykt det er. Begge deler slås av for brukere som har bedt om redusert bevegelse.

## Bevegelse

All bevegelse bruker samme kurve (`--ease-out` i `variables.css`) og animerer bare `opacity`, `translate`, `scale` og `clip-path`, som er billige for nettleseren. Alt slås av for brukere som har bedt om redusert bevegelse, og siden virker uten JavaScript.

| Hva | Hvor | Slik brukes det |
| --- | --- | --- |
| Åpningsanimasjon (logoen tegnes, flaten løftes) | `intro.js`, `intro.css` | Vises én gang per økt. Fjern `initIntro()`-effekten ved å slette `intro-pending`-linjen i `<head>` |
| Overskrift ord for ord | `reveal.js`, `reveal.css` | `data-split` på overskriften |
| Tone inn / én etter én / forheng | `reveal.js`, `reveal.css` | `data-reveal`, `data-reveal="stagger"`, `data-reveal="curtain"` |
| Hero ved innlasting | `reveal.css`, `hero.css` | `data-load` og `style="--d: 500ms"` for forsinkelse |
| Vann som beveger seg i hero-rørene | `hero.js`, `hero.css` | Automatisk for alle `.dr-pipe` |
| Prosessrøret fylles ved rulling | `process.js`, `process.css` | Automatisk |
| Stoppekran som kan stenges | `valve.js`, `valve.css` | Klikk |
| Løpende stedsnavn i footeren | `marquee.js`, `marquee.css` | Rediger `<span>`-ene i `.marquee__track` |
| Header som glir ut og inn | `header.js`, `header.css` | Automatisk |

## Bytte plassholdere med ekte bilder

Hver bildeplass er en `<figure class="placeholder">` med et fast størrelsesforhold. Bytt `<svg>` inni med:

```html
<img src="assets/img/filnavn.jpg" alt="Beskriv hva bildet viser"
     width="800" height="600" loading="lazy">
```

og slett `<span class="placeholder__label">`. Lagre bildene som WebP eller JPEG, maks rundt 1600 px brede.

## Koble på ekte skjema

Skjemaet er en ren demo. Valideringen ligger i `js/modules/form.js`, og funksjonen `send()` nederst i filen er stedet der ekte innsending kobles på (Formspree, Netlify Forms eller kundens eget API).

## Før en ekte kunde tar siden i bruk

- Bytt alle plassholdere, og fjern «Demoside»-linjen i footeren.
- Kontroller at godkjenninger og forsikring faktisk finnes. Ikke la noe stå som kunden ikke har.
- La kundens fagansvarlige lese gjennom FAQ-svarene.
- Vurder å legge fontene lokalt i `assets/fonts/` i stedet for Google Fonts. Da sendes ingen IP-adresser til Google, og personvernteksten kan forenkles.
- `@import` i CSS laster filene én etter én. Det er ryddig å jobbe med, men for best fart kan filene slås sammen til én før publisering.
