# Candle

`core-flow.html` is the complete, self-contained Core Flow. Copy that file alone
to any folder and open it directly in a browser. No server, installation, adjacent
files, or internet connection is required to display and use the interface.

The file contains all 23 screen layouts, the original styles, input/display
JavaScript, 9 images, inline SVG icons, and four full embedded font faces. Font licenses and
copyright notices are included inside the HTML. `index.html` is an identical
hosting entry point; it is not required to use `core-flow.html`.

Without a fragment the login screen opens. All four login buttons skip
authentication and open the home screen without creating or saving a session.
Other screens are accessible through fragment addresses such as `#home`,
`#consent`, `#prediction`, `#shop`, and `#payout`.

## Supported input

- Stock name/code search, market filters, and empty results.
- Stock, direction, and product selection reflected in related screens.
- Aggregate and individual consent, including the indeterminate state.
- Phone/name validation, required consent, and matching reward recipient fields.
- Advertisement information sheet, navigation, and browser back/forward.

Input state stays in the current document. Recipient fields are cleared when
leaving their flow. Forms do not transmit their values, including on Enter.

## Server boundary

Actual authentication requires a server; login buttons only navigate locally.
Consent submission, prediction acceptance, eligibility checks, attendance, ad
verification, reward claims, payout, and logout report that a real server
connection is required. No business API integration or mock transaction processing
runs in this file. No receipt, balance, ticket grant, winning status, or logged-in
session is manufactured by JavaScript.

Unknown balances, prices, counts, and eligibility are unavailable. Stock names and
product denominations are selectable UI options, not live quotes, inventory, or
affordable balances. Approved legal documents and payout policies require a server.

## Editing and checks

Edit markup, styles, and input/display code directly inside `core-flow.html`.
Copy it to `index.html` after changes so both entry points remain identical.
External files under `src/` remain as reference; the standalone file does not load
them. Editing those reference files alone does not change the standalone page.

```sh
npm run build
npm run test:e2e
```

The build copies the two self-contained HTML entry points and hosting headers to
`dist/`. It does not ship any external CSS, JavaScript, images, or font files.
The browser check tests source and built pages, then copies only `core-flow.html`
to an otherwise empty folder and repeats all controls and 23-screen mobile/desktop
checks with the network offline. It also verifies that no external file/resource
requests, business requests, storage, or fabricated server state occur.

`npm run dev` remains available for optional HTTP preview. The separate introduction
page is in `landing/`. Previous service code/tests remain reference-only; the old
integration scripts under `test:e2e:legacy` do not target the current interface.
See [LEGACY_RUNTIME.md](docs/LEGACY_RUNTIME.md) for historical runtime notes and
[BRAND_ASSETS.md](docs/BRAND_ASSETS.md) for logo attribution.
