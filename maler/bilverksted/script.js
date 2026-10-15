(() => {
  // js/modules/split.js
  function splitText(scope = document) {
    scope.querySelectorAll("[data-split]:not(.is-split)").forEach((el) => {
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
              frag.append(" ");
              return;
            }
            const outer = document.createElement("span");
            const inner = document.createElement("span");
            outer.className = "w";
            inner.className = "w__i";
            inner.style.setProperty("--i", i++);
            inner.textContent = bit;
            outer.append(inner);
            frag.append(outer);
          });
          child.replaceWith(frag);
        });
      };
      walk(el);
      el.classList.add("is-split");
    });
  }

  // js/modules/reveal.js
  var SELECTOR = "[data-split], [data-reveal], [data-curtain], .dwg";
  function showAll() {
    document.querySelectorAll(SELECTOR).forEach((el) => el.classList.add("is-in"));
  }
  function initReveal({ reduce: reduce2 = false } = {}) {
    const items = [...document.querySelectorAll(SELECTOR)].filter((el) => !el.hasAttribute("data-hero"));
    document.querySelectorAll('[data-reveal="stagger"]').forEach((list) => {
      [...list.children].forEach((child, i) => child.style.setProperty("--i", i));
    });
    if (reduce2 || !("IntersectionObserver" in window)) {
      showAll();
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        });
      },
      // Utløses når elementet er kommet et stykke opp fra bunnen av skjermen.
      { rootMargin: "0px 0px -12% 0px", threshold: 0.08 }
    );
    items.forEach((el) => io.observe(el));
  }

  // js/modules/intro.js
  var KEY = "dbb-intro";
  var wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  async function playIntro({ reduce: reduce2 = false } = {}) {
    const root2 = document.documentElement;
    const el = document.querySelector("[data-intro]");
    if (!el || reduce2 || !root2.classList.contains("has-intro")) {
      root2.classList.remove("has-intro");
      return;
    }
    try {
      sessionStorage.setItem(KEY, "1");
    } catch (e) {
    }
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    el.classList.add("is-drawing");
    await wait(1500);
    el.classList.add("is-leaving");
    setTimeout(() => {
      root2.classList.remove("has-intro");
      el.remove();
    }, 1100);
    await wait(250);
  }

  // js/modules/smooth-scroll.js
  var STIVHET = 5.5;
  var target = 0;
  var current = 0;
  var lastSet = 0;
  var lastTime = 0;
  var running = false;
  var enabled = false;
  var maxScroll = () => document.documentElement.scrollHeight - window.innerHeight;
  var clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  function frame(time) {
    if (!running) return;
    if (Math.abs(window.scrollY - lastSet) > 2) {
      running = false;
      return;
    }
    const dt = Math.min((time - lastTime) / 1e3, 0.05);
    lastTime = time;
    current += (target - current) * (1 - Math.exp(-STIVHET * dt));
    if (Math.abs(target - current) < 0.5) current = target;
    window.scrollTo(0, current);
    lastSet = window.scrollY;
    if (current === target) {
      running = false;
      return;
    }
    requestAnimationFrame(frame);
  }
  function run() {
    if (running) return;
    running = true;
    lastTime = performance.now();
    lastSet = window.scrollY;
    requestAnimationFrame(frame);
  }
  function scrollsInside(el, deltaY) {
    for (let node = el; node && node !== document.body; node = node.parentElement) {
      if (node.tagName === "SELECT") return true;
      if (node.scrollHeight <= node.clientHeight + 1) continue;
      const overflow = getComputedStyle(node).overflowY;
      const isScroller = overflow === "auto" || overflow === "scroll" || node.tagName === "TEXTAREA";
      if (!isScroller) continue;
      const atTop = node.scrollTop <= 0;
      const atBottom = node.scrollTop + node.clientHeight >= node.scrollHeight - 1;
      if (deltaY < 0 && !atTop || deltaY > 0 && !atBottom) return true;
    }
    return false;
  }
  function onWheel(event) {
    if (event.ctrlKey || event.metaKey || event.defaultPrevented) return;
    if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
    if (scrollsInside(event.target, event.deltaY)) return;
    event.preventDefault();
    let delta = event.deltaY;
    if (event.deltaMode === 1) delta *= 40;
    else if (event.deltaMode === 2) delta *= window.innerHeight;
    if (!running) current = target = window.scrollY;
    target = clamp(target + delta, 0, maxScroll());
    run();
  }
  function scrollToY(y) {
    const goal = clamp(y, 0, maxScroll());
    if (!enabled) {
      window.scrollTo(0, goal);
      return;
    }
    if (!running) current = window.scrollY;
    target = goal;
    run();
  }
  function onAnchorClick(event) {
    const link = event.target.closest('a[href^="#"]');
    if (!link || event.metaKey || event.ctrlKey || event.shiftKey) return;
    const id = link.getAttribute("href").slice(1);
    const dest = id ? document.getElementById(id) : null;
    if (!dest) return;
    event.preventDefault();
    const top = dest.getBoundingClientRect().top + window.scrollY;
    const header = document.querySelector("[data-header]");
    const offset = top < window.scrollY && header ? header.offsetHeight : 0;
    scrollToY(id === "topp" ? 0 : top - offset);
    history.pushState(null, "", `#${id}`);
    if (!dest.hasAttribute("tabindex")) dest.setAttribute("tabindex", "-1");
    dest.focus({ preventScroll: true });
  }
  function initSmoothScroll({ reduce: reduce2 = false } = {}) {
    document.addEventListener("click", onAnchorClick);
    if (reduce2) return;
    enabled = true;
    window.addEventListener("wheel", onWheel, { passive: false });
  }

  // js/modules/header.js
  function initHeader() {
    const header = document.querySelector("[data-header]");
    if (!header) return;
    const btn = header.querySelector("[data-menu-btn]");
    const menu = header.querySelector("[data-menu]");
    let lastY = window.scrollY;
    let ticking = false;
    const setMenu = (open) => {
      if (!btn || !menu) return;
      menu.classList.toggle("is-open", open);
      btn.setAttribute("aria-expanded", String(open));
    };
    const isOpen = () => !!menu && menu.classList.contains("is-open");
    const update = () => {
      ticking = false;
      const y = window.scrollY;
      const delta = y - lastY;
      if (Math.abs(delta) < 6) return;
      header.classList.toggle("is-hidden", delta > 0 && y > 240 && !isOpen());
      lastY = y;
    };
    window.addEventListener(
      "scroll",
      () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(update);
      },
      { passive: true }
    );
    if (btn && menu) {
      btn.addEventListener("click", () => setMenu(!isOpen()));
      menu.addEventListener("click", (event) => {
        if (event.target.closest("a")) setMenu(false);
      });
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && isOpen()) {
          setMenu(false);
          btn.focus();
        }
      });
    }
    const bar = document.querySelector("[data-actionbar]");
    const contact = document.getElementById("kontakt");
    if (bar && contact && "IntersectionObserver" in window) {
      new IntersectionObserver(
        ([entry]) => bar.classList.toggle("is-away", entry.isIntersecting),
        { threshold: 0.05 }
      ).observe(contact);
    }
  }

  // js/modules/thread.js
  var NS = "http://www.w3.org/2000/svg";
  var GOLDEN = 0.618;
  var DARK_TONES = ["dark", "iron"];
  function make(tag, attrs = {}, parent) {
    const node = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
    if (parent) parent.append(node);
    return node;
  }
  var clamp2 = (v, min, max) => Math.min(max, Math.max(min, v));
  function initThread({ reduce: reduce2 = false } = {}) {
    const root2 = document.querySelector("[data-thread-root]");
    const anchor = document.querySelector("[data-thread-anchor]");
    const endSection = root2 && root2.querySelector("[data-thread-end]");
    if (!root2 || !anchor || !endSection) return null;
    const hero = anchor.closest("section");
    const svg = make("svg", { class: "thread", "aria-hidden": "true", focusable: "false" });
    const clip = make("clipPath", { id: "thread-dark", clipPathUnits: "userSpaceOnUse" }, make("defs", {}, svg));
    const line = make("path", { class: "thread__line" }, svg);
    const lineDark = make("path", { class: "thread__line thread__line--dark", "clip-path": "url(#thread-dark)" }, svg);
    const marksGroup = make("g", {}, svg);
    const end = make("g", { class: "thread__end" }, svg);
    make("rect", { class: "thread__end-stroke", x: -6, y: -11, width: 12, height: 9, rx: 1 }, end);
    make("circle", { class: "thread__end-stroke", cx: 0, cy: 9, r: 9 }, end);
    make("path", { class: "thread__end-stroke", d: "M-5.5 5.5l1.6 1.6M5.5 5.5l-1.6 1.6M0 2.2v2.2" }, end);
    make("line", { class: "thread__needle", x1: 0, y1: 10, x2: 4.2, y2: 4.6 }, end);
    make("circle", { class: "thread__end-stroke", cx: 0, cy: 10, r: 1.4 }, end);
    root2.prepend(svg);
    let geo = null;
    let marks = [];
    let shown = 0;
    let goal = 0;
    let maxTip = 0;
    let started = false;
    let animating = false;
    let lastTime2 = 0;
    let buildQueued = false;
    function build() {
      buildQueued = false;
      const box = root2.getBoundingClientRect();
      const width = box.width;
      const top = (rect) => rect.top - box.top;
      const a = anchor.getBoundingClientRect();
      const ax = a.left + a.width / 2 - box.left;
      const ay = a.top + a.height / 2 - box.top;
      const container = hero.querySelector(".container");
      const gutter = parseFloat(getComputedStyle(container).paddingLeft) || 26;
      const tx = Math.round(container.getBoundingClientRect().left - box.left + gutter / 2);
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      const yH = Math.round(top(hero.getBoundingClientRect()) + hero.offsetHeight - rem * 2.618);
      const stop = endSection.querySelector("[data-thread-stop]");
      const stopRect = stop ? stop.getBoundingClientRect() : null;
      const yEnd = Math.round(stopRect ? top(stopRect) + stopRect.height / 2 : top(endSection.getBoundingClientRect()) + rem * 6);
      const r = Math.max(0, Math.min(18, (ax - tx) / 2, (yH - ay) / 2));
      const yV = yH + r;
      const prefix = `M${ax} ${ay}V${yH - r}Q${ax} ${yH} ${ax - r} ${yH}H${tx + r}Q${tx} ${yH} ${tx} ${yV}`;
      line.setAttribute("d", prefix);
      const L0 = line.getTotalLength();
      const L = L0 + Math.max(0, yEnd - yV);
      const d = `${prefix}V${yEnd}`;
      [line, lineDark].forEach((path) => {
        path.setAttribute("d", d);
        path.style.strokeDasharray = `${L} ${L}`;
      });
      clip.replaceChildren();
      root2.querySelectorAll("[data-tone]").forEach((section) => {
        if (!DARK_TONES.includes(section.dataset.tone)) return;
        const rect = section.getBoundingClientRect();
        make("rect", { x: 0, y: top(rect), width, height: rect.height }, clip);
      });
      marksGroup.replaceChildren();
      marks = [];
      root2.querySelectorAll("section[data-thread]").forEach((section) => {
        const y = Math.round(top(section.getBoundingClientRect()));
        if (y <= yV) return;
        const dark = DARK_TONES.includes(section.dataset.tone);
        const pos = make("g", { transform: `translate(${tx} ${y})` }, marksGroup);
        const mark = make("g", { class: `thread__mark${dark ? " thread__mark--dark" : ""}` }, pos);
        make("rect", { class: "thread__clip", x: -6, y: -5, width: 12, height: 10, rx: 1 }, mark);
        const label = make("text", { class: "thread__label", transform: "rotate(-90)", x: -14, y: 12, "text-anchor": "end" }, mark);
        label.textContent = section.dataset.thread;
        marks.push({ el: mark, at: L0 + (y - yV) });
      });
      end.setAttribute("transform", `translate(${tx} ${yEnd}) scale(${gutter < 40 ? 0.75 : 1})`);
      geo = { L, L0, yH, yV, rootTop: box.top + window.scrollY };
      update();
    }
    function queueBuild() {
      if (buildQueued) return;
      buildQueued = true;
      requestAnimationFrame(build);
    }
    function update() {
      if (!geo) return;
      const { L, L0, yH, yV, rootTop } = geo;
      if (reduce2) {
        shown = goal = L;
        render();
        return;
      }
      if (!started) {
        render();
        return;
      }
      const vh = window.innerHeight;
      maxTip = Math.max(maxTip, window.scrollY + vh * GOLDEN - rootTop);
      const tStart = yH - vh * (1 - GOLDEN);
      let length;
      if (maxTip <= tStart) length = 0;
      else if (maxTip < yV) length = L0 * (maxTip - tStart) / (yV - tStart);
      else length = L0 + (maxTip - yV);
      goal = clamp2(length, 0, L);
      shown = Math.min(shown, L);
      render();
      if (!animating && Math.abs(goal - shown) > 0.5) {
        animating = true;
        lastTime2 = performance.now();
        requestAnimationFrame(tick);
      }
    }
    function tick(time) {
      const dt = Math.min((time - lastTime2) / 1e3, 0.05);
      lastTime2 = time;
      shown += (goal - shown) * (1 - Math.exp(-8 * dt));
      if (Math.abs(goal - shown) < 0.5) shown = goal;
      render();
      if (shown !== goal) requestAnimationFrame(tick);
      else animating = false;
    }
    function render() {
      const offset = Math.max(0, geo.L - shown);
      line.style.strokeDashoffset = offset;
      lineDark.style.strokeDashoffset = offset;
      marks.forEach((mark) => mark.el.classList.toggle("is-on", shown >= mark.at));
      end.classList.toggle("is-on", shown >= geo.L - 1);
    }
    build();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", queueBuild);
    if ("ResizeObserver" in window) new ResizeObserver(queueBuild).observe(root2);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(queueBuild);
    return {
      start() {
        started = true;
        update();
      }
    };
  }

  // js/modules/process.js
  var clamp3 = (v, min, max) => Math.min(max, Math.max(min, v));
  function initProcess({ reduce: reduce2 = false } = {}) {
    const list = document.querySelector("[data-process]");
    if (!list) return;
    const steps = [...list.children];
    if (reduce2) {
      steps.forEach((step) => step.classList.add("is-on"));
      return;
    }
    let best = 0;
    let ticking = false;
    const update = () => {
      ticking = false;
      const rect = list.getBoundingClientRect();
      if (!rect.height) return;
      const p = clamp3((window.innerHeight * 0.618 - rect.top) / rect.height, 0, 1);
      if (p <= best) return;
      best = p;
      list.style.setProperty("--p", best.toFixed(4));
      steps.forEach((step) => {
        if (best >= (step.offsetTop + 12) / rect.height) step.classList.add("is-on");
      });
    };
    const queue = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };
    list.style.setProperty("--p", "0");
    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue);
    update();
  }

  // js/modules/marquee.js
  var BASE = 36;
  var FOLLOW = 0.45;
  function initMarquee({ reduce: reduce2 = false } = {}) {
    if (reduce2) return;
    document.querySelectorAll("[data-marquee]").forEach((el) => {
      const track = el.querySelector(".marquee__track");
      const group = track && track.querySelector(".marquee__group");
      if (!group) return;
      el.classList.add("is-ready");
      let groupWidth = 0;
      let x = 0;
      let dir = 1;
      let velocity = 0;
      let lastY = window.scrollY;
      let lastTime2 = 0;
      let visible = false;
      let running2 = false;
      const fill = () => {
        groupWidth = group.getBoundingClientRect().width;
        if (!groupWidth) return;
        const needed = Math.ceil(el.clientWidth / groupWidth) + 1;
        while (track.children.length < needed) {
          const copy = group.cloneNode(true);
          copy.setAttribute("aria-hidden", "true");
          track.append(copy);
        }
      };
      const frame2 = (time) => {
        if (!visible) {
          running2 = false;
          return;
        }
        const dt = Math.min((time - lastTime2) / 1e3, 0.05);
        lastTime2 = time;
        const y = window.scrollY;
        const scrollSpeed = dt > 0 ? (y - lastY) / dt : 0;
        lastY = y;
        if (Math.abs(scrollSpeed) > 20) dir = Math.sign(scrollSpeed);
        velocity += (scrollSpeed - velocity) * (1 - Math.exp(-6 * dt));
        x -= (BASE * dir + velocity * FOLLOW) * dt;
        if (groupWidth) x = (x % groupWidth - groupWidth) % groupWidth;
        track.style.transform = `translate3d(${x.toFixed(2)}px, 0, 0)`;
        requestAnimationFrame(frame2);
      };
      fill();
      window.addEventListener("resize", fill);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(fill);
      new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (visible && !running2) {
          running2 = true;
          lastTime2 = performance.now();
          lastY = window.scrollY;
          requestAnimationFrame(frame2);
        }
      }).observe(el);
    });
  }

  // js/modules/lamps.js
  function initLamps() {
    const box = document.querySelector("[data-lamps]");
    if (!box) return;
    const buttons = [...box.querySelectorAll("[data-lamp]")];
    const infos = [...box.querySelectorAll("[data-lamp-info]")];
    const empty = box.querySelector("[data-lamps-empty]");
    let current2 = null;
    const select = (id) => {
      current2 = id;
      buttons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.lamp === id)));
      infos.forEach((info) => {
        const on = info.dataset.lampInfo === id;
        info.hidden = !on;
        info.classList.toggle("is-swap", on);
      });
      if (empty) empty.hidden = Boolean(id);
    };
    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        select(current2 === button.dataset.lamp ? null : button.dataset.lamp);
      });
    });
    select(null);
  }

  // js/modules/form.js
  var RULES = {
    navn: (v) => v.length >= 2 ? "" : "Skriv navnet ditt.",
    telefon: (v) => {
      const digits = v.replace(/^\+47/, "").replace(/\D/g, "");
      return digits.length === 8 ? "" : "Skriv et telefonnummer med \xE5tte siffer.";
    },
    epost: (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? "" : "E-postadressen ser ikke riktig ut.",
    regnr: (v) => !v || /^[A-ZÆØÅ]{2}\s?\d{4,5}$/i.test(v) ? "" : "Skriv to bokstaver og fire eller fem siffer, for eksempel AB 12345.",
    tjeneste: (v) => v ? "" : "Velg hva henvendelsen gjelder.",
    melding: (v) => v.length >= 10 ? "" : "Beskriv kort hva du har merket p\xE5 bilen \u2013 minst et par ord."
  };
  function initForm() {
    const form = document.querySelector("[data-form]");
    if (!form) return;
    const summary = form.querySelector("[data-form-summary]");
    const receipt = document.querySelector("[data-form-receipt]");
    const again = document.querySelector("[data-form-again]");
    form.setAttribute("novalidate", "");
    const errorEl = (field) => document.getElementById(field.getAttribute("aria-describedby").split(" ")[0]);
    const check = (field) => {
      const rule = RULES[field.name];
      if (!rule) return "";
      const message = rule(field.value.trim());
      field.setAttribute("aria-invalid", message ? "true" : "false");
      errorEl(field).textContent = message;
      return message;
    };
    const fields = [...form.elements].filter((el) => RULES[el.name]);
    fields.forEach((field) => {
      field.addEventListener("blur", () => {
        if (field.value.trim() || field.getAttribute("aria-invalid") === "true") check(field);
      });
      field.addEventListener("input", () => {
        if (field.getAttribute("aria-invalid") === "true") check(field);
      });
    });
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const failed = fields.filter((field) => check(field));
      if (failed.length) {
        summary.hidden = false;
        summary.textContent = failed.length === 1 ? "Ett felt m\xE5 rettes f\xF8r vi kan sende." : `${failed.length} felt m\xE5 rettes f\xF8r vi kan sende.`;
        failed[0].focus();
        return;
      }
      summary.hidden = true;
      const data = Object.fromEntries(new FormData(form));
      const now = /* @__PURE__ */ new Date();
      const ref = `DB-${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(Math.floor(Math.random() * 900) + 100)}`;
      const fill = (key, value) => {
        const el = receipt.querySelector(`[data-r="${key}"]`);
        if (el) el.textContent = value;
      };
      fill("navn", data.navn.trim().split(/\s+/)[0]);
      fill("telefon", data.telefon.trim());
      fill("ref", ref);
      fill("tjeneste", data.tjeneste);
      fill("regnr", data.regnr.trim() ? data.regnr.trim().toUpperCase() : "Ikke oppgitt");
      form.hidden = true;
      receipt.hidden = false;
      receipt.focus();
    });
    if (again) {
      again.addEventListener("click", () => {
        form.reset();
        fields.forEach((field) => {
          field.removeAttribute("aria-invalid");
          errorEl(field).textContent = "";
        });
        receipt.hidden = true;
        form.hidden = false;
        fields[0].focus();
      });
    }
  }

  // js/index.js
  var root = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var FEIL = /* @__PURE__ */ Symbol("feil");
  function trygg(navn, fn) {
    try {
      return fn();
    } catch (feil) {
      console.error(`[${navn}]`, feil);
      return FEIL;
    }
  }
  function playHero() {
    document.querySelectorAll("[data-hero]").forEach((el) => el.classList.add("is-in"));
  }
  async function start() {
    clearTimeout(window.__failsafe);
    const ok = trygg("split", () => splitText()) !== FEIL && trygg("reveal", () => initReveal({ reduce })) !== FEIL;
    if (!ok) {
      root.classList.remove("js");
      showAll();
    }
    trygg("smooth-scroll", () => initSmoothScroll({ reduce }));
    trygg("header", () => initHeader());
    trygg("process", () => initProcess({ reduce }));
    trygg("marquee", () => initMarquee({ reduce }));
    trygg("lamps", () => initLamps());
    trygg("form", () => initForm());
    const thread = trygg("thread", () => initThread({ reduce }));
    await trygg("intro", () => playIntro({ reduce }));
    playHero();
    if (thread && thread !== FEIL) setTimeout(thread.start, reduce ? 0 : 2600);
  }
  start();
  window.addEventListener("error", () => root.classList.remove("has-intro"));
})();
