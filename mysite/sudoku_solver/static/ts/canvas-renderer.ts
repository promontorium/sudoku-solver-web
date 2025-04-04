import { ICell } from "./cell.js";

export interface ICanvasRenderer {
    readonly canvas: HTMLCanvasElement;
    draw(cells: ICell[][]): void;
    resize(cells: ICell[][]): void;
    getCellByOffset(offsetX: number, offsetY: number): { col: number; row: number };
    loadColorScheme(): void;
}

export class CanvasRenderer implements ICanvasRenderer {
    public readonly canvas: HTMLCanvasElement;
    private colors!: {
        GRID_BORDER: string;
        CELL_BORDER: string;
        GIVEN_TEXT: string;
        SOLVED_TEXT: string;
        CANDIDATE_TEXT: string;
        SELECTED: string;
        CONFLICT: string;
        SAME_VALUE: string;
        HAS_CANDIDATE: string;
        NEIGHBOR: string;
    };
    private readonly ctx;
    private readonly container;

    public constructor() {
        this.canvas = document.querySelector("#game-grid")!;
        if (!this.canvas || !(this.canvas instanceof HTMLCanvasElement)) {
            throw new Error("Canvas not found");
        }
        this.ctx = this.canvas.getContext("2d")!;
        if (!this.ctx) {
            throw new Error("Canvas context not found");
        }
        this.container = this.canvas.parentElement!;
        if (!this.container) {
            throw new Error("Container context not found");
        }
        this.loadColorScheme();
    }

    public draw(cells: ICell[][]): void {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        // this.ctx.reset(); // TODO is clearRect enough ?
        const cellSize = this.getCellSize();
        cells.flat().forEach((cell) => this.drawCell(cell, cellSize));
        this.drawBorders(cellSize);
    }

    public resize(cells: ICell[][]): void {
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

    public getCellByOffset(offsetX: number, offsetY: number): { col: number; row: number } {
        const cellSize = this.getCellSize();
        const col = Math.floor(offsetX / cellSize);
        const row = Math.floor(offsetY / cellSize);
        return { col: col, row: row };
    }

    public loadColorScheme(): void {
        const styles = getComputedStyle(this.container);
        this.colors = {
            GRID_BORDER: styles.getPropertyValue("--color-sudoku-game-grid-border").trim(),
            CELL_BORDER: styles.getPropertyValue("--color-sudoku-game-grid-cell-border").trim(),
            GIVEN_TEXT: styles.getPropertyValue("--color-sudoku-game-grid-given").trim(),
            SOLVED_TEXT: styles.getPropertyValue("--color-sudoku-game-grid-solved").trim(),
            CANDIDATE_TEXT: styles.getPropertyValue("--color-sudoku-game-grid-candidate").trim(),
            SELECTED: styles.getPropertyValue("--color-sudoku-game-grid-selected").trim(),
            CONFLICT: styles.getPropertyValue("--color-sudoku-game-grid-conflict").trim(),
            SAME_VALUE: styles.getPropertyValue("--color-sudoku-game-grid-same-value").trim(),
            HAS_CANDIDATE: styles.getPropertyValue("--color-sudoku-game-grid-has-candidate").trim(),
            NEIGHBOR: styles.getPropertyValue("--color-sudoku-game-grid-neighbor").trim(),
        };
    }

    private getCellSize(): number {
        return Math.min(this.canvas.offsetWidth, this.canvas.offsetHeight) / 9;
    }

    private getCellCursorColor(cell: ICell): string | null {
        return cell.isSelected
            ? this.colors.SELECTED
            : cell.isConflict
            ? this.colors.CONFLICT
            : cell.isSameVal
            ? this.colors.SAME_VALUE
            : cell.hasCandidate
            ? this.colors.HAS_CANDIDATE
            : cell.isNeighbor
            ? this.colors.NEIGHBOR
            : null;
    }

    private drawCell(cell: ICell, size: number): void {
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
        this.ctx.strokeStyle = this.colors.GRID_BORDER;
        this.ctx.lineWidth = 2;
        this.ctx.rect(1, 1, cellSize * 9 - 2, cellSize * 9 - 2);
        this.ctx.closePath();
        this.ctx.stroke();
    }

    private drawBoxesBorders(cellSize: number): void {
        this.ctx.beginPath();
        this.ctx.strokeStyle = this.colors.GRID_BORDER;
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
        this.ctx.strokeStyle = this.colors.CELL_BORDER;
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

    private drawCellCursors(cell: ICell, size: number): void {
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

    private drawCellValue(cell: ICell, size: number): void {
        if (!cell.value) {
            return;
        }
        const fontSize = Math.floor(size * 0.75) - 5;
        this.ctx.beginPath();
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        this.ctx.fillStyle = cell.isGiven ? this.colors.GIVEN_TEXT : this.colors.SOLVED_TEXT;
        this.ctx.font = `${fontSize}px sans-serif`;
        const x = cell.col * size + size / 2;
        const y = cell.row * size + size / 2;
        this.ctx.fillText(cell.value.toString(), x, y);
        this.ctx.closePath();
        this.ctx.fill();
    }

    private drawCellCandidates(cell: ICell, size: number): void {
        if (!cell.candidates.length) {
            return;
        }
        const fontSize = Math.floor(size * 0.375) - 5;
        this.ctx.beginPath();
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        this.ctx.fillStyle = this.colors.CANDIDATE_TEXT;
        this.ctx.font = `${fontSize}px sans-serif`;
        cell.candidates.forEach((candidate) => {
            const xIndex = (candidate - 1) % 3;
            const yIndex = Math.floor((candidate - 1) / 3);
            const x = cell.col * size + ((xIndex + 1) * size) / 4;
            const y = cell.row * size + ((yIndex + 1) * size) / 4;
            this.ctx.fillText(candidate.toString(), x, y);
        });
        this.ctx.closePath();
        this.ctx.fill();
    }
}
