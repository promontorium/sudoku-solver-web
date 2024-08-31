const enum NOTES_MODES { basic, pencil, auto_notes };

let notesMode = NOTES_MODES.basic;

let canvas: HTMLCanvasElement;
let winPopup: HTMLDivElement;

window.addEventListener("load", () => {
    canvas = document.querySelector("#canvas-grid")!;
    if (!canvas) {
        throw new Error("Canvas not found");
    }
    winPopup = document.querySelector("#win-popup")!;
    if (!winPopup) {
        throw new Error("Victory is not possible...");
    }
    window.addEventListener("click", event => {
        if (event.target === winPopup) {
            changeWinPopupVisibility(false);
        }
    });
    document.addEventListener("keydown", event => {
        if (["Enter", "Escape"].includes(event.key)) {
            changeWinPopupVisibility(false);
        }
    });
    document.querySelector("#win-popup-close")?.addEventListener("click", () => changeWinPopupVisibility(false));
    resize();
    const board = new Board();
    board.init();
    board.bind();
    board.draw();
    document.querySelector("#game-controls-notes")?.addEventListener("click", () => togleNotesMode());
    window.addEventListener("resize", () => {
        resize();
        board.draw();
    });
});

function togleNotesMode(): void {
    const contClassList = document.querySelector("#game-controls")?.classList;
    switch (notesMode) {
        case NOTES_MODES.basic:
            contClassList?.add("pencil-mode");
            notesMode = NOTES_MODES.pencil;
            break;
        case NOTES_MODES.pencil:
            contClassList?.remove("pencil-mode");
            contClassList?.add("auto-notes-mode");
            notesMode = NOTES_MODES.auto_notes;
            break;
        case NOTES_MODES.auto_notes:
            contClassList?.remove("auto-notes-mode");
            notesMode = NOTES_MODES.basic;
            break;
        default:
            throw new Error("Invalid notes mode");
    }
}

function resize(): void {
    const container = document.querySelector("#sudoku-container");
    if (!container) {
        throw new Error("Resize error");
    }
    const contStyle = getComputedStyle(container);
    let containerWidth = container.clientWidth;
    let containerHeight = container.clientHeight
    containerWidth -= parseFloat(contStyle.paddingLeft) + parseFloat(contStyle.paddingRight);
    containerHeight -= parseFloat(contStyle.paddingTop) + parseFloat(contStyle.paddingBottom);
    const containerSize = Math.min(containerWidth, containerHeight);
    const canvasMaxSize = 500, canvasMinSize = 250;
    canvas.width = canvas.height = Math.min(Math.max(containerSize, canvasMinSize), canvasMaxSize);
}

function getCanvasSize(): number {
    return Math.min(canvas.offsetWidth, canvas.offsetHeight);
}

function changeWinPopupVisibility(state: boolean): void {
    winPopup.classList.toggle("is-visible", state);
}

function isWinPopupVisible(): boolean {
    return winPopup.classList.contains("is-visible");
}

class Cell {
    private wrappedValue = 0;
    private wrappedCandidates = new Set<number>;
    private readonly ctx: CanvasRenderingContext2D;
    public readonly col: number;
    public readonly row: number;
    public readonly isGiven: boolean;
    public hasCandidate = false;
    public isSelected = false;
    public isNeighbor = false;
    public isSameVal = false;
    public isConflict = false;

    public constructor(col: number, row: number, value?: number, isGiven?: boolean, candidates?: number[]) {
        this.col = Math.floor(col);
        this.row = Math.floor(row);
        if (this.col < 0 || this.row < 0 || this.col > 8 || this.row > 8) {
            throw new Error(`Cell ${this.col} ${this.row}: invalid coordinates`);
        }
        this.value = value ?? 0;
        this.candidates = candidates ?? [];
        this.isGiven = !!isGiven;
        if (this.isGiven && !this.wrappedValue) {
            throw new Error(`Cell ${this.col} ${this.row}: givens should have non zero value`);
        }
        this.ctx = canvas.getContext("2d")!;
        if (!this.ctx) {
            throw new Error(`Cell ${this.col} ${this.row}: canvas not found`);
        }
    }

