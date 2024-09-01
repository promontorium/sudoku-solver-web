function debounce<T extends (...args: any[]) => void>(func: T, wait: number): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout>;
    return (...args: Parameters<T>) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), wait);
    }
}

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