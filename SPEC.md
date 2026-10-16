# Proposeroo Desk: spec (Days 1–3)
Audience: freelancers and small service businesses leaving subscription tools after price hikes, on any OS. Pay once, local-first, no account.

## Data (all in the browser, localStorage key `prd:v1`, one JSON document)
- **client** {id, name, email, address, currency}
- **project** {id, clientId, name, rate (hourly, in currency units), archived}
- **entry** (time) {id, projectId, date YYYY-MM-DD, minutes, note, billable, invoiceId|null}
- **timer** {projectId, note, startedAt ms} | null (one running timer; survives reloads)
- **quote** {id, number Q-0001, clientId, date, items[{desc, qty, price}], taxPct, notes, status draft|sent|accepted|declined}
- **invoice** {id, number INV-0001, clientId, date, due, items[{desc, qty, price, entryIds?}], taxPct, notes, status unpaid|paid, paidAt}
- settings {business name, email, address, currency, defaultTaxPct, nextQuote, nextInvoice}
Money is computed in integer cents to avoid float drift.

## Behaviors
1. Timer: start/stop; stopping creates an entry, rounded up to the nearest minute (min 1). Only one timer at a time.
2. Manual entries: add/edit/delete; minutes > 0.
3. Time → invoice: pick a client + date range, and unbilled billable entries for that client's projects become one line per project (hours × rate). The entries are marked with invoiceId so they can't be billed twice. Deleting an invoice releases them.
4. Quote → invoice: copies the items.
5. Invoice totals: subtotal, tax, total; status paid/unpaid with paidAt; overdue = unpaid and past due.
6. PDF: print-optimized invoice/quote view → browser "Save as PDF" (no third-party libs).
7. Export: full JSON backup + CSVs (entries, invoices). Import JSON backup (validated).
8. Privacy: no network calls, and no analytics in the app itself.

## Out of scope until Day 4–5
Harvest/CSV importers, pricing gate, Gumroad, public listing. The page is `noindex` and not linked from the sales sites.
