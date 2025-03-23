from abc import ABC, abstractmethod
from logging import getLogger
from typing import Iterable

from .. import Cell, Container, Grid


class Strategy(ABC):
    def __init__(self, grid: Grid):
        self._grid = grid
        self._logger = getLogger(__name__)

    @abstractmethod
    def __str__(self) -> str: ...

    @abstractmethod
    def solve(self) -> bool: ...

    def _get_candidate_cells_map(
        self, container: Container, *, min_cells: int = 1, max_cells: int = 9, candidates: Iterable[int] = range(1, 10)
    ) -> dict[int, tuple[Cell, ...]]:
        result: dict[int, tuple[Cell, ...]] = {}
        for cand in candidates:
            cells = tuple(container.filter_cells(has_candidate=cand))
            if len(cells) in range(min_cells, max_cells + 1):
                result[cand] = cells
        return result
