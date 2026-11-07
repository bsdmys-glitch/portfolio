const carouselTrack = document.querySelector("[data-carousel-track]");

if (carouselTrack) {
  const carouselSlides = Array.from(carouselTrack.children);
  const previousButton = document.querySelector(".carousel-prev");
  const nextButton = document.querySelector(".carousel-next");
  let currentSlide = 0;
  let carouselFrame;

  const updateCarousel = () => {
    currentSlide = carouselSlides.reduce((closestIndex, slide, index) => {
      const closestDistance = Math.abs(carouselSlides[closestIndex].offsetLeft - carouselTrack.scrollLeft);
      const slideDistance = Math.abs(slide.offsetLeft - carouselTrack.scrollLeft);
      return slideDistance < closestDistance ? index : closestIndex;
    }, 0);

    if (previousButton) previousButton.disabled = currentSlide === 0;
    if (nextButton) nextButton.disabled = currentSlide === carouselSlides.length - 1;
  };

  const showSlide = (index) => {
    const targetIndex = Math.max(0, Math.min(index, carouselSlides.length - 1));
    carouselTrack.scrollTo({ left: carouselSlides[targetIndex].offsetLeft, behavior: "smooth" });
  };

  if (previousButton) previousButton.addEventListener("click", () => showSlide(currentSlide - 1));
  if (nextButton) nextButton.addEventListener("click", () => showSlide(currentSlide + 1));

  carouselTrack.addEventListener("scroll", () => {
    cancelAnimationFrame(carouselFrame);
    carouselFrame = requestAnimationFrame(updateCarousel);
  }, { passive: true });

  carouselTrack.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    showSlide(currentSlide + (event.key === "ArrowRight" ? 1 : -1));
  });

  let dragStartX = 0;
  let dragStartScroll = 0;

  carouselTrack.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    dragStartX = event.clientX;
    dragStartScroll = carouselTrack.scrollLeft;
    carouselTrack.classList.add("is-dragging");
    carouselTrack.setPointerCapture(event.pointerId);
  });

  carouselTrack.addEventListener("pointermove", (event) => {
    if (!carouselTrack.hasPointerCapture(event.pointerId)) return;
    carouselTrack.scrollLeft = dragStartScroll - (event.clientX - dragStartX);
  });

  const finishDrag = (event) => {
    if (!carouselTrack.hasPointerCapture(event.pointerId)) return;
    carouselTrack.releasePointerCapture(event.pointerId);
    carouselTrack.classList.remove("is-dragging");
    showSlide(currentSlide);
  };

  carouselTrack.addEventListener("pointerup", finishDrag);
  carouselTrack.addEventListener("pointercancel", finishDrag);

  window.addEventListener("resize", updateCarousel);
  updateCarousel();
}

document.querySelectorAll("[data-scroller]").forEach((root) => {
  const track = root.querySelector("[data-scroller-track]");
  const previousButton = root.querySelector("[data-scroller-prev]");
  const nextButton = root.querySelector("[data-scroller-next]");
  if (!track || !previousButton || !nextButton) return;

  let frame;

  const updateScroller = () => {
    const maxScroll = track.scrollWidth - track.clientWidth;
    previousButton.disabled = track.scrollLeft <= 2;
    nextButton.disabled = track.scrollLeft >= maxScroll - 2;
  };

  const scrollByItem = (direction) => {
    const distance = Math.max(track.clientWidth * 0.84, 220);
    track.scrollBy({ left: direction * distance, behavior: "smooth" });
  };

  previousButton.addEventListener("click", () => scrollByItem(-1));
  nextButton.addEventListener("click", () => scrollByItem(1));
  track.addEventListener("scroll", () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(updateScroller);
  }, { passive: true });
  track.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    scrollByItem(event.key === "ArrowRight" ? 1 : -1);
  });
  updateScroller();
});

const imageAlignedCaptionFigures = Array.from(document.querySelectorAll("[data-caption-align=\"image\"]"));

const alignImageCaptions = () => {
  imageAlignedCaptionFigures.forEach((figure) => {
    const frame = figure.querySelector(".image-frame");
    const image = frame ? frame.querySelector("img") : null;
    if (!frame || !image || !image.naturalWidth || !image.naturalHeight || !frame.clientHeight) return;

    const frameRatio = frame.clientWidth / frame.clientHeight;
    const imageRatio = image.naturalWidth / image.naturalHeight;
    const visibleWidth = Math.min(1, imageRatio / frameRatio);
    figure.style.setProperty("--caption-width", `${visibleWidth * 100}%`);
  });
};

imageAlignedCaptionFigures.forEach((figure) => {
  const image = figure.querySelector(".image-frame img");
  if (image) image.addEventListener("load", alignImageCaptions);
});

window.addEventListener("resize", alignImageCaptions);
window.addEventListener("load", () => {
  alignImageCaptions();
  document.querySelectorAll("[data-scroller-track]").forEach((track) => track.dispatchEvent(new Event("scroll")));
});
