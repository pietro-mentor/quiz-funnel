// Vercel Serverless Function (Node.js runtime, zero-config: file sotto /api viene rilevato automaticamente)
// Riceve il payload del quiz dal browser e lo inoltra server-side a Zapier.
// Evita la chiamata diretta browser -> hooks.zapier.com, che su alcuni dispositivi/reti
// veniva bloccata/svuotata prima di arrivare a destinazione (CORS/DNS filter/estensioni).

const ZAPIER_WEBHOOK_URL = process.env.ZAPIER_WEBHOOK_URL || 'https://hooks.zapier.com/hooks/catch/3441543/4dkb38z/';

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const payload = req.body;

  console.log('[quiz-submit] Payload ricevuto dal browser:', JSON.stringify(payload));

  if (!payload || typeof payload !== 'object') {
    console.error('[quiz-submit] Payload mancante o non valido');
    return res.status(400).json({ error: 'Payload mancante o non valido' });
  }

  try {
    const zapierResponse = await fetch(ZAPIER_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const zapierText = await zapierResponse.text();

    console.log('[quiz-submit] Risposta Zapier status:', zapierResponse.status);
    console.log('[quiz-submit] Risposta Zapier body:', zapierText);

    if (!zapierResponse.ok) {
      console.error('[quiz-submit] Zapier ha risposto con errore:', zapierResponse.status, zapierText);
      return res.status(502).json({ error: 'Errore inoltro a Zapier', zapierStatus: zapierResponse.status });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[quiz-submit] Errore di rete verso Zapier:', err.message);
    return res.status(502).json({ error: 'Errore di rete verso Zapier', details: err.message });
  }
};
