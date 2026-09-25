// Questionnaire facturation.
// Top half: the questions and the rules, pure, exported for quiz.test.js.
// Bottom half: the page (browser only).

// Four questions. The ids stay q2, q3, q4, q6 because patterns.json triggers use q3 and q6.
const QUESTIONS = [
  { id: 'q2', key: 'software', title: 'Où faites-vous les factures que vous envoyez à vos clients?', options: [
    { v: 'quickbooks', label: 'QuickBooks', min: 6 },
    { v: 'sage50', label: 'Sage 50', min: 6 },
    { v: 'acomba', label: 'Acomba', min: 6 },
    { v: 'genius', label: 'Genius ERP', min: 6 },
    { v: 'autre', label: 'Autre logiciel', min: 6, other: true },
    { v: 'excel', label: 'Excel, Word ou Google Sheets', min: 6 },
    { v: 'papier', label: 'Sur papier', min: 10 }
  ] },
  { id: 'q3', key: 'sources', multi: true, title: "D'où vient l'information avant la facture?", options: [
    { v: 'courriel', label: 'Bons de commande par courriel', short: 'Le client envoie son bon par courriel' },
    { v: 'papier', label: 'Bons de travail ou feuilles de temps papier', short: 'Le technicien remplit un bon papier' },
    { v: 'livraison', label: 'Bons de livraison ou preuves de livraison', short: 'Le chauffeur rapporte la preuve de livraison' },
    { v: 'soumission', label: 'Soumissions dans Excel', short: 'La soumission Excel est acceptée' },
    { v: 'portail', label: 'Portail ou plateforme client', short: 'Le client commande sur son portail' },
    { v: 'textos', label: 'Commandes par texto', short: 'Le client commande par texto' },
    { v: 'appels', label: 'Commandes par téléphone', short: 'Le client commande au téléphone' }
  ] },
  { id: 'q4', key: 'monthly_volume', title: 'Combien de factures envoyez-vous à vos clients par mois?', options: [
    { v: 'lt30', label: 'Moins de 30', n: 20 },
    { v: '30-100', label: '30 à 100', n: 65 },
    { v: '100-300', label: '100 à 300', n: 200 },
    { v: '300-1000', label: '300 à 1 000', n: 650 },
    { v: 'gt1000', label: 'Plus de 1 000', n: 1200 }
  ] },
  { id: 'q6', key: 'trigger', title: "Qu'est-ce qui vous pousse à regarder votre facturation maintenant?", options: [
    { v: 'temps', label: 'Trop de temps passé à créer les factures' },
    { v: 'ressaisie', label: 'Trop de ressaisie' },
    { v: 'erreurs', label: "Trop d'erreurs" },
    { v: 'retard', label: 'Factures envoyées trop tard' },
    { v: 'suivis', label: 'Trop de suivis manuels' },
    { v: 'croissance', label: 'Croissance du volume' },
    { v: 'personnel', label: 'Difficulté à trouver du personnel' },
    { v: 'curieux', label: 'Simplement curieux' }
  ] }
];

// Where invoices are made -> the Q3 source whose pattern it prefers as primary.
const PREFERS = { papier: 'papier', excel: 'soumission' };
// Copy, create, check, send: the manual steps behind every invoice.
const MULTIPLIER = 1.3;
// Patterns triggered by these sources are always "À valider".
const ALWAYS_VALIDATE = ['Commandes par texto', 'Commandes par téléphone'];
const LOGICIEL = {
  quickbooks: 'QuickBooks', sage50: 'Sage 50', acomba: 'Acomba', genius: 'Genius ERP',
  excel: 'votre fichier Excel ou Google Sheets', papier: 'QuickBooks Online'
};
const CONFIDENCE = { forte: 'Forte compatibilité', valider: 'À valider avec votre processus réel' };

