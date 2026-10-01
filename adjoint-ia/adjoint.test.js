// node --test adjoint-ia/adjoint.test.js
const test = require('node:test');
const assert = require('node:assert');
const Q = require('./adjoint.js');

const base = { metier: 'plomberie', compta: 'qbo', jobs: ['jobber'], courriel: 'm365', ca: '250k-1m', role: 'proprietaire',
  temps: 'soumissions' };
const A = over => Object.assign({}, base, over);

test('result: only "not in construction" rejects', () => {
  assert.strictEqual(Q.result(A({ metier: 'hors' })), 'refus_A');
  assert.ok(!Q.QUESTIONS.some(q => q.id === 'investir'), 'no investment question: if they are here, they are');
  assert.strictEqual(Q.result(A({ compta: 'aucun', jobs: ['excel'], courriel: 'autre' })), 'qualifie_cerveau', 'Excel, paper and no business email still get a call');
});

test('result: scope follows the best tier', () => {
  assert.strictEqual(Q.result(base), 'qualifie_complet');
  assert.strictEqual(Q.result(A({ compta: 'acomba', jobs: ['excel'] })), 'qualifie_cerveau', 'Acomba desktop + Outlook is not rejected');
  assert.strictEqual(Q.result(A({ compta: 'sage50', jobs: ['jobber'] })), 'qualifie_complet', 'Jobber alone is enough');
  assert.strictEqual(Q.result(A({ compta: 'aucun', jobs: ['excel'], courriel: 'gmail' })), 'qualifie_cerveau', 'email alone');
  assert.strictEqual(Q.result(A({ compta: 'acomba', jobs: ['excel'], courriel: 'autre' })), 'qualifie_cerveau', 'bridge alone');
});

test('payload carries labels, tiers, variant and UTMs', () => {
  const p = Q.payload(A({ jobs: ['excel', 'hubspot'] }), { prenom: 'Luc' }, 'B', 'https://labergetech.com/adjoint-ia/direct/?utm_source=fb&utm_content=n3');
  assert.strictEqual(p.variante, 'B');
  assert.strictEqual(p.compta, 'QuickBooks Online');
  assert.deepStrictEqual(p.jobs, ['Excel ou papier', 'HubSpot']);
  assert.strictEqual(p.jobs_tier, 1);
  assert.strictEqual(p.utm_content, 'n3');
  assert.strictEqual(p.prenom, 'Luc');
  assert.strictEqual(p.resultat, 'qualifie_complet');
});

test('every option with a tier has one from 1 to 4', () => {
  for (const q of Q.QUESTIONS.filter(q => ['compta', 'jobs', 'courriel'].includes(q.id)))
    for (const o of q.options) assert.ok([1, 2, 3, 4].includes(o.tier), q.id + ':' + o.v);
});

test('payload: ad click data, URL UTMs win over the stored first touch', () => {
  const src = { fbc: 'fb.1.1700000000000.abc', fbp: 'fb.1.1.2', event_id: 'e1', user_agent: 'UA', utm_source: 'old', utm_campaign: 'c1' };
  const p = Q.payload(base, {}, 'A', 'https://labergetech.com/adjoint-ia/?utm_source=fb', src);
  assert.strictEqual(p.utm_source, 'fb');
  assert.strictEqual(p.utm_campaign, 'c1', 'reload without UTMs keeps the first touch');
  assert.deepStrictEqual([p.fbc, p.fbp, p.event_id, p.user_agent], [src.fbc, 'fb.1.1.2', 'e1', 'UA']);
  assert.strictEqual(Q.payload(base, {}, 'A', 'https://x.test/').fbc, '', 'no ad click: empty, not undefined');
});

test('page B: 3 questions (métier, CRM, time), and its short answers make a full payload', () => {
  assert.deepStrictEqual(Q.QUESTIONS.filter(q => q.short).map(q => q.id), ['metier', 'jobs', 'temps']);
  const b = { metier: 'plomberie', jobs: ['excel'], temps: 'soumissions' };
  assert.strictEqual(Q.result(b), 'qualifie_cerveau');
  assert.strictEqual(Q.result({ ...b, jobs: ['jobber'] }), 'qualifie_complet');
  const p = Q.payload(b, { prenom: 'Luc' }, 'B', 'https://labergetech.com/adjoint-ia/direct/');
  assert.deepStrictEqual([p.compta, p.compta_tier, p.courriel, p.ca, p.role], ['', '', '', '', ''], 'skipped questions are blank, not errors');
  assert.deepStrictEqual(p.jobs, ['Excel ou papier']);
});

test('partial lead: contact only, no answers yet, payload still builds', () => {
  const p = Q.payload({ jobs: [] }, { prenom: 'Luc', cellulaire: '514' }, 'A', 'https://labergetech.com/adjoint-ia/');
  assert.deepStrictEqual([p.prenom, p.metier, p.compta, p.jobs_tier], ['Luc', '', '', '']);
});
