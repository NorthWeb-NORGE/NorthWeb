/* data-split: pakker hvert ord i to <span>-er, så CSS kan skyve ordet opp
   bak en «kant» (ytre span har overflow: hidden, indre flyttes).
   Mellomrommene blir stående som vanlig tekst, så linjebryting, kopiering
   og skjermlesere fungerer som før. <em> inni overskriften beholdes. */

export function splitText(scope = document) {
  scope.querySelectorAll('[data-split]:not(.is-split)').forEach((el) => {
    let i = 0;

    const walk = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === Node.ELEMENT_NODE) {
          walk(child);
          return;
        }
        if (child.nodeType !== Node.TEXT_NODE) return;

        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((bit) => {
          if (!bit) return;
          if (/^\s+$/.test(bit)) {
            frag.append(' ');
            return;
          }
          const outer = document.createElement('span');
          const inner = document.createElement('span');
          outer.className = 'w';
          inner.className = 'w__i';
          inner.style.setProperty('--i', i++); // rekkefølge → forsinkelse i CSS
          inner.textContent = bit;
          outer.append(inner);
          frag.append(outer);
        });
        child.replaceWith(frag);
      });
    };

    walk(el);
    el.classList.add('is-split');
  });
}
