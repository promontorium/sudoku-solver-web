const enum NOTES_MODES { basic, pencil, auto_notes };
let notesMode = NOTES_MODES.basic;

window.addEventListener("load", () => {
    const gameControls = document.querySelector("#game-controls");
    if (gameControls) {
        document.querySelector("#game-controls-notes")?.addEventListener("click", () => toggleNotesMode(gameControls));
    }
    new Board(new CanvasRenderer(), new WinPopupNotification()).start();
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

interface IWinNotification {
    state: boolean;
}

interface ICanvasRenderer {
    readonly canvas: HTMLCanvasElement;
    draw(cells: Cell[][]): void;
    resizeAndDraw(cells: Cell[][]): void;
    getCellByOffset(offsetX: number, offsetY: number): { col: number, row: number };
}

class WinPopupNotification implements IWinNotification {
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

class CanvasRenderer implements ICanvasRenderer {
    public readonly canvas: HTMLCanvasElement;
    private readonly containserSelector = "#sudoku-container";
    private readonly canvasSelector = "#canvas-grid";
    private readonly ctx;
    private readonly container;
    // TODO Colors/Fonts constants

    public constructor() {
        this.container = document.querySelector(this.containserSelector)!;
        if (!this.container) {
            throw new Error("Container context not found");
        }
        this.canvas = document.querySelector(this.canvasSelector)!;
        if (!this.canvas || !(this.canvas instanceof HTMLCanvasElement)) {
            throw new Error("Canvas not found");
        }
        this.ctx = this.canvas.getContext("2d")!;
        if (!this.ctx) {
            throw new Error("Canvas context not found");
        }
    }

    public draw(cells: Cell[][]): void {
        this.ctx.reset();
        const cellSize = this.getCellSize();
        cells.flat().forEach(cell => this.drawCell(cell, cellSize));
        this.drawBorders(cellSize);
    }

    public resizeAndDraw(cells: Cell[][]): void {
        const { paddingLeft, paddingRight, paddingTop, paddingBottom } = getComputedStyle(this.container);
        const paddingHorizontal = parseFloat(paddingLeft) + parseFloat(paddingRight);
        const paddingVertical = parseFloat(paddingTop) + parseFloat(paddingBottom);
        const containerWidth = this.container.clientWidth - paddingHorizontal;
        const containerHeight = this.container.clientHeight - paddingVertical;
        const containerSize = Math.min(containerWidth, containerHeight);
        const canvasMaxSize = 500;
        const canvasMinSize = 250;
        const newSize = Math.min(Math.max(containerSize, canvasMinSize), canvasMaxSize);
        this.canvas.width = newSize;
        this.canvas.height = newSize;
        this.draw(cells);
    }

    public getCellByOffset(offsetX: number, offsetY: number): { col: number, row: number } {
        const cellSize = this.getCellSize();
        const col = Math.floor(offsetX / cellSize);
        const row = Math.floor(offsetY / cellSize);
        return { col: col, row: row };
    }

    private getCellSize(): number {
        return Math.min(this.canvas.offsetWidth, this.canvas.offsetHeight) / 9;
    }

    private getCellCursorColor(cell: Cell): string | null {
        return cell.isSelected ? "#bbdefb" :
            cell.isConflict ? "#f7cfd6" :
                cell.isSameVal ? "#c3d7ea" :
                    cell.hasCandidate ? "#d4ebda" :
                        cell.isNeighbor ? "#e2ebf3" :
                            null;
    }

    private drawCell(cell: Cell, size: number): void {
        this.drawCellCursors(cell, size);
        this.drawCellValue(cell, size);
        this.drawCellCandidates(cell, size);
    }

    private drawBorders(cellSize: number) {
        this.drawCellsBorders(cellSize);
        this.drawGridBorders(cellSize);
        this.drawBoxesBorders(cellSize);
    }

    private drawGridBorders(cellSize: number): void {
        this.ctx.beginPath();
        this.ctx.strokeStyle = "#344861";
        this.ctx.lineWidth = 2;
        this.ctx.rect(1, 1, (cellSize * 9) - 2, (cellSize * 9) - 2);
        this.ctx.closePath();
        this.ctx.stroke();
    }

    private drawBoxesBorders(cellSize: number): void {
        this.ctx.beginPath();
        this.ctx.strokeStyle = "#344861";
        this.ctx.lineWidth = 2;
        for (let i = 1; i < 3; i++) {
            this.ctx.moveTo(0, i * 3 * cellSize);
            this.ctx.lineTo(cellSize * 9, i * 3 * cellSize);
            this.ctx.moveTo(i * 3 * cellSize, 0);
            this.ctx.lineTo(i * 3 * cellSize, cellSize * 9);
        }
        this.ctx.closePath();
        this.ctx.stroke();
    }

    private drawCellsBorders(cellSize: number) {
        this.ctx.beginPath();
        this.ctx.strokeStyle = "#bfc6d4";
        this.ctx.lineWidth = 1;
        for (let i = 1; i < 9; i++) {
            if (!(i % 3)) {
                continue;
            }
            this.ctx.moveTo(0, i * cellSize);
            this.ctx.lineTo(cellSize * 9, i * cellSize);
            this.ctx.moveTo(i * cellSize, 0);
            this.ctx.lineTo(i * cellSize, cellSize * 9);
        }
        this.ctx.closePath();
        this.ctx.stroke();
    }

    private drawCellCursors(cell: Cell, size: number): void {
        const color = this.getCellCursorColor(cell);
        if (!color) {
            return;
        }
        this.ctx.beginPath();
        this.ctx.lineWidth = 0;
        this.ctx.fillStyle = color;
        this.ctx.rect(cell.col * size, cell.row * size, size, size);
        this.ctx.closePath();
        this.ctx.fill();
    }

    private drawCellValue(cell: Cell, size: number): void {
        if (!cell.value) {
            return;
        }
        this.ctx.beginPath();
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        this.ctx.fillStyle = cell.isGiven ? "#344861" : "#325aaf";
        const fontSize = Math.floor(size * 0.75) - 5;
        this.ctx.font = `${fontSize}px sans-serif`;
        const x = (cell.col * size) + (size / 2);
        const y = (cell.row * size) + (size / 2);
        this.ctx.fillText(cell.value.toString(), x, y);
        this.ctx.closePath();
        this.ctx.fill();
    }

    private drawCellCandidates(cell: Cell, size: number): void {
        if (!cell.candidates.length) {
            return;
        }
        this.ctx.beginPath();
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        this.ctx.fillStyle = "#6e7c8c";
        const fontSize = Math.floor(size * 0.375) - 5;
        this.ctx.font = `${fontSize}px sans-serif`;
        cell.candidates.forEach(candidate => {
            const xIndex = (candidate - 1) % 3;
            const yIndex = Math.floor((candidate - 1) / 3);
            const x = (cell.col * size) + ((xIndex + 1) * size / 4);
            const y = (cell.row * size) + ((yIndex + 1) * size / 4);
            this.ctx.fillText(candidate.toString(), x, y);
        });
        this.ctx.closePath();
        this.ctx.fill();
    }
}

class Cell {
    public readonly col;
    public readonly row;
    public readonly isGiven;
    public hasCandidate = false;
    public isSelected = false;
    public isNeighbor = false;
    public isSameVal = false;
    public isConflict = false;
    private wrappedValue = 0;
    private wrappedCandidates = new Set<number>;

    public constructor(col: number, row: number, value: number = 0, isGiven: boolean = false, candidates: number[] = []) {
        this.col = Math.floor(col);
        this.row = Math.floor(row);
        if (this.col < 0 || this.row < 0 || this.col > 8 || this.row > 8) {
            throw new Error(`Cell ${this.col} ${this.row}: invalid coordinates`);
        }
        this.value = value;
        this.candidates = candidates;
        this.isGiven = isGiven;
        if (this.isGiven && !this.value) {
            throw new Error(`Cell ${this.col} ${this.row}: givens should have non zero value`);
        }
    }

    public static fromEncoded(value: string, row: number, col: number): Cell {
        const val = Math.abs(parseInt(value));
        if (isNaN(val) || val > 511) {
            throw new Error(`Decode ${col} ${row}: unexpected value encoding ${val}`);
        }
        const isGiven = value[0] === "-";
        const isSolved = value[0] === "+";
        if (isGiven || isSolved) {
            return new Cell(col, row, val, isGiven);
        }
        const candidates = [...val.toString(2)].reverse()
            .map((bit, index) => bit === "1" ? index + 1 : null)
            .filter(candidate => candidate !== null);
        return new Cell(col, row, 0, isGiven, candidates);
    }

    public get value(): number {
        return this.wrappedValue;
    }

    public set value(value: number) {
        this.validateCellChange();
        this.validateValue(value, true);
        this.candidates = [];
        this.wrappedValue = Math.floor(value);
    }

    public get candidates(): number[] {
        return Array.from(this.wrappedCandidates);
    }

    public set candidates(values: number[]) {
        if (!values.length && !this.wrappedCandidates.size) {
            return;
        }
        this.validateCellChange();
        this.validateCandChange();
        this.wrappedCandidates.clear();
        values.forEach(value => {
            this.validateValue(value, false);
            this.wrappedCandidates.add(Math.floor(value));
        });
    }

    public encode(): string {
        let val = this.value || this.candidates.reduce((acc, cand) => acc + Math.pow(2, cand - 1), 0);
        const prefix = this.isGiven ? "-" : this.value ? "+" : "";
        return `${prefix}${val}`;
    }

    private validateCellChange(): void {
        if (this.isGiven) {
            throw new Error(`Cell ${this.col} ${this.row}: can not change given cell`);
        }
    }

    private validateCandChange(): void {
        if (this.value) {
            throw new Error(`Cell ${this.col} ${this.row}: can not change solved cell candidates`);
        }
    }

    private validateValue(value: number, allowZero: boolean = true): void {
        const v = Math.floor(value);
        if (isNaN(v) || v > 9 || (allowZero && value < 0) || (!allowZero && value < 1)) {
            throw new Error(`$Cell ${this.col} ${this.row}: ${v} is not valid value`);
        }
    }

    public addCandidate(value: number): void {
        this.validateCellChange();
        this.validateCandChange();
        this.validateValue(value, false);
        this.wrappedCandidates.add(value);
    }

    public removeCandidate(value: number): boolean {
        this.validateCellChange();
        this.validateCandChange();
        return this.wrappedCandidates.delete(value);
    }

    public reset(): void {
        if (this.isGiven) {
            return;
        }
        this.candidates = [];
        this.value = 0;
    }
}

class Board {
    private readonly boardKey = "sudokuboard";
    private readonly prevBoardKey = "prevsudokuboard";
    private readonly canvasRenderer;
    private readonly winNotification;
    private wrappedCells: Cell[][] = [];
    private selectedCell: Cell | null = null;
    // TODO selectors constants for bind

    public constructor(canvasRenderer: ICanvasRenderer, winNotification: IWinNotification) {
        this.canvasRenderer = canvasRenderer;
        this.winNotification = winNotification;
    }

    public start(): void {
        this.cells = this.load();
        this.canvasRenderer.resizeAndDraw(this.cells);
        this.bind();
    }

    private get cells(): Cell[][] {
        return Array.from(this.wrappedCells);
    }

    private set cells(cells: Cell[][]) {
        const prevSelectedCell = this.selectedCell;
        this.wrappedCells = cells;
        this.selectedCell = prevSelectedCell ? cells[prevSelectedCell.row][prevSelectedCell.col] : null;
    }

    private getCellNeighbors(cell: Cell, filterFn: (c: Cell) => boolean = () => true): Set<Cell> {
        const cells = new Set<Cell>();
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

    private encode(): string {
        return this.cells.flatMap(row => row.map(cell => cell.encode())).toString();
    }

    private decode(data: string): Cell[][] | null {
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

    // --------------------------------------------------------------------- TODO ^

    private getCSRFToken(): string | null {
        const name = "csrftoken";
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        return parts.pop()?.split(";").shift() ?? null;
    }

    private load(): Cell[][] {
        const board = localStorage.getItem(this.boardKey);
        const cells = board ? this.decode(board) : null;
        return cells ?? Array.from({ length: 9 }, (_, i) => Array.from({ length: 9 }, (_, j) => new Cell(j, i)));
    }

    private save(): void {
        const board = this.encode();
        localStorage.setItem(this.prevBoardKey, localStorage.getItem(this.boardKey) ?? "");
        localStorage.setItem(this.boardKey, board);
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

    private bind(): void {
        document.addEventListener("keydown", event => this.handleOnKeyPressed(event.key));
        document.querySelectorAll(".numpad-item").forEach(item => {
            if (item instanceof HTMLElement && item.dataset["value"]) {
                item.addEventListener("click", () => this.handleOnKeyPressed(item.dataset["value"]!));
            }
        });
        const actionsMap = [
            { id: "#game-controls-create-notes", action: () => this.createNotes() },
            { id: "#game-controls-solve-step", action: () => this.solveStep() },
            { id: "#game-controls-import", action: () => this.import() },
            { id: "#game-controls-reset", action: () => this.reset() },
            { id: "#game-controls-undo", action: () => this.undo() },
        ];
        actionsMap.forEach(({ id, action }) => document.querySelector(id)?.addEventListener("click", action));
        this.canvasRenderer.canvas.addEventListener("click", event => this.handleOnClick(event));
        window.addEventListener("resize", debounce(() => this.canvasRenderer.resizeAndDraw(this.cells), 100));
    }

    private solveStep(): void {
        console.debug("Running solve step");
        const url = "solve-step/";
        const payload = { "board": this.encode() };
        this.postData(url, payload)
            .then(data => this.processSolveResponse(data))
            .catch(error => console.error(`Solve step request: ${error}`));
    }

    private async postData(url: string, payload: any): Promise<any> {
        const headers = {
            "Content-Type": "application/json",
            "X-CSRFToken": this.getCSRFToken() ?? ""
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

    private processSolveResponse(response: any): void {
        console.debug(`Solve request response: ${response}`);
        if (response.reason) {
            return;
        }
        const cells = this.decode(response.result);
        if (!cells) {
            console.error("Solve request response: decode error");
            return;
        }
        this.cells = cells;
        this.postprocessCellsChanges();
        this.determineWin();
    }

    // --------------------------------------------------------------------- TODO $

    private determineWin(): void {
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

    private reset(): void {
        console.debug("Running reset");
        this.cells.flat().forEach(cell => cell.reset());
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

    private createNotes(): void {
        console.debug("Running create notes");
        this.cells.flat().filter(cell => !cell.value).forEach(cell => {
            const usedValues = Array.from(this.getCellNeighbors(cell)).map(c => c.value);
            cell.candidates = Array.from({ length: 9 }, (_, i) => i + 1).filter(v => !usedValues.includes(v));
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

    private processCellNotesChange(cell: Cell, value: number): boolean {
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

    private processCellValueChange(cell: Cell, value: number): boolean {
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
        const neighborCells = this.selectedCell ? this.getCellNeighbors(this.selectedCell) : new Set<Cell>();
        const value = this.selectedCell?.value ?? 0;
        this.cells.flat().forEach(cell => {
            cell.isSelected = cell === this.selectedCell;
            cell.isNeighbor = neighborCells.has(cell);
            cell.hasCandidate = !cell.isSelected && cell.candidates.includes(value);
            cell.isSameVal = !cell.isSelected && !!cell.value && cell.value === value;
            cell.isConflict = cell.isSameVal && cell.isNeighbor;
        });
    }

    private postprocessCellsChanges(): void {
        this.save();
        this.postprocessSelectedCellChange();
    }

    private postprocessSelectedCellChange(): void {
        this.updateCellsFlags();
        this.canvasRenderer.draw(this.cells);
    }
}