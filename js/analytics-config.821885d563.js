/**
 * Cookieless, consent-free analytics configuration.
 *
 * All three supported providers are cookieless: they store nothing on the
 * visitor's device, so § 25 TDDDG (the German ePrivacy rule that forces a
 * consent banner) does not apply and no cookie banner is required.
 * Legal basis is Art. 6(1)(f) GDPR — see the "Analytics" section of
 * /privacy/ and /de/datenschutz/.
 *
 * Leave PROVIDER as "" to keep analytics fully disabled (nothing loads).
 * Pick ONE provider below, fill in its setting, and set PROVIDER to match.
 */
window.ACE_ANALYTICS = {
  // "" | "goatcounter" | "plausible" | "umami"
  PROVIDER: "goatcounter",

  // --- goatcounter --------------------------------------------------------
  // Free for personal sites, hosted in the EU, no personal data stored.
  // Sign up at https://www.goatcounter.com/ and put your code below.
  // Your dashboard lives at https://<code>.goatcounter.com/
  GOATCOUNTER_CODE: "aceconsciousstudio",

  // --- plausible ----------------------------------------------------------
  // Paid (~€9/mo), EU-hosted (Germany). Set this to your site's domain.
  PLAUSIBLE_DOMAIN: "aceconscious.studio",

  // --- umami --------------------------------------------------------------
  // Self-hosted or Umami Cloud (EU region available).
  UMAMI_SRC: "",
  UMAMI_WEBSITE_ID: "",
};
