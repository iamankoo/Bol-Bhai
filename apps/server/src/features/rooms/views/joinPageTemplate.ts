function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

type JoinPageOptions = {
  roomCode: string;
  roomExists: boolean;
};

export function renderJoinPage({ roomCode, roomExists }: JoinPageOptions): string {
  const safeCode = escapeHtml(roomCode);

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="bol-bhai-room-code" content="${safeCode}" />
<title>Bol Bhai — Room ${safeCode}</title>
<style>
  :root { color-scheme: dark; }
  body {
    margin: 0;
    min-height: 100vh;
    display: grid;
    place-items: center;
    padding: 24px;
    background: #0a0a0c;
    color: #fff;
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  }
  .card {
    width: 100%;
    max-width: 380px;
    border: 1px solid rgba(255,255,255,0.14);
    border-radius: 22px;
    padding: 28px;
    background: linear-gradient(145deg, rgba(255,255,255,0.1), rgba(255,255,255,0.03)), rgba(12,12,14,0.9);
  }
  h1 { margin: 0 0 4px; font-size: 20px; }
  p { margin: 0 0 20px; color: rgba(255,255,255,0.68); font-size: 14px; line-height: 1.5; }
  .code { font-size: 32px; font-weight: 800; letter-spacing: 2px; margin: 0 0 20px; }
  .hint {
    display: none;
    margin-top: 18px;
    padding: 12px 14px;
    border-radius: 12px;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(255,255,255,0.06);
    font-size: 13px;
    color: rgba(255,255,255,0.78);
  }
  .hint.visible { display: block; }
  .missing { color: #fca5a5; }
</style>
</head>
<body>
  <main class="card">
    <h1>Bol Bhai voice room</h1>
    ${
      roomExists
        ? `<p>You've been invited to talk live. Open Bol Bhai to join.</p><p class="code">${safeCode}</p>`
        : `<p class="missing">This room code doesn't exist anymore — it may have already ended. Ask your friend for a fresh invite, or open Bol Bhai and create a new room.</p><p class="code">${safeCode}</p>`
    }
    <div id="installed-hint" class="hint">
      Click the Bol Bhai icon in your browser toolbar, then choose <strong>Join Room</strong> and enter <strong>${safeCode}</strong>.
    </div>
    <div id="missing-hint" class="hint">
      Bol Bhai doesn't seem to be installed in this browser yet. Install the extension, then come back to this page (or reopen the invite) to join room <strong>${safeCode}</strong>.
    </div>
  </main>
  <script>
    setTimeout(function () {
      var installed = document.documentElement.hasAttribute("data-bol-bhai-installed");
      var el = document.getElementById(installed ? "installed-hint" : "missing-hint");
      if (el) el.className += " visible";
    }, 900);
  </script>
</body>
</html>`;
}
