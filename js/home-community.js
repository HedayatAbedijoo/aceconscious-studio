/* Community requests use the same payload and response contract as contact.js. */
(function () {
  "use strict";

  const form = document.getElementById("community-form");
  const status = document.getElementById("community-status");
  if (!form || !status) return;

  const dialog = document.getElementById("community-dialog");
  const trigger = document.querySelector(".community-tab");
  const closeButton = dialog.querySelector(".community-close");
  const compactScreen = window.matchMedia("(max-width: 1024px)");
  const COLLAPSE_DELAY_MS = 1000;
  let collapseTimer;
  let pointerHeld = false;
  let pointerOver = false;
  let pointerDismissal = false;
  let lastScrollY = window.scrollY;

  function scheduleCollapse() {
    window.clearTimeout(collapseTimer);
    if (!compactScreen.matches || dialog.open || pointerHeld || pointerOver) return;
    collapseTimer = window.setTimeout(() => {
      trigger.removeAttribute("data-scroll-active");
    }, COLLAPSE_DELAY_MS);
  }

  function revealTab() {
    if (!compactScreen.matches) return;
    trigger.setAttribute("data-scroll-active", "");
    scheduleCollapse();
  }

  // Scrolling inside the dialog must not affect the tab's idle timer.
  window.addEventListener("scroll", () => {
    const scrollY = window.scrollY;
    if (scrollY === lastScrollY) return;
    lastScrollY = scrollY;
    if (!dialog.open) revealTab();
  }, { passive: true });

  trigger.addEventListener("pointerenter", event => {
    if (event.pointerType === "touch" || dialog.open) return;
    pointerOver = true;
    revealTab();
  });
  trigger.addEventListener("pointerleave", () => {
    pointerOver = false;
    scheduleCollapse();
  });

  // Reveal the collapsed edge on contact and keep the tap on the moving button.
  trigger.addEventListener("pointerdown", event => {
    pointerHeld = true;
    trigger.setAttribute("data-pointer-focus", "");
    trigger.setPointerCapture(event.pointerId);
    revealTab();
  });
  for (const eventName of ["blur", "keydown"]) {
    trigger.addEventListener(eventName, () => trigger.removeAttribute("data-pointer-focus"));
  }
  function releasePointer() {
    if (!pointerHeld) return;
    pointerHeld = false;
    scheduleCollapse();
  }
  window.addEventListener("pointerup", releasePointer);
  window.addEventListener("pointercancel", releasePointer);

  compactScreen.addEventListener("change", () => {
    window.clearTimeout(collapseTimer);
    trigger.removeAttribute("data-scroll-active");
    lastScrollY = window.scrollY;
  });

  // Native modal behavior contains keyboard focus and makes the page behind it inert.
  // Explicit handlers also support browsers without declarative dialog commands.
  trigger.addEventListener("click", event => {
    event.preventDefault();
    pointerDismissal = event.detail > 0;
    pointerOver = false;
    revealTab();
    window.clearTimeout(collapseTimer);
    if (!dialog.open) dialog.showModal();
  });
  closeButton.addEventListener("click", event => {
    event.preventDefault();
    pointerDismissal = event.detail > 0;
    dialog.close();
  });
  dialog.addEventListener("cancel", () => { pointerDismissal = false; });
  dialog.addEventListener("close", () => {
    trigger.focus({ preventScroll: true });
    // WebKit can mark restored pointer focus as :focus-visible. Retain focus,
    // but only keyboard dismissal should keep the tab expanded indefinitely.
    trigger.toggleAttribute("data-pointer-focus", pointerDismissal);
    revealTab();
  });

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
