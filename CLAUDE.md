# CLAUDE.md

## Project Overview

- **Purpose**: Bol Bhai is a real-time voice chat browser extension (Chromium-first, Firefox planned). Users create/join "rooms" and talk via WebRTC; a Node backend handles signaling (Socket.IO) and room management. Note: the README describes an early "monorepo foundation only" scaffold stage, but the actual code has grown well beyond that (substantial voice/WebRTC/signaling and rooms features are implemented) — treat the code, not the README's "Current Status," as authoritative.
- **Tech stack**: TypeScript everywhere (ESM, Node.js >=22). Extension: WXT (Manifest V3 framework), React 19, Zustand, TanStack Query, Zod, Tailwind CSS 4, Socket.IO client. Server: Fastify 5, Socket.IO server, Pino, Zod, `tsx` for dev. Monorepo: pnpm workspaces + Turborepo, centralized dependency versions via pnpm `catalog:`.
- **Main architecture**: pnpm/Turborepo monorepo with two independently deployable apps (`extension`, `server`) and shared internal packages. Feature-based/vertical-slice architecture within each app (`rooms`, `voice`, `realtime` as top-level features, each internally layered by technical concern). Server uses a lightweight event-bus/pub-sub pattern plus a controller → service → store layering for rooms.
- **Important folders**:
  - `apps/extension/src/features/rooms/` and `.../voice/` — room API/state/components; voice devices/media/permissions/session/signaling/webrtc
  - `apps/extension/src/overlay/` — in-page floating overlay UI
  - `apps/extension/src/entrypoints/` — WXT entrypoints (background, content, popup)
  - `apps/server/src/features/rooms/` — controller/routes/services/in-memory store/validators
  - `apps/server/src/features/realtime/` — Socket.IO gateway
  - `apps/server/src/core/events/` — custom event bus
  - `packages/shared/` — `@bol-bhai/shared`, cross-app protocol types (signaling, voice, webrtc)
  - `packages/eslint-config/`, `packages/tsconfig/` — shared lint/TS configs
- **Entry points**: Extension — `apps/extension/src/entrypoints/background/index.ts`, `.../content/index.ts` (mounts overlay), `.../popup/main.tsx`. Server — `apps/server/src/server.ts` (loads dotenv, calls `buildApp()` from `app.ts`).

## Development Standards

- Production-ready code — no half-finished features left wired into the app; empty `.gitkeep` placeholder directories (`src/hooks`, `src/lib`, `middleware`, `plugins`, etc.) are intentional future scaffolding, not dead code to clean up.
- Strict feature-folder/vertical-slice architecture — new functionality belongs inside the relevant feature folder (`rooms`, `voice`, `realtime`), internally organized by technical layer (`api`/`components`/`hooks`/`store`/`types` or `handlers`/`queue`/`services`/`state`/`validators`), matching existing siblings.
- SOLID/DRY/KISS/YAGNI — services are implemented as classes with `private readonly` fields and small, single-purpose methods (see `PeerConnectionManager` as the reference pattern).
- Barrel exports: nearly every feature subdirectory has an `index.ts` re-exporting its public surface — follow this for new modules.

## Coding Rules

