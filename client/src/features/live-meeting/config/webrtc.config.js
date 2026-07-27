/* ==========================================================
   WEBRTC ICE SERVER CONFIGURATION
========================================================== */

const buildIceServers = () => {
  const stunUrl =
    import.meta.env.VITE_WEBRTC_STUN_URL ||
    "stun:stun.l.google.com:19302";

  const turnUrl =
    import.meta.env.VITE_WEBRTC_TURN_URL;

  const turnUsername =
    import.meta.env.VITE_WEBRTC_TURN_USERNAME;

  const turnCredential =
    import.meta.env.VITE_WEBRTC_TURN_CREDENTIAL;

  const iceServers = [];

  if (stunUrl) {
    iceServers.push({
      urls: stunUrl,
    });
  }

  /*
   * Add TURN only when all required TURN values exist.
   * This prevents invalid empty TURN configuration.
   */

  if (
    turnUrl &&
    turnUsername &&
    turnCredential
  ) {
    iceServers.push({
      urls: turnUrl,
      username: turnUsername,
      credential: turnCredential,
    });
  }

  return iceServers;
};

const rtcConfiguration = {
  iceServers: buildIceServers(),

  iceCandidatePoolSize: 10,

  bundlePolicy: "max-bundle",

  rtcpMuxPolicy: "require",
};

export {
  buildIceServers,
  rtcConfiguration,
};

export default rtcConfiguration;