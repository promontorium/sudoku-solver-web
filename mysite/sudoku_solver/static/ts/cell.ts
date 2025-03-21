export interface ICell {
    readonly col: number;
    readonly row: number;
    readonly isGiven: boolean;
    hasCandidate: boolean;
    isSelected: boolean;
    isNeighbor: boolean;
    isSameVal: boolean;
    isConflict: boolean;
    value: number;
    candidates: number[];
    encode(): string;
    addCandidate(value: number): void;
    removeCandidate(value: number): boolean;
    reset(): void;
}

export class Cell implements ICell {
    public readonly col;
    public readonly row;
    public readonly isGiven;
    public hasCandidate = false;
    public isSelected = false;
    public isNeighbor = false;
    public isSameVal = false;
    public isConflict = false;
    private wrappedValue = 0;
    private wrappedCandidates = new Set<number>();

    public constructor(col: number, row: number, value: number = 0, isGiven: boolean = false, candidates: number[] = []) {
        this.col = col;
        this.row = row;
        this.validateCoordinates();
        this.value = value;
        this.isGiven = isGiven;
        this.candidates = candidates;
        this.assertIsConsistent();
    }

    public static fromEncoded(encoded: string, row: number, col: number): ICell {
        const val = Math.abs(parseInt(encoded));
        if (isNaN(val) || val > 511) {
            throw new Error(`Cell(${col}, ${row}): Invalid encoding value ${val}`);
        }
        const isGiven = encoded.startsWith("-");
        const isSolved = encoded.startsWith("+");
        if (isGiven || isSolved) {
            return new Cell(col, row, val, isGiven);
        }
        const candidates = Array.from({ length: 9 }, (_, i) => i + 1).filter((_, i) => val & (1 << i));
        return new Cell(col, row, 0, isGiven, candidates);
    }

    public get value(): number {
        return this.wrappedValue;
    }

    public set value(value: number) {
        this.assertIsMutable();
        this.validateValue(value, true);
        this.wrappedValue = value;
        this.wrappedCandidates.clear()
    }

    public get candidates(): number[] {
        return Array.from(this.wrappedCandidates);
    }

    public set candidates(values: number[]) {
        if (!values.length && !this.wrappedCandidates.size) {
            return;
        }
        this.assertIsMutable();
        this.assertCandidatesAreMutable();
        this.wrappedCandidates = new Set(values.map(v => {
            this.validateValue(v, false);
            return v;
        }));
    }

    public encode(): string {
        const prefix = this.isGiven ? "-" : this.value ? "+" : "";
        const val = this.value || this.candidates.reduce((acc, cand) => acc | (1 << (cand - 1)), 0);
        return `${prefix}${val}`;
    }

    public addCandidate(value: number): void {
        this.assertIsMutable();
        this.assertCandidatesAreMutable();
        this.validateValue(value, false);
        this.wrappedCandidates.add(value);
    }

    public removeCandidate(value: number): boolean {
        this.assertIsMutable();
        this.assertCandidatesAreMutable();
        return this.wrappedCandidates.delete(value);
    }

    public reset(): void {
        if (this.isGiven) {
            return;
        }
        this.wrappedCandidates.clear();
        this.wrappedValue = 0;
    }

    private assertIsConsistent(): void {
        if (this.isGiven && !this.value) {
            throw new Error(`Cell(${this.col}, ${this.row}): Given cell must have non-zero value`);
        }
    }

    private assertIsMutable(): void {
        if (this.isGiven) {
            throw new Error(`Cell(${this.col}, ${this.row}): Cannot modify given cell`);
        }
    }

    private assertCandidatesAreMutable(): void {
        if (this.value) {
            throw new Error(`Cell(${this.col}, ${this.row}): Cannot modify solved cell candidates`);
        }
    }

    private validateCoordinates(): void {
        if (!Number.isInteger(this.col) || !Number.isInteger(this.row) || this.col < 0 || this.row < 0 || this.col > 8 || this.row > 8) {
            throw new Error(`Cell(${this.col}, ${this.row}): Invalid coordinates`);
        }
    }

    private validateValue(value: number, allowZero: boolean = true): void {
        if (!Number.isInteger(value) || value < (allowZero ? 0 : 1) || value > 9) {
            throw new Error(`Cell(${this.col}, ${this.row}): Invalid value ${value}`);
        }
    }
}