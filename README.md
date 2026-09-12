# Bol Bhai

**Publisher:** Aniket Raj

Bol Bhai is a real-time voice chat browser extension. Two or more friends open
Bol Bhai in any tab, create or join a room, and talk over live WebRTC audio
while they keep playing a browser game, watching a stream, or doing anything
else on the web — no separate app to switch to.

## Installation

Bol Bhai isn't on the Chrome Web Store yet (see "Chrome Web Store Status"
below), so it's installed from a GitHub Release. This takes about a minute
and needs nothing but Chrome — no terminal, no Node.js, no dev server.

1. Open the [Bol Bhai Releases page](https://github.com/iamankoo/Bol-Bhai/releases).
2. Open the latest release (currently **v1.0.0**).
3. Under "Assets", download `bol-bhai-extension-v1.0.0.zip`.
4. Extract the ZIP into a normal folder you'll keep around (e.g. Desktop or
   Documents) — Chrome loads the extension directly from this folder, so
   don't delete it afterwards.
5. Open Google Chrome.
6. Go to:
   ```text
   chrome://extensions/
   ```
7. Turn on **Developer mode** (toggle in the top-right corner).
8. Click **Load unpacked**.
9. Select the folder you extracted in step 4 — the one that directly
   contains `manifest.json`.
10. Bol Bhai should now appear in your installed extensions list.
11. Click the puzzle-piece icon in Chrome's toolbar and **pin Bol Bhai** so
    its icon stays visible — you'll use it to reopen the overlay (see "How
    to Use Bol Bhai" below).

That's the whole install — nothing to run afterwards.

## Production Architecture

The extension you just installed already talks to Bol Bhai's live backend;
you don't need to run or configure anything yourself:

```text
Bol Bhai Extension (your Chrome)
        ↓
Production Backend — https://bol-bhai-server.onrender.com
        ↓
Socket.IO Signaling
        ↓
WebRTC (peer-to-peer)
        ↓
Live Voice
```

That backend runs on Render's free tier, which spins down after a period of
inactivity. If nobody has used Bol Bhai in a while, the first room
create/join can take up to ~50 seconds while it wakes back up — that's
expected, not a bug. See "How it works, end to end" further below for the
full signaling/WebRTC breakdown.

## How to Use Bol Bhai

### Step 1 — Open a new tab

Open any new browser tab. Bol Bhai's small floating mic icon appears in the
corner of the page. If you don't interact with it, it automatically
disappears after about 5 seconds — it isn't meant to sit on screen
permanently.

### Step 2 — Reopen Bol Bhai

If the icon has disappeared (auto-hidden, or you minimized it), click the
**Bol Bhai icon in your Chrome toolbar** (the one you pinned during
installation). That brings the floating icon back on the current tab.

### Step 3 — Create a Room

Click the floating icon to open its panel, then click **Create Room**.

```text
Open Bol Bhai
→ Create Room
→ Room is created
```

You'll land straight on the Room panel: your room code (e.g. `IN483921`),
the current connection status, and the member list (just you, as host, so
far).

### Step 4 — Share the Room

In the Room panel, click **Share Invite**. Depending on your
device/browser, this opens either the native share sheet or a WhatsApp
(`wa.me`) link, pre-filled with a message like "Join my Bol Bhai voice room:
\<link\>". That link points to Bol Bhai's `/join/:code` page for your room.

### Step 5 — Join the Room

The person you invited opens that link. If they already have Bol Bhai
installed, it recognizes the room code on that page and opens straight to
the **Join Room** view with the code pre-filled — they still have to click
**Join** themselves; opening the link does not join them automatically. If
they don't have Bol Bhai installed, the page tells them that instead of
showing a broken page.

Anyone can also join manually at any time: open Bol Bhai → **Join Room** →
type in the room code → **Join**.

### Step 6 — Start Voice Chat

The microphone is **off by default** for everyone who joins — nothing is
sent anywhere until a participant explicitly turns it on. In the Room
panel:

- First click: **Enable Microphone** — Chrome asks for microphone
  permission, then your mic starts.
- After that: the same button toggles **Mute Microphone** / **Unmute
  Microphone** without leaving the room.

Once participants have their mics enabled and the connection is
established, you can talk in real time.

### Step 7 — Minimize Bol Bhai

You can hide the floating icon and panel at any time — hover over the
floating mic icon and click the small **×** that appears, or simply let it
auto-hide. **Minimizing does not end your call or leave the room** — the
voice connection and your mic state keep running; only the visible UI is
hidden. Bring it back anytime with the toolbar icon (Step 2).

### Step 8 — Leave the Room

To actually end your participation, open the Room panel and click **Leave
Room**. This is the action that ends the call for you — closing the panel
or minimizing the overlay does not.

