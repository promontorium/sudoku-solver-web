import { ICell } from "./cell.js";

export interface ICanvasRenderer {
    readonly canvas: HTMLCanvasElement;
    draw(cells: ICell[][]): void;
    resizeAndDraw(cells: ICell[][]): void;
    getCellByOffset(offsetX: number, offsetY: number): { col: number, row: number };
}

export class CanvasRenderer implements ICanvasRenderer {
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

    public draw(cells: ICell[][]): void {
        this.ctx.reset();
        const cellSize = this.getCellSize();
        cells.flat().forEach(cell => this.drawCell(cell, cellSize));
        this.drawBorders(cellSize);
    }

    public resizeAndDraw(cells: ICell[][]): void {
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

    private getCellCursorColor(cell: ICell): string | null {
        return cell.isSelected ? "#bbdefb" :
            cell.isConflict ? "#f7cfd6" :
                cell.isSameVal ? "#c3d7ea" :
                    cell.hasCandidate ? "#d4ebda" :
                        cell.isNeighbor ? "#e2ebf3" :
                            null;
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

    private drawCellCandidates(cell: ICell, size: number): void {
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