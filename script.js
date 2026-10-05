document.addEventListener("DOMContentLoaded", () => {
  const menuButton = document.querySelector(".menu-button");
  const navigation = document.querySelector(".main-navigation");

  if (menuButton && navigation) {
    menuButton.addEventListener("click", () => {
      const isOpen = navigation.classList.toggle("is-open");

      menuButton.setAttribute("aria-expanded", String(isOpen));
      menuButton.setAttribute(
        "aria-label",
        isOpen ? "Menü schließen" : "Menü öffnen"
      );
    });

    navigation.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navigation.classList.remove("is-open");
        menuButton.setAttribute("aria-expanded", "false");
        menuButton.setAttribute("aria-label", "Menü öffnen");
      });
    });
  }

  const heroVideo = document.querySelector(".hero-intro__video");
  const volumeSlider = document.querySelector(".hero-intro__volume-slider");

  if (heroVideo && volumeSlider) {
    const volumeKnob = volumeSlider.querySelector(".hero-intro__volume-knob");
    let volume = Number(volumeSlider.getAttribute("aria-valuenow")) / 100;
    let pointerIsDown = false;

    const renderVolume = () => {
      const sliderWidth = volumeSlider.clientWidth;
      const knobWidth = volumeKnob.getBoundingClientRect().width;
      const inset = Math.max(12, knobWidth / 2);
      volumeKnob.style.left = `${inset + volume * (sliderWidth - inset * 2)}px`;
      volumeSlider.setAttribute("aria-valuenow", String(Math.round(volume * 100)));
      heroVideo.volume = volume;
      heroVideo.muted = volume === 0;
    };

    const setVolumeFromPointer = (event) => {
      const bounds = volumeSlider.getBoundingClientRect();
      const knobWidth = volumeKnob.getBoundingClientRect().width;
      const inset = Math.max(12, knobWidth / 2);
      const usableWidth = bounds.width - inset * 2;
      volume = Math.min(1, Math.max(0, (event.clientX - bounds.left - inset) / usableWidth));
      renderVolume();
      heroVideo.play().catch(() => {});
    };

    volumeSlider.addEventListener("pointerdown", (event) => {
      pointerIsDown = true;
      volumeSlider.setPointerCapture(event.pointerId);
      setVolumeFromPointer(event);
    });

    volumeSlider.addEventListener("pointermove", (event) => {
      if (pointerIsDown) {
        setVolumeFromPointer(event);
      }
    });

    volumeSlider.addEventListener("pointerup", () => {
      pointerIsDown = false;
    });

    volumeSlider.addEventListener("pointercancel", () => {
      pointerIsDown = false;
    });

    volumeSlider.addEventListener("keydown", (event) => {
      let nextVolume = volume;

      if (event.key === "ArrowRight" || event.key === "ArrowUp") {
        nextVolume = Math.min(1, volume + 0.05);
      } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
        nextVolume = Math.max(0, volume - 0.05);
      } else if (event.key === "Home") {
        nextVolume = 0;
      } else if (event.key === "End") {
        nextVolume = 1;
      } else {
        return;
      }

      event.preventDefault();
      volume = nextVolume;
      renderVolume();
      heroVideo.play().catch(() => {});
    });

    heroVideo.volume = volume;
    heroVideo.muted = true;
    renderVolume();
    window.addEventListener("resize", renderVolume);

    heroVideo.play().catch(() => {});
  }

  document.querySelectorAll("[data-carousel]").forEach((carousel) => {
    const track = carousel.querySelector("[data-carousel-track]");
    const slides = [...carousel.querySelectorAll(".carousel__slide")];
    const previousButton = carousel.querySelector("[data-carousel-prev]");
    const nextButton = carousel.querySelector("[data-carousel-next]");
    const viewport = carousel.querySelector("[data-carousel-viewport]");

    let currentSlide = 0;
    let trackPosition = 1;

    const lastClone = slides[slides.length - 1].cloneNode(true);
    const firstClone = slides[0].cloneNode(true);
    [lastClone, firstClone].forEach((clone) => {
      clone.setAttribute("aria-hidden", "true");
      clone.inert = true;
    });

    track.prepend(lastClone);
    track.append(firstClone);

    const dotsContainer = document.createElement("div");
    dotsContainer.className = "editorial-carousel__dots";
    const dots = slides.map((_, index) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "editorial-carousel__dot";
      dot.setAttribute("aria-label", `Seite ${index + 1}`);
      dot.addEventListener("click", () => {
        currentSlide = index;
        trackPosition = index + 1;
        updateCarousel();
      });
      dotsContainer.append(dot);
      return dot;
    });
    carousel.append(dotsContainer);

    const updateCarousel = () => {
      track.style.transform = `translateX(-${trackPosition * viewport.clientWidth}px)`;
      dots.forEach((dot, index) => {
        dot.classList.toggle("is-active", index === currentSlide);
        dot.setAttribute("aria-current", index === currentSlide ? "true" : "false");
      });
      slides.forEach((slide, index) => {
        const video = slide.querySelector("video");

        if (!video) {
          return;
        }

        if (index === currentSlide) {
          video.volume = 0.25;
          video.muted = false;
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      });
    };

    previousButton.addEventListener("click", () => {
      if (currentSlide === 0) {
        currentSlide = slides.length - 1;
        trackPosition = 0;
      } else {
        currentSlide -= 1;
        trackPosition -= 1;
      }

      updateCarousel();
    });

    nextButton.addEventListener("click", () => {
      if (currentSlide === slides.length - 1) {
        currentSlide = 0;
        trackPosition = slides.length + 1;
      } else {
        currentSlide += 1;
        trackPosition += 1;
      }

      updateCarousel();
    });

    track.addEventListener("transitionend", (event) => {
      if (event.target !== track || event.propertyName !== "transform") {
        return;
      }

      if (trackPosition === slides.length + 1) {
        trackPosition = 1;
      } else if (trackPosition === 0) {
        trackPosition = slides.length;
      } else {
        return;
      }

      track.style.transition = "none";
      updateCarousel();
      track.getBoundingClientRect();
      track.style.transition = "";
    });

    carousel.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") {
        previousButton.click();
      } else if (event.key === "ArrowRight") {
        nextButton.click();
      }
    });

    let swipeStart = null;

    viewport.addEventListener("pointerdown", (event) => {
      swipeStart = { x: event.clientX, y: event.clientY };
    });

    viewport.addEventListener("pointerup", (event) => {
      if (!swipeStart) {
        return;
      }

      const deltaX = event.clientX - swipeStart.x;
      const deltaY = event.clientY - swipeStart.y;
      swipeStart = null;

      if (Math.abs(deltaX) < 40 || Math.abs(deltaX) < Math.abs(deltaY) * 1.5) {
        return;
      }

      (deltaX < 0 ? nextButton : previousButton).click();
    });

    viewport.addEventListener("pointercancel", () => {
      swipeStart = null;
    });

    window.addEventListener("resize", updateCarousel);
    track.style.transition = "none";
    updateCarousel();
    track.getBoundingClientRect();
    track.style.transition = "";
  });

  const year = document.querySelector("#current-year");

  if (year) {
    year.textContent = new Date().getFullYear();
  }
});