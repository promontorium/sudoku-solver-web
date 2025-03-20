from .. import sudoku


def decode_board(data: str) -> sudoku.Grid:
    field = data.split(",")
    grid = sudoku.Grid(c[1:] if c.startswith("-") else "." for c in field)
    for c, cell in zip(field, grid.cells):
        if c.startswith("+"):
            cell.value = int(c[1:])
        elif c != "0" and c.isdigit():
            num = int(c)
            cell.candidates = frozenset(i + 1 for i in range(9) if (num >> i) & 1)
    return grid


def encode_board(grid: sudoku.Grid) -> str:
    return ",".join(map(encode_cell, grid.cells))


def encode_cell(cell: sudoku.Cell) -> str:
    if cell.value:
        return f"{'-' if cell.is_given else '+'}{cell.value}"
    else:
        return str(sum(1 << (cand - 1) for cand in cell.candidates))
