# Proposeroo Desk (preview)
Local-first quotes, time tracking and invoices that run entirely in your browser. No account, no server, and no network calls. Built from scratch by Orvian Market.

- Data: one JSON document in `localStorage` (`prd:v1`). Export a JSON backup and CSVs from Settings & data.
- PDF: the invoice/quote view is print-optimized, so use your browser's "Save as PDF".
- Spec: [SPEC.md](SPEC.md). Tests: `node --test test/core.test.mjs` (core) and `node test/e2e.mjs <url> <shotDir>` (browser).

Preview build. Not yet for sale.