    static fromEncoded(value: string, row: number, col: number): Cell {
        const val = Math.abs(parseInt(value));
        if (isNaN(val) || val > 511) {
            throw new Error("Unexpected encoding");
        }
        const isGiven = value[0] === "-";
        const isSolved = value[0] === "+";
        if (isGiven || isSolved) {
            return new Cell(col, row, val, isGiven);
        }
        const candidates = val.toString(2).split("").reverse()
            .map((current, i) => current === "1" ? i + 1 : null)
            .filter(candidate => candidate !== null);
        return new Cell(col, row, 0, isGiven, candidates);
    }

    public get value(): number {
        return this.wrappedValue;
    }

    public set value(value: number) {
        this.validateCellChange();
        this.validateValue(value, true);
        this.wrappedValue = Math.floor(value);
        this.wrappedCandidates.clear();
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
        this.wrappedValue = 0;
        this.wrappedCandidates.clear();
    }

    public encode(): string {
        let val = this.value || this.candidates.reduce((acc, cand) => acc + Math.pow(2, cand - 1), 0);
        const prefix = this.isGiven ? "-" : this.value ? "+" : "";
        return `${prefix}${val}`;
    }

    public draw(size: number): void {
        this.drawCursors(size);
        this.drawValue(size);
        this.drawCandidates(size);
    }

    private drawCursors(size: number): void {
        const color = this.getCursorColor();
        if (!color) {
            return;
        }
        this.ctx.beginPath();
        this.ctx.lineWidth = 0;
        this.ctx.fillStyle = color;
        this.ctx.rect(this.col * size, this.row * size, size, size);
        this.ctx.closePath();
        this.ctx.fill();
    }

    private getCursorColor(): string | null {
        return this.isSelected ? "#bbdefb" :
            this.isConflict ? "#f7cfd6" :
                this.isSameVal ? "#c3d7ea" :
                    this.hasCandidate ? "#d4ebda" :
                        this.isNeighbor ? "#e2ebf3" :
                            null;
    }

    private drawValue(size: number): void {
        if (!this.wrappedValue) {
            return;
        }
        this.ctx.beginPath();
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        this.ctx.fillStyle = this.isGiven ? "#344861" : "#325aaf";
        const fontSize = Math.floor(getCanvasSize() / 12) - 5;
        this.ctx.font = `${fontSize}px sans-serif`;
        const x = (this.col * size) + (size / 2);
        const y = (this.row * size) + (size / 2);
        this.ctx.fillText(this.wrappedValue.toString(), x, y);
        this.ctx.closePath();
        this.ctx.fill();
    }

    private drawCandidates(size: number): void {
        if (!this.wrappedCandidates.size) {
            return;
        }
        this.ctx.beginPath();
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        this.ctx.fillStyle = "#6e7c8c";
        const fontSize = Math.floor(getCanvasSize() / 25) - 5;
        this.ctx.font = `${fontSize}px sans-serif`;
        this.candidates.forEach(candidate => {
            const xIndex = (candidate - 1) % 3;
            const yIndex = Math.floor((candidate - 1) / 3);
            const x = (this.col * size) + ((xIndex + 1) * size / 4);
            const y = (this.row * size) + ((yIndex + 1) * size / 4);
            this.ctx.fillText(candidate.toString(), x, y);
        });
        this.ctx.closePath();
        this.ctx.fill();
    }

    private validateCellChange(): void {
        if (this.isGiven) {
            throw new Error(`Cell ${this.col} ${this.row}: can not change given cell`);
        }
    }

    private validateCandChange(): void {
        if (this.wrappedValue) {
            throw new Error(`Cell ${this.col} ${this.row}: can not change solved cell candidates`);
        }
    }

    private validateValue(value: number, allowZero: boolean = true): void {
        const v = Math.floor(value);
        if (isNaN(v) || v > 9 || (allowZero && value < 0) || (!allowZero && value < 1)) {
            throw new Error(`$Cell ${this.col} ${this.row}: ${v} is not valid value`);
        }
    }
}

class Board {
    private readonly boardKey: string = "sudokuboard";
    private cells: Cell[][] = [];
    private selectedCell: Cell | null = null;
    private readonly ctx: CanvasRenderingContext2D;

    constructor() {
        this.ctx = canvas.getContext("2d")!;
        if (!this.ctx) {
            throw new Error("Board: canvas not found");
        }
    }

    public init(): void {
        const cells = this.loadCells();
        if (cells) {
            this.cells = cells;
            return;
        }
        for (let i = 0; i < 9; i++) {
            this.cells[i] = [];
            for (let j = 0; j < 9; j++) {
                this.cells[i][j] = new Cell(j, i);
            }
        }
    }

