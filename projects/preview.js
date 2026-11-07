const previewPanel = document.querySelector("[data-project-preview-panel]");

if (previewPanel) {
  const previewImage = previewPanel.querySelector("[data-project-preview-image]");
  const previewType = previewPanel.querySelector("[data-project-preview-type]");
  const triggers = [...document.querySelectorAll("[data-project-preview]")];
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let hideTimer;

  const hidePreview = () => {
    clearTimeout(hideTimer);
    previewPanel.classList.remove("is-visible", "is-loaded");
    previewPanel.setAttribute("aria-hidden", "true");
    hideTimer = window.setTimeout(() => {
      if (previewPanel.getAttribute("aria-hidden") === "true") {
        previewPanel.classList.remove("is-cursor-positioned");
        previewPanel.style.removeProperty("--preview-x");
        previewPanel.style.removeProperty("--preview-y");
      }
    }, 280);
  };

  const positionPreview = (event) => {
    if (!finePointer.matches || !event) return;

    const gap = 24;
    const bounds = previewPanel.getBoundingClientRect();
    const width = bounds.width || 360;
    const height = bounds.height || 310;
    let x = event.clientX + gap;
    let y = event.clientY + gap;

    if (x + width > window.innerWidth - gap) x = event.clientX - width - gap;
    if (y + height > window.innerHeight - gap) y = event.clientY - height - gap;

    previewPanel.style.setProperty("--preview-x", `${Math.max(gap, x)}px`);
    previewPanel.style.setProperty("--preview-y", `${Math.max(gap, y)}px`);
    previewPanel.classList.add("is-cursor-positioned");
  };

  const showPreview = (trigger, event) => {
    const source = trigger.dataset.projectPreview;
    if (!source) return;

    previewPanel.classList.remove("is-loaded");
    previewPanel.setAttribute("aria-hidden", "false");
    previewImage.alt = trigger.dataset.projectPreviewAlt || trigger.textContent.trim();
    previewType.textContent = trigger.dataset.projectPreviewType || "PROJECT IMAGE";
    previewImage.onload = () => previewPanel.classList.add("is-loaded");
    previewImage.src = source;

    if (event) positionPreview(event);
    else {
      previewPanel.classList.remove("is-cursor-positioned");
      previewPanel.style.removeProperty("--preview-x");
      previewPanel.style.removeProperty("--preview-y");
    }

    clearTimeout(hideTimer);
    previewPanel.classList.add("is-visible");
  };

  triggers.forEach((trigger) => {
    trigger.addEventListener("pointerenter", (event) => showPreview(trigger, event));
    trigger.addEventListener("pointermove", positionPreview);
    trigger.addEventListener("pointerleave", hidePreview);
    trigger.addEventListener("focus", () => showPreview(trigger));
    trigger.addEventListener("blur", hidePreview);
  });

  if (reduceMotion.matches) {
    previewPanel.style.transition = "none";
    previewPanel.querySelector("img").style.transition = "none";
  }
}
