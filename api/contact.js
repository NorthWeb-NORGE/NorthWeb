// POST /api/contact  { token, code, navn, bedrift, epost, pakke, melding }
// Only delivers the inquiry to NorthWeb when the code matches the one emailed to `epost`.
const L = require('./_lib');

const PACKAGES = ['Basic', 'Proff bilder', 'Nettbutikk', 'Usikker'];
const ERRORS = {
  wrong: [400, 'Feil kode. Sjekk e-posten og prøv igjen.'],
  expired: [400, 'Koden har gått ut. Be om en ny kode.'],
  locked: [429, 'For mange feil forsøk. Be om en ny kode.'],
  invalid: [400, 'Ugyldig bekreftelse. Be om en ny kode.'],
};

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return L.send(res, 405, { error: 'Method not allowed' });
  try {
    const b = await L.readJson(req);
    if (b.website) return L.send(res, 200, { ok: true });
    if (L.limited('verify:' + L.clientIp(req), 20, 15 * 60 * 1000)) {
      return L.send(res, 429, { error: 'For mange forsøk. Vent litt og prøv igjen.' });
    }

    const email = L.normEmail(b.epost);
    const result = L.checkChallenge(b.token, b.code, email);
    if (result !== 'ok') {
      const [status, error] = ERRORS[result];
      return L.send(res, status, { error, reason: result });
    }

    const navn = L.oneLine(b.navn, 80);
    const bedrift = L.oneLine(b.bedrift, 120) || '-';
    const pakke = PACKAGES.includes(b.pakke) ? b.pakke : 'Usikker';
    const melding = L.clean(b.melding, 5000) || '(ingen melding)';
    if (!navn) return L.send(res, 400, { error: 'Navn mangler.' });

    const rows = [['Navn', navn], ['Bedrift', bedrift], ['E-post', email + ' ✓ bekreftet'], ['Pakke', pakke]];
    await L.sendMail({
      to: L.env('CONTACT_TO', 'kontakt@northweb.no'),
      replyTo: email,
      subject: 'Ny forespørsel: ' + navn + (bedrift !== '-' ? ' (' + bedrift + ')' : ''),
      text: rows.map((r) => r[0] + ': ' + r[1]).join('\n') + '\n\n' + melding,
      html:
        '<div style="font-family:-apple-system,BlinkMacSystemFont,Helvetica,Arial,sans-serif;max-width:560px;color:#0A1628">' +
        '<h2 style="margin:0 0 16px">Ny forespørsel fra northweb.no</h2><table style="border-collapse:collapse;font-size:15px">' +
        rows.map((r) => '<tr><td style="padding:4px 16px 4px 0;color:#56667D">' + r[0] + '</td><td style="padding:4px 0"><b>' + L.esc(r[1]) + '</b></td></tr>').join('') +
        '</table><p style="white-space:pre-wrap;font-size:15px;line-height:1.5;background:#F4F8FC;border-radius:12px;padding:16px;margin-top:20px">' + L.esc(melding) + '</p>' +
        '<p style="font-size:13px;color:#8A99AE">Svar direkte på denne e-posten for å svare kunden.</p></div>',
    });
    return L.send(res, 200, { ok: true });
  } catch (err) {
    console.error('contact:', err);
    return L.send(res, err.status || 500, { error: 'Noe gikk galt. Prøv igjen, eller send oss en e-post direkte.' });
  }
};
