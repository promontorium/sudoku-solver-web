import { debounce, isAuthenticated } from "./utils.js";
import { NOTES_MODES, notesMode } from "./index.js";
import { ICell, Cell } from "./cell.js";
import { ICanvasRenderer } from "./canvas-renderer.js";
import { IWinNotification } from "./win-notification.js";

export interface IBoard {
    start(): void;
}

export class BoardFactory {
    public static getBoard(): new (...args: ConstructorParameters<typeof AbstractBoard>) => IBoard {
        return isAuthenticated() ? UserBoard : GuestBoard;
    }
}

abstract class AbstractBoard implements IBoard {
    protected readonly prevBoardKey = "prevsudokuboard";
    private wrappedCells: ICell[][] = [];
    private selectedCell: ICell | null = null;
    // TODO selectors constants for bind

    public constructor(private readonly canvasRenderer: ICanvasRenderer, private readonly winNotification: IWinNotification) { }

    public start(): void {
        this.cells = this.load();
        this.canvasRenderer.resizeAndDraw(this.cells);
        this.bind();
    }

    protected abstract bindHandlers(): void;

    protected abstract load(): ICell[][];

    protected abstract save(): void;

    protected get cells(): ICell[][] {
        return Array.from(this.wrappedCells);
    }

    protected set cells(cells: ICell[][]) {
        const prevSelectedCell = this.selectedCell;
        this.wrappedCells = cells;
        this.selectedCell = prevSelectedCell ? cells[prevSelectedCell.row][prevSelectedCell.col] : null;
    }

    protected encode(): string {
        return this.cells.flatMap(row => row.map(cell => cell.encode())).toString();
    }

    protected decode(data: string): ICell[][] | null {
        const values = data.split(",");
        if (values?.length !== 81) {
            console.warn(`Decode cells error: incorrect length ${values?.length}`);
            return null;
        }
        try {
            return Array.from({ length: 9 }, (_, i) => Array.from({ length: 9 }, (_, j) => Cell.fromEncoded(values[(i * 9) + j], i, j)));
        } catch (error) {
            console.warn(`Decode cells. Cell creation error: ${error}`);
        }
        return null;
    }

