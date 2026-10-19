(() => {
  const dialog = document.querySelector(".project-lightbox");
  if (!dialog) return;

  const expandedImage = dialog.querySelector(".project-lightbox__image");
  const caption = dialog.querySelector(".project-lightbox__caption");
  const closeButton = dialog.querySelector(".project-lightbox__close");
  const previousButton = dialog.querySelector(".project-lightbox__nav--previous");
  const nextButton = dialog.querySelector(".project-lightbox__nav--next");
  const links = Array.from(document.querySelectorAll("[data-project-lightbox]"));
  let currentIndex = -1;

  const showImage = (index) => {
    currentIndex = (index + links.length) % links.length;
    const link = links[currentIndex];
    const thumbnail = link.querySelector("img");
    expandedImage.src = link.href;
    expandedImage.alt = thumbnail?.alt || "Expanded project image";
    caption.textContent = thumbnail?.alt || "";
  };

  links.forEach((link, index) => {
    link.addEventListener("click", (event) => {
      if (event.button !== 0 || !dialog.showModal) return;
      event.preventDefault();

      showImage(index);
      dialog.showModal();
      closeButton.focus();
    });
  });

  previousButton.addEventListener("click", () => showImage(currentIndex - 1));
  nextButton.addEventListener("click", () => showImage(currentIndex + 1));
  closeButton.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      showImage(currentIndex - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      showImage(currentIndex + 1);
    }
  });
  dialog.addEventListener("close", () => {
    expandedImage.removeAttribute("src");
    caption.textContent = "";
  });
})();
