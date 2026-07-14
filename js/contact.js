(function () {
  "use strict";

  const ENDPOINT = window.CONTACT_FORM_ENDPOINT || "";
  const MESSAGE_TYPE = "ace-contact-form";

  const form = document.getElementById("contact-form");
  const statusEl = document.getElementById("contact-status");
  if (!form || !statusEl) return;

  function msg(key) {
    return window.aceI18n?.getString(key) || "";
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

    const email = form.email.value.trim();
    const message = form.message.value.trim();
    if (!email || !message) return;

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
          message,
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