    public bind(): void {
        canvas.addEventListener("click", e => this.handleOnClick(e));
        document.addEventListener("keydown", e => this.handleOnKeyPressed(e.key));
        const actionsMap = [
            { id: "#game-controls-import", action: () => this.import() },
            { id: "#game-controls-reset", action: () => this.reset() },
            { id: "#game-controls-undo", action: () => this.undo() },
            { id: "#game-controls-redo", action: () => this.redo() },
            { id: "#game-controls-create-notes", action: () => this.createNotes() },
            { id: "#game-controls-solve-step", action: () => this.solveStep() },
        ];
        actionsMap.forEach(({ id, action }) => document.querySelector(id)?.addEventListener("click", action));
        document.querySelectorAll(".numpad-item").forEach(item => {
            if (item instanceof HTMLElement && item.dataset["value"]) {
                item.addEventListener("click", () => this.handleOnKeyPressed(item.dataset["value"]!));
            }
        });
    }

    public draw(): void {
        this.ctx.reset();
        const cellSize = getCanvasSize() / 9;
        this.cells.flat().forEach(cell => cell.draw(cellSize));
        this.drawCells(cellSize);
        this.drawGrid(cellSize);
        this.drawBoxes(cellSize);
    }

    private loadCells(): Cell[][] | null {
        const values = localStorage.getItem(this.boardKey)?.split(",");
        if (values?.length !== 81) {
            console.warn("Saved cells length missmatch");
            return null;
        }
        const result: Cell[][] = [];
        for (let i = 0; i < 9; i++) {
            result[i] = [];
            for (let j = 0; j < 9; j++) {
                try {
                    result[i][j] = Cell.fromEncoded(values[(i * 9) + j], i, j);
                } catch (error) {
                    console.warn("Saved cell creation error: ", error);
                    return null;
                }
            }
        }
        return result;
    }

    private drawGrid(cellSize: number): void {
        this.ctx.beginPath();
        this.ctx.strokeStyle = "#344861";
        this.ctx.lineWidth = 2;
        this.ctx.rect(1, 1, (cellSize * 9) - 2, (cellSize * 9) - 2);
        this.ctx.closePath();
        this.ctx.stroke();
    }