    protected determineWin(): void {
        if (this.cells.flat().some(cell => !cell.value)) {
            return;
        }
        const values = new Set();
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                const cell = this.cells[i][j];
                const rowKey = `row-${i}-${cell.value}`;
                const colKey = `col-${j}-${cell.value}`;
                const boxKey = `box-${Math.floor(i / 3)}-${Math.floor(j / 3)}-${cell.value}`;
                if (values.has(rowKey) || values.has(colKey) || values.has(boxKey)) {
                    return;
                }
                values.add(rowKey);
                values.add(colKey);
                values.add(boxKey);
            }
        }
        this.winNotification.state = true;
    }

    protected postprocessCellsChanges(): void {
        this.save();
        this.postprocessSelectedCellChange();
    }

    private getCellNeighbors(cell: ICell, filterFn: (c: ICell) => boolean = () => true): Set<ICell> {
        const cells = new Set<ICell>();
        const boxRowStart = Math.floor(cell.row / 3) * 3;
        const boxColStart = Math.floor(cell.col / 3) * 3;
        for (let row = 0; row < this.cells.length; row++) {
            for (let col = 0; col < this.cells[row].length; col++) {
                const c = this.cells[row][col];
                if (c !== cell && filterFn(c) && (
                    row === cell.row ||
                    col === cell.col ||
                    (row >= boxRowStart && row < boxRowStart + 3 && col >= boxColStart && col < boxColStart + 3)
                )) {
                    cells.add(c);
                }
            }
        }
        return cells;
    }

    private bind(): void {
        document.addEventListener("keydown", event => this.handleOnKeyPressed(event.key));
        document.querySelectorAll(".numpad-item").forEach(item => {
            if (item instanceof HTMLElement && item.dataset["value"]) {
                item.addEventListener("click", () => this.handleOnKeyPressed(item.dataset["value"]!));
            }
        });
        const actionsMap = [
            { id: "#game-controls-create-notes", action: () => this.createNotes() },
            { id: "#game-controls-import", action: () => this.import() },
            { id: "#game-controls-reset", action: () => this.reset() },
            { id: "#game-controls-undo", action: () => this.undo() },
        ];
        actionsMap.forEach(({ id, action }) => document.querySelector(id)?.addEventListener("click", action));
        this.canvasRenderer.canvas.addEventListener("click", event => this.handleOnClick(event));
        window.addEventListener("resize", debounce(() => this.canvasRenderer.resizeAndDraw(this.cells), 100));
        this.bindHandlers();
    }

    private undo(): void {
        console.debug("Running undo");
        const prevBoard = localStorage.getItem(this.prevBoardKey);
        if (!prevBoard) {
            console.debug("Undo: no prev board");
            return;
        }
        const cells = this.decode(prevBoard);
        if (!cells) {
            console.warn("Undo: unexpected format prev board");
            return;
        }
        this.cells = cells;
        this.postprocessCellsChanges();
        this.determineWin();
    }

    private reset(): void {
        console.debug("Running reset");
        this.cells.flat().forEach(cell => cell.reset());
        this.postprocessCellsChanges();
    }

    private createNotes(): void {
        console.debug("Running create notes");
        this.cells.flat().filter(cell => !cell.value).forEach(cell => {
            const usedValues = Array.from(this.getCellNeighbors(cell)).map(c => c.value);
            cell.candidates = Array.from({ length: 9 }, (_, i) => i + 1).filter(v => !usedValues.includes(v));
        });
        this.postprocessCellsChanges();
    }

    private import(): void {
        console.debug("Running import");
        const field = window.prompt("Enter a string of 81 numbers (you can express blanks as 0 or '.')");
        if (field?.length !== 81) {
            console.warn("Import board length missmatch");
            return;
        }
        try {
            this.cells = Array.from({ length: 9 }, (_, i) =>
                Array.from({ length: 9 }, (_, j) => {
                    const fieldValue = field[i * 9 + j];
                    const value = fieldValue === "." ? 0 : parseInt(fieldValue);
                    return new Cell(j, i, value, value !== 0);
                })
            );
        } catch (error) {
            console.warn("Import cell creation error: ", error);
            return;
        }
        this.postprocessCellsChanges();
    }

    private handleOnClick(event: MouseEvent): void {
        const { col, row } = this.canvasRenderer.getCellByOffset(event.offsetX, event.offsetY);
        const eventCell = this.cells[row][col];
        this.selectedCell = this.selectedCell === eventCell ? null : eventCell;
        this.postprocessSelectedCellChange();
    }

    private handleOnKeyPressed(value: string): void {
        if (this.winNotification.state || !this.selectedCell) {
            return;
        }
        if (!isNaN(parseInt(value))) {
            this.processCellInput(parseInt(value));
        } else {
            this.processCellSelection(value);
        }
    }

    private processCellInput(value: number): void {
        if (value < 0 || value > 9 || !this.selectedCell || this.selectedCell.isGiven) {
            return;
        }
        const changed = notesMode === NOTES_MODES.pencil
            ? this.processCellNotesChange(this.selectedCell, value)
            : this.processCellValueChange(this.selectedCell, value);
        if (!changed) {
            return;
        }
        this.postprocessCellsChanges();
        this.determineWin();
    }

    private processCellNotesChange(cell: ICell, value: number): boolean {
        if (cell.value) {
            return false;
        }
        if (value) {
            const hasCandidate = cell.candidates.includes(value);
            hasCandidate ? cell.removeCandidate(value) : cell.addCandidate(value);
            return true;
        }
        if (!cell.candidates.length) {
            return false;
        }
        cell.candidates = [];
        return true;
    }

    private processCellValueChange(cell: ICell, value: number): boolean {
        if (!cell.value && !value) {
            return false;
        }
        cell.value = cell.value === value ? 0 : value;
        if (notesMode === NOTES_MODES.auto_notes && cell.value) {
            this.getCellNeighbors(cell, c => !c.value).forEach(c => c.removeCandidate(cell.value));
        }
        return true;
    }

    private processCellSelection(value: string): void {
        if (!this.selectedCell) {
            return;
        }
        const maxIndex = 8;
        let { col, row } = this.selectedCell;
        switch (value) {
            case "ArrowLeft":
                col = col ? col - 1 : maxIndex;
                break;
            case "ArrowRight":
                col = col < maxIndex ? col + 1 : 0;
                break;
            case "ArrowUp":
                row = row ? row - 1 : maxIndex;
                break;
            case "ArrowDown":
                row = row < maxIndex ? row + 1 : 0;
                break;
        }
        if (col === this.selectedCell.col && row === this.selectedCell.row) {
            return;
        }
        this.selectedCell = this.cells[row][col];
        this.postprocessSelectedCellChange();
    }

    private updateCellsFlags(): void {
        const neighborCells = this.selectedCell ? this.getCellNeighbors(this.selectedCell) : new Set<ICell>();
        const value = this.selectedCell?.value ?? 0;
        this.cells.flat().forEach(cell => {
            cell.isSelected = cell === this.selectedCell;
            cell.isNeighbor = neighborCells.has(cell);
            cell.hasCandidate = !cell.isSelected && cell.candidates.includes(value);
            cell.isSameVal = !cell.isSelected && !!cell.value && cell.value === value;
            cell.isConflict = cell.isSameVal && cell.isNeighbor;
        });
    }

    private postprocessSelectedCellChange(): void {
        this.updateCellsFlags();
        this.canvasRenderer.draw(this.cells);
    }
}

