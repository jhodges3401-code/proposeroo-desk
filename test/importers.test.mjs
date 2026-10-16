import test from 'node:test'; import assert from 'node:assert/strict';
import * as D from '../core.js'; import * as I from '../importers.js';
const HARVEST = `Date,Client,Project,Project Code,Task,Notes,Hours,Hours Rounded,Billable?,Invoiced?,Approved?,First Name,Last Name,Roles,Employee?,Billable Rate,Billable Amount,Cost Rate,Cost Amount,Currency,External Reference URL
2026-10-01,Acme,Website,WEB,Design,"Homepage, hero ""v2""",1.5,1.5,Yes,No,No,Jane,Doe,,Yes,85,127.5,0,0,US Dollar - USD,
2026-10-02,Acme,Website,WEB,Meetings,Kickoff,0.75,0.75,Yes,Yes,No,Jane,Doe,,Yes,85,63.75,0,0,US Dollar - USD,
2026-10-02,Beta LLC,SEO,,Research,,2,2,No,No,No,Jane,Doe,,Yes,60,0,0,0,US Dollar - USD,
`;
const TOGGL = '\uFEFFUser,Email,Client,Project,Task,Description,Billable,Start date,Start time,End date,End time,Duration,Tags,Amount (USD)\r\nJane,j@x.com,Acme,Website,,Copy edits,Yes,2026-10-03,09:00:00,2026-10-03,10:30:00,01:30:00,,\r\n';
const GENERIC = 'date,project,hours,description\n10/04/2026,Logo,2.25,Sketches\nbad,Logo,1,x\n';

test('CSV parser handles quotes, commas, BOM and CRLF', () => {
  assert.deepEqual(I.parseCSV('a,"b,c","d ""e"""\r\n1,2,3'), [['a', 'b,c', 'd "e"'], ['1', '2', '3']]);
  assert.equal(I.parseCSV(TOGGL)[0][0], 'User');
});
test('Harvest export: detected, invoiced rows not billable, rates applied', () => {
  const pv = I.previewImport(HARVEST); assert.equal(pv.format, 'harvest'); assert.equal(pv.items.length, 3); assert.equal(pv.totalMinutes, 255);
  assert.equal(pv.items[0].note, 'Design: Homepage, hero "v2"');
  const s = D.emptyState(); const r = I.applyImport(s, pv); assert.deepEqual(r, { clients: 2, projects: 2, entries: 3 });
  const acme = s.clients.find(c => c.name === 'Acme'); assert.equal(s.projects.find(p => p.clientId === acme.id).rate, 85);
  assert.equal(D.unbilled(s, acme.id).length, 1); // invoiced row excluded
  const inv = D.invoiceFromTime(s, { clientId: acme.id }); assert.equal(D.totals(inv).subtotal, 127.5);
});
test('Toggl-style export with HH:MM:SS durations', () => {
  const pv = I.previewImport(TOGGL); assert.equal(pv.format, 'generic'); assert.equal(pv.items[0].minutes, 90); assert.equal(pv.items[0].date, '2026-10-03'); assert.equal(pv.items[0].note, 'Copy edits');
});
test('Generic CSV: US dates, missing client, bad rows reported', () => {
  const pv = I.previewImport(GENERIC); assert.equal(pv.items.length, 1); assert.equal(pv.items[0].date, '2026-10-04');
  assert.equal(pv.items[0].minutes, 135); assert.equal(pv.items[0].client, 'Imported client'); assert.equal(pv.errors.length, 1);
});
test('Rejects files without required columns; re-import reuses clients/projects', () => {
  assert.throws(() => I.previewImport('foo,bar\n1,2'), /Could not find/);
  const s = D.emptyState(); I.applyImport(s, I.previewImport(HARVEST)); const r = I.applyImport(s, I.previewImport(HARVEST));
  assert.deepEqual(r, { clients: 0, projects: 0, entries: 3 });
});
