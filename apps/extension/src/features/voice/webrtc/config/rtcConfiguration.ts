// STUN alone lets peers behind most home/NAT routers discover their public
// address and connect directly. It does NOT guarantee connectivity: symmetric
// NATs and restrictive corporate/mobile-carrier firewalls require relaying
// media through a TURN server instead. TURN credentials are optional and
// operator-provided (see apps/extension/.env.example) because they require a
// TURN deployment (e.g. coturn, or a hosted provider) this repo does not include.
function buildTurnServer(): RTCIceServer | null {
  const url = import.meta.env.WXT_TURN_URL;

  if (!url) {
    return null;
  }

  return {
    urls: [url],
    username: import.meta.env.WXT_TURN_USERNAME,
    credential: import.meta.env.WXT_TURN_CREDENTIAL
  };
}

const turnServer = buildTurnServer();

export const DEFAULT_RTC_CONFIGURATION: RTCConfiguration = {
  iceServers: [
    {
      urls: ["stun:stun.l.google.com:19302"]
    },
    ...(turnServer ? [turnServer] : [])
  ]
};