class GuestBoard extends AbstractBoard {
    private readonly boardKey = "sudokuboard";

    protected override bindHandlers(): void { }

    protected override load(): ICell[][] {
        const board = localStorage.getItem(this.boardKey);
        const cells = board ? this.decode(board) : null;
        return cells ?? Array.from({ length: 9 }, (_, i) => Array.from({ length: 9 }, (_, j) => new Cell(j, i)));
    }

    protected override save(): void {
        const board = this.encode();
        localStorage.setItem(this.prevBoardKey, localStorage.getItem(this.boardKey) ?? "");
        localStorage.setItem(this.boardKey, board);
    }
}

class UserBoard extends AbstractBoard {
    // TODO remove
    private readonly boardKey = "sudokuboard";

    // TODO
    protected override load(): ICell[][] {
        const board = localStorage.getItem(this.boardKey);
        const cells = board ? this.decode(board) : null;
        return cells ?? Array.from({ length: 9 }, (_, i) => Array.from({ length: 9 }, (_, j) => new Cell(j, i)));
    }

    // TODO
    protected override save(): void {
        const board = this.encode();
        localStorage.setItem(this.prevBoardKey, localStorage.getItem(this.boardKey) ?? "");
        localStorage.setItem(this.boardKey, board);
    }

    protected override bindHandlers(): void {
        document.querySelector("#game-controls-solve-step")?.addEventListener("click", () => this.solveStep());
    }

    private getCSRFToken(): string | null {
        const name = "csrftoken";
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        return parts.pop()?.split(";").shift() ?? null;
    }

    private solveStep(): void {
        console.debug("Running solve step");
        const url = "solve-step/";
        const payload = { "board": this.encode() };
        this.postData(url, payload)
            .then(data => this.processResponse(data))
            .catch(error => console.error(`Solve step request: ${error}`));
    }

    private async postData(url: string, payload: any): Promise<any> {
        const headers = {
            "Content-Type": "application/json",
            "X-CSRFToken": this.getCSRFToken() ?? "",
        };
        const init: RequestInit = {
            method: "POST",
            headers: headers,
            body: JSON.stringify(payload),
        };
        const response = await fetch(url, init);
        if (!response.ok) {
            throw new Error(`Response: ${response}`);
        }
        return await response.json();
    }

    private processResponse(response: any): void {
        console.debug("Processing response");
        if (response.reason) {
            console.debug(`Response is not ok: ${response.reason}`);
            return;
        }
        console.debug(`Response result: ${response.result}`)
        const cells = this.decode(response.result);
        if (!cells) {
            console.error("Response: decode error");
            return;
        }
        this.cells = cells;
        this.postprocessCellsChanges();
        this.determineWin();
    }
}