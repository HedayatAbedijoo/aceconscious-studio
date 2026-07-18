/** Bump ASSET_VERSION whenever cover/art assets change so mobile caches refresh. */
(function () {
  "use strict";
  window.ACE_ASSET_VERSION = "20260719a";

  window.aceAssetUrl = function aceAssetUrl(path) {
    if (!path) return path;
    if (/^(?:https?:|data:|blob:)/i.test(path)) return path;
    var clean = String(path).replace(/^\//, "");
    var versioned = clean + (clean.indexOf("?") === -1 ? "?" : "&") + "v=" + window.ACE_ASSET_VERSION;
    return "/" + versioned;
  };
})();
