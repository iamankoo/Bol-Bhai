import React from "react";
import { createRoot } from "react-dom/client";
import { AppProvider } from "../core/providers/AppProvider";
import { QueryProvider } from "../core/providers/QueryProvider";
import { OverlayRoot } from "./components/OverlayRoot";
import overlayStyles from "./styles/overlay.css?inline";

const HOST_ID = "bol-bhai-overlay-root";

export function mountOverlay() {
  if (document.getElementById(HOST_ID)) {
    return;
  }

  const host = document.createElement("div");
  host.id = HOST_ID;
  host.style.position = "fixed";
  host.style.inset = "0";
  host.style.pointerEvents = "none";
  host.style.zIndex = "2147483647";

  const shadowRoot = host.attachShadow({ mode: "open" });
  const styleElement = document.createElement("style");
  styleElement.textContent = overlayStyles;

  const appRoot = document.createElement("div");
  appRoot.id = "bol-bhai-overlay-app";

  shadowRoot.append(styleElement, appRoot);
  document.documentElement.appendChild(host);

  createRoot(appRoot).render(
    <React.StrictMode>
      <QueryProvider>
        <AppProvider>
          <OverlayRoot />
        </AppProvider>
      </QueryProvider>
    </React.StrictMode>
  );
}
