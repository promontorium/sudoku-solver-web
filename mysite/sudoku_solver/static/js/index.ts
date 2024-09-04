import { BoardFactory } from "./board.js";
import { CanvasRenderer } from "./canvas-renderer.js";
import { WinPopupNotification } from "./win-notification.js";

export const enum NOTES_MODES { basic, pencil, auto_notes };
export let notesMode = NOTES_MODES.basic;

window.addEventListener("load", () => {
    const gameControls = document.querySelector("#game-controls");
    if (gameControls) {
        document.querySelector("#game-controls-notes")?.addEventListener("click", () => toggleNotesMode(gameControls));
    }
    const BoardClass = BoardFactory.getBoard();
    new BoardClass(new CanvasRenderer(), new WinPopupNotification()).start();
});

function toggleNotesMode(element: Element): void {
    const MODE_CLASSES: Record<NOTES_MODES, string> = {
        [NOTES_MODES.basic]: "",
        [NOTES_MODES.pencil]: "pencil-mode",
        [NOTES_MODES.auto_notes]: "auto-notes-mode"
    }
    const currentModeClass = MODE_CLASSES[notesMode];
    if (currentModeClass) {
        element.classList.remove(currentModeClass);
    }
    notesMode = (notesMode + 1) % Object.keys(MODE_CLASSES).length;
    const newModeClass = MODE_CLASSES[notesMode];
    if (newModeClass) {
        element.classList.add(newModeClass);
    }
}