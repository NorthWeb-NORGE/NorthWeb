// Animasjoner som starter når noe kommer inn i bildet. Denne modulen
// gjør bare forarbeidet og setter klassen .is-visible. Selve bevegelsene
// ligger i css/components/reveal.css.
//
//   data-reveal             toner inn og glir opp
//   data-reveal="stagger"   barna kommer én etter én
//   data-reveal="curtain"   bildet avdekkes som bak et forheng
//   data-split              overskriften kommer ord for ord
//   data-index              gir bare barna et nummer (--i) til bruk i CSS

export function initReveal() {
  document.querySelectorAll("[data-split]").forEach(splitWords);

  document.querySelectorAll('[data-reveal="stagger"], [data-index]').forEach((list) => {
    [...list.children].forEach((child, i) => child.style.setProperty("--i", i));
  });

  // Elementer med data-load styres av introen, ikke av rulling
  const items = document.querySelectorAll("[data-reveal], [data-split]:not([data-load])");
  if (!items.length) return;

  const show = (el) => el.classList.add("is-visible");

  if (!("IntersectionObserver" in window)) {
    items.forEach(show);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        show(entry.target);
        observer.unobserve(entry.target); // bare én gang
      });
    },
    { rootMargin: "0px 0px -10% 0px" }
  );

  items.forEach((el) => observer.observe(el));
}

// Pakker hvert ord i to <span>: den ytre klipper, den indre glir opp.
// Tagger inni overskriften (som <em>) beholdes, og <br> står urørt.
function splitWords(heading) {
  let index = 0;

  const wrap = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const fragment = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) {
            fragment.append(" ");
            return;
          }
          const outer = document.createElement("span");
          const inner = document.createElement("span");
          outer.className = "w";
          inner.className = "w__i";
          inner.style.setProperty("--i", index++);
          inner.textContent = part;
          outer.append(inner);
          fragment.append(outer);
        });
        child.replaceWith(fragment);
      } else if (child.nodeType === Node.ELEMENT_NODE && child.tagName !== "BR") {
        wrap(child);
      }
    });
  };

  wrap(heading);
}
