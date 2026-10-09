// Adjoint IA: questionnaire, VSL and pixel, shared by both A/B pages.
// Top half: questions and rules, pure, exported for adjoint.test.js.
// Bottom half: the page (browser only). Spec: 2.Outreach/AdjointIA/03_questionnaire.md

// Tiers (2.Outreach/AdjointIA/02_integrations.md): 1 native, 2 MCP, 3 API or bridge, 4 nothing usable.
// short: true = also asked on page B (the short page). Page A asks everything.
const QUESTIONS = [
  { id: 'metier', short: true, title: 'Quel est votre métier?', options: [
    { v: 'plomberie', label: 'Plomberie' },
    { v: 'electricite', label: 'Électricité' },
    { v: 'cvac', label: 'Chauffage, ventilation et climatisation (CVAC)' },
    { v: 'entrepreneur', label: 'Entrepreneur général ou rénovation' },
    { v: 'paysagement', label: 'Paysagement' },
    { v: 'construction', label: 'Autre métier de la construction' },
    { v: 'hors', label: 'Pas dans la construction' }
  ] },
  { id: 'compta', title: 'Quel logiciel utilisez-vous pour la comptabilité?', options: [
    { v: 'qbo', label: 'QuickBooks Online', tier: 2 },
    { v: 'acombago', label: 'Acomba GO (en ligne)', tier: 3 },
    { v: 'acomba', label: "Acomba installé sur l'ordinateur", tier: 3, bridge: true },
    { v: 'sage50', label: 'Sage', tier: 3, bridge: true },
    { v: 'avantage', label: 'Avantage', tier: 3, bridge: true },
    { v: 'maestro', label: 'Maestro', tier: 3 },
    { v: 'xero', label: 'Xero', tier: 1 },
    { v: 'autre', label: 'Autre', tier: 3 },
    { v: 'aucun', label: "Aucun, c'est Excel ou papier", tier: 4 }
  ] },
  // The CRMs Michael features (2026-09-30). Anything else goes in "Autre" and gets checked on the call.
  { id: 'jobs', short: true, multi: true, title: 'Où gérez-vous vos jobs et vos clients?', hint: 'Choisissez tout ce qui s\u2019applique.', options: [
    { v: 'jobber', label: 'Jobber', tier: 2 },
    { v: 'progression', label: 'ProgressionLIVE', tier: 3 },
    { v: 'hubspot', label: 'HubSpot', tier: 1 },
    { v: 'hcp', label: 'Housecall Pro', tier: 2 },
    { v: 'servicetitan', label: 'ServiceTitan', tier: 2 },
    { v: 'ghl', label: 'GoHighLevel', tier: 1 },
    { v: 'excel', label: 'Excel ou papier', tier: 4 },
    { v: 'autre', label: 'Autre', tier: 3 }
  ] },
  { id: 'courriel', title: "Quel courriel utilisez-vous pour l'entreprise?", options: [
    { v: 'm365', label: 'Outlook avec Microsoft 365', tier: 1 },
    { v: 'workspace', label: 'Gmail avec Google Workspace (@votreentreprise)', tier: 1 },
    { v: 'gmail', label: 'Gmail personnel (@gmail.com)', tier: 1 },
    { v: 'autre', label: 'Autre (Vidéotron, Hotmail, etc.)', tier: 4 }
  ] },
  { id: 'ca', title: "Quel est votre chiffre d'affaires annuel?", options: [
    { v: 'lt250k', label: 'Moins de 250 000 $' }, { v: '250k-1m', label: '250 000 $ à 1 M$' },
    { v: '1m-5m', label: '1 M$ à 5 M$' }, { v: 'gt5m', label: 'Plus de 5 M$' }
  ] },
  { id: 'role', title: 'Quel est votre rôle?', options: [
    { v: 'proprietaire', label: 'Propriétaire' }, { v: 'associe', label: 'Associé(e)' },
    { v: 'bureau', label: 'Gestionnaire ou adjoint(e) administratif(ve)' }, { v: 'autre', label: 'Autre' }
  ] },
  { id: 'temps', short: true, multi: true, title: "Qu'est-ce qui vous prend le plus de temps chaque semaine?", hint: 'Choisissez tout ce qui s\u2019applique.', options: [
    { v: 'soumissions', label: 'Monter les soumissions' },
    { v: 'factures', label: 'Faire les factures et relancer les paiements' },
    { v: 'courriels', label: 'Répondre aux courriels des clients' },
    { v: 'horaire', label: "Planifier les jobs et l'horaire des gars" },
    { v: 'retrouver', label: "Retrouver un prix, un document ou les infos d'une ancienne job" },
    { v: 'double', label: 'Entrer les mêmes infos dans plusieurs logiciels' },
    { v: 'suivis', label: 'Faire les suivis avec les prospects' },
    { v: 'autre', label: 'Autre', other: true } // shows a "Précisez" field
  ] }
];

