export interface IWinNotification {
    state: boolean;
}

export class WinPopupNotification implements IWinNotification {
    private readonly elementSelector = "#win-notification";
    private readonly closeButtonSelector = ".win-popup-close";
    private readonly isHiddenClassName = "hidden";
    private readonly element;

    public constructor() {
        this.element = document.querySelector(this.elementSelector) as HTMLElement;
        if (!this.element) {
            throw new Error("WinPopupNotification: Required DOM element not found");
        }
        this.bindEvents();
    }

    public get state(): boolean {
        return !this.element.classList.contains(this.isHiddenClassName);
    }

    public set state(state: boolean) {
        this.element.classList.toggle(this.isHiddenClassName, !state);
    }

    private bindEvents(): void {
        const closeHandler = () => (this.state = false);
        window.addEventListener("click", (event) => {
            if (event.target === this.element) {
                closeHandler();
            }
        });
        document.addEventListener("keydown", (event) => {
            if (["Enter", "Escape"].includes(event.key)) {
                closeHandler();
            }
        });
        this.element.querySelector(this.closeButtonSelector)?.addEventListener("click", closeHandler);
    }
}
