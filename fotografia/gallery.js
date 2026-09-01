"use strict";

const header = document.querySelector(".photo-header");
const tiles = [...document.querySelectorAll(".photo-tile")];
const filterButtons = [...document.querySelectorAll("[data-filter]")];
const lightbox = document.querySelector("#lightbox");
const lightboxImage = lightbox.querySelector("img");
const lightboxTitle = lightbox.querySelector(".lightbox-meta span");
const lightboxCount = lightbox.querySelector(".lightbox-meta b");
let visibleTiles = [...tiles];
let currentIndex = 0;
let lastFocus = null;

const syncHeader = () => header.classList.toggle("is-scrolled", window.scrollY > 30);
syncHeader();
window.addEventListener("scroll", syncHeader, {passive:true});

tiles.forEach((tile, index) => {
  tile.tabIndex = 0;
  tile.setAttribute("role", "button");
  tile.setAttribute("aria-label", `Abrir fotografía: ${tile.dataset.title}`);
  tile.style.transitionDelay = `${(index % 4) * 45}ms`;
});

if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    });
  }, {threshold:.08, rootMargin:"0px 0px -4% 0px"});
  tiles.forEach(tile => { tile.classList.add("reveal"); observer.observe(tile); });
}

function updateVisibleTiles() {
  visibleTiles = tiles.filter(tile => !tile.classList.contains("is-filtered"));
  visibleTiles.forEach((tile, index) => {
    tile.querySelector("figcaption b").textContent = String(index + 1).padStart(2, "0");
  });
}

filterButtons.forEach(button => button.addEventListener("click", () => {
  filterButtons.forEach(item => item.classList.toggle("active", item === button));
  const filter = button.dataset.filter;
  tiles.forEach(tile => {
    const show = filter === "all" || tile.dataset.category === filter;
    tile.classList.toggle("is-filtered", !show);
    if (show) tile.classList.add("visible");
  });
  updateVisibleTiles();
}));

function showImage(index) {
  currentIndex = (index + visibleTiles.length) % visibleTiles.length;
  const tile = visibleTiles[currentIndex];
  const source = tile.querySelector("img");
  lightboxImage.src = source.src;
  lightboxImage.alt = source.alt;
  lightboxTitle.textContent = tile.dataset.title;
  lightboxCount.textContent = `${String(currentIndex + 1).padStart(2, "0")} / ${String(visibleTiles.length).padStart(2, "0")}`;
}

function openLightbox(tile) {
  lastFocus = tile;
  showImage(visibleTiles.indexOf(tile));
  lightbox.classList.add("open");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.classList.add("lightbox-open");
  lightbox.querySelector(".lightbox-close").focus();
}

function closeLightbox() {
  lightbox.classList.remove("open");
  lightbox.setAttribute("aria-hidden", "true");
  document.body.classList.remove("lightbox-open");
  if (lastFocus) lastFocus.focus();
}

tiles.forEach(tile => {
  tile.addEventListener("click", () => openLightbox(tile));
  tile.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openLightbox(tile); }
  });
});

lightbox.querySelector(".lightbox-close").addEventListener("click", closeLightbox);
lightbox.querySelector(".lightbox-prev").addEventListener("click", () => showImage(currentIndex - 1));
lightbox.querySelector(".lightbox-next").addEventListener("click", () => showImage(currentIndex + 1));
lightbox.addEventListener("click", event => { if (event.target === lightbox) closeLightbox(); });
document.addEventListener("keydown", event => {
  if (!lightbox.classList.contains("open")) return;
  if (event.key === "Escape") closeLightbox();
  if (event.key === "ArrowLeft") showImage(currentIndex - 1);
  if (event.key === "ArrowRight") showImage(currentIndex + 1);
});

updateVisibleTiles();
