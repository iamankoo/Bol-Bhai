export default defineContentScript({
  matches: ["<all_urls>"],
  main() {
    // Lets a Bol Bhai join-invite page (see apps/server join route) detect that
    // the extension is installed and skip its "install Bol Bhai" fallback hint.
    document.documentElement.setAttribute("data-bol-bhai-installed", "true");

    void import("../../overlay/mount").then(({ mountOverlay }) => {
      mountOverlay();
    });
  }
});
