// Questionnaire facturation.
// Top half: the questions and the rules, pure, exported for quiz.test.js.
// Bottom half: the page (browser only).

// Four questions. The ids stay q2, q3, q4, q6 because patterns.json triggers use q3 and q6.
const QUESTIONS = [
  { id: 'q2', key: 'software', title: 'Où faites-vous les factures que vous envoyez à vos clients?', options: [
    { v: 'quickbooks', label: 'QuickBooks' },
    { v: 'sage50', label: 'Sage 50' },
    { v: 'acomba', label: 'Acomba' },
    { v: 'genius', label: 'Genius ERP' },
    { v: 'autre', label: 'Autre logiciel', other: true },
    { v: 'excel', label: 'Excel, Word ou Google Sheets' },
    { v: 'papier', label: 'Sur papier' }
  ] },
  { id: 'q3', key: 'sources', multi: true, title: "D'où vient l'information avant la facture?", options: [
    { v: 'courriel', label: 'Bons de commande par courriel', short: 'Vous recevez un bon de commande par courriel',
      today: ['Vous ouvrez le courriel et regardez les informations', 'Vous retapez les lignes{dans}', 'Vous vérifiez les prix', 'Vous envoyez la facture'] },
    { v: 'papier', label: 'Bons de travail ou feuilles de temps papier', short: 'Vous remplissez un bon de travail papier',
      today: ['Le bon revient au bureau', 'Vous retapez les heures et le matériel{dans}', 'Vous vérifiez heures et prix', 'Vous envoyez la facture'] },
    { v: 'livraison', label: 'Bons de livraison ou preuves de livraison', short: 'Le chauffeur rapporte la preuve de livraison',
      today: ['Vous retrouvez le tarif convenu', 'Vous retapez la livraison{dans}', 'Vous vérifiez les frais', 'Vous envoyez la facture'] },
    { v: 'soumission', label: 'Soumissions dans Excel', short: 'La soumission Excel est acceptée',
      waits: 'Le travail est terminé',
      today: ['Vous retapez les lignes{dans}', 'Vous ajoutez les extras', 'Vous vérifiez la facture', 'Vous envoyez la facture'] },
    { v: 'portail', label: 'Portail ou plateforme client', short: 'Le client commande sur son portail',
      today: ['Vous vous connectez au portail', 'Vous retapez les commandes{dans}', 'Vous regroupez par client', 'Vous envoyez les factures'] },
    { v: 'crm', label: 'Mon CRM', other: true, short: 'Une vente est conclue dans {crm}',
      today: ['Vous ouvrez la vente dans {crm}', 'Vous retapez les lignes{dans}', 'Vous vérifiez les prix', 'Vous envoyez la facture'] },
    { v: 'textos', label: 'Commandes par texto', short: 'Le client commande par texto',
      today: ['Vous retrouvez le texto', 'Vous retapez la commande{dans}', 'Vous vérifiez la facture', "Vous l'envoyez"] }
  ] },
  { id: 'q4', key: 'monthly_volume', title: 'Combien de factures envoyez-vous à vos clients par mois?', options: [
    { v: 'lt30', label: 'Moins de 30', n: 20 },
    { v: '30-100', label: '30 à 100', n: 65 },
    { v: '100-300', label: '100 à 300', n: 200 },
    { v: '300-1000', label: '300 à 1 000', n: 650 },
    { v: 'gt1000', label: 'Plus de 1 000', n: 1200 }
  ] },
  // Their own minutes for one invoice, from start to sent, on a 1 to 20 slider.
  { id: 'q5', key: 'minutes_per_invoice', slider: true, title: "Combien de temps vous prend une facture, du début à l'envoi?",
    options: Array.from({ length: 20 }, (_, i) => ({ v: String(i + 1), label: String(i + 1), min: i + 1 })) },
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

// English page: same ids and rules, English words. Matching always uses the French labels above,
// which patterns.json triggers refer to, so both languages pick the same automation.
const EN = {
  q2: { title: 'Where do you create the invoices you send to your clients?', opts: {
    autre: { label: 'Other software' }, excel: { label: 'Excel, Word or Google Sheets' }, papier: { label: 'On paper' } } },
  q3: { title: 'Where does the information come from before the invoice?', opts: {
    courriel: { label: 'Purchase orders by email', short: 'You receive a purchase order by email',
      today: ['You open the email and look at the details', 'You retype the lines{dans}', 'You check the prices', 'You send the invoice'] },
    papier: { label: 'Paper work orders or timesheets', short: 'You fill out a paper work order',
      today: ['The work order comes back to the office', 'You retype the hours and materials{dans}', 'You check hours and prices', 'You send the invoice'] },
    livraison: { label: 'Delivery slips or proofs of delivery', short: 'The driver brings back the proof of delivery',
      today: ['You look up the agreed rate', 'You retype the delivery{dans}', 'You check the charges', 'You send the invoice'] },
    soumission: { label: 'Quotes in Excel', short: 'The Excel quote is accepted', waits: 'The job is done',
      today: ['You retype the lines{dans}', 'You add the extras', 'You check the invoice', 'You send the invoice'] },
    portail: { label: 'Client portal or platform', short: 'The client orders on their portal',
      today: ['You log into the portal', 'You retype the orders{dans}', 'You group them by client', 'You send the invoices'] },
    crm: { label: 'My CRM', short: 'A sale is closed in {crm}',
      today: ['You open the sale in {crm}', 'You retype the lines{dans}', 'You check the prices', 'You send the invoice'] },
    textos: { label: 'Orders by text message', short: 'The client orders by text',
      today: ['You find the text', 'You retype the order{dans}', 'You check the invoice', 'You send it'] } } },
  q4: { title: 'How many invoices do you send to clients each month?', opts: {
    lt30: { label: 'Under 30' }, '30-100': { label: '30 to 100' }, '100-300': { label: '100 to 300' },
    '300-1000': { label: '300 to 1,000' }, gt1000: { label: 'Over 1,000' } } },
  q5: { title: 'How long does one invoice take you, from start to sent?', opts: {} },
  q6: { title: "What's making you look at your invoicing now?", opts: {
    temps: { label: 'Too much time spent creating invoices' }, ressaisie: { label: 'Too much retyping' },
    erreurs: { label: 'Too many errors' }, retard: { label: 'Invoices go out too late' },
    suivis: { label: 'Too many manual follow-ups' }, croissance: { label: 'Growing volume' },
    personnel: { label: 'Hard to find staff' }, curieux: { label: 'Just curious' } } }
};

// Words the rules put into flows and steps, per language.
const WORDS = {
  fr: { into: ' dans ', at: ' dans ', yourCrm: 'votre CRM', excelTemplate: 'votre gabarit Excel', yourSoftware: 'votre logiciel', excelTool: 'Excel ou Google Sheets',
    byHand: 'Vous écrivez la facture à la main', target: / dans \{logiciel\}/, plural: /^Factures/,
    prepared: 'Facture préparée', preparedPlural: 'Factures préparées', billingSoftware: 'un logiciel de facturation',
    forte: 'Forte compatibilité', valider: 'À valider avec votre processus réel', decimal: ',', locale: 'fr-CA' },
  en: { into: ' into ', at: ' in ', yourCrm: 'your CRM', excelTemplate: 'your Excel template', yourSoftware: 'your software', excelTool: 'Excel or Google Sheets',
    byHand: 'You write the invoice by hand', target: / in \{logiciel\}/, plural: /^Invoices/,
    prepared: 'Invoice prepared', preparedPlural: 'Invoices prepared', billingSoftware: 'invoicing software',
    forte: 'Strong fit', valider: 'To confirm with your actual process', decimal: '.', locale: 'en-CA' }
};

let LANG = 'fr';
function setLang(l) { LANG = l === 'en' ? 'en' : 'fr'; }
const W = () => WORDS[LANG];

// Where invoices are made -> the Q3 source whose pattern it prefers as primary.
const PREFERS = { papier: 'papier', excel: 'soumission' };
// Patterns triggered by these sources are always "À valider".
const ALWAYS_VALIDATE = ['Commandes par texto'];
// Where the slider starts, from where they make invoices. They move it to their own number.
const START_MINUTES = { excel: 5, papier: 10 };
function startMinutes(a) {
  return START_MINUTES[a.q2] || 6;
}

const LOGICIEL = { quickbooks: 'QuickBooks', sage50: 'Sage 50', acomba: 'Acomba', genius: 'Genius ERP', papier: 'QuickBooks Online' };

const question = id => QUESTIONS.find(q => q.id === id);
const opt = (id, v) => question(id).options.find(o => o.v === v);
const labelsOf = (id, vs) => vs.map(v => opt(id, v).label);
const inOrder = (id, vs) => question(id).options.map(o => o.v).filter(v => vs.includes(v));
// The option as displayed: French as is, English with its words swapped in.
const shown = (id, v) => (LANG === 'en' ? Object.assign({}, opt(id, v), (EN[id].opts || {})[v]) : opt(id, v));
const titleOf = q => (LANG === 'en' ? EN[q.id].title : q.title);
const dec1 = x => (Math.round(x * 10) / 10).toFixed(1).replace(/\.0$/, '').replace('.', W().decimal);
const num = n => n.toLocaleString(W().locale);

// The CRM they named, or "votre CRM".
function withCrm(text, a) {
  return text.split('{crm}').join(String(a.q3_other || '').trim() || W().yourCrm);
}

// Where they retype today, as it reads in a step: " dans Sage 50", " dans votre gabarit Excel".
function dans(a) {
  return W().into + logiciel(a);
}

// Today's steps for one source, written to mirror that source's automated flow.
// With several sources ticked, pass the featured automation so both flows compare the same thing.
function todayFlow(a, primary) {
  const ticked = inOrder('q3', a.q3);
  // Rules use the French labels, whatever the page language.
  const v = (primary && ticked.find(x => primary.triggers.q3.includes(opt('q3', x).label))) || ticked[0];
  const src = shown('q3', v);
  const flow = [{ kind: 'source', label: withCrm(src.short, a) }];
  if (src.waits) flow.push({ kind: 'plain', label: src.waits });
  src.today.forEach(t => flow.push({
    kind: 'manual',
    label: withCrm(!t.includes('{dans}') ? t : a.q2 === 'papier' ? W().byHand : t.replace('{dans}', dans(a)), a)
  }));
  return flow;
}

// Excel users get the invoice in their template; paper users have no software yet.
function afterLabel(s, a) {
  s = withCrm(s, a);
  const w = W();
  const at = s.search(w.target);
  if (at < 0) return s;
  const head = s.slice(0, at);
  const tail = s.slice(at).replace(w.target, '');
  if (a.q2 !== 'excel' && a.q2 !== 'papier') return head + w.at + logiciel(a) + tail;
  const where = a.q2 === 'excel' ? w.excelTemplate : w.billingSoftware;
  return (w.plural.test(head) ? w.preparedPlural : w.prepared) + w.at + where + tail;
}

function afterFlow(p, a) {
  return p.after_flow.map((s, i) => ({
    kind: i === 0 ? 'source' : p.human_steps.includes(s) ? 'human' : 'auto', label: afterLabel(s, a)
  }));
}

// Hours a year from exactly what they told us: invoices a month x their minutes per invoice.
function calc(a) {
  const minutes = opt('q5', a.q5).min;
  const volume = opt('q4', a.q4).n;
  const hours = Math.round(volume * minutes * 12 / 60);
  const manual = todayFlow(a).filter(n => n.kind === 'manual').length;
  return { minutes, volume, hours, manual };
}

function figure(hours) {
  if (hours < 200) return { big: String(Math.round(hours / 8)), unit: 'journées complètes par année' };
  const weeks = hours / 37.5;
  if (weeks <= 52) return { big: dec1(weeks), unit: 'semaines de travail à temps plein par année' };
  const people = Math.round(hours / 1950 * 10) / 10;
  return { big: dec1(people), unit: (people < 2 ? 'personne' : 'personnes') + " à temps plein, à l'année" };
}

function logiciel(a) {
  if (a.q2 === 'autre') return String(a.q2_other || '').trim() || W().yourSoftware;
  return a.q2 === 'excel' ? W().excelTemplate : LOGICIEL[a.q2];
}

function fill(text, a) {
  const s = text.split('{logiciel}').join(logiciel(a));
  return LANG === 'fr' ? s.replace(/ :/g, '\u00a0:') : s;
}

// The software's short name, for tags and the flow: "Excel ou Google Sheets", not "votre fichier ...".
function toolName(a) {
  const t = a.q2 === 'excel' ? W().excelTool : logiciel(a);
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

// English text for each automation lives in patterns.en.json, keyed by id. The rules
// (triggers, priority, software) stay in patterns.json only.
function localize(patterns, texts) {
  return patterns.map(p => Object.assign({}, p, (texts || {})[p.id]));
}

function eliminated(a, primary) {
  return Math.max(1, calc(a).manual - primary.human_steps.length);
}

// The answers, in the URL hash, so the emailed link can rebuild the result.
function encodeAnswers(a) {
  return ['q2=' + a.q2, 'q3=' + a.q3.join(','), 'q4=' + a.q4, 'q5=' + a.q5, 'q6=' + a.q6].join('&');
}

function decodeAnswers(hash) {
  const p = new URLSearchParams(String(hash || '').replace(/^#/, ''));
  const one = id => (opt(id, p.get(id)) ? p.get(id) : null);
  const vs = String(p.get('q3') || '').split(',').filter(Boolean);
  const a = { q2: one('q2'), q2_other: '', q3: vs.length && vs.every(v => opt('q3', v)) ? vs : null, q3_other: '',
    q4: one('q4'), q5: one('q5'), q6: one('q6') };
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
    crm_name: a.q3.includes('crm') ? String(a.q3_other || '').trim() : '',
    sources: labelsOf('q3', inOrder('q3', a.q3)),
    monthly_volume: opt('q4', a.q4).label,
    trigger: opt('q6', a.q6).label,
    minutes_per_invoice: c.minutes, invoices_per_month: c.volume,
    manual_steps: c.manual, hours: c.hours,
    figure: 'environ ' + f.big + ' ' + f.unit,
    primary_pattern: sel.primary ? sel.primary.id : '',
    primary_confidence: sel.primary ? sel.primary.confidence : '',
    other_patterns: sel.others.map(p => ({ id: p.id, confidence: p.confidence })),
    answers_hash: encodeAnswers(a),
    timestamp: new Date().toISOString(),
    page_url: pageUrl,
    utm_source: q('utm_source'), utm_medium: q('utm_medium'), utm_campaign: q('utm_campaign'),
    utm_content: q('utm_content'), utm_term: q('utm_term'),
    lang: LANG
  };
}

if (typeof module !== 'undefined') {
  module.exports = { QUESTIONS, EN, opt, shown, setLang, startMinutes, todayFlow, afterFlow, calc, figure, fill, stepOf, localize,
    selectPatterns, eliminated, encodeAnswers, decodeAnswers, payload, confidenceLabel: c => W()[c] };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

if (typeof document !== 'undefined') {
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
  setLang(document.documentElement.lang.slice(0, 2));
  const UI = {
    fr: {
      lastStep: 'Dernière étape', question: (i, n) => `Question ${i} de ${n}`, back: '← Retour',
      hint: "Choisissez tout ce qui s'applique.", which: 'Lequel?', next: 'Suivant',
      contactTitle: 'Où envoyer votre résultat?', firstName: 'Prénom', company: "Nom de l'entreprise", email: 'Courriel',
      phone: 'Téléphone', optional: '(facultatif)', website: 'Site web', submit: 'Voir mon résultat',
      notice: "Vos réponses servent à produire ce résultat, à vous l'envoyer et à vous recontacter à ce sujet.",
      privacy: 'Confidentialité', privacyHref: '../confidentialite/', swipe: 'Glissez pour voir la suite →',
      cta: 'On regarde ça ensemble →', sent: e => `Une copie de ce résultat vous sera envoyée à <strong>${e}</strong>.`,
      result: 'Votre résultat', perYear: 'heures / année', spent: 'consacrées à cette tâche administrative.',
      basis: (v, m) => `Basé sur ${v} factures/mois × ${m} min/facture.`,
      sliderHint: 'Glissez le point vers la gauche ou la droite.', minUnit: 'min',
      confirm: m => `Continuer avec ${m} min →`,
      today: "Votre processus aujourd'hui", legend: ['Manuel', 'Automatisé', 'Fait par vous'], change: "Ce qu'on peut changer",
      elim: n => (n === 1 ? '1 étape manuelle éliminée.' : `${n} étapes manuelles éliminées.`),
      gainTitle: "Votre processus semble être un bon candidat à l'automatisation.",
      gainText: "On peut maintenant regarder 1 ou 2 de vos vraies factures pour confirmer ce qui est possible.",
      first: 'À automatiser en premier', tools: 'Outils\u00a0: ', others: 'Autres possibilités',
      why: "Pourquoi ce n'est pas juste connecter A à B",
      diy: (t, d) => `À faire soi-même\u00a0: environ ${t}, difficulté ${d}, plus l'entretien quand vos outils changent.`,
      endTitle: 'Validons-le avec vos vraies factures',
      endText: "En 15 minutes, on prend 1 ou 2 de vos factures et le document qui a servi à les créer, et on vérifie ce qui peut réellement être automatisé. Sans engagement."
    },
    en: {
      lastStep: 'Last step', question: (i, n) => `Question ${i} of ${n}`, back: '← Back',
      hint: 'Choose all that apply.', which: 'Which one?', next: 'Next',
      contactTitle: 'Where should we send your result?', firstName: 'First name', company: 'Company name', email: 'Email',
      phone: 'Phone', optional: '(optional)', website: 'Website', submit: 'See my result',
      notice: 'Your answers are used to produce this result, send it to you, and follow up with you about it.',
      privacy: 'Privacy', privacyHref: '../privacy/', swipe: 'Swipe to see the rest →',
      cta: "Let's look at it together →", sent: e => `A copy of this result will be sent to <strong>${e}</strong>.`,
      result: 'Your result', perYear: 'hours / year', spent: 'spent on this administrative task.',
      basis: (v, m) => `Based on ${v} invoices/month × ${m} min/invoice.`,
      sliderHint: 'Drag the dot left or right.', minUnit: 'min',
      confirm: m => `Continue with ${m} min →`,
      today: 'Your process today', legend: ['Manual', 'Automated', 'Done by you'], change: 'What we can change',
      elim: n => (n === 1 ? '1 manual step removed.' : `${n} manual steps removed.`),
      gainTitle: 'Your process looks like a good candidate for automation.',
      gainText: "We can now look at 1 or 2 of your real invoices to confirm what's possible.",
      first: 'Automate this first', tools: 'Tools: ', others: 'Other options',
      why: "Why it isn't just connecting A to B",
      diy: (t, d) => `Doing it yourself: about ${t}, ${d} difficulty, plus upkeep whenever your tools change.`,
      endTitle: "Let's check it with your real invoices",
      endText: 'In 15 minutes, we take 1 or 2 of your invoices and the document used to create them, and check what can really be automated. No commitment.'
    }
  };
  const T = UI[LANG];
  const getJson = u => fetch(u).then(r => (r.ok ? r.json() : null)).catch(() => null);
  const cfgReady = Promise.all([getJson('../facturation/patterns.json'), LANG === 'en' ? getJson('../facturation/patterns.en.json') : null])
    .then(([cfg, texts]) => (cfg && Object.assign({}, cfg, { patterns: localize(cfg.patterns, texts) })));
  const isSet = s => s && !String(s).startsWith('[');

  const state = { i: 0, a: { q2: null, q2_other: '', q3: [], q3_other: '', q4: null, q5: null, q6: null }, contact: {} };
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
    `<li class="${n.kind}">${esc(n.label)}</li>`).join('') + `</ol><p class="swipe" hidden>${T.swipe}</p></div>`;

  function renderStep(focus) {
    const onContact = state.i === TOTAL;
    $('#prog-t').textContent = onContact ? T.lastStep : T.question(state.i + 1, TOTAL);
    $('#bar').style.width = ((onContact ? TOTAL : state.i) / TOTAL * 100) + '%';
    $('#step').innerHTML = `<button type="button" class="back">${T.back}</button>` +
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

  function sliderHTML(q) {
    const m = Number(state.a.q5) || startMinutes(state.a);
    return `<h2 tabindex="-1">${esc(titleOf(q))}</h2><p class="hint">${esc(T.sliderHint)}</p>
      <div class="slider">
        <p class="slider-v"><strong>${m}</strong> ${T.minUnit}</p>
        <input type="range" min="1" max="20" step="1" value="${m}" aria-label="${esc(titleOf(q))}" aria-valuetext="${m} ${T.minUnit}">
        <div class="slider-ends"><span>1 ${T.minUnit}</span><span>20 ${T.minUnit}</span></div>
      </div>
      <button type="button" class="btn btn-primary btn-lg wide next">${T.confirm(m)}</button>`;
  }

  function bindSlider() {
    const input = $('#step input[type="range"]');
    const next = $('#step .next');
    const show = () => {
      const m = input.value;
      $('#step .slider-v strong').textContent = m;
      input.setAttribute('aria-valuetext', m + ' ' + T.minUnit);
      input.style.setProperty('--p', ((m - 1) / 19 * 100) + '%');
      next.textContent = T.confirm(m);
    };
    input.addEventListener('input', show);
    show();
    next.addEventListener('click', () => { state.a.q5 = input.value; go(state.i + 1); });
  }

  function questionHTML(q) {
    if (q.slider) return sliderHTML(q);
    const sel = selected(q);
    const chips = q.options.map(o =>
      `<button type="button" class="chip" data-v="${o.v}" aria-pressed="${sel.includes(o.v)}">${esc(shown(q.id, o.v).label)}</button>`).join('');
    const withText = q.options.find(o => o.other);
    const other = withText
      ? `<label class="fld other" ${sel.includes(withText.v) ? '' : 'hidden'}><span>${T.which}</span>
         <input type="text" maxlength="60" value="${esc(state.a[q.id + '_other'])}" autocomplete="off"></label>` : '';
    const needsNext = q.multi || (withText && sel.includes(withText.v));
    return `<h2 tabindex="-1">${esc(titleOf(q))}</h2>` +
      (q.multi ? `<p class="hint">${esc(T.hint)}</p>` : '') +
      `<div class="chips${q.multi ? ' multi' : ''}" role="group" aria-label="${esc(titleOf(q))}">${chips}</div>${other}` +
      `<button type="button" class="btn btn-primary wide next" ${needsNext ? '' : 'hidden'} ${sel.length ? '' : 'disabled'}>${T.next}</button>`;
  }

  function bindQuestion(q) {
    if (q.slider) return bindSlider();
    const next = $('#step .next');
    next.addEventListener('click', () => go(state.i + 1));
    const otherBox = $('#step .other');
    if (otherBox) otherBox.querySelector('input').addEventListener('input', e => { state.a[q.id + '_other'] = e.target.value; });
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
      if (q.multi) {
        const withText = q.options.find(x => x.other);
        if (withText && otherBox) {
          otherBox.hidden = !sel.includes(withText.v);
          if (o.v === withText.v && !otherBox.hidden) otherBox.querySelector('input').focus();
        }
        return;
      }
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
    return `<h2 tabindex="-1">${T.contactTitle}</h2>
      <form id="contact">
        <label class="fld"><span>${T.firstName}</span><input name="first_name" required maxlength="60" autocomplete="given-name" value="${v('first_name')}"></label>
        <label class="fld"><span>${T.company}</span><input name="company" required maxlength="100" autocomplete="organization" value="${v('company')}"></label>
        <label class="fld"><span>${T.email}</span><input name="email" type="email" required maxlength="120" autocomplete="email"
          pattern="[^@\\s]+@[^@\\s]+\\.[^@\\s]{2,}" value="${v('email')}"></label>
        <label class="fld"><span>${T.phone} <em>${T.optional}</em></span><input name="phone" type="tel" maxlength="30" autocomplete="tel" value="${v('phone')}"></label>
        <label class="hp" aria-hidden="true">${T.website}<input name="website" tabindex="-1" autocomplete="off"></label>
        <button type="submit" class="btn btn-primary btn-lg wide">${T.submit}</button>
        <p class="notice">${T.notice}
          <a href="${T.privacyHref}">${T.privacy}</a></p>
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
      // The result never waits on this, and a failure stays invisible. A local copy never posts:
      // the URL in patterns.json is the live one.
      const local = /^(localhost|127\.0\.0\.1|)$/.test(location.hostname);
      if (cfg && isSet(cfg.apps_script_url) && !local) {
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
  const tag = c => `<p class="tag ${c}">${esc(W()[c])}</p>`;
  const CTA = T.cta;
  const toolClass = t => (['IA', 'AI', 'Automatisation', 'Automation'].includes(t) ? ' ai' : ['Vous', 'You'].includes(t) ? ' you' : '');
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
      ? `<p class="sent${b.low ? ' main' : ''}">${T.sent(esc(contact.email))}</p>` : '';

    let h = `<header class="rhead">
      <h1>${T.result}</h1>
      <div class="fig">
        <p class="big">${num(c.hours)} <span>${T.perYear}</span></p>
        <p class="unit">${T.spent}</p>
        <p class="small">${T.basis(num(c.volume), c.minutes)}</p>
      </div>
    </header>`;
    h += block(T.today,
      `<ul class="legend"><li class="human">${T.legend[2]}</li><li class="auto">${T.legend[1]}</li></ul>` +
      flowHTML(todayFlow(a, p)));
    if (p) {
      const n = eliminated(a, p);
      h += block(T.change, flowHTML(afterFlow(p, a)) + `<p class="elim">${T.elim(n)}</p>`);
    }
    h += `<section class="gain">
      <h2>${T.gainTitle}</h2>
      <p class="gain-t">${T.gainText}</p>
      <img src="../assets/michael-320.jpg" alt="Michael Laberge" width="265" height="320" loading="lazy">
      <div class="gain-cta">${b.low ? sent + bookLink : bookBtn + sent}</div>
    </section>`;
    if (p) {
      const steps = p.steps.map(s => stepOf(s, a));
      const tools = [...new Set(steps.map(s => s.tool).filter(t => t && !['Vous', 'You'].includes(t)))];
      const others = sel.others.map(o =>
        `<div class="card mini"><h4>${esc(fill(o.name, a))}</h4><p class="desc">${esc(fill(o.description, a))}</p>${tag(o.confidence)}</div>`).join('');
      h += block(T.first,
        `<div class="card">${tag(p.confidence)}<h3>${esc(fill(p.name, a))}</h3>` +
        (tools.length ? `<p class="tools">${T.tools}${tools.map(esc).join(' · ')}</p>` : '') +
        '<ol class="steps">' + steps.map(s =>
          `<li>${s.tool ? `<span class="tool${toolClass(s.tool)}">${esc(s.tool)}</span>` : ''}${esc(s.text)}</li>`).join('') +
        '</ol></div>' + (others ? `<h3 class="others-t">${T.others}</h3>${others}` : ''));
      h += block(T.why,
        '<ul class="exc">' + p.exceptions.map(x =>
          `<li><strong>${esc(fill(x.case, a))}.</strong> ${esc(fill(x.handling, a))}</li>`).join('') + '</ul>' +
        `<p class="diy">${T.diy(esc(p.diy.setup_time), esc(p.diy.difficulty))}</p>`);
    }
    h += `<section class="rblock cta"><h2>${T.endTitle}</h2>
      <p>${T.endText}</p>
      ${b.low ? bookLink : bookBtn}
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
