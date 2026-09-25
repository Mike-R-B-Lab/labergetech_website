// node --test facturation/quiz.test.js
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const Q = require('./quiz.js');

const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'patterns.json'), 'utf8'));
const base = { q2: 'quickbooks', q2_other: '', q3: ['papier'], q4: '30-100', q5: '6', q6: 'temps' };
const A = over => Object.assign({}, base, over);

test('five questions, hours straight from their volume and their minutes', () => {
  assert.deepStrictEqual(Q.QUESTIONS.map(q => q.id), ['q2', 'q3', 'q4', 'q5', 'q6']);
  assert.deepStrictEqual(Q.QUESTIONS[3].options.map(o => o.min), Array.from({ length: 20 }, (_, i) => i + 1));
  assert.deepStrictEqual(Q.calc(base), { minutes: 6, volume: 65, hours: 78, manual: 4 }, '65 x 6 x 12 / 60 = 78');
  assert.strictEqual(Q.calc(A({ q2: 'papier' })).hours, 78, 'where they make invoices no longer changes the minutes');
  assert.strictEqual(Q.calc(A({ q4: '100-300', q5: '12' })).hours, 480);
  assert.strictEqual(Q.calc(A({ q4: 'lt30', q5: '1' })).hours, 4, '20 x 1 min x 12 / 60 = 4 h, not rounded away');
  assert.strictEqual(Q.calc(A({ q4: 'gt1000', q5: '20' })).hours, 4800);
});

test('days, weeks, then full-time people', () => {
  assert.strictEqual(Q.figure(190).unit, 'journées complètes par année');
  assert.deepStrictEqual(Q.figure(510), { big: '13,6', unit: 'semaines de travail à temps plein par année' });
  assert.strictEqual(Q.figure(1950).big, '52');
  assert.deepStrictEqual(Q.figure(3120), { big: '1,6', unit: "personne à temps plein, à l'année" });
  assert.strictEqual(Q.figure(5380).unit, "personnes à temps plein, à l'année");
});

test('today flow: steps of the featured source, in their software', () => {
  const flow = a => Q.todayFlow(A(a), Q.selectPatterns(A(a), cfg.patterns).primary).map(n => n.label);
  assert.deepStrictEqual(flow({ q2: 'sage50', q3: ['courriel'] }), ['Vous recevez un bon de commande par courriel',
    'Vous ouvrez le courriel et regardez les informations', 'Vous retapez les lignes dans Sage 50', 'Vous vérifiez les prix', 'Vous envoyez la facture']);
  assert.strictEqual(flow({ q2: 'excel', q3: ['textos'] })[2], 'Vous retapez la commande dans votre gabarit Excel');
  assert.strictEqual(flow({ q2: 'papier', q3: ['textos'] })[2], 'Vous écrivez la facture à la main');
  assert.strictEqual(flow({ q2: 'autre', q2_other: 'Maestro', q3: ['livraison'] })[2], 'Vous retapez la livraison dans Maestro');
  assert.strictEqual(flow({ q2: 'excel', q3: ['courriel', 'papier'] })[0], 'Vous remplissez un bon de travail papier',
    'several sources: only the featured one, so both flows compare the same thing');
  const s = Q.todayFlow(A({ q3: ['soumission'] }));
  assert.deepStrictEqual(s.slice(0, 2).map(n => n.kind), ['source', 'plain'], 'waiting for the job is not manual work');
  Q.QUESTIONS[1].options.forEach(o =>
    assert.strictEqual(Q.todayFlow(A({ q3: [o.v] })).filter(n => n.kind === 'manual').length, 4, o.v + ': 4 manual steps'));
});

test('automated flow: who does what, with the software named', () => {
  const p = cfg.patterns.find(x => x.id === 'email-po-to-invoice-draft');
  assert.deepStrictEqual(Q.afterFlow(p, A({ q2: 'excel' })).map(n => n.label), ['Vous recevez un bon de commande par courriel',
    "L'IA lit le bon", 'Les prix sont vérifiés', 'Facture préparée dans votre gabarit Excel', 'Vous approuvez', 'La facture part au client']);
  assert.strictEqual(Q.afterFlow(p, A({ q2: 'papier' }))[3].label, 'Facture préparée dans un logiciel de facturation');
  assert.strictEqual(Q.afterFlow(p, A({ q2: 'autre' }))[3].label, 'Brouillon créé dans votre logiciel');
  const portal = cfg.patterns.find(x => x.id === 'portal-orders-to-monthly-invoice');
  assert.strictEqual(Q.afterFlow(portal, A({ q2: 'excel' }))[3].label, 'Factures préparées dans votre gabarit Excel');
  const t = cfg.patterns.find(x => x.id === 'text-screenshot-to-invoice');
  assert.deepStrictEqual(Q.afterFlow(t, base).filter(n => n.kind === 'human').map(n => n.label),
    ["Vous envoyez une capture d'écran", 'Vous approuvez']);
  assert.strictEqual(Q.eliminated(A({ q3: ['textos'] }), t), 2, 'steps the person still does are not counted as eliminated');
});

