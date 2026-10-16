import test from 'node:test'; import assert from 'node:assert/strict';
import * as D from '../core.js';
const mem = () => { const m = {}; return { getItem: k => m[k] ?? null, setItem: (k, v) => { m[k] = v; } }; };
function seed() { const s = D.emptyState(); const c = D.addClient(s, { name: 'Acme' }); const p = D.addProject(s, { clientId: c.id, name: 'Website', rate: 85 }); return { s, c, p }; }

test('save/load roundtrip and bad data falls back', () => {
  const st = mem(); const { s } = seed(); D.save(st, s); assert.equal(D.load(st).clients[0].name, 'Acme');
  st.setItem(D.KEY, '{broken'); assert.deepEqual(D.load(st).clients, []);
});
test('timer creates entry rounded up to minute; one timer only', () => {
  const { s, p } = seed(); D.startTimer(s, p.id, 'design', 0);
  assert.throws(() => D.startTimer(s, p.id, '', 1)); assert.equal(D.fmtDuration(D.timerElapsed(s, 3661000)), '01:01:01');
  const e = D.stopTimer(s, 90 * 1000); assert.equal(e.minutes, 2); assert.equal(s.timer, null);
  assert.throws(() => D.stopTimer(s));
});
test('manual entry validation, edit and delete', () => {
  const { s, p } = seed(); assert.throws(() => D.addEntry(s, { projectId: p.id, minutes: 0 }));
  assert.throws(() => D.addEntry(s, { projectId: 'nope', minutes: 5 }));
  const e = D.addEntry(s, { projectId: p.id, minutes: 30, date: '2026-10-10' }); D.updateEntry(s, e.id, { minutes: 45 });
  assert.equal(s.entries[0].minutes, 45); D.deleteEntry(s, e.id); assert.equal(s.entries.length, 0);
});
test('time → invoice: totals in cents, entries locked, range + non-billable respected', () => {
  const { s, c, p } = seed(); const p2 = D.addProject(s, { clientId: c.id, name: 'SEO', rate: 60 });
  D.addEntry(s, { projectId: p.id, minutes: 90, date: '2026-10-01' });
  D.addEntry(s, { projectId: p.id, minutes: 30, date: '2026-10-02' });
  D.addEntry(s, { projectId: p2.id, minutes: 20, date: '2026-10-02' });
  D.addEntry(s, { projectId: p.id, minutes: 60, date: '2026-10-02', billable: false });
  D.addEntry(s, { projectId: p.id, minutes: 60, date: '2026-11-01' });
  const inv = D.invoiceFromTime(s, { clientId: c.id, from: '2026-10-01', to: '2026-10-31', date: '2026-10-31', taxPct: 10 });
  assert.equal(inv.number, 'INV-0001'); assert.equal(inv.items.length, 2);
  assert.equal(inv.items[0].qty, 2); assert.equal(inv.items[1].qty, 0.33);
  assert.deepEqual(D.totals(inv), { subtotal: 189.8, tax: 18.98, total: 208.78 });
  assert.equal(inv.due, '2026-11-14');
  assert.throws(() => D.invoiceFromTime(s, { clientId: c.id, from: '2026-10-01', to: '2026-10-31' }), /No unbilled/);
  assert.throws(() => D.deleteEntry(s, s.entries[0].id), /invoiced/);
  D.deleteInvoice(s, inv.id); assert.equal(D.unbilled(s, c.id, '2026-10-01', '2026-10-31').length, 3);
});
test('quote → invoice, paid/unpaid and overdue', () => {
  const { s, c } = seed(); const q = D.makeQuote(s, { clientId: c.id, items: [{ desc: 'Logo', qty: 1, price: 0.1 }, { desc: 'Pages', qty: 3, price: 0.2 }] });
  assert.equal(q.number, 'Q-0001'); assert.equal(D.totals(q).subtotal, 0.7);
  const inv = D.invoiceFromQuote(s, q.id, { date: '2026-10-01' }); assert.equal(q.status, 'accepted');
  assert.equal(D.isOverdue(inv, '2026-10-20'), true); D.setPaid(s, inv.id, true, '2026-10-16');
  assert.equal(inv.status, 'paid'); assert.equal(inv.paidAt, '2026-10-16'); assert.equal(D.isOverdue(inv, '2026-10-20'), false);
  D.setPaid(s, inv.id, false); assert.equal(inv.paidAt, null);
});
test('CSV export escapes quotes/commas and neutralizes formulas; JSON import validates', () => {
  const { s, c, p } = seed(); D.addEntry(s, { projectId: p.id, minutes: 60, note: '=HYPERLINK("x"), "hi"', date: '2026-10-01' });
  const csv = D.entriesCSV(s); assert.match(csv, /^date,client,project/); assert.match(csv, /"'=HYPERLINK\(""x""\), ""hi"""/);
  D.invoiceFromTime(s, { clientId: c.id }); assert.match(D.invoicesCSV(s), /INV-0001,Acme,.*,85\.00,0\.00,85\.00,unpaid/);
  assert.equal(D.importJSON(D.exportJSON(s)).entries.length, 1); assert.throws(() => D.importJSON('{"v":2}'));
});
