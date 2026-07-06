(function () {
  "use strict";

  const bookCover = document.getElementById("book-cover");
  const peekBtn = document.getElementById("book-cover-peek");
  const card = bookCover?.querySelector(".book-cover__card");

  if (!bookCover || !peekBtn || !card) return;

  const DRAG_THRESHOLD = 56;
  const FLIP_ANGLE = 180;

  let dragging = false;
  let startX = 0;
  let startY = 0;
  let pointerId = null;

  function isFlipped() {
    return bookCover.classList.contains("is-flipped");
  }

  function setFlipped(flipped) {
    bookCover.classList.toggle("is-flipped", flipped);
    peekBtn.setAttribute("aria-pressed", String(flipped));
    updatePeekLabel(flipped);
    card.style.transform = "";
  }

  function updatePeekLabel(flipped) {
    const key = flipped ? "hero.coverPeekAriaBack" : "hero.coverPeekAria";
    const label = window.aceI18n?.getString?.(key);
    if (label) peekBtn.setAttribute("aria-label", label);
  }

  function toggleFlip() {
    setFlipped(!isFlipped());
  }

  function dragProgress(deltaX, deltaY) {
    const drag = isFlipped() ? deltaX : -deltaX;
    return Math.max(0, Math.min(1, (drag - deltaY * 0.15) / 110));
  }

  function applyDragRotation(progress) {
    const angle = isFlipped()
      ? -FLIP_ANGLE + progress * FLIP_ANGLE
      : -progress * FLIP_ANGLE;
    card.style.transform = `rotateY(${angle}deg)`;
  }

  function onPointerDown(event) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    dragging = true;
    pointerId = event.pointerId;
    startX = event.clientX;
    startY = event.clientY;
    bookCover.classList.add("is-dragging");
    peekBtn.setPointerCapture(pointerId);
    event.preventDefault();
  }

  function onPointerMove(event) {
    if (!dragging || event.pointerId !== pointerId) return;
    const deltaX = event.clientX - startX;
    const deltaY = event.clientY - startY;
    applyDragRotation(dragProgress(deltaX, deltaY));
  }

  function finishDrag(event) {
    if (!dragging || event.pointerId !== pointerId) return;
    dragging = false;
    bookCover.classList.remove("is-dragging");
    peekBtn.releasePointerCapture(pointerId);
    pointerId = null;

    const deltaX = event.clientX - startX;
    const deltaY = event.clientY - startY;
    const distance = Math.hypot(deltaX, deltaY);
    const progress = dragProgress(deltaX, deltaY);

    if (distance < 8) {
      card.style.transform = "";
      toggleFlip();
      return;
    }

    if (!isFlipped() && (progress > 0.35 || deltaX < -DRAG_THRESHOLD)) {
      setFlipped(true);
      return;
    }

    if (isFlipped() && (progress > 0.35 || deltaX > DRAG_THRESHOLD)) {
      setFlipped(false);
      return;
    }

    card.style.transform = "";
  }

  peekBtn.addEventListener("pointerdown", onPointerDown);
  peekBtn.addEventListener("pointermove", onPointerMove);
  peekBtn.addEventListener("pointerup", finishDrag);
  peekBtn.addEventListener("pointercancel", finishDrag);

  peekBtn.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleFlip();
    }
  });

  document.addEventListener("languagechange", () => {
    updatePeekLabel(isFlipped());
  });
})();