test('primary: a match with where invoices are made beats priority, otherwise priority', () => {
  const sel = a => Q.selectPatterns(A(a), cfg.patterns);
  assert.strictEqual(sel({ q2: 'excel', q3: ['papier', 'soumission'] }).primary.id, 'excel-quote-to-job-to-invoice');
  assert.strictEqual(sel({ q2: 'quickbooks', q3: ['papier', 'soumission'] }).primary.id, 'paper-workorder-photo-to-invoice');
  assert.strictEqual(sel({ q2: 'papier', q3: ['courriel', 'livraison'] }).primary.id, 'delivery-proof-to-invoice');
});

test('Q6-only patterns show up only on their Q6 answer, first among others', () => {
  const ids = a => Q.selectPatterns(A(a), cfg.patterns).others.map(p => p.id);
  assert.deepStrictEqual(ids({ q3: ['papier'] }), []);
  assert.deepStrictEqual(ids({ q3: ['papier', 'courriel', 'portail'], q6: 'suivis' }),
    ['payment-follow-up', 'email-po-to-invoice-draft']);
  assert.deepStrictEqual(ids({ q3: ['papier'], q6: 'retard' }), ['invoice-on-completion']);
});

test('confidence', () => {
  const conf = a => Q.selectPatterns(A(a), cfg.patterns).primary.confidence;
  assert.strictEqual(conf({}), 'forte');
  assert.strictEqual(conf({ q2: 'acomba' }), 'forte');
  assert.strictEqual(conf({ q2: 'excel' }), 'forte');
  assert.strictEqual(conf({ q2: 'papier' }), 'valider');
  assert.strictEqual(conf({ q2: 'autre', q2_other: 'Maestro' }), 'valider');
  assert.strictEqual(conf({ q3: ['textos'] }), 'valider');
  assert.strictEqual(Q.selectPatterns(A({ q6: 'suivis' }), cfg.patterns).others[0].confidence, 'forte');
});

test('{logiciel} and French colon spacing', () => {
  assert.strictEqual(Q.fill(cfg.patterns.find(p => p.id === 'excel-quote-to-job-to-invoice').name, A({ q2: 'acomba' })),
    'Soumission Excel → automatisation débute → brouillon de facture créé dans Acomba');
  assert.strictEqual(Q.fill('dans {logiciel}', A({ q2: 'papier' })), 'dans QuickBooks Online');
  assert.strictEqual(Q.fill('dans {logiciel}', A({ q2: 'autre', q2_other: ' Maestro ' })), 'dans Maestro');
  assert.strictEqual(Q.fill('dans {logiciel}', A({ q2: 'autre' })), 'dans votre logiciel');
  assert.strictEqual(Q.fill('lu : client', base), 'lu\u00a0: client');
});

test('eliminated steps: manual steps minus approvals', () => {
  const p = Q.selectPatterns(base, cfg.patterns).primary;
  assert.strictEqual(Q.eliminated(base, p), 3);
});

test('steps carry a short tool tag', () => {
  const p = cfg.patterns.find(x => x.id === 'excel-quote-to-job-to-invoice');
  const s = Q.stepOf(p.steps[3], A({ q2: 'sage50' }));
  assert.strictEqual(s.tool, 'Sage 50');
  assert.match(s.text, /créé dans Sage 50/);
  assert.strictEqual(Q.stepOf(p.steps[3], A({ q2: 'excel' })).tool, 'Excel ou Google Sheets');
  assert.strictEqual(Q.stepOf(p.steps[3], A({ q2: 'autre', q2_other: 'maestro' })).tool, 'Maestro');
  assert.deepStrictEqual(Q.stepOf('Texte seul', base), { tool: '', text: 'Texte seul' });
});

test('answers survive the URL hash; junk is rejected', () => {
  const a = A({ q3: ['papier', 'textos', 'portail'] });
  assert.deepStrictEqual(Q.decodeAnswers('#' + Q.encodeAnswers(a)), a);
  assert.strictEqual(Q.decodeAnswers('#q2=papier'), null);
  assert.strictEqual(Q.decodeAnswers('#' + Q.encodeAnswers(a).replace('q5=6', 'q5=21')), null, 'minutes outside 1 to 20');
  assert.strictEqual(Q.decodeAnswers('#' + Q.encodeAnswers(a).replace('q4=30-100', 'q4=<b>')), null);
});

test('payload carries answers, figure, patterns and UTM', () => {
  const p = Q.payload(base, { first_name: 'Julie', company: 'X', email: 'j@x.ca', phone: '', website: '' }, cfg,
    'https://labergetech.com/facturation/?r=S00042&utm_source=courriel');
  assert.strictEqual(p.ref, 'S00042');
  assert.strictEqual(p.utm_source, 'courriel');
  assert.strictEqual(p.figure, 'environ 10 journées complètes par année');
  assert.strictEqual(p.primary_pattern, 'paper-workorder-photo-to-invoice');
  assert.ok(!('wants_email_copy' in p));
  assert.strictEqual(p.minutes_per_invoice, 6);
});

