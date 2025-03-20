from itertools import chain
from logging import getLogger
from typing import Iterable, Unpack

from .cell import Cell
from .cells_holder import CellsFilter, CellsHolder
from .container import Container, ContainerType
from .exceptions import SudokuException
from .history_manager import HistoryManager, as_complex_action


class Grid(CellsHolder):
    def __init__(self, field: Iterable[int | str]):
        super().__init__(self._create_cells(field))
        self._logger = getLogger(__name__)
        self._history_manager = HistoryManager(self.filter_cells(given=False))
        self._rows = tuple(self._create_row(i) for i in range(9))
        self._columns = tuple(self._create_column(i) for i in range(9))
        self._boxes = tuple(self._create_box(i) for i in range(9))

    def __str__(self) -> str:
        return "Grid"

    @property
    def history_manager(self) -> HistoryManager:
        return self._history_manager

    @property
    def is_consistent(self) -> bool:
        self._logger.info("%s: Running consistency check", self)
        return all(cont.is_consistent for cont in chain(self._rows, self._columns, self._boxes))

    @property
    def rows(self) -> tuple[Container, ...]:
        return self._rows

    @property
    def columns(self) -> tuple[Container, ...]:
        return self._columns

    @property
    def boxes(self) -> tuple[Container, ...]:
        return self._boxes

    @property
    def console_representation(self) -> str:
        result = ""
        for i in range(9):
            result += "\n" if i else ""
            result += "------+-------+------\n" if i in (3, 6) else ""
            for j in range(9):
                result += " |" if j in (3, 6) else ""
                result += " " if j else ""
                value = self.get_cell(j, i).value
                result += str(value) if value else "."
        return result

    def get_column(self, cell: Cell) -> Container:
        try:
            return self._columns[cell.coordinates[0]]
        except IndexError:
            raise SudokuException(f"{self}: Illegal column index {cell.coordinates[0]} for {cell=}")

    def get_row(self, cell: Cell) -> Container:
        try:
            return self._rows[cell.coordinates[1]]
        except IndexError:
            raise SudokuException(f"{self}: Illegal row index {cell.coordinates[1]} for {cell=}")

    def get_box(self, cell: Cell) -> Container:
        column, row = cell.coordinates
        block_idx = 3 * (row // 3) + (column // 3)
        try:
            return self._boxes[block_idx]
        except IndexError:
            raise SudokuException(f"{self}: Illegal block index {block_idx} for {cell=}")

    def get_neighbors(self, cell: Cell, /, **kwargs: Unpack[CellsFilter]) -> set[Cell]:
        conts = (self.get_row(cell), self.get_column(cell), self.get_box(cell))
        return {cont_cell for cont in conts for cont_cell in cont.filter_cells(**kwargs)} - {cell}

    @as_complex_action
    def set_value(self, cell: Cell, value: int) -> None:
        self._logger.info("%s: Setting cell value: %s = %d", self, cell, value)
        cell.value = value
        for neighbor in self.get_neighbors(cell, has_candidate=cell.value):
            neighbor.candidates -= {cell.value}

    @as_complex_action
    def reset(self) -> None:
        self._logger.info("%s: Resetting", self)
        for cell in self.filter_cells(given=False):
            cell.reset()

    @as_complex_action
    def init_candidates(self) -> None:
        self._logger.info("%s: Creating candidates", self)
        for cell in self.filter_cells(solved=False):
            cands = self._prepare_candidates(cell)
            if not cands:
                self._logger.warning("%s: No candidates found for %s", self, cell)
            cell.candidates = cands

    def _create_cells(self, field: Iterable[int | str]) -> tuple[Cell, ...]:
        values = self._adjust_field(field)
        return tuple(Cell(value, i % 9, i // 9) for i, value in enumerate(values))

    def _create_row(self, idx: int) -> Container:
        cells = [self.get_cell(i, idx) for i in range(9)]
        return Container(cells, idx, ContainerType.ROW)

    def _create_column(self, idx: int) -> Container:
        cells = [self.get_cell(idx, i) for i in range(9)]
        return Container(cells, idx, ContainerType.COLUMN)

    def _create_box(self, idx: int) -> Container:
        row = 3 * (idx % 3)
        column = 3 * (idx // 3)
        cells = [self.get_cell(row + j, column + i) for i in range(3) for j in range(3)]
        return Container(cells, idx, ContainerType.BOX)

    def _adjust_field(self, field: Iterable[int | str]) -> tuple[int, ...]:
        try:
            result = tuple(int(v) if v != "." else 0 for v in field)
        except ValueError:
            raise SudokuException(f"{self}: Non numeric value found")
        if len(result) != 81:
            raise SudokuException(f"{self}: Unexpected cells count {len(result)}")
        return result

    def _prepare_candidates(self, cell: Cell) -> frozenset[int]:
        return frozenset(range(1, 10)) - {neighbor.value for neighbor in self.get_neighbors(cell, solved=True)}
