(function () {
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Nav background after scroll
  var nav = document.getElementById('nav');
  function onScroll() { nav.classList.toggle('scrolled', scrollY > 20); }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // Scale iframes so a full desktop layout fits inside each preview frame
  function fit(screen) {
    var f = screen.querySelector('iframe'); if (!f) return;
    var w = screen.clientWidth, base = +screen.dataset.w || 1440;
    if (screen.id === 'heroScreen' && w < 560) base = 390;
    var s = w / base;
    f.style.width = base + 'px';
    f.style.height = (screen.clientHeight / s) + 'px';
    f.style.transform = 'scale(' + s + ')';
  }
  var ro = new ResizeObserver(function (es) { es.forEach(function (e) { fit(e.target); }); });
  document.querySelectorAll('.screen').forEach(function (s) { ro.observe(s); fit(s); });

  // Lazy-load previews
  var lazy = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.src = e.target.dataset.src; lazy.unobserve(e.target); } });
  }, { rootMargin: '500px' });
  document.querySelectorAll('iframe[data-src]').forEach(function (f) { lazy.observe(f); });

  // Hero picker
  var tabs = document.querySelectorAll('.picker button');
  var frame = document.getElementById('heroFrame'), scr = document.getElementById('heroScreen'), url = document.getElementById('heroUrl');
  var auto, idx = 0;
  function pick(i, user) {
    if (i === idx && !user) return;
    idx = i;
    tabs.forEach(function (t, j) { t.setAttribute('aria-selected', j === i ? 'true' : 'false'); });
    scr.classList.add('loading');
    setTimeout(function () { frame.src = tabs[i].dataset.src; }, 250);
    url.textContent = tabs[i].dataset.url;
    if (user) clearInterval(auto);
  }
  frame.addEventListener('load', function () { scr.classList.remove('loading'); });
  tabs.forEach(function (t, i) { t.addEventListener('click', function () { pick(i, true); }); });
  if (!reduce) auto = setInterval(function () { pick((idx + 1) % tabs.length); }, 6500);

  // Starfield / ice-crystal network in hero
  var cv = document.getElementById('stars'), ctx = cv.getContext('2d'), pts = [], W, H, dpr = Math.min(devicePixelRatio || 1, 2), running = true;
  function size() {
    W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var n = Math.round(W * H / 16000); pts = [];
    for (var i = 0; i < n; i++) pts.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .18, vy: (Math.random() - .5) * .18, r: Math.random() * 1.3 + .3 });
  }
  function draw() {
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < pts.length; i++) {
      var p = pts[i];
      if (!reduce) { p.x += p.vx; p.y += p.vy; if (p.x < 0 || p.x > W) p.vx *= -1; if (p.y < 0 || p.y > H) p.vy *= -1; }
      for (var j = i + 1; j < pts.length; j++) {
        var q = pts[j], dx = p.x - q.x, dy = p.y - q.y, d = dx * dx + dy * dy;
        if (d < 13000) { ctx.strokeStyle = 'rgba(143,209,255,' + (0.14 * (1 - d / 13000)) + ')'; ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke(); }
      }
      ctx.fillStyle = 'rgba(207,230,255,.75)'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
    }
    if (running && !reduce) requestAnimationFrame(draw);
  }
  size(); draw();
  addEventListener('resize', function () { size(); if (reduce) draw(); });
  new IntersectionObserver(function (es) { var v = es[0].isIntersecting; if (v && !running) { running = true; draw(); } else running = v; }).observe(cv);

  // Reveal on scroll
  var rv = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); rv.unobserve(e.target); } });
  }, { threshold: .12, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.rv').forEach(function (el) { rv.observe(el); });
  var sc = new IntersectionObserver(function (es) {
    if (es[0].isIntersecting) { document.querySelectorAll('.gauge').forEach(function (g, i) { setTimeout(function () { g.classList.add('on'); }, i * 120); }); sc.disconnect(); }
  }, { threshold: .4 });
  sc.observe(document.getElementById('scores'));

  // Mobile menu
  var btn = document.querySelector('.menu-btn');
  function setMenu(o) { document.body.classList.toggle('menu-open', o); btn.setAttribute('aria-expanded', o); btn.setAttribute('aria-label', o ? 'Lukk meny' : 'Åpne meny'); }
  btn.addEventListener('click', function () { setMenu(!document.body.classList.contains('menu-open')); });
  document.querySelectorAll('.mobile-menu a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });

  // Package buttons preselect the form
  document.querySelectorAll('[data-pkg]').forEach(function (a) {
    a.addEventListener('click', function () { var r = document.querySelector('input[name="pakke"][value="' + a.dataset.pkg + '"]'); if (r) r.checked = true; });
  });

  // Contact form: step 1 emails a code, step 2 verifies it and delivers the message (see /api)
  var form = document.getElementById('contactForm'), verify = document.getElementById('verifyForm');
  var formBtn = document.getElementById('formBtn'), verifyBtn = document.getElementById('verifyBtn'), resendBtn = document.getElementById('resendBtn');
  var boxes = [].slice.call(document.querySelectorAll('#codeBoxes input'));
  var token = null, cooldown;

  function showError(id, msg) { var el = document.getElementById(id); el.textContent = msg || ''; el.classList.toggle('show', !!msg); }
  function busy(b, on, label) { b.disabled = on; if (label) b.textContent = label; }
  function post(url, data) {
    return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) throw Object.assign(new Error(j.error || 'Noe gikk galt. Prøv igjen.'), { reason: j.reason }); return j; }); },
        function () { throw new Error('Fikk ikke kontakt med serveren. Sjekk nettet og prøv igjen.'); });
  }
  function fields() { var d = new FormData(form), o = {}; d.forEach(function (v, k) { o[k] = v; }); return o; }
  function startCooldown() {
    var s = 30; clearInterval(cooldown); resendBtn.disabled = true; resendBtn.textContent = 'Send ny kode (' + s + ')';
    cooldown = setInterval(function () { s--; if (s <= 0) { clearInterval(cooldown); resendBtn.disabled = false; resendBtn.textContent = 'Send ny kode'; } else resendBtn.textContent = 'Send ny kode (' + s + ')'; }, 1000);
  }
  function requestCode() {
    var f = fields();
    return post('/api/send-code', { email: f.epost, navn: f.navn, website: f.website }).then(function (j) { token = j.token; startCooldown(); });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault(); showError('formError');
    if (!form.reportValidity()) return;
    busy(formBtn, true, 'Sender kode …');
    requestCode().then(function () {
      document.getElementById('verifyEmail').textContent = fields().epost.trim();
      form.style.display = 'none'; verify.style.display = 'block';
      boxes.forEach(function (b) { b.value = ''; }); showError('verifyError'); boxes[0].focus();
    }).catch(function (err) { showError('formError', err.message); })
      .then(function () { busy(formBtn, false, 'Send forespørsel'); });
  });

  // Code boxes: auto-advance, backspace, paste of the full code
  boxes.forEach(function (b, i) {
    b.addEventListener('input', function () {
      var v = b.value.replace(/\D/g, '');
      if (v.length > 1) { fill(v, i); return; }
      b.value = v; if (v && boxes[i + 1]) boxes[i + 1].focus();
      if (code().length === 6) verify.requestSubmit();
    });
    b.addEventListener('keydown', function (e) {
      if (e.key === 'Backspace' && !b.value && boxes[i - 1]) { boxes[i - 1].focus(); boxes[i - 1].value = ''; e.preventDefault(); }
      if (e.key === 'ArrowLeft' && boxes[i - 1]) boxes[i - 1].focus();
      if (e.key === 'ArrowRight' && boxes[i + 1]) boxes[i + 1].focus();
    });
    b.addEventListener('focus', function () { b.select(); });
    b.addEventListener('paste', function (e) { e.preventDefault(); fill((e.clipboardData || window.clipboardData).getData('text'), 0); });
  });
  function fill(str, from) {
    var d = str.replace(/\D/g, '').slice(0, 6 - from).split('');
    d.forEach(function (c, k) { boxes[from + k].value = c; });
    (boxes[from + d.length] || boxes[5]).focus();
    if (code().length === 6) verify.requestSubmit();
  }
  function code() { return boxes.map(function (b) { return b.value; }).join(''); }

  verify.addEventListener('submit', function (e) {
    e.preventDefault(); showError('verifyError');
    if (code().length !== 6) { showError('verifyError', 'Skriv inn alle 6 sifrene.'); return; }
    if (verifyBtn.disabled) return;
    busy(verifyBtn, true, 'Bekrefter …');
    var data = fields(); data.token = token; data.code = code();
    post('/api/contact', data).then(function () {
      verify.style.display = 'none'; var s = document.getElementById('sent'); s.style.display = 'block';
    }).catch(function (err) {
      showError('verifyError', err.message);
      var cb = document.getElementById('codeBoxes'); cb.classList.remove('shake'); void cb.offsetWidth; cb.classList.add('shake');
      boxes.forEach(function (b) { b.value = ''; }); boxes[0].focus();
    }).then(function () { busy(verifyBtn, false, 'Bekreft og send'); });
  });

  resendBtn.addEventListener('click', function () {
    showError('verifyError'); resendBtn.disabled = true; resendBtn.textContent = 'Sender …';
    requestCode().then(function () { boxes.forEach(function (b) { b.value = ''; }); boxes[0].focus(); })
      .catch(function (err) { showError('verifyError', err.message); resendBtn.disabled = false; resendBtn.textContent = 'Send ny kode'; });
  });
  document.getElementById('backBtn').addEventListener('click', function () {
    token = null; clearInterval(cooldown); verify.style.display = 'none'; form.style.display = 'grid';
    document.getElementById('f-email').focus();
  });

  document.getElementById('yr').textContent = new Date().getFullYear();
})();
