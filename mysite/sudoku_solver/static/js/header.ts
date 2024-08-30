let lastScrollTop = 0;

window.addEventListener("load", () => {
    const header = document.querySelector("header") as HTMLElement;
    if (!header) {
        return;
    }
    window.addEventListener("scroll", () => {
        const scrollTop = document.documentElement.scrollTop;
        header.style.top = scrollTop > lastScrollTop ? "-60px" : "0";
        lastScrollTop = scrollTop < 0 ? 0 : scrollTop;
    });
});