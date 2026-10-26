# Candle backend handoff

This directory follows the professor's supplied `backendexample/html` structure.
The latest tracked `core-flow.html` supplied the screen layouts, tutorial, stock
controls, icons and fonts. Each page owns its HTML and backend integration
functions; there is no runtime screen generator, JavaScript module loader, or
required build step. Shared font licenses remain in `css/style.css`.

```text
html/
  index.html                  Native token lookup and start screen
  signup.html                 Native social login and token exchange
  home.html                   Home markup and page data hook
  stock-select.html           Stock rows, search and market filters
  prediction.html             Selected stock and direction
  confirm.html                Final submission hook
  *.html                      Remaining individual screens and legal pages
  css/reset.css               Shared reset
  css/style.css               Current screen styles and font licenses
  css/static.css              Page navigation adjustments
  js/common.js                Selection transfer and shared UI controls
  default/jquery.js           Professor-supplied library
  default/handlebars.min.js   Professor-supplied list-template library
  default/flutter.js          Professor-supplied native bridge
  default/custom.js           Professor-supplied AJAX and binding helpers
  images/                    Current logos and icons
  fonts/                     Four original font faces
```

## Run and edit

From the repository root, run `npm run dev` and open
`http://127.0.0.1:4173/html/`. For a UI-only review open `home.html` directly.
For login start at `index.html` or `signup.html` in the native WebView. A normal
browser has no social-login channels and displays an explanation instead of
creating a session. The whole directory can also be served independently with
`python3 -m http.server 3000` from inside `html/`.

Edit each screen directly. Every HTML page loads jQuery, Handlebars, the bridge,
and the AJAX helper. Its bottom `<script>` contains `listener_load()` for server
reads and named `listener_*` functions for server actions. `js/common.js` calls
these functions after parsing the document or when the matching button is used.
Payout and prize forms validate before invoking their action hooks.

Set `baseUrlForAjax` in `default/custom.js` to the professor's server origin; the
copied default is `http://localhost:8080`. Use an HTTPS origin for deployment.
All four social providers now use this same helper and origin. The supplied
example used relative URLs for three providers; that inconsistency is not copied
into the new page-owned login code. No credentials or service keys are included.

The original `backendexample/` input is not a runtime dependency. The root
`core-flow.html` and `index.html` are independent historical standalone previews;
editing them does not regenerate or change this directory. The old `src/`
services, `/api/v1` proposal and contract simulator are not used by these pages.

## Request and binding convention

Use the professor's existing global helper inside the relevant HTML page:

```js
function listener_load() {
  func_ajax({
    url: '/api/user',
    type: 'GET',
    param: { id: 0 },
    success: function (data, status, xhr) {
      listenerAfterDetail(data, 'myuser');
      // Add .font_myuser_FIELD or #detail_myuser_FIELD to the matching markup.
      // Use only fields whose meaning is confirmed by the backend DTO.
    },
    error: function () {
      CandleUI.announce('사용자 정보를 불러오지 못했습니다.');
    },
  });
}
```

`func_ajax` sends GET parameters as a query and other payloads as JSON. It sends
the stored access token verbatim in `Authorization`, with the same token format
as the supplied code. After a 401 it exchanges the refresh token once and retries
the original request. The professor's existing error handling and redirects are
preserved in `default/custom.js`.

The copied start screen checks token presence, not server session validity.
Protected reads still need server authorization. The helper's existing behavior
redirects to `index.html` after a 401 when no refresh token is available, including
a rejected social-login request.

`listenerAfterDetail(data, 'name')` binds `.font_name_FIELD`,
`#detail_name_FIELD`, and `#img_name_FIELD`. Current business placeholders also
have `data-server-value` attributes; replace those with confirmed response fields.
Never bind untrusted markup through the helper's HTML setter. Use `textContent`
for arbitrary strings and approved legal text. For lists, place a Handlebars
template directly in the owning HTML and render only into its list container.

## Contracts evidenced by the supplied example

These routes are evidence from the professor's files, not proof that a live
server currently accepts requests. Social login/token exchange and the inherited
FCM bridge callback are wired in this handoff. Other screen functions deliberately
remain connection hooks.

