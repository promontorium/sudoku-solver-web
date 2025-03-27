window.addEventListener("load", () => {
    const handlerSetAttribute = "password-widget-reveal-handler-set";
    const SHOW_TITLE = "Show password";
    const HIDE_TITLE = "Hide password";
    document.querySelectorAll(".password-widget-reveal-wrapper").forEach((element) => {
        if (!element.hasAttribute(handlerSetAttribute)) {
            element.setAttribute("title", SHOW_TITLE);
            element.addEventListener("click", () => {
                const input = element.parentElement?.querySelector("input") as HTMLInputElement;
                if (input) {
                    input.type = input.type === "password" ? "text" : "password";
                    element.setAttribute("title", input.type === "password" ? SHOW_TITLE : HIDE_TITLE);
                    element.querySelectorAll(".password-widget-reveal").forEach((svg) => {
                        svg.classList.toggle("hidden");
                    });
                }
            });
            element.setAttribute(handlerSetAttribute, "true");
        }
    });
});