const question = id => QUESTIONS.find(q => q.id === id);
const opt = (id, v) => question(id).options.find(o => o.v === v);
const labelsOf = (id, vs) => vs.map(v => opt(id, v).label);
const inOrder = (id, vs) => question(id).options.map(o => o.v).filter(v => vs.includes(v));
const dec1 = x => (Math.round(x * 10) / 10).toFixed(1).replace('.', ',').replace(/,0$/, '');
const num = n => n.toLocaleString('fr-CA');

function todayFlow(a) {
  const src = inOrder('q3', a.q3).map(v => opt('q3', v).short).join(' + ');
  return [
    { kind: 'source', label: src },
    { kind: 'manual', label: 'Vous recopiez les données' },
    { kind: 'manual', label: a.q2 === 'papier' ? 'Vous écrivez la facture' : 'Vous créez la facture' },
    { kind: 'manual', label: 'Vous la vérifiez' },
    { kind: 'manual', label: "Vous l'envoyez" }
  ];
}

function afterFlow(p, a) {
  return p.after_flow.map((s, i) => ({
    kind: i === 0 ? 'source' : p.human_steps.includes(s) ? 'human' : 'auto', label: s.split('{logiciel}').join(toolName(a))
  }));
}

function calc(a) {
  const minutes = opt('q2', a.q2).min;
  const volume = opt('q4', a.q4).n;
  const hours = Math.round(volume * minutes * MULTIPLIER * 12 / 60 / 10) * 10;
  const manual = todayFlow(a).filter(n => n.kind === 'manual').length;
  // Minutes per invoice with every manual step counted, so volume x this adds up to hours.
  const perInvoice = Math.round(minutes * MULTIPLIER * 10) / 10;
  return { minutes, volume, hours, manual, perInvoice };
}

function figure(hours) {
  if (hours < 200) return { big: String(Math.round(hours / 8)), unit: 'journées complètes par année' };
  const weeks = hours / 37.5;
  if (weeks <= 52) return { big: dec1(weeks), unit: 'semaines de travail à temps plein par année' };
  const people = Math.round(hours / 1950 * 10) / 10;
  return { big: dec1(people), unit: (people < 2 ? 'personne' : 'personnes') + " à temps plein, à l'année" };
}

function logiciel(a) {
  return a.q2 === 'autre' ? (String(a.q2_other || '').trim() || 'votre logiciel') : LOGICIEL[a.q2];
}

function fill(text, a) {
  return text.split('{logiciel}').join(logiciel(a)).replace(/ :/g, ' :');
}

// The software's short name, for tags and the flow: "Excel ou Google Sheets", not "votre fichier ...".
function toolName(a) {
  const t = a.q2 === 'excel' ? 'Excel ou Google Sheets' : logiciel(a);
  return t.charAt(0).toUpperCase() + t.slice(1);
}

// A step is { tool, text }. The tool label is short: it sits in a tag.
function stepOf(step, a) {
  const s = typeof step === 'string' ? { tool: '', text: step } : step;
  const tool = s.tool === '{logiciel}' ? toolName(a) : s.tool;
  return { tool: tool.charAt(0).toUpperCase() + tool.slice(1), text: fill(s.text, a) };
}

function confidence(a, hit) {
  if (a.q2 === 'papier' || a.q2 === 'autre') return 'valider';
  if (hit.p.triggers.q3.some(s => ALWAYS_VALIDATE.includes(s))) return 'valider';
  return hit.p.supported_software.includes(opt('q2', a.q2).label) ? 'forte' : 'valider';
}

// Primary: only a Q3 trigger can make one. A match with where invoices are made wins, then priority.
// Others: Q6-triggered first, then priority, max 2.
function selectPatterns(a, patterns) {
  const q3 = labelsOf('q3', a.q3);
  const q6 = opt('q6', a.q6).label;
  const hits = patterns
    .map(p => ({ p, by3: p.triggers.q3.some(s => q3.includes(s)), by6: p.triggers.q6.includes(q6) }))
    .filter(h => h.by3 || h.by6);
  const prefer = PREFERS[a.q2] && a.q3.includes(PREFERS[a.q2]) ? opt('q3', PREFERS[a.q2]).label : null;
  const rank = h => (prefer && h.p.triggers.q3.includes(prefer) ? 0 : 1);
  const primary = hits.filter(h => h.by3).sort((x, y) => rank(x) - rank(y) || x.p.priority - y.p.priority)[0];
  const others = hits.filter(h => h !== primary).sort((x, y) => (y.by6 - x.by6) || x.p.priority - y.p.priority).slice(0, 2);
  const out = h => Object.assign({}, h.p, { confidence: confidence(a, h) });
  return { primary: primary ? out(primary) : null, others: others.map(out) };
}

