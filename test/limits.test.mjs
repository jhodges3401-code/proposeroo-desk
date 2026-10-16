import test from 'node:test'; import assert from 'node:assert/strict';
import * as D from '../core.js'; import * as L from '../limits.js';
// Throwaway signing key generated per run: the real private key and sellable keys never touch the repo.
const kp = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
const PUB = await crypto.subtle.exportKey('jwk', kp.publicKey);
const mk = async (plan, id) => `PD1-${plan.toUpperCase()}-${id}-` + Buffer.from(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, kp.privateKey, new TextEncoder().encode(`PD1|${plan}|${id}`))).toString('base64url');
const PRO = await mk('pro', 'TESTKEY2'), TEAM = await mk('team', 'TESTKEY3');
test('free plan: 1 real client, demo clients do not count', () => {
  const s = D.emptyState(); assert.equal(L.plan(s), 'free'); assert.ok(L.canAddClient(s));
  const d = D.addClient(s, { name: 'Sample (demo)' }); d.demo = true; assert.ok(L.canAddClient(s));
  D.addClient(s, { name: 'Acme' }); assert.equal(L.canAddClient(s), false); assert.throws(() => L.assertCanAddClient(s), /free plan/);
  assert.equal(L.canImport(s), false); assert.match(L.pdfFooter(s), /Proposeroo Desk/);
});
test('real public key rejects keys signed by another key', async () => { assert.equal(await L.verifyKey(PRO), null); });
test('signed keys verify offline; tampered, forged and old keys fail', async () => {
  assert.equal(await L.verifyKey(PRO, PUB), 'pro'); assert.equal(await L.verifyKey(TEAM, PUB), 'team');
  assert.equal(await L.verifyKey(' ' + PRO.slice(0, 30) + '\n' + PRO.slice(30) + ' ', PUB), 'pro', 'whitespace tolerant');
  assert.equal(await L.verifyKey(PRO.replace('PD1-PRO-', 'PD1-TEAM-'), PUB), null, 'plan swap fails');
  const id = PRO.split('-')[2]; assert.equal(await L.verifyKey(PRO.replace(id, id[0] === 'A' ? 'B' + id.slice(1) : 'A' + id.slice(1)), PUB), null, 'id change fails');
  const sig = PRO.slice(-5); assert.equal(await L.verifyKey(PRO.slice(0, -5) + (sig[0] === 'A' ? 'B' : 'A') + sig.slice(1), PUB), null, 'sig change fails');
  for (const k of ['PRD-PRO-2026', 'nope', '', null]) assert.equal(await L.verifyKey(k, PUB), null);
});
test('activate / plans / deactivate', async () => {
  const s = D.emptyState(); await assert.rejects(L.activate(s, 'nope', PUB), /not recognized/); assert.equal(L.plan(s), 'free');
  assert.equal(await L.activate(s, PRO, PUB), 'pro'); assert.ok(L.isPro(s)); assert.equal(L.pdfFooter(s), ''); assert.ok(L.canImport(s));
  D.addClient(s, { name: 'A' }); D.addClient(s, { name: 'B' }); assert.ok(L.canAddClient(s));
  assert.equal(await L.activate(s, TEAM, PUB), 'team'); assert.equal(L.planLabel(s), 'Team (5 people)');
  L.deactivate(s); assert.equal(L.plan(s), 'free');
});
test('license survives backup roundtrip; hand-edited plan is dropped by recheck', async () => {
  const s = D.emptyState(); await L.activate(s, PRO, PUB); const r = D.importJSON(D.exportJSON(s)); assert.equal(await L.recheck(r, PUB), 'pro');
  const f = D.emptyState(); f.settings.license = { key: 'fake', plan: 'team' }; assert.equal(L.plan(f), 'team'); assert.equal(await L.recheck(f, PUB), 'free');
  const old = D.emptyState(); old.settings.license = 'PRD-PRO-2026'; assert.equal(await L.recheck(old, PUB), 'free');
});