- **Zod-first validation**: all external/boundary data (room API payloads, signaling messages, session descriptions, browser storage) must be validated with Zod schemas colocated in `validators`/`schemas` files — this is the established pattern for any new I/O boundary, not optional.
- TypeScript strict mode is enforced repo-wide (`packages/tsconfig/base.json`): `strict`, `noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`, `noImplicitOverride`, `noFallthroughCasesInSwitch`. Don't weaken these.
- Naming: camelCase files/functions (`roomCodeService.ts`, `useRoomsController.ts`), PascalCase classes (`PeerConnectionManager`, `RoomMemoryStore`).
- Prettier formatting: `printWidth: 100`, `semi: true`, double quotes, no trailing commas — run `pnpm format` (checks only; there's no root `format:write` script wired up).
- **Always add/bump shared dependency versions in `pnpm-workspace.yaml`'s `catalog:` block** and reference as `"catalog:"` in package `package.json` files — never hardcode a version that diverges from the catalog.
- Internal packages are scoped `@bol-bhai/<name>` and consumed via `workspace:*`.

## Security Rules

- Never commit `.env`/`.env.*` (only `.env.example` is tracked, e.g. `apps/server/.env.example` with `PORT`, `HOST`, `LOG_LEVEL`).
- All signaling/room payloads must be Zod-validated server-side before being trusted — WebRTC signaling messages are attacker-influenceable input.
- CORS is configured via `@fastify/cors` on the server — don't loosen it without a clear reason.
- No auth system currently exists for rooms (in-memory store, no persistence) — treat this as a known gap, not a green light to skip validation elsewhere.

## Performance Rules

- WebRTC/signaling code (queues, negotiators, managers) is performance-sensitive for call quality — avoid blocking the event loop in `apps/server` (Fastify) or introducing synchronous heavy work in the extension's content script/background worker.
- Avoid unnecessary Socket.IO round-trips; batch or debounce signaling messages where the existing `signaling/queue` pattern already does this.

## Testing

- **No test suite or framework is currently configured anywhere in the repo** (no Vitest/Jest config, no test files, no `test` script in any `package.json`). If asked to add tests, Vitest is a natural fit given the Vite-based WXT toolchain — note the choice here once added.
- Never remove any tests once they exist; keep coverage growing with new features.

## Documentation

- `docs/architecture.md` and `docs/roadmap.md` are currently stub placeholders — don't treat them as authoritative on current implementation state; the code is ahead of the docs. Update them if you're doing significant architecture work.
- Update `README.md` if the "Current Status" section is touched, since it currently understates what's implemented.
- New shared protocol types added to `packages/shared` should be documented with a short comment on their purpose (signaling/voice/webrtc message shapes).

## Git Workflow

- Small, logical commits scoped to one feature/layer.
- Never rewrite history or force-push unless explicitly asked.
- `.github/` currently has no CI workflows configured (only `.gitkeep`) — don't assume CI will catch lint/type errors; run `pnpm lint`/`pnpm typecheck` locally before considering work done.

## Editing Behaviour

- Understand the feature-folder layout before adding code — figure out whether new work belongs in `rooms`, `voice`, `realtime`, or a new feature folder following the same internal layering convention.
- Don't conflate `apps/extension` and `apps/server` — they're independently built/deployed; check `wxt.config.ts` vs `app.ts`/`server.ts` to know which app you're in.
- Ask before removing `.gitkeep` placeholder directories — they signal intended future locations for code.
- Ask before changing the monorepo tooling (pnpm workspaces / Turborepo) or the `catalog:` dependency-versioning convention.
- Preserve the shared-types contract in `packages/shared` when changing signaling/voice/webrtc message shapes on either the extension or server side — both must stay in sync.

## Project-Specific Guidelines

- **Commands** (root, via Turborepo): `pnpm install`, `pnpm dev` (`turbo run dev --parallel`), `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm format` (Prettier check only). Per-package: extension `dev`→`wxt`, `build`→`wxt build`, `typecheck`→`wxt prepare && tsc --noEmit`; server `dev`→`tsx watch src/server.ts`, `build`→`tsc`.
- **Env vars**: `apps/server/.env.example` — `PORT=4000`, `HOST=0.0.0.0`, `LOG_LEVEL=info`, loaded via `dotenv/config`.
- **Key dependencies to respect**: `wxt` (extension build/dev framework), `socket.io`/`socket.io-client` (signaling transport), `zod` v4 (validation), `zustand` (state), `@tanstack/react-query` (server-state cache), `fastify` + `pino` (server/logging). No SFU/mediasoup yet — WebRTC is native `RTCPeerConnection` peer-to-peer, per README's stated future work.
