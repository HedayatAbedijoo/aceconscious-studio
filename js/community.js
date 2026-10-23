/* Reader circle requests use the same endpoint, payload and response contract as
   contact.js. Taken unchanged from the Community section of branch new-design
   (commit bb7a21a) so the book edition keeps the project's own joining flow. */
(function () {
  "use strict";

  const form = document.getElementById("community-form");
  const status = document.getElementById("community-status");
  if (!form || !status) return;

  const endpoint = window.CONTACT_FORM_ENDPOINT || "";
  const emailField = form.elements.namedItem("email");
  const fields = form.querySelector("fieldset");
  const submitButton = form.querySelector('[type="submit"]');
  const MESSAGE_TYPE = "ace-contact-form";
  const REQUEST_TIMEOUT_MS = 20000;
  let sending = false;

  function setStatus(message, state = "") {
    status.textContent = message;
    status.hidden = !message;
    status.dataset.state = state;
    if (message && form.closest(".gift-page")) status.scrollIntoView({ block: "nearest" });
  }

  emailField.addEventListener("input", () => {
    emailField.setCustomValidity("");
    emailField.removeAttribute("aria-invalid");
    if (!sending) setStatus("");
  });

  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (sending) return;

    emailField.value = emailField.value.trim();
    emailField.setCustomValidity("");
    // Match the contact backend's validation as well as the native email check.
    if (!emailField.validity.valid || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailField.value)) {
      emailField.setCustomValidity(form.dataset.invalidEmail);
      emailField.setAttribute("aria-invalid", "true");
      form.reportValidity();
      return;
    }
    emailField.removeAttribute("aria-invalid");

    if (!endpoint) {
      setStatus(form.dataset.unavailable, "error");
      return;
    }

    // Retain the contact form's honeypot; trapped submissions never leave the page.
    if (form.elements.namedItem("website").value.trim()) {
      form.reset();
      setStatus(form.dataset.success, "success");
      return;
    }

    const email = emailField.value;
    sending = true;
    submitButton.disabled = true;
    emailField.readOnly = true;
    form.setAttribute("aria-busy", "true");
    setStatus(form.dataset.sending);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        credentials: "omit",
        signal: controller.signal,
        body: JSON.stringify({
          email,
          message: `Community join request\n\n${form.dataset.requestMessage}\n\nPage: ${window.location.pathname}#community`,
          origin: window.location.origin,
          website: "",
        }),
      });
      const data = await response.json();
      if (!response.ok || data?.type !== MESSAGE_TYPE || data.status !== "success") {
        throw new Error("Request was not confirmed");
      }
      form.reset();
      setStatus(form.dataset.success, "success");
    } catch {
      // Keep the address so the reader can retry; never claim an unconfirmed join.
      setStatus(form.dataset.error, "error");
    } finally {
      window.clearTimeout(timeout);
      sending = false;
      submitButton.disabled = false;
      emailField.readOnly = false;
      form.removeAttribute("aria-busy");
    }
  });

  // Prevent an unhandled native submission if JavaScript fails to load.
  fields.disabled = false;
})();
