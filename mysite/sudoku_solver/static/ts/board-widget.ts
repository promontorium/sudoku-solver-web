window.addEventListener("load", () => {
    document.querySelectorAll(".board-container__input").forEach((input) => {
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
                target.classList.remove("board-container__input--given", "board-container__input--candidates");
            } else {
                target.classList.toggle("board-container__input--given", isGiven);
                target.classList.toggle("board-container__input--candidates", isCandsHolder);
            }
        });
    });
});
