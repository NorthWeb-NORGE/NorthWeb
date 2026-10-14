// Mobilmeny + markering av hvilken seksjon man står i.

export function initNav() {
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

  // Lukk når man velger en lenke, eller trykker Escape
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

// Setter aria-current på menylenken til seksjonen som er midt i skjermen.
function initScrollSpy(nav) {
  if (!("IntersectionObserver" in window)) return;

  const links = new Map();
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
