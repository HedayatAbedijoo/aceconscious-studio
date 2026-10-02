(function () {
  "use strict";

  const ENDPOINT = window.CONTACT_FORM_ENDPOINT || "";
  const MESSAGE_TYPE = "ace-contact-form";

  const form = document.getElementById("contact-form");
  const statusEl = document.getElementById("contact-status");
  if (!form || !statusEl) return;

  // English fallback for pages that do not load js/i18n.js (the /rights/ and /screen/ pages).
  const FALLBACK = {
    "contact.sending": "Sending…",
    "contact.success": "Thank you — your message is on its way.",
    "contact.error": "Something went wrong. Please try again in a moment.",
    "contact.notConfigured": "The contact form is not set up yet. Please try again later.",
  };

  function msg(key) {
    return window.aceI18n?.getString(key) || FALLBACK[key] || "";
  }

  function setStatus(text, type) {
    statusEl.textContent = text;
    statusEl.hidden = !text;
    statusEl.classList.toggle("contact-form__status--success", type === "success");
    statusEl.classList.toggle("contact-form__status--error", type === "error");
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!ENDPOINT) {
      setStatus(msg("contact.notConfigured"), "error");
      return;
    }

    // The form is novalidate, so show the browser's own messages for missing or invalid
    // fields (email, message, and the required category on the industry pages).
    const email = form.email.value.trim();
    const message = form.message.value.trim();
    if (!form.checkValidity() || !email || !message) {
      form.reportValidity();
      return;
    }

    // Category select (industry pages). The form backend stores only email and message,
    // so the category and page travel at the top of the message itself.
    const categoryField = form.elements.namedItem("category");
    const category = categoryField ? categoryField.value.trim() : "";
    const body = categoryField
      ? `Category: ${category}\nPage: ${window.location.pathname}\n\n${message}`
      : message;

    const honeypot = form.website?.value?.trim();
    if (honeypot) {
      form.reset();
      setStatus(msg("contact.success"), "success");
      return;
    }

    const submitBtn = form.querySelector('[type="submit"]');
    submitBtn.disabled = true;
    setStatus(msg("contact.sending"), null);

    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          email,
          message: body,
          ...(categoryField ? { category } : {}),
          origin: window.location.origin,
          website: "",
        }),
      });

      const data = await response.json();
      if (data?.type === MESSAGE_TYPE && data.status === "success") {
        form.reset();
        setStatus(msg("contact.success"), "success");
        return;
      }

      setStatus(msg("contact.error"), "error");
    } catch {
      setStatus(msg("contact.error"), "error");
    } finally {
      submitBtn.disabled = false;
    }
  });
})();
