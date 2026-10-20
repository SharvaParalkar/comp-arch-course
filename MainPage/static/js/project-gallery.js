(() => {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!prefersReducedMotion) {
    document.querySelectorAll(".project-card__carousel, .publication-card__carousel, .teaching-card__carousel").forEach((carousel, carouselIndex) => {
      const images = Array.from(carousel.querySelectorAll("img"));
      if (images.length < 2) return;

      let activeIndex = 0;
      const advance = () => {
        if (document.hidden || carousel.matches(":hover, :focus-within")) return;
        images[activeIndex].classList.remove("is-active");
        activeIndex = (activeIndex + 1) % images.length;
        images[activeIndex].classList.add("is-active");
        if (carousel.matches(".publication-card__carousel")) {
          carousel.href = images[activeIndex].src;
        }
      };
      const isProjectOrTeachingCarousel = carousel.matches(".project-card__carousel, .teaching-card__carousel");
      const initialDelay = isProjectOrTeachingCarousel
        ? 1500 + ((carouselIndex * 347) % 1000)
        : 4000 + ((carouselIndex * 347) % 4500);
      window.setTimeout(() => {
        advance();
        window.setInterval(advance, 4500);
      }, initialDelay);
    });
  }

  const dialog = document.querySelector(".project-lightbox");
  if (!dialog) return;

  const expandedImage = dialog.querySelector(".project-lightbox__image");
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
  };

  links.forEach((link, index) => {
    link.addEventListener("click", (event) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();

      showImage(index);
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
      closeButton.focus();
    });
  });

  previousButton.addEventListener("click", () => showImage(currentIndex - 1));
  nextButton.addEventListener("click", () => showImage(currentIndex + 1));
  closeButton.addEventListener("click", () => {
    if (typeof dialog.close === "function") dialog.close();
    else dialog.removeAttribute("open");
  });
  dialog.addEventListener("click", (event) => {
    if (event.target !== dialog) return;
    if (typeof dialog.close === "function") dialog.close();
    else dialog.removeAttribute("open");
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
  });
})();
