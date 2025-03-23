from typing import Iterable

from .... import Cell, Container
from .intersection_strategy import IntersectionStrategy


class PointingSubset(IntersectionStrategy):
    """Pointing Pair/Triple
    Candiate in a Box also belongs to the same Row/Column: exclude this candidate from other Row/Column Cells
    """

    def __str__(self) -> str:
        return "Pointing Subset"

    def _get_base_containers(self) -> Iterable[Container]:
        for cont in self._grid.boxes:
            if len(tuple(cont.filter_cells(solved=False))) > 1:
                yield cont

    def _get_affected_container(self, cells: tuple[Cell, ...]) -> Container | None:
        rows = {self._grid.get_row(cell) for cell in cells}
        if len(rows) == 1:
            return rows.pop()
        columns = {self._grid.get_column(cell) for cell in cells}
        if len(columns) == 1:
            return columns.pop()
        return None
