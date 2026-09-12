# Bol Bhai

**Publisher:** Aniket Raj

Bol Bhai is a real-time voice chat browser extension. Two or more friends open
Bol Bhai in any tab, create or join a room, and talk over live WebRTC audio
while they keep playing a browser game, watching a stream, or doing anything
else on the web — no separate app to switch to.

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

1. **Server** (`apps/server`) — build with the provided `apps/server/Dockerfile`
   (multi-stage: `pnpm deploy --legacy` produces a standalone `dist/` +
   `node_modules`, which is verified to boot with `node dist/server.js`), or
   run `pnpm --filter @bol-bhai/server build && node apps/server/dist/server.js`
   directly on any Node 22+ host. It needs a public HTTPS/WSS-capable URL
   (Socket.IO needs WebSocket upgrade support from whatever reverse proxy /
   platform sits in front of it).
2. **Extension** — set `WXT_API_BASE_URL` to that server's HTTPS URL (in
   `apps/extension/.env.production`, see `.env.example`) before running
   `pnpm --filter @bol-bhai/extension build`; the built extension in
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
