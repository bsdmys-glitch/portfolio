const preview = document.querySelector("[data-preview]");

if (preview) {
  const slides = [...preview.querySelectorAll("[data-slide]")];
  const dots = [...preview.querySelectorAll("[data-dot]")];
  const previousButton = preview.querySelector("[data-prev]");
  const nextButton = preview.querySelector("[data-next]");
  const currentIndex = preview.querySelector("[data-current-index]");
  const total = preview.querySelector("[data-total]");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let activeIndex = 0;
  let isChanging = false;
  let pointerStartX = 0;
  let pointerStartY = 0;
  let hasPointerMoved = false;
  let pointerActive = false;
  let suppressClickUntil = 0;

  if (total) total.textContent = String(slides.length).padStart(2, "0");

  const updateNavigation = () => {
    if (currentIndex) currentIndex.textContent = String(activeIndex + 1).padStart(2, "0");

    dots.forEach((dot, index) => {
      const isActive = index === activeIndex;
      dot.classList.toggle("is-active", isActive);
      if (dot.getAttribute("role") === "tab") {
        dot.setAttribute("aria-selected", String(isActive));
        dot.tabIndex = isActive ? 0 : -1;
      } else {
        dot.setAttribute("aria-current", String(isActive));
      }
    });
  };

  const showSlide = (targetIndex) => {
    if (isChanging || targetIndex === activeIndex) return;

    const nextIndex = (targetIndex + slides.length) % slides.length;
    const currentSlide = slides[activeIndex];
    const nextSlide = slides[nextIndex];
    const transitionDuration = reduceMotion ? 20 : 950;

    isChanging = true;
    currentSlide.classList.remove("is-active");
    currentSlide.classList.add("is-exiting");
    nextSlide.classList.add("is-active");
    nextSlide.setAttribute("aria-hidden", "false");
    currentSlide.setAttribute("aria-hidden", "true");
    nextSlide.inert = false;
    currentSlide.inert = true;
    activeIndex = nextIndex;
    updateNavigation();

    window.setTimeout(() => {
      currentSlide.classList.remove("is-exiting");
      isChanging = false;
    }, transitionDuration);
  };

  const goNext = () => showSlide(activeIndex + 1);
  const goPrevious = () => showSlide(activeIndex - 1);

  previousButton?.addEventListener("click", (event) => {
    event.stopPropagation();
    goPrevious();
  });

  nextButton?.addEventListener("click", (event) => {
    event.stopPropagation();
    goNext();
  });

  dots.forEach((dot, index) => {
    dot.addEventListener("click", (event) => {
      event.stopPropagation();
      showSlide(index);
    });
  });

  preview.addEventListener("wheel", (event) => {
    if (!event.target.closest(".preview-stage")) return;
    const horizontalDelta = event.deltaX || (event.shiftKey ? event.deltaY : 0);
    if (Math.abs(horizontalDelta) < 24 || isChanging) return;
    event.preventDefault();
    horizontalDelta > 0 ? goNext() : goPrevious();
  }, { passive: false });

  preview.addEventListener("keydown", (event) => {
    if (event.target.closest("input, textarea, select, [contenteditable]")) return;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      goNext();
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goPrevious();
    }
  });

  preview.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (!event.target.closest(".preview-stage")) return;
    if (event.target.closest("button, a:not(.project-zoom-link)")) return;
    pointerStartX = event.clientX;
    pointerStartY = event.clientY;
    hasPointerMoved = false;
    pointerActive = true;
    if (!event.target.closest(".project-zoom-link")) preview.setPointerCapture?.(event.pointerId);
  });

  preview.addEventListener("pointermove", (event) => {
    if (!pointerActive) return;
    if (Math.abs(event.clientX - pointerStartX) > 8 || Math.abs(event.clientY - pointerStartY) > 8) {
      hasPointerMoved = true;
    }
  });

  preview.addEventListener("pointerup", (event) => {
    if (!pointerActive) return;
    pointerActive = false;
    const deltaX = event.clientX - pointerStartX;
    const deltaY = event.clientY - pointerStartY;
    pointerStartX = 0;
    pointerStartY = 0;

    if (hasPointerMoved) suppressClickUntil = performance.now() + 400;

    if (!hasPointerMoved || Math.abs(deltaX) < 55 || Math.abs(deltaX) < Math.abs(deltaY)) return;
    event.preventDefault();
    deltaX < 0 ? goNext() : goPrevious();
  });

  preview.addEventListener("pointercancel", () => {
    pointerActive = false;
    pointerStartX = 0;
    pointerStartY = 0;
  });

  preview.addEventListener("click", event => {
    if (event.target.closest(".project-zoom-link") && performance.now() < suppressClickUntil) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);

  updateNavigation();
}
