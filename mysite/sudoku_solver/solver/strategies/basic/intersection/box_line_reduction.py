from itertools import chain
from typing import Iterable

from .... import Cell, Container
from .intersection_strategy import IntersectionStrategy


class BoxLineReduction(IntersectionStrategy):
    """Candidate in a Row/Column also belongs to the same Box: exclude this candidate from other Box cells"""

    def __str__(self) -> str:
        return "Box/Line Reduction"

    def _get_base_containers(self) -> Iterable[Container]:
        for cont in chain(self._grid.rows, self._grid.columns):
            if len(tuple(cont.filter_cells(solved=False))) > 1:
                yield cont

    def _get_affected_container(self, cells: tuple[Cell, ...]) -> Container | None:
        boxes = {self._grid.get_box(cell) for cell in cells}
        return boxes.pop() if len(boxes) == 1 else None