function eliminated(a, primary) {
  return Math.max(1, calc(a).manual - primary.human_steps.length);
}

// The answers, in the URL hash, so the emailed link can rebuild the result.
function encodeAnswers(a) {
  return ['q2=' + a.q2, 'q3=' + a.q3.join(','), 'q4=' + a.q4, 'q6=' + a.q6].join('&');
}

function decodeAnswers(hash) {
  const p = new URLSearchParams(String(hash || '').replace(/^#/, ''));
  const one = id => (opt(id, p.get(id)) ? p.get(id) : null);
  const vs = String(p.get('q3') || '').split(',').filter(Boolean);
  const a = { q2: one('q2'), q2_other: '', q3: vs.length && vs.every(v => opt('q3', v)) ? vs : null, q4: one('q4'), q6: one('q6') };
  return Object.values(a).every(v => v !== null) ? a : null;
}

function payload(a, contact, cfg, pageUrl) {
  const c = calc(a);
  const f = figure(c.hours);
  const sel = selectPatterns(a, cfg.patterns);
  const url = new URL(pageUrl);
  const q = k => url.searchParams.get(k) || '';
  return {
    ref: q('r'),
    first_name: contact.first_name, company: contact.company, email: contact.email, phone: contact.phone,
    website: contact.website,
    software: opt('q2', a.q2).label,
    software_other: a.q2 === 'autre' ? String(a.q2_other || '').trim() : '',
    sources: labelsOf('q3', inOrder('q3', a.q3)),
    monthly_volume: opt('q4', a.q4).label,
    trigger: opt('q6', a.q6).label,
    minutes_per_invoice: c.minutes, minutes_all_steps: c.perInvoice, invoices_per_month: c.volume,
    manual_steps: c.manual, hours: c.hours,
    figure: 'environ ' + f.big + ' ' + f.unit,
    primary_pattern: sel.primary ? sel.primary.id : '',
    primary_confidence: sel.primary ? sel.primary.confidence : '',
    other_patterns: sel.others.map(p => ({ id: p.id, confidence: p.confidence })),
    answers_hash: encodeAnswers(a),
    timestamp: new Date().toISOString(),
    page_url: pageUrl,
    utm_source: q('utm_source'), utm_medium: q('utm_medium'), utm_campaign: q('utm_campaign'),
    utm_content: q('utm_content'), utm_term: q('utm_term')
  };
}

if (typeof module !== 'undefined') {
  module.exports = { QUESTIONS, opt, todayFlow, afterFlow, calc, figure, fill, stepOf, selectPatterns, eliminated,
    encodeAnswers, decodeAnswers, payload };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

if (typeof document !== 'undefined') {
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
  const cfgReady = fetch('patterns.json').then(r => (r.ok ? r.json() : null)).catch(() => null);
  const isSet = s => s && !String(s).startsWith('[');

  const state = { i: 0, a: { q2: null, q2_other: '', q3: [], q4: null, q6: null }, contact: {} };
  const TOTAL = QUESTIONS.length;

  // Three screens, one at a time: intro, questions, result.
  function screen(name) {
    $('#intro').hidden = name !== 'intro';
    $('#questionnaire').hidden = name !== 'quiz';
    $('#resultat').hidden = name !== 'result';
    $('#sticky').hidden = true;
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  // One line read left to right. On a phone it scrolls sideways, with a hint while there is more.
  const flowHTML = nodes => '<div class="panel"><ol class="flow">' + nodes.map(n =>
    `<li class="${n.kind}">${esc(n.label)}</li>`).join('') + '</ol><p class="swipe" hidden>Glissez pour voir la suite →</p></div>';

  function renderStep(focus) {
    const onContact = state.i === TOTAL;
    $('#prog-t').textContent = onContact ? 'Dernière étape' : `Question ${state.i + 1} de ${TOTAL}`;
    $('#bar').style.width = ((onContact ? TOTAL : state.i) / TOTAL * 100) + '%';
    $('#step').innerHTML = '<button type="button" class="back">← Retour</button>' +
      (onContact ? contactHTML() : questionHTML(QUESTIONS[state.i]));
    $('#step .back').addEventListener('click', () => (state.i === 0 ? screen('intro') : go(state.i - 1)));
    if (onContact) bindContact(); else bindQuestion(QUESTIONS[state.i]);
    if (focus) {
      if ($('#questionnaire').getBoundingClientRect().top < 0) window.scrollTo({ top: 0, behavior: 'instant' });
      $('#step h2').focus({ preventScroll: true });
    }
  }

  function selected(q) {
    const v = state.a[q.id];
    return q.multi ? v : v ? [v] : [];
  }

  function questionHTML(q) {
    const sel = selected(q);
    const chips = q.options.map(o =>
      `<button type="button" class="chip" data-v="${o.v}" aria-pressed="${sel.includes(o.v)}">${esc(o.label)}</button>`).join('');
    const other = q.options.some(o => o.other)
      ? `<label class="fld other" ${state.a.q2 === 'autre' ? '' : 'hidden'}><span>Lequel?</span>
         <input type="text" maxlength="60" value="${esc(state.a.q2_other)}" autocomplete="off"></label>` : '';
    const needsNext = q.multi || (q.id === 'q2' && state.a.q2 === 'autre');
    return `<h2 tabindex="-1">${esc(q.title)}</h2>` +
      (q.multi ? '<p class="hint">Choisissez tout ce qui s\'applique.</p>' : '') +
      `<div class="chips${q.multi ? ' multi' : ''}" role="group" aria-label="${esc(q.title)}">${chips}</div>${other}` +
      `<button type="button" class="btn btn-primary wide next" ${needsNext ? '' : 'hidden'} ${sel.length ? '' : 'disabled'}>Suivant</button>`;
  }

  function bindQuestion(q) {
    const next = $('#step .next');
    next.addEventListener('click', () => go(state.i + 1));
    const otherBox = $('#step .other');
    if (otherBox) otherBox.querySelector('input').addEventListener('input', e => { state.a.q2_other = e.target.value; });
    $('#step .chips').addEventListener('click', e => {
      const b = e.target.closest('.chip');
      if (!b) return;
      const o = opt(q.id, b.dataset.v);
      if (q.multi) {
        let v = state.a[q.id];
        if (v.includes(o.v)) v = v.filter(x => x !== o.v);
        else if (o.exclusive) v = [o.v];
        else v = v.filter(x => !opt(q.id, x).exclusive).concat(o.v);
        state.a[q.id] = v;
      } else {
        state.a[q.id] = o.v;
      }
      const sel = selected(q);
      $('#step .chips').querySelectorAll('.chip').forEach(c => c.setAttribute('aria-pressed', sel.includes(c.dataset.v)));
      next.disabled = !sel.length;
      if (q.multi) return;
      if (o.other) {
        otherBox.hidden = false;
        next.hidden = false;
        otherBox.querySelector('input').focus();
        return;
      }
      if (otherBox) otherBox.hidden = true;
      setTimeout(() => go(state.i + 1), 180);
    });
  }

  function contactHTML() {
    const c = state.contact;
    const v = k => esc(c[k] || '');
    return `<h2 tabindex="-1">Où envoyer votre résultat?</h2>
      <form id="contact">
        <label class="fld"><span>Prénom</span><input name="first_name" required maxlength="60" autocomplete="given-name" value="${v('first_name')}"></label>
        <label class="fld"><span>Nom de l'entreprise</span><input name="company" required maxlength="100" autocomplete="organization" value="${v('company')}"></label>
        <label class="fld"><span>Courriel</span><input name="email" type="email" required maxlength="120" autocomplete="email"
          pattern="[^@\\s]+@[^@\\s]+\\.[^@\\s]{2,}" value="${v('email')}"></label>
        <label class="fld"><span>Téléphone <em>(facultatif)</em></span><input name="phone" type="tel" maxlength="30" autocomplete="tel" value="${v('phone')}"></label>
        <label class="hp" aria-hidden="true">Site web<input name="website" tabindex="-1" autocomplete="off"></label>
        <button type="submit" class="btn btn-primary btn-lg wide">Voir mon résultat</button>
        <p class="notice">Vos réponses servent à produire ce résultat, à vous l'envoyer et à vous recontacter à ce sujet.
          <a href="../confidentialite/">Confidentialité</a></p>
      </form>`;
  }

  function bindContact() {
    const form = $('#contact');
    const save = () => { state.contact = Object.fromEntries(new FormData(form)); };
    form.addEventListener('input', save);
    form.addEventListener('submit', async e => {
      e.preventDefault();
      save();
      const cfg = await cfgReady;
      showResult(state.a, cfg, state.contact);
      history.replaceState(null, '', location.pathname + location.search + '#' + encodeAnswers(state.a));
      // The result never waits on this, and a failure stays invisible.
      if (cfg && isSet(cfg.apps_script_url)) {
        fetch(cfg.apps_script_url, {
          method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify(payload(state.a, state.contact, cfg, location.href))
        }).catch(() => {});
      }
    });
  }

  function go(i) {
    state.i = i;
    renderStep(true);
  }

  const block = (title, body) => `<section class="rblock"><h2>${esc(title)}</h2>${body}</section>`;
  const tag = c => `<p class="tag ${c}">${esc(CONFIDENCE[c])}</p>`;
  const CTA = 'On regarde ça ensemble →';
  const toolClass = t => (t === 'IA' || t === 'Automatisation' ? ' ai' : t === 'Vous' ? ' you' : '');
  // Under 30 invoices or "Simplement curieux": booking is a text link, not the main button.
  const booking = (a, cfg) => ({
    url: cfg && isSet(cfg.booking_url) ? cfg.booking_url : '#',
    low: a.q4 === 'lt30' || a.q6 === 'curieux'
  });

  function resultHTML(a, cfg, contact) {
    const c = calc(a);
    const sel = cfg ? selectPatterns(a, cfg.patterns) : { primary: null, others: [] };
    const p = sel.primary;
    const b = booking(a, cfg);
    const link = `href="${esc(b.url)}" target="_blank" rel="noopener"`;
    const bookBtn = `<a class="btn btn-primary btn-lg wide book" ${link}>${CTA}</a>`;
    const bookLink = `<p class="booklink"><a ${link}>${CTA}</a></p>`;
    const sent = contact && contact.email
      ? `<p class="sent${b.low ? ' main' : ''}">Une copie de ce résultat vous sera envoyée à <strong>${esc(contact.email)}</strong>.</p>` : '';

    let h = `<header class="rhead">
      <h1>Votre résultat</h1>
      <div class="fig">
        <p class="big">${num(c.hours)} <span>heures / année</span></p>
        <p class="unit">consacrées à cette tâche administrative.</p>
        <p class="small">Basé sur ${num(c.volume)} factures/mois × ${dec1(c.perInvoice)} min/facture, ${c.manual} étapes manuelles comprises.</p>
      </div>
    </header>`;
    h += block("Votre processus aujourd'hui",
      '<ul class="legend"><li class="manual">Manuel</li><li class="auto">Automatisé</li><li class="human">Fait par vous</li></ul>' +
      flowHTML(todayFlow(a)));
    if (p) {
      const n = eliminated(a, p);
      h += block("Ce qu'on peut changer", flowHTML(afterFlow(p, a)) +
        `<p class="elim">${n} ${n === 1 ? 'étape manuelle éliminée' : 'étapes manuelles éliminées'}.</p>`);
    }
    h += `<section class="gain">
      <h2>Votre processus semble être un bon candidat à l'automatisation.</h2>
      <p class="gain-t">On peut maintenant regarder 1 ou 2 de vos vraies factures pour confirmer ce qui peut être automatisé et ce qui doit rester sous contrôle humain.</p>
      ${b.low ? sent + bookLink : bookBtn + sent}
    </section>`;
    if (p) {
      const steps = p.steps.map(s => stepOf(s, a));
      const tools = [...new Set(steps.map(s => s.tool).filter(t => t && t !== 'Vous'))];
      const others = sel.others.map(o =>
        `<div class="card mini"><h4>${esc(fill(o.name, a))}</h4><p class="desc">${esc(fill(o.description, a))}</p>${tag(o.confidence)}</div>`).join('');
      h += block('À automatiser en premier',
        `<div class="card">${tag(p.confidence)}<h3>${esc(fill(p.name, a))}</h3>` +
        (tools.length ? `<p class="tools">Outils : ${tools.map(esc).join(' · ')}</p>` : '') +
        '<ol class="steps">' + steps.map(s =>
          `<li>${s.tool ? `<span class="tool${toolClass(s.tool)}">${esc(s.tool)}</span>` : ''}${esc(s.text)}</li>`).join('') +
        '</ol></div>' + (others ? `<h3 class="others-t">Autres possibilités</h3>${others}` : ''));
      h += block("Pourquoi ce n'est pas juste connecter A à B",
        '<ul class="exc">' + p.exceptions.map(x =>
          `<li><strong>${esc(fill(x.case, a))}.</strong> ${esc(fill(x.handling, a))}</li>`).join('') + '</ul>' +
        `<p class="diy">À faire soi-même : environ ${esc(p.diy.setup_time)}, difficulté ${esc(p.diy.difficulty)}, plus l'entretien quand vos outils changent.</p>`);
    }
    h += `<section class="rblock cta"><h2>Validons-le avec vos vraies factures</h2>
      <p>En 15 minutes, on prend 1 ou 2 de vos factures et le document qui a servi à les créer, et on vérifie ce qui peut réellement être automatisé. Sans engagement.</p>
      ${b.low ? bookLink : bookBtn}
      <div class="me"><img src="../assets/michael-320.jpg" alt="Michael Laberge" width="64" height="77" loading="lazy">
        <p><strong>Michael Laberge</strong>, LabergeTech<br>C'est moi qui regarde vos factures avec vous et qui bâtis l'automatisation.</p></div>
    </section>`;
    return h;
  }

  function showResult(a, cfg, contact) {
    const r = $('#resultat');
    r.innerHTML = '<div class="wrap">' + resultHTML(a, cfg, contact) + '</div>';
    screen('result');
    r.querySelectorAll('.flow').forEach(f => {
      const hint = f.nextElementSibling;
      const edge = () => {
        const more = f.scrollLeft + f.clientWidth < f.scrollWidth - 4;
        f.classList.toggle('more', more);
        if (!more) hint.hidden = true;
      };
      hint.hidden = f.scrollWidth <= f.clientWidth + 4;
      f.addEventListener('scroll', edge, { passive: true });
      edge();
    });
    const b = booking(a, cfg);
    if (b.low || !('IntersectionObserver' in window)) return;
    // The booking bar shows only while neither booking button is on screen.
    const bar = $('#sticky');
    bar.querySelector('a').href = b.url;
    const onScreen = new Set();
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => (e.isIntersecting ? onScreen.add(e.target) : onScreen.delete(e.target)));
      bar.hidden = onScreen.size > 0;
    });
    r.querySelectorAll('.book').forEach(el => io.observe(el));
  }

  $('#start').addEventListener('click', () => {
    screen('quiz');
    renderStep(true);
  });
  const fromLink = decodeAnswers(location.hash);
  if (fromLink) {
    $('#intro').hidden = true;
    cfgReady.then(cfg => showResult(fromLink, cfg, null));
  }
}
