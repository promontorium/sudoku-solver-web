window.addEventListener("load", () => {
    document.querySelectorAll(".board-container input").forEach((input) => {
        input.addEventListener("input", (e) => {
            const target = e.target as HTMLInputElement;
            const isGiven = target.value.startsWith("!");
            const isCandsHolder = target.value.startsWith("#");
            const res = [...new Set(target.value.replace(/[^1-9]/g, ""))];
            target.value = isGiven
                ? `!${res.slice(-1)}`
                : isCandsHolder
                ? `#${res.sort().join("")}`
                : `${res.slice(-1)}`;
            if (target.value.length === 1 && isNaN(parseInt(target.value))) {
                target.value = "";
                target.classList.remove("given", "candidates");
            } else {
                target.classList.toggle("given", isGiven);
                target.classList.toggle("candidates", isCandsHolder);
            }
        });
    });
});
