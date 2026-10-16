<p align="center"><a href="https://jhodges3401-code.github.io/rate-calculator/desk/"><img src="docs/banner.svg" alt="Proposeroo Desk" width="100%"></a></p>

<p align="center">
<a href="https://jhodges3401-code.github.io/rate-calculator/desk/"><img alt="Live app" src="https://img.shields.io/badge/live%20app-online-14b8a6"></a>
<img alt="Local-first" src="https://img.shields.io/badge/data-local--first-0f766e">
<img alt="No server" src="https://img.shields.io/badge/server-none-0f172a">
<img alt="Status" src="https://img.shields.io/badge/status-preview-b45309">
</p>

<p align="center"><b><a href="https://jhodges3401-code.github.io/rate-calculator/desk/">Open the live app</a></b> · ⭐ <b>Star this repo</b> to follow the 1.0 release</p>

# Proposeroo Desk (preview)
Local-first quotes, time tracking and invoices that run entirely in your browser. No account, no server, and no network calls. Built from scratch by Orvian Market.

<p align="center"><img src="docs/shot.svg" alt="Screenshot of Proposeroo Desk" width="100%"></p>

## Features
| | |
|---|---|
| ⏱️ Timer and manual time entries | 🧾 Invoices and quotes, print-optimized for "Save as PDF" |
| 👥 Clients and projects | 💾 One JSON document in `localStorage` (`prd:v1`) |
| 📤 JSON backup and CSV export | 🔒 No account, no network calls |

## Quick start
Open the [live app](https://jhodges3401-code.github.io/rate-calculator/desk/), or clone this repo and serve the folder with any static server (`npx serve .`).

## Development
- Spec: [SPEC.md](SPEC.md)
- Tests: `node --test test/core.test.mjs` (core) and `node test/e2e.mjs <url> <shotDir>` (browser)

Preview build. Not yet for sale. Independent software; not affiliated with any vendor named in the comparison pages.
