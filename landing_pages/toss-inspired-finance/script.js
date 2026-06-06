const header = document.querySelector(".site-header");

const updateHeader = () => {
  header.dataset.elevated = window.scrollY > 12 ? "true" : "false";
};

updateHeader();
window.addEventListener("scroll", updateHeader, { passive: true });
