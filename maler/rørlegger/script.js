(() => {
  // js/modules/intro.js
  var HOLD = 1150;
  function initIntro() {
    const root = document.documentElement;
    const release = () => root.classList.add("is-loaded");
    if (!root.classList.contains("intro-pending")) {
      release();
      return;
    }
    const intro = document.createElement("div");
    intro.className = "intro";
    intro.setAttribute("aria-hidden", "true");
    intro.innerHTML = `
    <svg viewBox="0 0 40 40">
      <path class="intro__pipe" pathLength="1" d="M31 10H17a5 5 0 0 0 0 10h6a5 5 0 0 1 0 10H9"/>
      <path class="intro__bore" pathLength="1" d="M31 10H17a5 5 0 0 0 0 10h6a5 5 0 0 1 0 10H9"/>
      <path class="intro__muffe" d="M30 5.5h3.5v9H30zM6.5 25.5H10v9H6.5z"/>
    </svg>`;
    document.body.append(intro);
    root.classList.remove("intro-pending");
    setTimeout(() => {
      intro.classList.add("is-leaving");
      release();
    }, HOLD);
    setTimeout(() => intro.remove(), HOLD + 1200);
    try {
      sessionStorage.setItem("intro", "1");
    } catch {
    }
  }

  // js/modules/smoothscroll.js
  var SMOOTHING = 0.075;
  function initSmoothScroll() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    document.documentElement.classList.add("has-smooth-scroll");
    let target = window.scrollY;
    let current = window.scrollY;
    let running = false;
    let last = 0;
    const maxScroll = () => document.documentElement.scrollHeight - window.innerHeight;
    const clamp = (y) => Math.max(0, Math.min(y, maxScroll()));
    function scrollsInside(node, delta) {
      for (let n = node; n && n !== document.body; n = n.parentElement) {
        if (n.scrollHeight <= n.clientHeight + 1) continue;
        const overflow = getComputedStyle(n).overflowY;
        if (overflow !== "auto" && overflow !== "scroll") continue;
        const atTop = n.scrollTop <= 0;
        const atBottom = n.scrollTop + n.clientHeight >= n.scrollHeight - 1;
        if (delta < 0 && !atTop || delta > 0 && !atBottom) return true;
      }
      return false;
    }
    function step(now) {
      if (!running) return;
      const dt = Math.min(now - last, 50);
      last = now;
      const ease = 1 - Math.pow(1 - SMOOTHING, dt / 16.67);
      current += (target - current) * ease;
      if (Math.abs(target - current) < 0.4) current = target;
      window.scrollTo(0, current);
      if (current === target) running = false;
      else requestAnimationFrame(step);
    }
    function glideTo(y) {
      if (!running) {
        current = window.scrollY;
        last = performance.now();
        running = true;
        requestAnimationFrame(step);
      }
      target = clamp(y);
    }
    function stop() {
      running = false;
      target = current = window.scrollY;
    }
    window.addEventListener(
      "wheel",
      (event) => {
        if (event.ctrlKey || event.defaultPrevented) return;
        if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
        if (document.hidden || scrollsInside(event.target, event.deltaY)) return;
        event.preventDefault();
        let delta = event.deltaY;
        if (event.deltaMode === 1) delta *= 40;
        if (event.deltaMode === 2) delta *= window.innerHeight;
        glideTo((running ? target : window.scrollY) + delta);
      },
      { passive: false }
      // må være false for å få lov til å stoppe standardrullingen
    );
    document.addEventListener("click", (event) => {
      const link = event.target.closest('a[href^="#"]');
      if (!link || event.defaultPrevented || document.hidden) return;
      const id = link.getAttribute("href").slice(1);
      const section = id ? document.getElementById(id) : null;
      if (!section) return;
      event.preventDefault();
      history.pushState(null, "", `#${id}`);
      requestAnimationFrame(() => {
        const offset = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
        const y = id === "topp" ? 0 : section.getBoundingClientRect().top + window.scrollY - offset;
        glideTo(y);
      });
      section.setAttribute("tabindex", "-1");
      section.focus({ preventScroll: true });
    });
    window.addEventListener("touchstart", stop, { passive: true });
    window.addEventListener("keydown", (event) => {
      if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(event.key)) stop();
    });
    window.addEventListener("pointerdown", (event) => {
      if (event.clientX >= document.documentElement.clientWidth) stop();
    });
  }

  // js/modules/header.js
  function initHeader() {
    const header = document.querySelector(".site-header");
    if (!header) return;
    let last = window.scrollY;
    window.addEventListener(
      "scroll",
      () => {
        const y = window.scrollY;
        if (Math.abs(y - last) < 6) return;
        const menuOpen = header.querySelector(".nav.is-open");
        header.classList.toggle("is-hidden", y > last && y > 320 && !menuOpen);
        last = y;
      },
      { passive: true }
    );
  }

  // js/modules/nav.js
  function initNav() {
    const toggle = document.querySelector(".nav-toggle");
    const nav = document.querySelector(".nav");
    if (!toggle || !nav) return;
    const setOpen = (open) => {
      nav.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
    };
    toggle.addEventListener("click", () => {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });
    nav.addEventListener("click", (event) => {
      if (event.target.closest("a")) setOpen(false);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && nav.classList.contains("is-open")) {
        setOpen(false);
        toggle.focus();
      }
    });
    initScrollSpy(nav);
  }
  function initScrollSpy(nav) {
    if (!("IntersectionObserver" in window)) return;
    const links = /* @__PURE__ */ new Map();
    nav.querySelectorAll('a[href^="#"]').forEach((link) => {
      const section = document.getElementById(link.hash.slice(1));
      if (section) links.set(section, link);
    });
    if (!links.size) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          links.forEach((link) => link.removeAttribute("aria-current"));
          links.get(entry.target).setAttribute("aria-current", "true");
        });
      },
      // En smal stripe midt på skjermen: seksjonen som krysser den er «aktiv»
      { rootMargin: "-45% 0px -50% 0px" }
    );
    links.forEach((_, section) => observer.observe(section));
  }

  // js/modules/reveal.js
  function initReveal() {
    document.querySelectorAll("[data-split]").forEach(splitWords);
    document.querySelectorAll('[data-reveal="stagger"], [data-index]').forEach((list) => {
      [...list.children].forEach((child, i) => child.style.setProperty("--i", i));
    });
    const items = document.querySelectorAll("[data-reveal], [data-split]:not([data-load])");
    if (!items.length) return;
    const show = (el2) => el2.classList.add("is-visible");
    if (!("IntersectionObserver" in window)) {
      items.forEach(show);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          show(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -10% 0px" }
    );
    items.forEach((el2) => observer.observe(el2));
  }
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

  // js/modules/hero.js
  function initHero() {
    const drawing = document.querySelector(".hero-drawing");
    if (!drawing) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    drawing.querySelectorAll(".dr-pipe").forEach((pipe, i) => {
      const flow = pipe.cloneNode();
      flow.setAttribute("class", "dr-flow");
      flow.removeAttribute("style");
      flow.style.setProperty("--i", i);
      pipe.after(flow);
    });
  }

  // js/modules/pagepipe.js
  var NS = "http://www.w3.org/2000/svg";
  var RISER_VV_X = 459.5;
  var RISER_KV_X = 464.75;
  var RISER_STROKE = 2.6;
  var CORNER = 12;
  var FOLLOW = 0.618;
  var el = (name, attrs = {}) => {
    const node = document.createElementNS(NS, name);
    Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
    return node;
  };
  function initPagePipe() {
    const main = document.querySelector("main");
    const drawing = document.querySelector(".hero-drawing");
    const endAnchor = document.querySelector("[data-pipe-end]");
    const container = document.querySelector(".hero .container");
    if (!main || !drawing || !endAnchor || !container) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const svg = el("svg", { class: "pagepipe", "aria-hidden": "true", focusable: "false" });
    main.append(svg);
    let lines = [];
    let marks = [];
    let table = [];
    let endNode = null;
    let total = 0;
    let drawn = 0;
    let target = 0;
    let frame = 0;
    const STEP = 6;
    function buildPath(points, offset) {
      const dirs = points.slice(1).map((p, i) => {
        const dx = Math.sign(p.x - points[i].x);
        const dy = Math.sign(p.y - points[i].y);
        return { x: dx, y: dy };
      });
      const normal = (d2) => ({ x: d2.y, y: -d2.x });
      const moved = points.map((p, i) => {
        const a = dirs[i - 1];
        const b = dirs[i];
        const n = a && b ? { x: normal(a).x + normal(b).x, y: normal(a).y + normal(b).y } : normal(a || b);
        return { x: p.x + n.x * offset, y: p.y + n.y * offset };
      });
      let d = `M${moved[0].x} ${moved[0].y}`;
      for (let i = 1; i < moved.length; i++) {
        const v = moved[i];
        const a = dirs[i - 1];
        const b = dirs[i];
        if (!b) {
          d += `L${v.x} ${v.y}`;
          break;
        }
        const cross = a.x * b.y - a.y * b.x;
        const r = Math.max(1, CORNER + offset * cross);
        d += `L${v.x - a.x * r} ${v.y - a.y * r}`;
        d += `A${r} ${r} 0 0 ${cross > 0 ? 1 : 0} ${v.x + b.x * r} ${v.y + b.y * r}`;
      }
      return d;
    }
    function lengthAt(y) {
      let lo = 0;
      let hi = table.length - 1;
      if (y <= table[0]) return 0;
      if (y >= table[hi]) return total;
      while (hi - lo > 1) {
        const mid = lo + hi >> 1;
        if (table[mid] <= y) lo = mid;
        else hi = mid;
      }
      const span = table[hi] - table[lo] || 1;
      return (lo + (y - table[lo]) / span) * STEP;
    }
    function build() {
      const box = main.getBoundingClientRect();
      const width = main.clientWidth;
      const height = main.offsetHeight;
      const top = (node) => node.getBoundingClientRect().top - box.top;
      svg.replaceChildren();
      svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
      svg.style.height = `${height}px`;
      const view = drawing.viewBox.baseVal;
      const rect = drawing.getBoundingClientRect();
      const scale = rect.width / view.width;
      const toX = (x) => rect.left - box.left + (x - view.x) * scale;
      const half = (RISER_KV_X - RISER_VV_X) * scale / 2;
      const startX = toX((RISER_KV_X + RISER_VV_X) / 2);
      const startY = rect.bottom - box.top;
      const margin = width - (container.getBoundingClientRect().right - box.left);
      const roomy = margin >= 36;
      const gutterX = width - margin + Math.min(Math.max(margin / 2, 9), 40);
      const endY = endAnchor.getBoundingClientRect().bottom - box.top + 60;
      const stub = roomy && width >= 960 ? 68 : 0;
      const points = [
        { x: startX, y: startY },
        { x: startX, y: startY + 20 },
        { x: gutterX, y: startY + 20 },
        { x: gutterX, y: endY }
      ];
      if (stub) points.push({ x: gutterX - stub, y: endY });
      const strokeWidth = Math.max(1.4, RISER_STROKE * scale);
      const track = el("path", { class: "pagepipe__track", d: buildPath(points, 0) });
      svg.append(track);
      total = track.getTotalLength();
      table = [];
      for (let len = 0; len <= total; len += STEP) table.push(track.getPointAtLength(len).y);
      const clipId = "pagepipe-dark";
      const clip = el("clipPath", { id: clipId, clipPathUnits: "userSpaceOnUse" });
      document.querySelectorAll("[data-pipe-dark]").forEach((section) => {
        clip.append(el("rect", { x: 0, y: top(section), width, height: section.offsetHeight }));
      });
      svg.append(clip);
      lines = [
        { cls: "pagepipe__vv", offset: -half, tipCls: "pagepipe__tip--vv" },
        { cls: "pagepipe__kv", offset: half, tipCls: "pagepipe__tip--kv" },
        { cls: "pagepipe__kv pagepipe__kv--light", offset: half, clip: true }
      ].map(({ cls, offset, clip: clipped, tipCls }) => {
        const path = el("path", { class: `pagepipe__line ${cls}`, d: buildPath(points, offset) });
        path.style.strokeWidth = strokeWidth;
        if (clipped) path.setAttribute("clip-path", `url(#${clipId})`);
        svg.append(path);
        const length = path.getTotalLength();
        path.style.strokeDasharray = `${length} ${length}`;
        const tip = tipCls ? el("circle", { class: `pagepipe__tip ${tipCls}`, r: strokeWidth * 1.15 }) : null;
        return { path, length, tip };
      });
      lines.forEach(({ tip }) => tip && svg.append(tip));
      marks = [...document.querySelectorAll("[data-pipe-label]")].map((section) => {
        const heading = section.querySelector("h2") || section;
        const y = top(heading) + 6;
        const group = el("g", { class: "pagepipe__mark" });
        if (section.hasAttribute("data-pipe-dark")) group.classList.add("pagepipe__mark--dark");
        const w = half * 2 + 9;
        group.append(el("rect", { x: gutterX - w / 2, y, width: w, height: 9, rx: 1 }));
        if (roomy) {
          const label = el("text", {
            transform: `translate(${gutterX - half - 15} ${y + 18}) rotate(90)`
          });
          label.textContent = section.dataset.pipeLabel.toUpperCase();
          group.append(label);
        }
        svg.append(group);
        return { node: group, at: lengthAt(y) };
      });
      const last = points[points.length - 1];
      endNode = el("g", { class: "pagepipe__end" });
      [-half, half].forEach((offset, i) => {
        const cx = stub ? last.x : last.x + offset;
        const cy = stub ? last.y + offset : last.y;
        endNode.append(
          el("circle", {
            class: i ? "pagepipe__valve pagepipe__valve--kv" : "pagepipe__valve pagepipe__valve--vv",
            cx,
            cy,
            r: Math.max(2.2, strokeWidth * 1.1)
          })
        );
      });
      svg.append(endNode);
      measure();
      drawn = target;
      render();
    }
    function measure() {
      if (reduceMotion) {
        target = total;
        return;
      }
      const doc = document.documentElement;
      const atBottom = window.scrollY + window.innerHeight >= doc.scrollHeight - 2;
      const y = window.innerHeight * FOLLOW - main.getBoundingClientRect().top;
      target = atBottom ? total : lengthAt(y);
    }
    function render() {
      const part = total ? drawn / total : 1;
      const moving = part > 2e-3 && part < 0.998;
      lines.forEach(({ path, length, tip }) => {
        path.style.strokeDashoffset = length * (1 - part);
        if (!tip) return;
        const point = path.getPointAtLength(length * part);
        tip.setAttribute("cx", point.x);
        tip.setAttribute("cy", point.y);
        tip.style.opacity = moving ? 1 : 0;
      });
      marks.forEach(({ node, at }) => node.classList.toggle("is-reached", drawn >= at - 1));
      if (endNode) endNode.classList.toggle("is-reached", part > 0.995);
    }
    function tick() {
      drawn += (target - drawn) * 0.16;
      if (Math.abs(target - drawn) < 0.5) drawn = target;
      render();
      frame = drawn === target ? 0 : requestAnimationFrame(tick);
    }
    function onScroll() {
      measure();
      if (document.hidden) {
        drawn = target;
        render();
      } else if (!frame) {
        frame = requestAnimationFrame(tick);
      }
    }
    build();
    let rebuild = 0;
    new ResizeObserver(() => {
      clearTimeout(rebuild);
      rebuild = setTimeout(build, 120);
    }).observe(main);
    if (!reduceMotion) {
      window.addEventListener("scroll", onScroll, { passive: true });
    }
  }

  // js/modules/process.js
  var PIPE_SHARE = 4.618 / 5;
  function initProcess() {
    const list = document.querySelector(".process__list");
    if (!list) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const steps = [...list.children];
    const wide = window.matchMedia("(min-width: 62rem)");
    list.classList.add("has-progress");
    const update = () => {
      const rect = list.getBoundingClientRect();
      const vh = window.innerHeight;
      const raw = wide.matches ? (vh * 0.85 - rect.top) / (vh * 0.5) : (vh * 0.7 - rect.top) / rect.height;
      const p = Math.max(0, Math.min(1, raw));
      list.style.setProperty("--p", p.toFixed(4));
      steps.forEach((step, i) => {
        const reach = wide.matches ? i / steps.length / PIPE_SHARE : i / steps.length;
        step.classList.toggle("is-active", p > 0.01 && p >= reach);
      });
    };
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  // js/modules/valve.js
  function initValve() {
    document.querySelectorAll(".valve").forEach((valve) => {
      const button = valve.querySelector(".valve__button");
      const status = valve.querySelector(".valve__status");
      if (!button || !status) return;
      button.addEventListener("click", () => {
        const closed = valve.classList.toggle("is-closed");
        button.setAttribute("aria-pressed", String(closed));
        status.textContent = closed ? "Stengt. Vannet er av i hele boligen." : "\xC5pen. Trykk p\xE5 kranen for \xE5 stenge.";
      });
    });
  }

  // js/modules/marquee.js
  var BASE_SPEED = 38;
  function initMarquee() {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.querySelectorAll(".marquee").forEach((marquee) => {
      const track = marquee.querySelector(".marquee__track");
      if (!track) return;
      track.innerHTML += track.innerHTML;
      if (reduceMotion) return;
      let x = 0;
      let boost = 0;
      let direction = 1;
      let lastY = window.scrollY;
      let lastTime = 0;
      let running = false;
      window.addEventListener(
        "scroll",
        () => {
          const delta = window.scrollY - lastY;
          lastY = window.scrollY;
          if (!delta) return;
          direction = delta > 0 ? 1 : -1;
          boost = Math.min(Math.abs(delta) * 14, 900);
        },
        { passive: true }
      );
      const frame = (now) => {
        if (!running) return;
        const dt = Math.min(now - lastTime, 50) / 1e3;
        lastTime = now;
        const loop = track.scrollWidth / 2;
        x -= direction * (BASE_SPEED + boost) * dt;
        boost *= Math.pow(0.04, dt);
        if (x <= -loop) x += loop;
        if (x > 0) x -= loop;
        track.style.transform = `translate3d(${x}px, 0, 0)`;
        requestAnimationFrame(frame);
      };
      new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting && !running) {
          running = true;
          lastTime = performance.now();
          requestAnimationFrame(frame);
        } else if (!entry.isIntersecting) {
          running = false;
        }
      }).observe(marquee);
    });
  }

  // js/modules/faq.js
  function initFaq() {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;
    document.querySelectorAll(".faq__item").forEach((item) => {
      const summary = item.querySelector("summary");
      const body = item.querySelector(".faq__body");
      if (!summary || !body || !body.animate) return;
      let running = null;
      summary.addEventListener("click", (event) => {
        event.preventDefault();
        if (running) running.cancel();
        if (item.open) {
          running = body.animate(
            { height: [`${body.offsetHeight}px`, "0px"], opacity: [1, 0] },
            { duration: 220, easing: "ease-in-out" }
          );
          running.onfinish = () => {
            item.open = false;
            running = null;
          };
        } else {
          item.open = true;
          running = body.animate(
            { height: ["0px", `${body.offsetHeight}px`], opacity: [0, 1] },
            { duration: 280, easing: "ease-out" }
          );
          running.onfinish = () => {
            running = null;
          };
        }
      });
    });
  }

  // js/modules/form.js
  var rules = {
    navn: (v) => v.length < 2 ? "Skriv inn navnet ditt." : "",
    telefon: (v) => {
      const digits = v.replace(/[\s+()-]/g, "").replace(/^(0047|47)(?=\d{8}$)/, "");
      return /^\d{8}$/.test(digits) ? "" : "Skriv inn et telefonnummer med 8 sifre.";
    },
    epost: (v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? "" : "E-postadressen ser ikke riktig ut. Sjekk at den har @ og et domene.",
    oppdrag: (v) => v ? "" : "Velg hva henvendelsen gjelder.",
    melding: (v) => v.length < 10 ? "Beskriv jobben med noen f\xE5 ord, s\xE5 vi kan forberede oss." : ""
  };
  function initForm() {
    const form = document.querySelector("#tilbudsskjema");
    const success = document.querySelector("#skjema-kvittering");
    if (!form || !success) return;
    const fields = Object.keys(rules).map((name) => form.elements[name]).filter(Boolean);
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
      success.focus();
    });
    success.querySelector("[data-reset]").addEventListener("click", () => {
      form.reset();
      fields.forEach((field) => field.removeAttribute("aria-invalid"));
      form.querySelectorAll(".field__error").forEach((el2) => el2.hidden = true);
      success.hidden = true;
      form.hidden = false;
      form.elements.navn.focus();
    });
  }
  function send(data) {
    void data;
  }

  // js/index.js
  window.__moduler = true;
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
  var year = document.querySelector("[data-year]");
  if (year) year.textContent = (/* @__PURE__ */ new Date()).getFullYear();
})();
