window.addEventListener("load", () => {
    const handlerSetAttribute = "password-widget-handler-set";
    const SHOW_TITLE = "Show password";
    const HIDE_TITLE = "Hide password";
    document.querySelectorAll(".password-widget__reveal-wrapper").forEach((element) => {
        if (element.getAttribute(handlerSetAttribute) !== "true") {
            element.setAttribute(handlerSetAttribute, "true");
            element.setAttribute("title", SHOW_TITLE);
            const input = element.parentElement?.querySelector("input") as HTMLInputElement;
            if (input) {
                const icons = element.querySelectorAll(".password-widget__reveal");
                element.addEventListener("click", () => {
                    input.type = input.type === "password" ? "text" : "password";
                    element.setAttribute("title", input.type === "password" ? SHOW_TITLE : HIDE_TITLE);
                    icons.forEach((icon) => {
                        icon.classList.toggle("password-widget__reveal--hidden");
                    });
                });
            }
        }
    });
});
