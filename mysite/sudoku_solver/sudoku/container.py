from enum import Enum
from typing import Iterable

from .cell import Cell
from .cells_holder import CellsHolder
from .exceptions import SudokuException


class ContainerType(Enum):
    ROW = "Row"
    COLUMN = "Column"
    BOX = "Box"


class Container(CellsHolder):
    def __init__(self, cells: Iterable[Cell], idx: int, container_type: ContainerType):
        super().__init__(cells)
        self._idx = idx
        self._container_type = container_type
        if len(self._cells) != 9:
            raise SudokuException(f"{self}: Invalid cells count {len(self._cells)}")
        if self._idx not in range(9):
            raise SudokuException(f"{self}: Invalid container index {self._idx}")

    def __str__(self) -> str:
        return f"{self._container_type.value}[{self._idx}]"

    def __repr__(self) -> str:
        return str(self)

    @property
    def idx(self) -> int:
        return self._idx

    @property
    def is_consistent(self) -> bool:
        values = tuple(cell.value for cell in self.filter_cells(solved=True))
        return len(values) == len(set(values))

    @property
    def is_box(self) -> bool:
        return self._container_type == ContainerType.BOX

    @property
    def is_column(self) -> bool:
        return self._container_type == ContainerType.COLUMN

    @property
    def is_row(self) -> bool:
        return self._container_type == ContainerType.ROW
