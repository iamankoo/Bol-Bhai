// Extension requests carry a chrome-extension://<id> origin, which is opaque and
// varies per install unless the extension is published with a pinned key, so an
// empty CORS_ALLOWED_ORIGINS keeps the permissive default; set it in production
// once the extension's published id (and any web client origins) are known.
export function getCorsOriginOption(): boolean | string[] {
  const raw = process.env.CORS_ALLOWED_ORIGINS?.trim();

  if (!raw) {
    return true;
  }

  const origins = raw
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  return origins.length > 0 ? origins : true;
}
