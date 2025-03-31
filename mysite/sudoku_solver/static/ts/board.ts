import { debounce, isAuthenticated } from "./utils.js";
import { NotesMode, notesMode } from "./index.js";
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
    private wrappedCells: ICell[][] = [];
    private selectedCell: ICell | null = null;
    private readonly DIRECTIONS = {
        ArrowLeft: { row: 0, col: -1 },
        ArrowRight: { row: 0, col: 1 },
        ArrowUp: { row: -1, col: 0 },
        ArrowDown: { row: 1, col: 0 },
    };

    public constructor(
        private readonly canvasRenderer: ICanvasRenderer,
        private readonly winNotification: IWinNotification
    ) {}

    public start(): void {
        this.cells = this.load() ?? this.createEmptyBoard();
        this.canvasRenderer.resize(this.cells);
        this.bindEvents();
    }

    protected abstract getPrevBoard(): string | null;

    protected abstract bindExtraEvents(): void;

    protected abstract load(): ICell[][] | null;

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
        return this.cells.flatMap((row) => row.map((cell) => cell.encode())).toString();
    }

    protected decode(data: string): ICell[][] | null {
        const values = data.split(",");
        if (values?.length !== 81) {
            console.warn(`Decode cells error: incorrect length ${values?.length}`);
            return null;
        }
        try {
            return Array.from({ length: 9 }, (_, i) =>
                Array.from({ length: 9 }, (_, j) => Cell.fromEncoded(values[i * 9 + j], i, j))
            );
        } catch (error) {
            console.warn(`Decode cells. Cell creation error: ${error}`);
        }
        return null;
    }

    protected determineWin(): void {
        if (this.cells.flat().some((cell) => !cell.value)) {
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

    private createEmptyBoard(): ICell[][] {
        return Array.from({ length: 9 }, (_, i) => Array.from({ length: 9 }, (_, j) => new Cell(j, i)));
    }

    private getCellNeighbors(cell: ICell, filterFn: (c: ICell) => boolean = () => true): Set<ICell> {
        const boxRowStart = Math.floor(cell.row / 3) * 3;
        const boxColStart = Math.floor(cell.col / 3) * 3;
        return new Set(
            this.cells.flatMap((row) =>
                row.filter(
                    (c) =>
                        c !== cell &&
                        filterFn(c) &&
                        (c.row === cell.row ||
                            c.col === cell.col ||
                            (c.row >= boxRowStart &&
                                c.row < boxRowStart + 3 &&
                                c.col >= boxColStart &&
                                c.col < boxColStart + 3))
                )
            )
        );
    }

    private bindEvents(): void {
        document.addEventListener("keydown", (event) => this.handleOnKeyPressed(event.key));
        document.querySelectorAll(".sudoku__numpad-button").forEach((item) => {
            if (item instanceof HTMLElement && item.dataset["value"]) {
                item.addEventListener("click", () => this.handleOnKeyPressed(item.dataset["value"]!));
            }
        });
        const actionsMap = new Map<string, () => any>([
            ["#game-controls-create-notes", () => this.createNotes()],
            ["#game-controls-reset", () => this.reset()],
            ["#game-controls-undo", () => this.undo()],
        ]);
        actionsMap.forEach((action, id) => {
            document.querySelector(id)?.addEventListener("click", action);
        });
        this.canvasRenderer.canvas.addEventListener("click", (event) => this.handleOnClick(event));
        window.addEventListener(
            "resize",
            debounce(() => this.canvasRenderer.resize(this.cells), 100)
        );
        window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
            this.canvasRenderer.loadColorScheme();
            this.canvasRenderer.draw(this.cells);
        });
        this.bindExtraEvents();
    }

    private undo(): void {
        console.debug("Running undo");
        const prevBoard = this.getPrevBoard();
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
        this.cells.flat().forEach((cell) => cell.reset());
        this.postprocessCellsChanges();
    }

    private createNotes(): void {
        console.debug("Running create notes");
        this.cells
            .flat()
            .filter((cell) => !cell.value)
            .forEach((cell) => {
                const usedValues = Array.from(this.getCellNeighbors(cell)).map((c) => c.value);
                cell.candidates = Array.from({ length: 9 }, (_, i) => i + 1).filter((v) => !usedValues.includes(v));
            });
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
        } else if (value in this.DIRECTIONS) {
            this.navigateSelection(value as keyof typeof this.DIRECTIONS);
        }
    }

    private processCellInput(value: number): void {
        if (value < 0 || value > 9 || !this.selectedCell || this.selectedCell.isGiven) {
            return;
        }
        if (
            !(notesMode == NotesMode.Pencil
                ? this.processCellNotesChange(this.selectedCell, value)
                : this.processCellValueChange(this.selectedCell, value))
        ) {
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
        if (notesMode === NotesMode.AutoNotes && cell.value) {
            this.getCellNeighbors(cell, (c) => !c.value).forEach((c) => c.removeCandidate(cell.value));
        }
        return true;
    }

    private navigateSelection(direction: keyof typeof this.DIRECTIONS) {
        if (!this.selectedCell) {
            return;
        }
        const delta = this.DIRECTIONS[direction];
        let newRow = (this.selectedCell.row + delta.row + 9) % 9;
        let newCol = (this.selectedCell.col + delta.col + 9) % 9;
        if (newRow === this.selectedCell.row && newCol === this.selectedCell.col) {
            return;
        }
        this.selectedCell = this.cells[newRow][newCol];
        this.postprocessSelectedCellChange();
    }

    private updateCellsFlags(): void {
        const neighborCells = this.selectedCell ? this.getCellNeighbors(this.selectedCell) : new Set<ICell>();
        const value = this.selectedCell?.value ?? 0;
        this.cells.flat().forEach((cell) => {
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
    private readonly prevBoardKey = "prevsudokuboard";

    protected override getPrevBoard(): string | null {
        return localStorage.getItem(this.prevBoardKey);
    }

    protected override bindExtraEvents(): void {
        document.querySelector("#game-controls-import")?.addEventListener("click", () => this.import());
    }

    protected override load(): ICell[][] | null {
        const board = localStorage.getItem(this.boardKey);
        return board ? this.decode(board) : null;
    }

    protected override save(): void {
        const board = this.encode();
        localStorage.setItem(this.prevBoardKey, localStorage.getItem(this.boardKey) ?? "");
        localStorage.setItem(this.boardKey, board);
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
}

class UserBoard extends AbstractBoard {
    private readonly saveDebounceDelay = 1000;
    private debouncedSaveBoard: () => void;

    public constructor(canvasRenderer: ICanvasRenderer, winNotification: IWinNotification) {
        super(canvasRenderer, winNotification);
        this.debouncedSaveBoard = debounce(() => this.saveBoard(), this.saveDebounceDelay);
    }

    protected override getPrevBoard(): string | null {
        // TODO
        console.debug("User getPrevBoard is not yet implemented");
        return null;
    }

    protected override load(): ICell[][] | null {
        const board = document.querySelector("#game-grid")?.getAttribute("data-context");
        return board ? this.decode(board) : null;
    }

    protected override save(): void {
        console.debug("Debouncing save");
        this.debouncedSaveBoard();
    }

    protected override bindExtraEvents(): void {
        document.querySelector("#game-controls-solve")?.addEventListener("click", () => this.solve());
        document.querySelector("#game-controls-solve-step")?.addEventListener("click", () => this.solveStep());
    }

    private getCSRFToken(): string | null {
        const name = "csrftoken";
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        return parts.pop()?.split(";").shift() ?? null;
    }

    private saveBoard(): void {
        console.debug("Running save");
        const url = "update/";
        const payload = { board: this.encode() };
        this.send(url, "PATCH", payload)
            .then((data) => this.processSaveResponse(data))
            .catch((error) => console.error(`Save request: ${error}`));
    }

    private solve(): void {
        console.debug("Running solve");
        const url = "solve/";
        const payload = { board: this.encode() };
        this.send(url, "POST", payload)
            .then((data) => this.processSolveResponse(data))
            .catch((error) => console.error(`Solve request: ${error}`));
    }

    private solveStep(): void {
        console.debug("Running solve step");
        const url = "solve-step/";
        const payload = { board: this.encode() };
        this.send(url, "POST", payload)
            .then((data) => this.processSolveResponse(data))
            .catch((error) => console.error(`Solve step request: ${error}`));
    }

    private async send(url: string, method: "POST" | "PATCH", payload: any): Promise<any> {
        const headers = {
            "Content-Type": "application/json",
            "X-CSRFToken": this.getCSRFToken() ?? "",
        };
        const init: RequestInit = {
            method: method,
            headers: headers,
            body: JSON.stringify(payload),
        };
        const response = await fetch(url, init);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const responseText = await response.text();
        return responseText ? JSON.parse(responseText) : null;
    }

    private processSaveResponse(response: any): void {
        console.debug("Processing save response");
        if (response?.reason) {
            console.warn(`Response reason: ${response.reason}`);
            return;
        }
        console.debug("Board saved");
    }

    private processSolveResponse(response: any): void {
        console.debug("Processing solve response");
        if (!response) {
            console.error("Empty response");
            return;
        }
        if (response.reason) {
            console.warn(`Response reason: ${response.reason}`);
            return;
        }
        console.debug(`Response result: ${response.result}`);
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