| Request | Payload or response evidence | Owning page |
| --- | --- | --- |
| `POST /api/user/kakao` | `{accessToken}`; response `RefreshToken` header | `signup.html` |
| `POST /api/user/naver` | `{accessToken}`; response `RefreshToken` header | `signup.html` |
| `POST /api/user/google` | `{token: idToken, accessToken}` | `signup.html` |
| `POST /api/user/apple` | `{authorizationCode, identityToken}` | `signup.html` |
| `POST /api/auth` | Request `RefreshToken`, response `Authorization` headers | Shared helper |
| `POST /api/user/temp` | `{username,password}`; example development login only, no added UI | Reference only |
| `GET /api/user` | `{id:0}` | `home.html` |
| `GET /api/reward/latest` | Empty parameters | `home.html` |
| `GET /api/alarm/count` | Response includes `hasNew` | `home.html` |
| `GET /api/heart/count` | Response includes `amount, ad, seconds` | `home.html` |
| `GET /api/topic/scrollList` | `{perpage:10,deleted:false,cate,keyword}`; bare array of `id,code,img,title,cate` | `stock-select.html` |
| `GET /api/topic` | `{id}`; response `title,code,cate,price,rate` | `prediction.html` |
| `POST /api/topicroundpredict/predict` | `{topicId,answer:110}` shown in example | `confirm.html` |
| `GET /api/banner/list` | `{deleted:false,cate:100}` | Optional home/search banner |
| `PUT /api/user` | `{id:0,fcm}` | Existing FCM bridge callback |

For topic search, `cate=''` means all, `'110'` means KOSPI and `'120'` means
KOSDAQ. The example supplies only the up answer `110`; the down answer must be
confirmed before enabling submission. `topicId` is a server entity ID and must
not be replaced with a six-digit exchange stock code. Set `data-topic-id` on
server-rendered stock rows; the shared selection code carries this optional ID
through selection, prediction and confirmation. The sample rows have no topic ID.

The reference home code depends on undefined notification/heart variables and
the reference banner renderer uses a missing template. Those page scripts are
not copied. The common request/bridge files are copied as supplied. No balance,
ticket grant, attendance, accepted prediction, eligibility, reward or payout is
manufactured locally. Hooks without confirmed contracts display the existing
server-required message and do not send a request or navigate to success.

## Native login contract

The channel names remain `KakaoLogin`, `NaverLogin`, `GoogleLogin`, and
`AppleLogin`; HTML sends `postMessage('login')`. Flutter calls these globals:

```js
receiveKakaoToken(accessToken);
receiveNaverToken(accessToken);
receiveGoogleCredential(idToken, accessToken);
receiveAppleCredential(authorizationCode, identityToken);
```

The server returns `RefreshToken`; HTML stores it through
`flutter_setLocalStorage`, exchanges it at `/api/auth`, stores the returned
`Authorization`, and moves to `consent.html`. The existing spelling
`listener_set_refrshToken` is retained. Tokens are never placed in URLs or logs.
For a different API origin, allow the frontend origin and request headers
`Authorization`, `RefreshToken`, and `Content-Type`; expose response headers
`Authorization` and `RefreshToken` to JavaScript.

The existing `FlutterBridge` and `receiveFromFlutter` names remain available for
FCM, local storage, ads, sharing and notifications. No ad callback grants a local
ticket. Consent submission and logout still require confirmed server contracts.

## UI state and remaining integration

Stock name/code/market, direction, product denomination and return destination
travel through query parameters. Session storage holds only those UI selections
and the local watchlist. This watchlist is not synced to an account. The tutorial
uses the existing `candle.tutorial.seen` local key; replay is in settings. A
`home.html?tutorial=1` landing can request the first tutorial after successful
server onboarding. `history.html` aliases the wallet's use tab.

Legal links have normal HTML destinations; with JavaScript they open a dialog
so consent state and recipient input stay in the current form. Populate the
dialog and legal pages with approved server text. Recipient fields never enter
query parameters, session storage, local storage, or logs, and reset when leaving
the form page. Selection options and denominations are UI metadata, not server
prices, availability or authorization to pay.

Before a real release, connect approved agreements, server topic search/detail,
confirmed prediction answers, tickets/results, wallet/missions, catalog,
eligibility, payout and logout in the corresponding page hooks. Keep server
acceptance authoritative and move to success only after a successful response.
Live Spring, OAuth providers, device bridge, CORS, ads and payout providers still
need verification in the professor's environment.

## Verification

From the repository root:

```sh
npm run check
```

This checks formatting, unit tests, production copying, the retained standalone
preview and the independent pages. Browser tests intercept test API responses;
they do not contact real providers or prove live backend connectivity. Mobile
screenshots are written to `test-results/`. `npm run build` copies this directory
verbatim into `dist/html/`; deployment does not require Node or npm.
