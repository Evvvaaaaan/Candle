# Professor backend integration

The current `index.html` retains the tidy design: 19 screens, four dialogs, the
original CSS, inline icons, embedded images and fonts. `default/` and `js/` add
the professor's backend and native interfaces. The reference `backendexample/`
directory and historical `/api/v1` reference modules are not runtime dependencies.

## Run and configure

Serve the repository with `python3 -m http.server 3000`, then open
`http://localhost:3000/index.html`. Deploy `index.html`, `default/` and `js/`
together. The app no longer consists of a standalone HTML file alone.

Edit `js/backend-config.js`:

- `baseUrl` is the backend origin, initially `http://localhost:8080`. Do not add
  `/api`; each confirmed request already includes that prefix.
- `predictionAnswers.up` and `.down` are **unknown**. Both are `null`. The supplied
  example always sends `110`, regardless of the selected direction. A tentative
  identification of `110` as down has not established the full mapping. Configure
  distinct integer codes only after confirmation. Until then the submission
  button explains the missing mapping without sending an incorrect request.

For separate origins, permit the actual frontend origin, methods, and request
headers `Content-Type`, `Authorization`, `RefreshToken`; expose response headers
`Authorization` and `RefreshToken`. Use HTTPS for deployment. Native social login
still needs the actual app channels and provider setup; changing a URL cannot
create those channels in a browser.

## Preserved interfaces

`default/jquery.js` and `default/flutter.js` are copied from the professor's
example. `default/custom.js` keeps the global helper names, request encoding,
verbatim Authorization format and refresh-token headers. Its request section is
adapted to this single document: concurrent 401s share one refresh, callbacks
settle on errors, and expiration navigates to signup without loading another HTML.
The copied utility/native helper functions remain available.

The public API functions in `js/backend.js` retain familiar names:
`tempLogin`, `getAccessToken`, `listener_set_refrshToken`, `detail_myuser`,
`latest_myreward`, `count_myalarm`, `count_myheart`, `search_topic`, `search_banner`,
`detail_topic`, and `create_topicroundpredict`. `CandleUI` adapts their responses
to the existing views without generating or replacing the whole app.

| Feature | Confirmed request | Current behavior |
| --- | --- | --- |
| Temporary login | `POST /api/user/temp` `{username,password}` | Expand the development login panel on signup. Password is cleared after the attempt and never stored. |
| Kakao/Naver | `POST /api/user/{provider}` `{accessToken}` | Native credential callback starts the exchange. |
| Google | `POST /api/user/google` `{token,accessToken}` | Keeps the professor's Google credential fields. |
| Apple | `POST /api/user/apple` `{authorizationCode,identityToken}` | Keeps the professor's Apple credential fields. |
| Token exchange | `POST /api/auth`, `RefreshToken` header | Saves response `Authorization`; new login proceeds to consent, restoration preserves the current screen or enters home. |
| Current user | `GET /api/user?id=0` | Reads user data; displays `nick` only if supplied as a string. It is not a required DTO field. |
| Point balance | `GET /api/reward/latest` | `latest` fills balance fields and product affordability. |
| Tickets/ads | `GET /api/heart/count` | `amount` is the total ticket count; `ad` is consumed ad participation; remaining is `10 - ad`. |
| Alarm | `GET /api/alarm/count` | `hasNew` updates the account indicator class. |
| FCM | `PUT /api/user` `{id:0,fcm}` | Existing `receiveFromFlutter` FCM event retains this callback. |
| Topic search | `GET /api/topic/scrollList` `{perpage:10,deleted:false,cate,keyword}` | Server rows use the tidy stock buttons; late search responses cannot overwrite newer ones. |
| Topic detail | `GET /api/topic?id=...` | Reads `id,code,title,cate,price,rate`; late responses cannot overwrite another selection. |
| Prediction | `POST /api/topicroundpredict/predict` `{topicId,answer}` | Request is connected, with unknown-code guard and duplicate-click prevention. Success refreshes balance/tickets. |
| Banner data | `GET /api/banner/list` `{deleted:false,cate:100}` | Publishes `candle:banners` with the response. No creative fields or working template exist in the example; the tidy self-promotion banner remains. |

The API topic entity ID is separate from an exchange stock code such as `005930`.
Selection retains both; it never submits the code as `topicId`. Search market
values are `''` for all, `'110'` for KOSPI and `'120'` for KOSDAQ. Bookmarks remain
local in-memory UI state and are not account-synced.

The native channel names remain `KakaoLogin`, `NaverLogin`, `GoogleLogin`,
`AppleLogin`, with `postMessage('login')`. Credential callbacks remain:

```js
receiveKakaoToken(accessToken);
receiveNaverToken(accessToken);
receiveGoogleCredential(idToken, accessToken);
receiveAppleCredential(authorizationCode, identityToken);
```

Credential callbacks are accepted only for the matching current native login
attempt. Responses after logout or cancellation cannot start another login.
Legacy native push destinations such as `home.html` and
`prediction.html?id=...` are translated to the current hash routes.

The generic `FlutterBridge`/`receiveFromFlutter` storage, FCM, advertising,
notification, share and external URL helpers remain available. Merely receiving
an advertising event does not grant a ticket. Only a server ticket response
changes the displayed available count. Notification scheduling calls commented
out in the example have not been activated.

## Boundaries retained from the supplied example

- Consent validation and local home navigation are preserved. The example has no
  confirmed consent-write endpoint; this is not proof of a stored legal agreement.
- Logout clears the native/browser tokens through the supplied local logout
  helper. There is no confirmed server revocation endpoint in the example.
- Statistics, streaks, detailed wallet/prediction histories, missions, prize
  eligibility, claims and payout have no confirmed server contract here. Existing
  layout samples are previews; history views say so. Claim and payout controls
  do not fabricate a successful payment or point grant.
- The automatic sample-winnings dialog is not shown for a real account. Its
  markup remains available for future server result binding.
- No free/ad ticket split is inferred from `amount` and `ad`. No refill timer is
  inferred from `seconds`: the reference's refill duration is undefined.
- Existing payout/name/phone and prize ID validation remains. Recipient inputs
  stay in form memory and are cleared when leaving their flow.
- The missing reference banner template and undefined home refill globals are
  not copied into the new integration. All provider requests use the configured
  backend origin rather than mixing relative and absolute API URLs.

## Verify

Use Node.js 22+ and Playwright. If browser-test tooling is not installed:

```sh
npm install --no-save --package-lock=false playwright@1.59.1
node tests/backend.browser.mjs
```

The default browser channel is Chrome; set `PLAYWRIGHT_CHANNEL` if required by
your environment. Tests intercept API responses locally and do not contact the
professor's server, OAuth providers, advertising or payout services. They cover
native/temporary login, request headers, refresh, server topic IDs, search races,
empty lists, answer guards, prediction failure/deduplication, FCM, privacy and
19-screen mobile/desktop layouts. Screenshots go to `.screenshots/`.

Live Spring behavior, actual direction codes, cross-origin hosting and native
devices still require verification in the professor's environment.
