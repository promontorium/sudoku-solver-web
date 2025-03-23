from typing import Iterable

from ... import Container
from .basic_strategy import BasicStrategy


class NakedSingle(BasicStrategy):
    """Naked single fast solver"""

    def __str__(self) -> str:
        return "Naked single"

    def _get_base_containers(self) -> Iterable[Container]:
        return self._grid.rows

    def _solve_container(self, container: Container) -> bool:
        for cell in container.cells:
            if len(cell.candidates) != 1:
                continue
            value = next(iter(cell.candidates))
            self._logger.info("%s: %s = %d", self, cell, value)
            self._grid.set_value(cell, value)
            return True
        return False
