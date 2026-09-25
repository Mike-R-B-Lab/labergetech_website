// node --test facturation/quiz.test.js
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const Q = require('./quiz.js');

const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'patterns.json'), 'utf8'));
const base = { q2: 'quickbooks', q2_other: '', q3: ['papier'], q4: '30-100', q6: 'temps' };
const A = over => Object.assign({}, base, over);

test('four questions, minutes per invoice from where invoices are made', () => {
  assert.deepStrictEqual(Q.QUESTIONS.map(q => q.id), ['q2', 'q3', 'q4', 'q6']);
  assert.deepStrictEqual(['quickbooks', 'autre', 'excel', 'papier'].map(v => Q.calc(A({ q2: v })).minutes), [6, 6, 6, 10]);
  const c = Q.calc(base);
  assert.deepStrictEqual(c, { minutes: 6, volume: 65, hours: 100, manual: 4, perInvoice: 7.8 });
  assert.ok(Math.abs(c.volume * c.perInvoice * 12 / 60 - c.hours) < 5, 'volume x min/facture adds up to the hours shown');
  assert.deepStrictEqual(Q.figure(c.hours), { big: '13', unit: 'journées complètes par année' });
});

test('days, weeks, then full-time people', () => {
  assert.strictEqual(Q.figure(190).unit, 'journées complètes par année');
  assert.deepStrictEqual(Q.figure(510), { big: '13,6', unit: 'semaines de travail à temps plein par année' });
  assert.strictEqual(Q.figure(1950).big, '52');
  assert.strictEqual(Q.calc(A({ q2: 'papier', q4: '300-1000' })).hours, 1690);
  assert.strictEqual(Q.calc(A({ q2: 'papier', q4: 'gt1000' })).hours, 3120);
  assert.deepStrictEqual(Q.figure(3120), { big: '1,6', unit: "personne à temps plein, à l'année" });
  assert.strictEqual(Q.figure(5380).unit, "personnes à temps plein, à l'année");
});

test('today flow: source, copy, create, check, send', () => {
  assert.deepStrictEqual(Q.todayFlow(A({ q3: ['soumission', 'courriel'] })).map(n => n.label), [
    'Le client envoie son bon par courriel + La soumission Excel est acceptée', 'Vous recopiez les données',
    'Vous créez la facture', 'Vous la vérifiez', "Vous l'envoyez"]);
  assert.strictEqual(Q.todayFlow(A({ q2: 'papier' }))[2].label, 'Vous écrivez la facture');
});

test('automated flow: who does what, with the software named', () => {
  const p = cfg.patterns.find(x => x.id === 'email-po-to-invoice-draft');
  assert.deepStrictEqual(Q.afterFlow(p, A({ q2: 'excel' })).map(n => n.label), ['Le client envoie son bon par courriel',
    "L'IA lit le bon", 'Les prix sont vérifiés', 'Brouillon créé dans Excel ou Google Sheets', 'Vous approuvez', 'La facture part au client']);
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
  assert.strictEqual(conf({ q3: ['appels'] }), 'valider');
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
  const a = A({ q3: ['papier', 'textos', 'appels'] });
  assert.deepStrictEqual(Q.decodeAnswers('#' + Q.encodeAnswers(a)), a);
  assert.strictEqual(Q.decodeAnswers('#q2=papier'), null);
  assert.strictEqual(Q.decodeAnswers('#' + Q.encodeAnswers(a).replace('q4=30-100', 'q4=<b>')), null);
});

test('payload carries answers, figure, patterns and UTM', () => {
  const p = Q.payload(base, { first_name: 'Julie', company: 'X', email: 'j@x.ca', phone: '', website: '' }, cfg,
    'https://labergetech.com/facturation/?r=S00042&utm_source=courriel');
  assert.strictEqual(p.ref, 'S00042');
  assert.strictEqual(p.utm_source, 'courriel');
  assert.strictEqual(p.figure, 'environ 13 journées complètes par année');
  assert.strictEqual(p.primary_pattern, 'paper-workorder-photo-to-invoice');
  assert.ok(!('wants_email_copy' in p));
  assert.strictEqual(p.minutes_all_steps, 7.8);
});

test('patterns.json is complete and the copy has no dashes', () => {
  const ids = cfg.patterns.map(p => p.id);
  assert.strictEqual(new Set(ids).size, 9);
  const sources = Q.QUESTIONS[1].options.map(o => o.label);
  const q6 = Q.QUESTIONS[3].options.map(o => o.label);
  const software = Q.QUESTIONS[0].options.map(o => o.label);
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
