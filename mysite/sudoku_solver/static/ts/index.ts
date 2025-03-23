import { BoardFactory } from "./board.js";
import { CanvasRenderer } from "./canvas-renderer.js";
import { WinPopupNotification } from "./win-notification.js";

export const enum NotesMode {
    Basic = "basic",
    Pencil = "pencil-mode",
    AutoNotes = "auto-notes-mode",
}
export let notesMode = NotesMode.Basic;

window.addEventListener("load", () => {
    const gameControls = document.querySelector("#game-controls");
    const notesButton = document.querySelector("#game-controls-notes");
    if (gameControls && notesButton) {
        notesButton.addEventListener("click", () => toggleNotesMode(gameControls));
    }
    const BoardClass = BoardFactory.getBoard();
    new BoardClass(new CanvasRenderer(), new WinPopupNotification()).start();
});

function toggleNotesMode(element: Element): void {
    const modeCycle = [NotesMode.Basic, NotesMode.Pencil, NotesMode.AutoNotes];
    const currentModeIndex = modeCycle.indexOf(notesMode);
    const nextMode = modeCycle[(currentModeIndex + 1) % modeCycle.length];
    if (notesMode !== NotesMode.Basic) {
        element.classList.remove(notesMode);
    }
    notesMode = nextMode;
    if (notesMode !== NotesMode.Basic) {
        element.classList.add(notesMode);
    }
}