## PUBG / Gaming Use Case

```text
Friend A:
Install Bol Bhai
→ Create Room
→ Share invite through WhatsApp

Friend B:
Open invite
→ Join Room

Both:
→ Enable microphone
→ Talk in real time
→ Continue playing their game
```

Bol Bhai provides browser-based, real-time voice communication that keeps
running while you continue using the web — it does not integrate with or
inject itself into PUBG or any other specific game.

## Troubleshooting

**Microphone not working**

- Check that Chrome has microphone permission granted (look for a
  blocked-mic icon in the address bar; click it to allow, then click
  "Enable Microphone" in Bol Bhai again).
- Confirm the mic button in the Room panel actually reads "Mute Microphone"
  (meaning it's active) rather than "Enable Microphone" (not started yet).
- Make sure the correct microphone is selected as your system/Chrome
  default input device.

**Cannot connect**

- Check your internet connection.
- The production backend can take up to ~50 seconds to respond on the very
  first request after sitting idle (Render free-tier cold start) — wait a
  little before assuming it's broken.
- Make sure both people are using the current release of the extension.
- Try reopening the Room panel via the toolbar icon (Step 2) rather than
  leaving it in a stuck state.

**Extension does not appear**

- Confirm **Developer mode** is enabled and Bol Bhai is listed and enabled
  at `chrome://extensions/`.
- Make sure the folder you selected in **Load unpacked** is the actual
  extracted extension folder — the one that directly contains
  `manifest.json` — not the `.zip` file or a parent folder.
- If a tab was already open before you installed Bol Bhai, that tab won't
  have it — refresh the tab (extensions only load into tabs opened or
  reloaded after installation).

## Production vs Development

**Normal user** — this is all you need:

```text
Download release
→ Extract
→ Load unpacked
→ Use Bol Bhai
```

No terminal required.

**Developer** — if you're working on Bol Bhai's own code, see the
"Development" section further below for the pnpm/Turborepo commands. Those
build a local copy pointed at whatever server you happen to be running, so
they're not the right instructions for normal installation.

## Chrome Web Store Status

**Bol Bhai is not yet published on the Chrome Web Store.** The current, and
only, installation method is:

**GitHub Release → Load unpacked** (see "Installation" above).

## Platform Limitations

- **Chromium-based browsers only** — built and tested on Google Chrome
  (Manifest V3). Firefox, Safari, and other non-Chromium browsers are not
  supported.
- **Not on the Chrome Web Store** — Chrome shows a "Developer mode
  extensions" notice for unpacked installs like this one; that's expected,
  not a sign of a problem.
- See "Known limitations" further below for the full technical list (no
  TURN server, no accounts/persistence, room size cap, etc.).

## How it works, end to end

```text
User opens a new tab
        ↓
Bol Bhai overlay appears (auto-hides after ~5s if untouched, or click Minimize)
        ↓
Create Room  →  server issues a room code (e.g. IN483921)
        ↓
Share Invite → WhatsApp / native share sheet with a join link
        ↓
Friend opens the link → Bol Bhai join view opens pre-filled with the code
        ↓
Friend clicks Join
        ↓
Socket.IO: both clients emit room:join, server confirms membership
        ↓
Server emits voice:peer-ready once both peers have joined
        ↓
VoiceSessionManager negotiates WebRTC (offer/answer/ICE) over voice:signal
        ↓
RTCPeerConnection connects peer-to-peer (STUN, optional TURN)
        ↓
User turns their mic on → local track attached to the peer connection(s)
        ↓
Remote peer's RemoteAudioService plays the incoming track
        ↓
Live voice, independent of whatever else is happening in the tab
```

Minimizing the overlay only hides its UI — it does not leave the room or end
the call. Leaving is a separate, explicit action inside the room panel.

## Architecture

pnpm workspace + Turborepo monorepo, two independently deployable apps and
shared internal packages:

```text
Bol-Bhai/
  apps/
    extension/   Chrome (MV3) extension — WXT, React 19, Zustand, TanStack Query
    server/      Fastify + Socket.IO signaling/rooms backend
  packages/
    shared/      @bol-bhai/shared — cross-app protocol types (Zod schemas)
    eslint-config/
    tsconfig/
  docker/        Dockerfile usage (docker-compose.yml) for the server
  .github/       CI workflow (lint/typecheck/build)
```

### Extension (`apps/extension`)

- `src/entrypoints/content` — injects the floating overlay into every page.
- `src/entrypoints/background` — routes toolbar-icon clicks to "show overlay"
  messages so the overlay can be manually reopened after it auto-hides.
- `src/overlay/` — the floating mic button + popup panel (create/join/settings).
- `src/features/rooms/` — room REST API client, Zustand room store, room UI.
- `src/features/voice/` — the WebRTC pipeline: signaling transport/queue,
  offer/answer/ICE services, `PeerConnectionManager` (keyed by peer id, so it
  scales to more than 2 participants), `RemoteAudioService` (one `<audio>`
  element per peer, deduped and cleaned up on peer-leave/session-destroy).

### Server (`apps/server`)

- `src/features/rooms/` — controller → service → in-memory store, Zod-validated
  REST endpoints (`/api/rooms/create|join|leave|:code`), plus a plain-HTML
  `/join/:code` landing page used by shared invite links.
- `src/features/realtime/` — the Socket.IO gateway: `room:join`/`room:leave`,
  `voice:peer-ready`, and `voice:signal` (relays WebRTC signaling messages,
  validated with the shared Zod schema, and only between sockets that have
  actually joined the target room).
- `src/core/events/` — a small in-process event bus wiring room lifecycle
  events (join/leave/host-change/delete) to realtime broadcasts.

### Shared protocol (`packages/shared`)

`@bol-bhai/shared` holds the canonical Zod schema for WebRTC signaling
messages (offer/answer/ICE-candidate/heartbeat/etc.) so the extension and the
server validate the exact same contract instead of two hand-maintained copies
drifting apart. Update it first when changing a signaling message shape, then
adjust both apps against it.

## Rooms, sharing, and joining

- **Create Room** — `POST /api/rooms/create` returns a room code (`IN` + 6
  digits) and the creator becomes host.
- **Share Invite** — the room panel's "Share Invite" button opens the native
  share sheet (`navigator.share`) where available, or a `wa.me` WhatsApp
  share link otherwise, both pre-filled with `Join my Bol Bhai voice room: <link>`.
  The link points at the server's `/join/:code` page.
- **Join via link** — opening that link, if Bol Bhai is installed, the
  extension's content script detects an embedded `<meta name="bol-bhai-room-code">`
  tag and opens the popup straight to the Join view with the code prefilled
  (the user still clicks Join — nothing joins automatically). If Bol Bhai
  isn't installed, the page explains that plainly instead of showing a broken
  localhost page.
- **Join manually** — Join Room → enter the code → `POST /api/rooms/join`.

## Voice / WebRTC

- Mic starts **off** every time a room opens; nothing requests microphone
  permission until the user explicitly taps the mic control.
- Negotiation only starts once the server confirms both sockets are in the
  room (`voice:peer-ready`) — starting earlier caused negotiation to race the
  Socket.IO room join in the past; do not reintroduce that.
- ICE: STUN only by default (`stun:stun.l.google.com:19302`). STUN alone does
  **not** guarantee connectivity for symmetric NATs or restrictive
  firewalls — set `WXT_TURN_URL` / `WXT_TURN_USERNAME` / `WXT_TURN_CREDENTIAL`
  (see `apps/extension/.env.example`) to add a TURN relay for production if
  you see connections fail specifically across such networks. No TURN
  deployment is included in this repo.
- Multi-peer: connections are keyed by peer id (`Map`/`Set`), so 3+
  participants are supported the same way as 2; one participant leaving only
  tears down that peer's connection, not everyone else's. There's a
  server-side room size cap (`MAX_ROOM_MEMBERS = 20`); it hasn't been tested
  at that scale, so treat it as an upper bound rather than a tested target.

## Production deployment

Nothing in production should point at `localhost`. Two things need deploying
independently:

1. **Server** (`apps/server`) — a `render.yaml` Blueprint is included, so on
   Render this is "New → Blueprint → connect this repo" and it builds
   `apps/server/Dockerfile` automatically. **Currently deployed at
   https://bol-bhai-server.onrender.com** (Render free tier — it spins down
   after inactivity, so the first request after a while can take ~50s while
   it wakes back up; upgrade the Render plan to avoid that in real use).
   Elsewhere: build with the same Dockerfile (multi-stage: `pnpm deploy --legacy`
   produces a standalone `dist/` + `node_modules`, verified to boot with
   `node dist/server.js`), or run
   `pnpm --filter @bol-bhai/server build && node apps/server/dist/server.js`
   directly on any Node 22+ host with a public HTTPS/WSS-capable URL (Socket.IO
   needs WebSocket upgrade support from whatever reverse proxy/platform sits
   in front of it).
