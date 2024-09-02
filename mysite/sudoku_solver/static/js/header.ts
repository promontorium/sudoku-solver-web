import { debounce } from "./utils.js";

window.addEventListener("load", () => {
    const header = document.querySelector("header");
    if (!header) {
        return;
    }
    let lastScrollY = window.scrollY;
    window.addEventListener("scroll", debounce(() => {
        const currentScrollY = window.scrollY;
        header.classList.toggle("scrolled-down", currentScrollY >= lastScrollY);
        lastScrollY = currentScrollY;
    }, 25));
});