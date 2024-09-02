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

    public static fromEncoded(value: string, row: number, col: number): ICell {
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
}