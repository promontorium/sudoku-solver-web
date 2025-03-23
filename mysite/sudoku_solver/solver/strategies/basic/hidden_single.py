from itertools import chain
from typing import Iterable

from ... import Cell, Container
from .basic_strategy import BasicStrategy


class HiddenSingle(BasicStrategy):
    """Hidden single fast solver"""

    def __str__(self) -> str:
        return "Hidden single"

    def _get_base_containers(self) -> Iterable[Container]:
        return chain(self._grid.rows, self._grid.columns, self._grid.boxes)

    def _solve_container(self, container: Container) -> bool:
        for cand in range(1, 10):
            cell: Cell | None = None
            for cont_cell in container.filter_cells(has_candidate=cand):
                if cell:
                    cell = None
                    break
                cell = cont_cell
            if not cell:
                continue
            self._logger.info("%s: %s = %d. Base: %s", self, cell, cand, container)
            self._grid.set_value(cell, cand)
            return True
        return False