const opt = (id, v) => (QUESTIONS.find(q => q.id === id).options || []).find(o => o.v === v);

// Nobody is rejected: every lead gets the booking button, even outside construction, and with
// Excel, paper or a non-business email (Michael takes every call). Page B asks the CRM, not the accounting.
function result(a) {
  const direct = (a.compta && opt('compta', a.compta).tier <= 2) || a.jobs.some(v => opt('jobs', v).tier <= 2);
  return direct ? 'qualifie_complet' : 'qualifie_cerveau';
}

// src: what the page kept from the ad click (fbc, fbp, first-touch UTMs, event_id, user agent).
// UTMs in the current URL win; the stored first touch covers a reload without them.
function payload(a, contact, variant, pageUrl, src = {}) {
  const url = new URL(pageUrl);
  const q = k => url.searchParams.get(k) || src[k] || '';
  const label = (id, v) => (v ? opt(id, v).label : ''); // page B skips most questions
  return Object.assign({}, contact, {
    variante: variant,
    metier: label('metier', a.metier),
    compta: label('compta', a.compta), compta_tier: a.compta ? opt('compta', a.compta).tier : '',
    jobs: a.jobs.map(v => label('jobs', v)), jobs_tier: a.jobs.length ? Math.min(...a.jobs.map(v => opt('jobs', v).tier)) : '',
    courriel: label('courriel', a.courriel), courriel_tier: a.courriel ? opt('courriel', a.courriel).tier : '',
    ca: label('ca', a.ca), role: label('role', a.role),
    temps_perdu: (a.temps || []).map(v => (v === 'autre' && a.temps_autre ? 'Autre : ' + a.temps_autre : label('temps', v))).join(', '),
    resultat: result(a),
    page_url: pageUrl, horodatage: new Date().toISOString(),
    utm_source: q('utm_source'), utm_medium: q('utm_medium'), utm_campaign: q('utm_campaign'),
    utm_content: q('utm_content'), utm_term: q('utm_term'),
    fbc: src.fbc || '', fbp: src.fbp || '', event_id: src.event_id || '', user_agent: src.user_agent || '',
    landing_url: src.landing_url || pageUrl
  });
}

if (typeof module !== 'undefined') module.exports = { QUESTIONS, opt, result, payload };

