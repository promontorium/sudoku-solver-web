from .. import sudoku


def decode_board(data: str) -> sudoku.Grid:
    field = data.split(",")
    grid = sudoku.Grid(c[1:] if c.startswith("-") else "." for c in field)
    for c, cell in zip(field, grid.cells):
        if c.startswith("+"):
            cell.value = int(c[1:])
        elif c != "0" and all(char.isdigit() for char in c):
            cell.candidates = [idx + 1 for idx, char in enumerate(bin(int(c))[2:][::-1]) if char == "1"]
    return grid


def encode_board(grid: sudoku.Grid) -> str:
    return ",".join(encode_cell(cell) for cell in grid.cells)


def encode_cell(cell: sudoku.Cell) -> str:
    if cell.value:
        return f"{'-' if cell.is_given else '+'}{cell.value}"
    else:
        return str(sum(2 ** (cand - 1) for cand in cell.candidates))
