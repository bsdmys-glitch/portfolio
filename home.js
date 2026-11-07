const siteLoading = document.querySelector("[data-site-loading]");

if (siteLoading) {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let loadingCompleted = false;

  root.classList.add("is-loading");

  const completeLoading = () => {
    if (loadingCompleted) return;
    loadingCompleted = true;
    siteLoading.classList.add("is-complete");

    const unlockPage = () => root.classList.remove("is-loading");
    if (reduceMotion) {
      unlockPage();
    } else {
      unlockPage();
    }
  };

  const revealPage = async () => {
    if (reduceMotion) {
      completeLoading();
      return;
    }
    const delay = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));
    const ready = document.fonts ? document.fonts.ready : Promise.resolve();
    await Promise.all([delay(1600), Promise.race([ready, delay(3000)])]);
    if (loadingCompleted) return;
    siteLoading.classList.add("is-expanding");
    await delay(1100);
    siteLoading.classList.add("is-opening");
    await delay(1000);
    completeLoading();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", revealPage, { once: true });
  } else {
    revealPage();
  }
  window.setTimeout(completeLoading, 7500);
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) completeLoading();
  });
}

const menuButton = document.querySelector(".menu-button");
const mobileMenu = document.querySelector("#mobile-menu");

function closeMenu() {
  if (!mobileMenu || !menuButton) return;
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.setAttribute("aria-label", "Open menu");
  mobileMenu.hidden = true;
}

menuButton?.addEventListener("click", () => {
  const isOpen = menuButton.getAttribute("aria-expanded") === "true";
  menuButton.setAttribute("aria-expanded", String(!isOpen));
  menuButton.setAttribute("aria-label", isOpen ? "Open menu" : "Close menu");
  if (mobileMenu) mobileMenu.hidden = isOpen;
});

mobileMenu?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", closeMenu);
});

document.querySelectorAll("[data-photo-flow]").forEach((root) => {
  const track = root.querySelector("[data-photo-flow-track]");
  const previousButton = root.querySelector("[data-photo-flow-prev]");
  const nextButton = root.querySelector("[data-photo-flow-next]");
  if (!track || !previousButton || !nextButton) return;

  let frame;

  const updatePhotoFlow = () => {
    const maxScroll = track.scrollWidth - track.clientWidth;
    previousButton.disabled = track.scrollLeft <= 2;
    nextButton.disabled = track.scrollLeft >= maxScroll - 2;
  };

  const scrollPhotoFlow = (direction) => {
    const distance = Math.max(track.clientWidth * 0.84, 220);
    track.scrollBy({ left: direction * distance, behavior: "smooth" });
  };

  previousButton.addEventListener("click", () => scrollPhotoFlow(-1));
  nextButton.addEventListener("click", () => scrollPhotoFlow(1));
  track.addEventListener("scroll", () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(updatePhotoFlow);
  }, { passive: true });
  track.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    scrollPhotoFlow(event.key === "ArrowRight" ? 1 : -1);
  });

  updatePhotoFlow();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeMenu();
});