// ---------------------------------------------------------------- page
if (typeof document !== 'undefined') (function () {
  const root = document.querySelector('[data-adjoint]');
  const variant = root.dataset.adjoint;
  const base = root.dataset.base || './';
  const cfgReady = fetch(base + 'config.json').then(r => (r.ok ? r.json() : {})).catch(() => ({}));
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const track = (ev, params, eventID) => window.fbq && window.fbq('track', ev, params, eventID ? { eventID } : undefined);

  // Ad click data, kept across reloads. A new ad click (UTMs or fbclid in the URL) replaces it; a plain reload keeps it.
  // Storage can throw in private mode: then it lasts for this visit only.
  const KEY = 'adjoint_src';
  let stored = {};
  try { stored = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { /* private mode */ }
  const here = new URLSearchParams(location.search);
  const click = {};
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(k => { if (here.get(k)) click[k] = here.get(k); });
  // fbc per Meta: fb.1.<ms when first seen>.<fbclid>. Same fbclid as stored = reload, keep the original timestamp.
  const fbclid = here.get('fbclid');
  if (fbclid && !(stored.fbc || '').endsWith('.' + fbclid)) click.fbc = 'fb.1.' + Date.now() + '.' + fbclid;
  const src0 = Object.keys(click).length || fbclid ? Object.assign({ fbc: stored.fbc }, click, { landing_url: location.href }) : stored;
  try { localStorage.setItem(KEY, JSON.stringify(src0)); } catch (e) { /* private mode */ }
  const cookie = n => (document.cookie.match('(?:^|; )' + n + '=([^;]*)') || [])[1] || '';

  // Pixel and VSL only load once config.json has their ids.
  cfgReady.then(cfg => {
    if (cfg.pixel_id) {
      /* eslint-disable */
      !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
      /* eslint-enable */
      window.fbq('init', cfg.pixel_id);
      window.fbq('track', 'PageView');
    }
    // One "visite" row in the sheet per page load, no personal data: Stats compares it with bookings.
    if (cfg.apps_script_url && !/^(localhost|127\.0\.0\.1|)$/.test(location.hostname)) {
      fetch(cfg.apps_script_url, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ etape: 'visite', variante: variant, utm_campaign: src0.utm_campaign || '', utm_content: src0.utm_content || '' }) }).catch(() => {});
    }
    const vsl = $('.vsl');
    if (vsl && cfg.vsl_youtube_id) {
      vsl.classList.add('ready');
      vsl.style.backgroundImage = `url(https://i.ytimg.com/vi/${encodeURIComponent(cfg.vsl_youtube_id)}/hqdefault.jpg)`;
      vsl.addEventListener('click', () => {
        vsl.classList.remove('ready'); // drops the poster's play icon so it doesn't sit on top of the player
        vsl.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(cfg.vsl_youtube_id)}?autoplay=1&rel=0&cc_load_policy=1&hl=fr" title="Vidéo Adjoint IA" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
        track('ViewContent', { content_name: 'vsl' });
      }, { once: true });
    }
  });

  // Step 0 is the contact form: saved as a partial lead right away, so Michael can call people who stop halfway.
  // One id per visitor ties the partial row, the complete row and Meta's Lead event together.
  const newId = () => (crypto.randomUUID && crypto.randomUUID()) || String(Date.now()) + Math.random().toString(16).slice(2);
  const state = { i: 0, a: { jobs: [], temps: [] }, contact: {}, id: newId() };
  const quiz = $('#quiz');
  const QS = variant === 'B' ? QUESTIONS.filter(q => q.short) : QUESTIONS;
  const steps = QS.length + 1; // + contact

  function render(focus) {
    const q = state.i ? QS[state.i - 1] : null;
    $('#prog-t').textContent = `Étape ${state.i + 1} de ${steps}`;
    $('#bar').style.width = (state.i / steps * 100) + '%';
    const back = state.i ? '<button type="button" class="back">← Retour</button>' : '';
    let body;
    if (!q) body = contactForm();
    else body = `<div class="chips${q.multi ? ' multi' : ''}">${q.options.map(o => {
        const on = q.multi ? state.a[q.id].includes(o.v) : state.a[q.id] === o.v;
        return `<button type="button" class="chip" data-v="${o.v}" aria-pressed="${on}">${esc(o.label)}</button>`;
      }).join('')}</div>${q.options.some(o => o.other) ? `<label class="fld" id="autre-w"${state.a[q.id].includes('autre') ? '' : ' hidden'}><span>Précisez</span><input id="autre" value="${esc(state.a[q.id + '_autre'] || '')}"></label>` : ''}${q.multi ? `<button type="button" class="btn btn-primary next"${state.a[q.id].length ? '' : ' disabled'}>${last() ? 'Voir mon résultat →' : 'Continuer →'}</button>` : ''}`;
    $('#step').innerHTML = `${back}<h3 tabindex="-1">${esc(q ? q.title : 'Commençons par vos coordonnées')}</h3>${q && q.hint ? `<p class="hint">${esc(q.hint)}</p>` : ''}${body}`;
    if (focus) $('#step h3').focus();
    wire(q);
  }

  function contactForm() {
    const v = k => esc(state.contact[k] || '');
    const on = k => (state.contact[k] ? ' checked' : '');
    return `<form id="contact" novalidate>
      <label class="fld"><span>Prénom</span><input name="prenom" autocomplete="given-name" required value="${v('prenom')}"></label>
      <label class="fld"><span>Nom <em>(facultatif)</em></span><input name="nom" autocomplete="family-name" value="${v('nom')}"></label>
      <label class="fld"><span>Entreprise</span><input name="entreprise" autocomplete="organization" required value="${v('entreprise')}"></label>
      <label class="fld"><span>Courriel</span><input name="courriel_contact" type="email" autocomplete="email" required value="${v('courriel_contact')}"></label>
      <label class="fld"><span>Cellulaire</span><input name="cellulaire" type="tel" autocomplete="tel" required value="${v('cellulaire')}"></label>
      <label class="hp" aria-hidden="true">Site web<input name="website" tabindex="-1" autocomplete="off"></label>
      <label class="check"><input type="checkbox" name="consent_loi25" required${on('consent_loi25')}> <span>J'accepte que LabergeTech utilise mes réponses pour évaluer mon projet et me contacter à ce sujet, et transmette à Meta une version chiffrée de mon courriel et de mon téléphone pour mesurer ses publicités. <a href="${base}../confidentialite/" target="_blank">Politique de confidentialité</a></span></label>
      <p class="err" id="err" role="alert" hidden>Oups! Il vous manque une info ou deux. Complétez ce qui est marqué d'un * rouge.</p>
      <button type="submit" class="btn btn-primary btn-lg wide">Continuer →</button>
    </form>`;
  }

  function wire(q) {
    const b = $('#step .back');
    if (b) b.onclick = () => { state.i--; render(true); };
    if (!q) return wireContact();
    const next = $('#step .next');
    const autre = $('#autre');
    if (autre) autre.oninput = () => { state.a[q.id + '_autre'] = autre.value.trim(); };
    document.querySelectorAll('#step .chip').forEach(c => c.onclick = () => {
      if (q.multi) {
        const v = c.dataset.v, on = state.a[q.id].includes(v);
        state.a[q.id] = on ? state.a[q.id].filter(x => x !== v) : state.a[q.id].concat(v);
        c.setAttribute('aria-pressed', String(!on));
        next.disabled = !state.a[q.id].length;
        if (autre && v === 'autre') { $('#autre-w').hidden = on; if (!on) autre.focus(); }
      } else {
        state.a[q.id] = c.dataset.v;
        if (last()) finish(); else { state.i++; render(true); }
      }
    });
    if (next) next.onclick = () => (last() ? finish() : (state.i++, render(true)));
  }
  const last = () => state.i === QS.length;

  function wireContact() {
    const form = $('#contact');
    // Missing or invalid field: red * on its label, cleared as soon as it's fixed.
    const mark = el => el.closest('label').classList.toggle('miss', !el.validity.valid);
    form.oninput = e => {
      if (!e.target.closest('.miss')) return;
      mark(e.target);
      $('#err').hidden = !form.querySelector('.miss');
    };
    form.onsubmit = e => {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.querySelectorAll('[required]').forEach(mark);
        $('#err').hidden = false;
        const first = form.querySelector('.miss input');
        if (first) first.focus();
        return;
      }
      const f = Object.fromEntries(new FormData(form));
      state.contact = { prenom: f.prenom, nom: f.nom, entreprise: f.entreprise, courriel_contact: f.courriel_contact,
        cellulaire: f.cellulaire, website: f.website || '', consent_loi25: !!f.consent_loi25 };
      send('partiel');
      state.i++; render(true);
    };
  }

  // partiel: contact only, sheet row, no Meta event. complet: same row updated, Lead to Meta (pixel + server).
  async function send(etape) {
    const cfg = await cfgReady;
    const src = Object.assign({}, src0, { fbc: cookie('_fbc') || src0.fbc || '', fbp: cookie('_fbp'),
      event_id: state.id, user_agent: navigator.userAgent });
    const p = Object.assign(payload(state.a, state.contact, variant, location.href, src), { etape });
    if (etape === 'partiel') p.resultat = '';
    const local = /^(localhost|127\.0\.0\.1|)$/.test(location.hostname);
    // sent: true once the request left the browser. Honeypot, local or a network error: false.
    let sent = Promise.resolve(false);
    if (cfg.apps_script_url && !local && !state.contact.website) {
      sent = fetch(cfg.apps_script_url, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(p) }).then(() => true, () => false);
    }
    return { p, cfg, sent };
  }

  async function finish() {
    const { p, cfg, sent } = await send('complet');
    showResult(p.resultat, cfg);
    // Same event_id as the server-side Conversions API call in the Apps Script: Meta counts it once.
    // Only when the sheet got it, so Meta never counts a lead that has no row.
    if (await sent) track('Lead', { content_name: 'adjoint-ia', resultat: p.resultat, variante: variant }, state.id);
  }

  // Like SDB: qualified leads see "good fit, book a call", not the software details (resultat still goes to the sheet and Meta).
  function showResult(r, cfg) {
    const book = `<a class="btn btn-primary btn-lg wide book" href="${esc(cfg.booking_url || '#')}" target="_blank" rel="noopener">Réserver mon appel →</a>`;
    const fit = ['Bonne nouvelle : vous semblez être un bon fit.',
      "La prochaine étape est un appel de 30 minutes pour faire le tour de vos outils et de ce qui vous ferait gagner des heures.", book];
    const T = {
      qualifie_complet: fit,
      qualifie_cerveau: fit
    }[r];
    quiz.innerHTML = `<div class="result ${r.startsWith('qualifie') ? 'ok' : ''}"><h3 tabindex="-1">${T[0]}</h3><p>${T[1]}</p>${T[2]}</div>`;
    quiz.querySelector('h3').focus();
    const bk = quiz.querySelector('.book');
    if (bk) bk.onclick = () => track('Schedule', { variante: variant });
  }

  document.querySelectorAll('[data-start]').forEach(b => b.addEventListener('click', () => {
    quiz.hidden = false;
    quiz.scrollIntoView({ behavior: 'smooth', block: 'start' });
    $('#step h3') && $('#step h3').focus({ preventScroll: true });
  }));
  render(false);
})();
