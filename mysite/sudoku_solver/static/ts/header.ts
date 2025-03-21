import { debounce } from "./utils.js";

window.addEventListener("load", () => {
    const header = document.querySelector("header");
    if (!header) {
        return;
    }
    let lastScrollPosition = window.scrollY;
    window.addEventListener("scroll", debounce(() => {
        const currentScrollPosition = window.scrollY;
        header.classList.toggle("scrolled-down", currentScrollPosition >= lastScrollPosition);
        lastScrollPosition = currentScrollPosition;
    }, 25));
});