    private drawBoxes(cellSize: number): void {
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

    private drawCells(cellSize: number): void {
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

    private handleOnClick(event: MouseEvent): void {
        const eventCell = this.getEventCell(event);
        this.selectedCell = this.selectedCell === eventCell ? null : eventCell;
        this.applyCursorFlags();
        this.draw();
    }

    private handleOnKeyPressed(value: string): void {
        if (isWinPopupVisible() || !this.selectedCell) {
            return;
        }
        if (!isNaN(parseInt(value))) {
            this.handleOnDigitPressed(parseInt(value));
        } else {
            this.handleOnNonDigitPressed(value);
        }
    }

    private handleOnDigitPressed(value: number): void {
        if (value < 0 || value > 9 || !this.selectedCell || this.selectedCell.isGiven) {
            return;
        }
        let changed = false;
        if (notesMode === NOTES_MODES.pencil) {
            changed = this.handleOnNotesPressed(this.selectedCell, value)
        } else {
            changed = this.handleOnValuePressed(this.selectedCell, value);
        }
        if (!changed) {
            return;
        }
        this.save(this.encode());
        this.applyCursorFlags();
        this.draw();
        this.checkWin();
    }

    private handleOnNotesPressed(cell: Cell, value: number): boolean {
        if (cell.value) {
            return false;
        }
        if (value) {
            if (cell.candidates.includes(value)) {
                cell.removeCandidate(value);
            } else {
                cell.addCandidate(value);
            }
            return true;
        }
        if (!cell.candidates.length) {
            return false;
        }
        cell.candidates = [];
        return true;
    }

    private handleOnValuePressed(cell: Cell, value: number): boolean {
        if (!cell.value && !value) {
            return false;
        }
        cell.value = cell.value === value ? 0 : value;
        if (notesMode === NOTES_MODES.auto_notes && cell.value) {
            this.getNeighborCells(cell, c => !c.value).forEach(c => c.removeCandidate(cell.value));
        }
        return true;
    }

    private handleOnNonDigitPressed(value: string): void {
        if (!this.selectedCell) {
            return;
        }
        let col = this.selectedCell.col;
        let row = this.selectedCell.row;
        switch (value) {
            case "ArrowLeft":
                col = col ? col - 1 : 8;
                break;
            case "ArrowRight":
                col = col < 8 ? col + 1 : 0;
                break;
            case "ArrowUp":
                row = row ? row - 1 : 8;
                break;
            case "ArrowDown":
                row = row < 8 ? row + 1 : 0;
                break;
        }
        if (col === this.selectedCell.col && row === this.selectedCell.row) {
            return;
        }
        this.selectedCell = this.cells[row][col];
        this.applyCursorFlags();
        this.draw();
    }

    private checkWin(): void {
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
        changeWinPopupVisibility(true);
    }

    private getEventCell(event: MouseEvent): Cell {
        const cellSize = getCanvasSize() / 9;
        const col = Math.floor(event.offsetX / cellSize);
        const row = Math.floor(event.offsetY / cellSize);
        return this.cells[row][col];
    }

    private applyCursorFlags(): void {
        const neighborCells = this.selectedCell ? this.getNeighborCells(this.selectedCell) : new Set<Cell>();
        this.cells.flat().forEach(cell => {
            cell.isSelected = cell === this.selectedCell;
            cell.isNeighbor = neighborCells.has(cell);
            cell.hasCandidate = !cell.isSelected && !!this.selectedCell?.value && cell.candidates.includes(this.selectedCell.value);
            cell.isSameVal = !cell.isSelected && !!this.selectedCell?.value && cell.value === this.selectedCell.value;
            cell.isConflict = cell.isSameVal && cell.isNeighbor;
        });
    }

    private getNeighborCells(cell: Cell, filterFn: (c: Cell) => boolean = () => true): Set<Cell> {
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

    private import(): void {
        const field = window.prompt("Enter a string of 81 numbers (you can express blanks as 0 or '.')");
        if (field?.length !== 81) {
            console.warn("Import board length missmatch");
            return;
        }
        const result: Cell[][] = [];
        for (let i = 0; i < 9; i++) {
            result[i] = [];
            for (let j = 0; j < 9; j++) {
                const fieldValue = field[(i * 9) + j];
                const value = fieldValue === "." ? 0 : parseInt(fieldValue);
                try {
                    result[i][j] = new Cell(j, i, value, value !== 0);
                } catch (error) {
                    console.warn("Import cell creation error: ", error);
                    return;
                }
            }
        }
        this.cells = result;
        this.selectedCell = null;
        this.save(this.encode());
        this.applyCursorFlags();
        this.draw();
    }

    private reset(): void {
        this.cells.flat().forEach(cell => cell.reset());
        this.save(this.encode());
        this.applyCursorFlags();
        this.draw();
    }

    private encode(): string {
        return this.cells.flatMap(row => row.map(cell => cell.encode())).toString();
    }

    private save(board: string): void {
        localStorage.setItem(this.boardKey, board);
    }

    private undo(): void {
        // TODO
    }

    private redo(): void {
        // TODO
    }

    private createNotes(): void {
        this.cells.flat().filter(cell => !cell.value).forEach(cell => {
            const usedValues = Array.from(this.getNeighborCells(cell)).map(c => c.value);
            cell.candidates = Array.from({ length: 9 }, (_, i) => i + 1).filter(v => !usedValues.includes(v));
        });
        this.save(this.encode());
        this.applyCursorFlags();
        this.draw();
    }

    private solveStep(): void {
        const url = "solve-step/";
        const payload = { "board": this.encode() };
        this.postData(url, payload)
            .then(data => this.processSolveResponse(data))
            .catch(error => console.error("Solve step request:", error));
    }

    private getCSRFToken(): string | null {
        const name = "csrftoken";
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        return parts.pop()?.split(";").shift() || null;
    }

    private async postData(url: string, data: any) {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": this.getCSRFToken() || "",
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const errorDetails = await response.json();
            console.error(errorDetails);
            throw new Error(`Response: ${response.status}`);
        }
        return await response.json();
    }

    private processSolveResponse(response: any): void {
        console.debug("Solve request:", response);
        if (response.reason) {
            return;
        }
        this.save(response.result);
        const cells = this.loadCells();
        if (!cells) {
            return;
        }
        this.cells = cells;
        this.selectedCell = null;
        this.applyCursorFlags();
        this.draw();
        this.checkWin();
    }
}