2. **Extension** — set `WXT_API_BASE_URL` to that server's HTTPS URL (in
   `apps/extension/.env.production`, see `.env.example`) before running
   `pnpm --filter @bol-bhai/extension build`; the current release build
   already points at the Render URL above. The built extension in
   `.output/chrome-mv3` is what gets zipped and uploaded to the Chrome Web
   Store (or loaded unpacked for local testing).

### Environment variables

| App       | Variable                                                   | Purpose                                                                                                                                                                                                                                |
| --------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| server    | `PORT`, `HOST`                                             | Fastify bind address                                                                                                                                                                                                                   |
| server    | `LOG_LEVEL`                                                | Pino log level                                                                                                                                                                                                                         |
| server    | `CORS_ALLOWED_ORIGINS`                                     | Comma-separated allowlist for REST + Socket.IO CORS. Empty/unset = allow any origin, which is the practical default because a `chrome-extension://<id>` origin varies per install unless the extension is published with a pinned key. |
| extension | `WXT_API_BASE_URL`                                         | Server URL the extension talks to. **Must** be set for a real production build — it defaults to `http://localhost:4000` otherwise, which only works during local development.                                                          |
| extension | `WXT_TURN_URL`, `WXT_TURN_USERNAME`, `WXT_TURN_CREDENTIAL` | Optional TURN relay for restrictive networks.                                                                                                                                                                                          |

