import { BoardFactory } from "./board.js";

export const enum NotesMode {
    Basic = "basic",
    Pencil = "pencil-mode",
    AutoNotes = "auto-notes-mode",
}
export let notesMode = NotesMode.Basic;

window.addEventListener("load", () => {
    const notesButton = document.querySelector("#game-controls-notes");
    notesButton?.addEventListener("click", () => toggleNotesMode(notesButton));
    BoardFactory.getBoard().start();
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
