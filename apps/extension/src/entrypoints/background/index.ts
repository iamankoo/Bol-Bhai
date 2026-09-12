import { OVERLAY_MESSAGE_TYPES, type ShowOverlayMessage } from "../../core/messaging";

export default defineBackground(() => {
  // Clicking the toolbar icon is the extension-native way to bring the overlay
  // back after it auto-hid or the user minimized it (see spec: manual reopen).
  browser.action.onClicked.addListener((tab) => {
    if (typeof tab.id !== "number") {
      return;
    }

    const message: ShowOverlayMessage = { type: OVERLAY_MESSAGE_TYPES.showOverlay };
    void browser.tabs.sendMessage(tab.id, message).catch(() => {
      // No content script on this tab (e.g. a browser-internal page) — nothing to reopen.
    });
  });
});
