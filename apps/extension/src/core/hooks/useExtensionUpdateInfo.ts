import { useEffect, useState } from "react";

export type UpdateChannel = "store" | "unpacked" | "unknown";

/**
 * Chrome auto-updates Web-Store-installed ("normal") extensions in the
 * background on its own schedule — there is no per-extension opt-in/out a
 * page or extension can set, and no supported auto-update path exists for a
 * sideloaded/unpacked install outside enterprise policy. This only reports
 * which situation the user is in so Settings can say something true, rather
 * than exposing a toggle that would not actually control anything.
 */
export function useExtensionUpdateInfo(): UpdateChannel {
  const [channel, setChannel] = useState<UpdateChannel>("unknown");

  useEffect(() => {
    browser.management
      ?.getSelf()
      .then((info) => {
        setChannel(info.installType === "development" ? "unpacked" : "store");
      })
      .catch(() => {
        setChannel("unknown");
      });
  }, []);

  return channel;
}
