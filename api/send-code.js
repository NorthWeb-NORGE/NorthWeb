// POST /api/send-code  { email, navn }  →  { token }
// Emails a 6-digit code to the visitor. The token is returned to the browser and sent back with the code.
const L = require('./_lib');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return L.send(res, 405, { error: 'Method not allowed' });
  try {
    const body = await L.readJson(req);
    if (body.website) return L.send(res, 200, { token: 'x.x' }); // honeypot: pretend success for bots

    const email = L.normEmail(body.email);
    const name = L.oneLine(body.navn, 80);
    if (!L.isEmail(email)) return L.send(res, 400, { error: 'Skriv inn en gyldig e-postadresse.' });

    if (L.limited('ip:' + L.clientIp(req), 6, 15 * 60 * 1000) || L.limited('mail:' + email, 3, 15 * 60 * 1000)) {
      return L.send(res, 429, { error: 'For mange forsøk. Vent litt og prøv igjen.' });
    }

    const { code, token } = L.createChallenge(email);
    const hello = name ? 'Hei ' + name.split(' ')[0] + '!' : 'Hei!';
    await L.sendMail({
      to: email,
      subject: code + ' er koden din fra NorthWeb',
      text: hello + '\n\nKoden din er: ' + code + '\n\nSkriv den inn på northweb.no for å sende meldingen din. Koden gjelder i 10 minutter.\n\nHar du ikke bedt om dette, kan du se bort fra e-posten.\n\n– NorthWeb',
      html:
        '<div style="font-family:-apple-system,BlinkMacSystemFont,Helvetica,Arial,sans-serif;max-width:460px;margin:0 auto;padding:32px 24px;color:#0A1628">' +
        '<p style="font-size:13px;font-weight:800;letter-spacing:.06em;margin:0 0 28px">NORTH<span style="color:#2D7FF9">WEB</span></p>' +
        '<p style="font-size:17px;margin:0 0 8px">' + L.esc(hello) + '</p>' +
        '<p style="font-size:15px;color:#56667D;margin:0 0 24px">Skriv inn koden under for å sende meldingen din.</p>' +
        '<p style="font-size:36px;font-weight:700;letter-spacing:.3em;background:#EAF4FF;border-radius:14px;padding:18px 0;text-align:center;margin:0 0 24px">' + code + '</p>' +
        '<p style="font-size:13px;color:#8A99AE;margin:0">Koden gjelder i 10 minutter. Har du ikke bedt om dette, kan du se bort fra e-posten.</p></div>',
    });
    return L.send(res, 200, { token });
  } catch (err) {
    console.error('send-code:', err);
    return L.send(res, err.status || 500, { error: 'Kunne ikke sende koden. Prøv igjen om litt.' });
  }
};
