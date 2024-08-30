from abc import ABC, abstractmethod
from typing import Iterable, Iterator, NotRequired, TypedDict

from .cell import Cell
from .exceptions import SudokuException


class CellsFilter(TypedDict):
    solved: NotRequired[bool]
    given: NotRequired[bool]
    value: NotRequired[int]
    has_candidate: NotRequired[int]
    candidates: NotRequired[Iterable[int]]


class CellsHolder(ABC):
    def __init__(self, cells: Iterable[Cell]):
        self._cells = tuple(cells)

    @abstractmethod
    def __str__(self) -> str:
        pass

    @property
    @abstractmethod
    def is_consistent(self) -> bool:
        pass

    @property
    def is_solved(self) -> bool:
        return not any(self.filter_cells(solved=False))

    @property
    def cells(self) -> tuple[Cell, ...]:
        return self._cells

    def get_cell(self, column: int, row: int) -> Cell:
        try:
            cell = self._cells[column + row * 9]
        except IndexError:
            raise SudokuException(f"{self}: Coordinates {column=} {row=} out of range")
        if cell.coordinates != (column, row):
            raise SudokuException(f"{self}: Internal error: wrong cells order")
        return cell

    def filter_cells(
        self,
        *,
        solved: bool | None = None,
        given: bool | None = None,
        value: int | None = None,
        has_candidate: int | None = None,
        candidates: Iterable[int] | None = None,
    ) -> Iterator[Cell]:
        result = iter(self._cells)
        if solved is not None:
            result = filter(lambda cell: cell.is_solved == solved, result)
        if given is not None:
            result = filter(lambda cell: cell.is_given == given, result)
        if value:
            result = filter(lambda cell: cell.value == value, result)
        if has_candidate:
            result = filter(lambda cell: has_candidate in cell.candidates, result)
        if candidates is not None:
            result = filter(lambda cell: cell.candidates == frozenset(candidates), result)
        return result
