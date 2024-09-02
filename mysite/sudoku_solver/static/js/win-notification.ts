export interface IWinNotification {
    state: boolean;
}

export class WinPopupNotification implements IWinNotification {
    private readonly elementSelector = "#win-popup";
    private readonly isVisibleClassName = "is-visible";
    private readonly closeButtonSelector = "#win-popup-close";
    private readonly element;

    public constructor() {
        this.element = document.querySelector(this.elementSelector)!;
        if (!this.element) {
            throw new Error("Victory is not possible...");
        }
        this.bind();
    }

    public get state(): boolean {
        return this.element.classList.contains(this.isVisibleClassName);
    }

    public set state(state: boolean) {
        this.element.classList.toggle(this.isVisibleClassName, state);
    }

    private bind(): void {
        window.addEventListener("click", event => {
            if (event.target === this.element) {
                this.state = false;
            }
        });
        document.addEventListener("keydown", event => {
            if (["Enter", "Escape"].includes(event.key)) {
                this.state = false;
            }
        });
        document.querySelector(this.closeButtonSelector)?.addEventListener("click", () => this.state = false);
    }
}