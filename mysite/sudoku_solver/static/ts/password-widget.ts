window.addEventListener("load", () => {
    const handlerSetAttribute = "password-widget-reveal-handler-set";
    document.querySelectorAll(".password-widget-reveal-wrapper").forEach((element) => {
        if (!element.hasAttribute(handlerSetAttribute)) {
            element.addEventListener("click", () => {
                element.querySelectorAll(".password-widget-reveal").forEach((svg) => {
                    svg.classList.toggle("hidden");
                });
                const input = element.parentElement?.querySelector("input") as HTMLInputElement;
                if (input) {
                    input.type = input.type === "password" ? "text" : "password";
                }
            });
            element.setAttribute(handlerSetAttribute, "true");
        }
    });
});
