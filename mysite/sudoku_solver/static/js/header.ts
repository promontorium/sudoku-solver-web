let lastScrollTop = 0;

window.addEventListener("load", () => {
    const header = document.querySelector("header") as HTMLElement;
    if (!header) {
        return;
    }
    const headerHeight = getComputedStyle(document.documentElement).getPropertyValue("--header-height") || "100%";
    window.addEventListener("scroll", () => {
        const scrollTop = document.documentElement.scrollTop;
        header.style.top = scrollTop > lastScrollTop ? `-${headerHeight}` : "0";
        lastScrollTop = scrollTop < 0 ? 0 : scrollTop;
    });
});