Never commit `.env`/`.env.*` files — only `.env.example` is tracked.

## Development

```bash
pnpm install
pnpm dev          # turbo run dev --parallel (server on :4000, extension via wxt)
pnpm build
pnpm lint
pnpm typecheck
pnpm format       # prettier --check (no format:write script wired up)
```

Loading the extension locally: `pnpm --filter @bol-bhai/extension dev` (or
`build`) then load `apps/extension/.output/chrome-mv3` as an unpacked
extension via `chrome://extensions` (Developer Mode → Load unpacked).

## Releases & updates

Versioning is semver, tracked in `package.json` at the root and in each app
(currently `1.0.0`). Release process: bump the version(s), `git tag vX.Y.Z`,
push the tag, then `gh release create vX.Y.Z` (or the GitHub UI) with the
built `.output/chrome-mv3` zipped as a release asset for anyone installing
manually.

**How the installed extension actually updates:**

- **If published to the Chrome Web Store**, Chrome updates every install of
  it automatically and silently in the background — this is entirely
  browser-managed and not something the extension (or this repo) can opt in
  or out of per user. There is no real "enable automatic updates" switch to
  build into the app, because Chrome doesn't expose one to third-party
  extensions; building a UI toggle that looked like it controlled this would
  be misleading, so Settings instead just reports which situation applies.
- **If loaded unpacked** (development, or a manually-distributed zip), Chrome
  never auto-updates it — the user has to reinstall a new version by hand.
  Settings shows a link to [GitHub Releases](https://github.com/iamankoo/Bol-Bhai/releases)
  in this case.
- Publishing to the Chrome Web Store itself is a manual, store-side step this
  repo can't perform (a Google Developer account, a one-time $5 registration
  fee, and a store listing submitted through the Chrome Web Store Developer
  Dashboard) — see "Known limitations" below.

## Testing

No automated test suite exists yet (no Vitest/Jest config or test files).
Vitest is the natural fit given the Vite-based WXT toolchain if/when tests are
added. Signaling/security behavior in this pass was verified with a scripted
multi-socket smoke test against a running server (room create/join, the
`voice:peer-ready` handshake, legitimate signal relay, and confirming a
socket that never joined a room cannot inject signaling into it) rather than
a committed automated suite.

## Known limitations

- **No TURN server included.** STUN-only will fail to connect some peers on
  symmetric NAT / restrictive firewalls (common on some corporate/mobile
  networks). Configure `WXT_TURN_URL` with your own TURN deployment if you
  hit this in practice.
- **No persistence / no auth.** Rooms live in an in-memory store and disappear
  when the server restarts or the last member leaves; there is no account
  system, so anyone with a room code can join it. This is a known, intentional
  gap for this stage, not an oversight — don't rely on it for private/sensitive
  conversations.
- **Chromium-first.** Built and tested against Chrome (Manifest V3). Firefox
  support is not implemented.
- **No custom branded icon.** The extension currently builds with WXT's
  default fallback icon; branded icon artwork hasn't been added.
- **Untested at scale.** The room member cap is 20, but real multi-peer mesh
  WebRTC (every peer connects to every other peer) has practical bandwidth/CPU
  limits well before that on typical consumer hardware; treat anything beyond
  a handful of simultaneous participants as unverified.
- **Not published to the Chrome Web Store.** Real browser-managed silent
  auto-update requires that; publishing is a manual, store-side step (Google
  Developer account + one-time fee + store review) this repo cannot perform.
  A `render.yaml` Blueprint is included for one-click backend hosting on
  Render, but creating/authorizing that Render service is likewise something
  only the account owner can do.