test('patterns.json is complete and the copy has no dashes', () => {
  const ids = cfg.patterns.map(p => p.id);
  assert.strictEqual(new Set(ids).size, 8);
  const labels = id => Q.QUESTIONS.find(q => q.id === id).options.map(o => o.label);
  const sources = labels('q3');
  const q6 = labels('q6');
  const software = labels('q2');
  cfg.patterns.forEach(p => {
    p.triggers.q3.forEach(s => assert.ok(sources.includes(s), p.id + ': unknown Q3 trigger ' + s));
    p.triggers.q6.forEach(s => assert.ok(q6.includes(s), p.id + ': unknown Q6 trigger ' + s));
    p.human_steps.forEach(s => assert.ok(p.after_flow.includes(s), p.id + ': human step not in after_flow'));
    p.supported_software.forEach(s => assert.ok(software.includes(s), p.id + ': unknown software ' + s));
    assert.ok(p.steps.length >= 3 && p.steps.length <= 6, p.id + ': 3 to 6 steps');
    p.steps.forEach(st => assert.ok(st.tool && st.text, p.id + ': every step has a tool and a text'));
    assert.ok(p.exceptions.length >= 3 && p.exceptions.length <= 4, p.id + ': 3 to 4 exceptions');
  });
  sources.forEach(s => assert.ok(cfg.patterns.some(p => p.triggers.q3.includes(s)), 'no pattern for ' + s));
  for (const f of ['patterns.json', 'index.html', 'quiz.js']) {
    const text = fs.readFileSync(path.join(__dirname, f), 'utf8');
    assert.doesNotMatch(text, /[\u2013\u2014]/, f + ' has an en or em dash');
  }
});

test('English: same automation, English words, complete texts', () => {
  const en = JSON.parse(fs.readFileSync(path.join(__dirname, 'patterns.en.json'), 'utf8'));
  cfg.patterns.forEach(p => {
    const t = en[p.id];
    assert.ok(t, p.id + ': no English text');
    assert.strictEqual(t.after_flow.length, p.after_flow.length, p.id + ': flow length differs');
    assert.strictEqual(t.steps.length, p.steps.length, p.id + ': step count differs');
    assert.strictEqual(t.exceptions.length, p.exceptions.length, p.id + ': exception count differs');
    t.human_steps.forEach(s => assert.ok(t.after_flow.includes(s), p.id + ': English human step not in flow'));
  });
  Q.QUESTIONS.forEach(q => q.options.forEach(o => assert.ok(o.label && Q.shown(q.id, o.v).label, q.id + '.' + o.v)));
  Q.setLang('en');
  try {
    const patterns = Q.localize(cfg.patterns, en);
    const a = A({ q2: 'sage50', q3: ['courriel'] });
    const p = Q.selectPatterns(a, patterns).primary;
    assert.strictEqual(p.id, 'email-po-to-invoice-draft');
    assert.deepStrictEqual(Q.todayFlow(a, p).map(n => n.label), ['You receive a purchase order by email', 'You open the email and look at the details',
      'You retype the lines into Sage 50', 'You check the prices', 'You send the invoice']);
    assert.deepStrictEqual(Q.afterFlow(p, a).map(n => n.label), ['You receive a purchase order by email', 'AI reads the order',
      'Prices are checked', 'Draft created in Sage 50', 'You approve', 'The invoice goes to the client']);
    assert.strictEqual(Q.afterFlow(p, A({ q2: 'excel' }))[3].label, 'Invoice prepared in your Excel template');
    assert.strictEqual(Q.afterFlow(p, A({ q2: 'papier' }))[3].label, 'Invoice prepared in invoicing software');
    assert.strictEqual(Q.todayFlow(A({ q2: 'papier', q3: ['textos'] }))[2].label, 'You write the invoice by hand');
    assert.strictEqual(Q.fill('Draft in {logiciel}', A({ q2: 'autre' })), 'Draft in your software');
    assert.strictEqual(Q.confidenceLabel('forte'), 'Strong fit');
    assert.strictEqual(Q.payload(a, { first_name: 'J', company: 'X', email: 'j@x.ca', phone: '', website: '' }, { patterns },
      'https://labergetech.com/invoicing/').software, 'Sage 50');
    assert.strictEqual(Q.payload(A({ q2: 'papier' }), { first_name: 'J', company: 'X', email: 'j@x.ca', phone: '', website: '' },
      { patterns }, 'https://labergetech.com/invoicing/').software, 'Sur papier', 'the Sheet keeps the French labels');
  } finally {
    Q.setLang('fr');
  }
  for (const f of ['patterns.en.json', '../invoicing/index.html', '../privacy/index.html']) {
    assert.doesNotMatch(fs.readFileSync(path.join(__dirname, f), 'utf8'), /[–—]/, f + ' has an en or em dash');
  }
});

test('the minutes slider starts from where they make invoices', () => {
  assert.deepStrictEqual(['quickbooks', 'sage50', 'autre', 'excel', 'papier'].map(v => Q.startMinutes(A({ q2: v }))), [6, 6, 6, 5, 10]);
});
