// WXT/Vite only exposes env vars prefixed with VITE_ or WXT_ to the client bundle,
// so the production server URL must be set at build time via WXT_API_BASE_URL
// (see apps/extension/.env.example) rather than hardcoded here.
const apiBaseUrl = import.meta.env.WXT_API_BASE_URL ?? "http://localhost:4000";

if (import.meta.env.PROD && !import.meta.env.WXT_API_BASE_URL) {
  console.warn(
    "[Bol Bhai] WXT_API_BASE_URL was not set at build time; falling back to http://localhost:4000, " +
      "which will not work for real users. Set it in apps/extension/.env.production before building."
  );
}

export const APP_CONFIG = {
  name: "Bol Bhai",
  tagline: "Real-Time Browser Voice Chat",
  apiBaseUrl,
  // Read from the built manifest instead of hardcoded here, so it can never
  // drift from the version actually shipped in apps/extension/package.json.
  version: browser.runtime.getManifest().version
} as const;
