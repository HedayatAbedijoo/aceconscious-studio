/**
 * Loads the cookieless analytics provider named in js/analytics-config.js.
 *
 * Sets no cookies and writes nothing to localStorage, so no consent banner is
 * required. Additionally honours Do Not Track / Global Privacy Control and
 * skips local development hosts, so neither ever reaches the provider.
 */
(function () {
  "use strict";

  var config = window.ACE_ANALYTICS;
  if (!config || !config.PROVIDER) return;

  // Respect browser opt-out signals even though consent is not legally required.
  var nav = window.navigator || {};
  var dnt = nav.doNotTrack || window.doNotTrack || nav.msDoNotTrack;
  if (dnt === "1" || dnt === "yes" || nav.globalPrivacyControl === true) return;

  // Never count our own visits while working on the site locally.
  var host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1" || host === "" || host.indexOf(".local") !== -1) return;

  var script = document.createElement("script");
  script.defer = true;

  switch (config.PROVIDER) {
    case "goatcounter":
      if (!config.GOATCOUNTER_CODE) return;
      script.src = "https://gc.zgo.at/count.js";
      script.setAttribute("data-goatcounter", "https://" + config.GOATCOUNTER_CODE + ".goatcounter.com/count");
      break;

    case "plausible":
      if (!config.PLAUSIBLE_DOMAIN) return;
      script.src = "https://plausible.io/js/script.js";
      script.setAttribute("data-domain", config.PLAUSIBLE_DOMAIN);
      break;

    case "umami":
      if (!config.UMAMI_SRC || !config.UMAMI_WEBSITE_ID) return;
      script.src = config.UMAMI_SRC;
      script.setAttribute("data-website-id", config.UMAMI_WEBSITE_ID);
      break;

    default:
      return;
  }

  document.head.appendChild(script);
})();
